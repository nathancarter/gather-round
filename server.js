
const app = require( 'express' )
const http = require( 'http' )
const path = require( 'path' )
const io = require( 'socket.io' )
const fs = require( 'fs' )

const socketClient = fs.readFileSync( path.join(
    __dirname, 'node_modules', 'socket.io-client', 'dist', 'socket.io.js' ) )
const gatherClient = fs.readFileSync( path.join( __dirname, 'client.js' ) )
const injection = '[[[INJECTION-FLAG]]]'

class GatherLobby {
    constructor () {
        this.app = app()
        this.http = http.createServer( this.app )
        this.io = io( this.http )
        this.port = 80
        this.setMainPageHTML( '' )
        this.sockets = [ ]
        this.scripts = [ ]
    }
    setMainPageFile ( absolutePath ) {
        this.setMainPageHTML( String( fs.readFileSync( absolutePath ) ) )
    }
    setMainPageHTML ( html ) {
        if ( /<head>/i.test( html ) ) {
            html = html.replace( /<head>/i, `<head>${injection}` )
        } else if ( /<html>/i.test( html ) ) {
            html = html.replace( /<html>/i, `<html>${injection}` )
        } else if ( /<body>/i.test( html ) ) {
            html = html.replace( /<body>/i, `${injection}<body>` )
        } else {
            html = injection + html
        }
        this.mainPage = html
    }
    addScript ( filename ) { this.scripts.push( filename ) }
    start () {
        const allScripts = [ 'socket-client.js', 'gather-client.js' ]
        this.scripts.map( ( filename, index ) => {
            allScripts.push( `user-script-${index}.js` )
            this.app.get( `/user-script-${index}.js`, ( request, result ) => {
                result.sendFile( filename )
            } )
        } )
        const mainPage = this.mainPage.replace( injection,
            allScripts.map( s => `<script src='${s}'></script>` ).join( '\n' ) )
        this.app.get( '/', ( request, result ) => { result.send( mainPage ) } )
        this.app.get( '/socket-client.js', ( request, result ) => {
            result.send( socketClient )
        } )
        this.app.get( '/gather-client.js', ( request, result ) => {
            result.send( gatherClient )
        } )
        this.io.on( 'connection', socket => {
            socket.gather = this
            socket.say = function ( msg ) { this.emit( 'server message', msg ) }
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
        } )
        this.http.listen( this.port, () => {
            if ( this.onStart ) this.onStart( this.port )
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

module.exports.GatherLobby = GatherLobby
