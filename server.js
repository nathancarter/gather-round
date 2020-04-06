
const app = require( 'express' )
const http = require( 'http' )
const path = require( 'path' )
const io = require( 'socket.io' )
const fs = require( 'fs' )
const url = require( 'url' )

const socketClient = fs.readFileSync( path.join(
    __dirname, 'node_modules', 'socket.io-client', 'dist', 'socket.io.js' ) )
const gatherClient = fs.readFileSync( path.join( __dirname, 'client.js' ) )
const injection = '[[[INJECTION-FLAG]]]'
const injected = ( html ) =>
    /<head>/i.test( html ) ? html.replace( /<head>/i, `<head>${injection}` ) :
    /<html>/i.test( html ) ? html.replace( /<html>/i, `<html>${injection}` ) :
    /<body>/i.test( html ) ? html.replace( /<body>/i, `${injection}<body>` ) :
                             injection + html

class GatherRoom {
    constructor () {
        this.sockets = [ ]
    }
    addSocket ( socket ) {
        socket.gatherRoom = this
        socket.on( 'client message', msg => {
            if ( socket.heard ) socket.heard( msg )
        } )
        this.sockets.push( socket )
        if ( this.model ) this.pushModel( socket )
        if ( this.onConnect ) this.onConnect( socket )
        socket.on( 'disconnect', () => {
            this.sockets = this.sockets.filter( c => c != socket )
            if ( this.onDisconnect ) this.onDisconnect( socket )
        } )
    }
    canSee ( socket, key ) { return true } // subclasses/instances may override
    sendModelChange ( key, socket ) {
        const doIt = s => {
            if ( this.canSee( s, key ) )
                s.emit( 'model write', {
                    key : key,
                    value : this.model.get( key )
                } )
        }
        if ( socket ) { doIt( socket ) } else { this.sockets.map( doIt ) }
    }
    pushModel ( socket ) {
        if ( !this.model ) return
        socket.emit( 'new model' )
        for ( let key of this.model.keys() )
            this.sendModelChange( key, socket )
    }
    setModel ( model ) {
        this.model = model
        this.sockets.map( client => this.pushModel( socket ) )
        model.changed = key => this.sendModelChange( key )
    }
}

class GatherLobby extends GatherRoom {
    constructor () {
        super()
        this.app = app()
        this.http = http.createServer( this.app )
        this.io = io( this.http )
        this.port = 80
        this.setMainPageHTML( '' )
        this.scripts = [ ]
        this.otherPages = { }
        this.rooms = { }
    }
    setMainPageFile ( absolutePath ) {
        this.setMainPageHTML( String( fs.readFileSync( absolutePath ) ) )
    }
    setMainPageHTML ( html ) { this.mainPage = html }
    addScript ( filename ) { this.scripts.push( filename ) }
    addRoomHTML ( path, html, setup ) { this.otherPages[path] = { setup, html } }
    addRoomFile ( path, absolutePath, setup ) {
        this.addRoomHTML( path, String( fs.readFileSync( absolutePath ) ), setup )
    }
    start () {
        const allScripts = [ '/socket-client.js', '/gather-client.js' ]
        this.scripts.map( ( filename, index ) => {
            allScripts.push( `/user-script-${index}.js` )
            this.app.get( `/user-script-${index}.js`, ( request, result ) => {
                result.sendFile( filename )
            } )
        } )
        const withScripts = ( html ) => injected( html ).replace( injection,
            allScripts.map( s => `<script src='${s}'></script>` ).join( '\n' ) )
        this.mainPage = withScripts( this.mainPage )
        this.app.get( '/', ( request, result ) => result.send( this.mainPage ) )
        for ( let path in this.otherPages ) {
            if ( this.otherPages.hasOwnProperty( path ) ) {
                this.otherPages[path].html =
                    withScripts( this.otherPages[path].html )
                console.log( 'Adding other page path:', path + '/*' )
                this.app.get( path + '/*', ( request, result ) =>
                    result.send( this.otherPages[path].html ) )
            }
        }
        this.app.get( '/socket-client.js', ( request, result ) =>
            result.send( socketClient ) )
        this.app.get( '/gather-client.js', ( request, result ) =>
            result.send( gatherClient ) )
        this.io.on( 'connection', socket => {
            const path = url.parse( socket.handshake.headers.referer ).pathname
            socket.gatherLobby = this
            socket.say = function ( msg ) { this.emit( 'server message', msg ) }
            let target = path == '/' ? this : null
            for ( let roomPath in this.otherPages ) {
                if ( this.otherPages.hasOwnProperty( roomPath )
                  && path.startsWith( roomPath + '/' ) ) {
                    const roomCode = path.substring( roomPath.length + 1 )
                    if ( !this.rooms.hasOwnProperty( roomCode ) )
                        this.rooms[roomCode] = this.otherPages[roomPath].setup()
                    target = this.rooms[roomCode]
                    break
                }
            }
            if ( !target ) return console.error( 'Could not connect:', path )
            target.addSocket( socket )
        } )
        this.http.listen( this.port, () => {
            if ( this.onStart ) this.onStart( this.port )
        } )
    }
}

module.exports.GatherRoom = GatherRoom
module.exports.GatherLobby = GatherLobby
