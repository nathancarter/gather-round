
const app = require( 'express' )
const http = require( 'http' )
const path = require( 'path' )
const io = require( 'socket.io' )
const fs = require( 'fs' )

const socketClient = fs.readFileSync( path.join(
    __dirname, 'node_modules', 'socket.io-client', 'dist', 'socket.io.js' ) )
const gatherClient = fs.readFileSync( path.join( __dirname, 'client.js' ) )
const injection = '[[[INJECTION-FLAG]]]'

class GatherRound {
    constructor () {
        this.app = app()
        this.http = http.createServer( this.app )
        this.io = io( this.http )
        this.port = 80
        this.setMainPageHTML( '' )
        this.clients = [ ]
        this.scripts = [ ]
    }
    setMainPageFile ( absolutePath ) {
        this.setMainPageHTML( String( fs.readFileSync( absolutePath ) ) )
    }
    setMainPageHTML ( html ) {
        if ( /<\/body>/i.test( html ) ) {
            html = html.replace( /<\/body>/i, `</body>${injection}` )
        } else if ( /<\/html>/i.test( html ) ) {
            html = html.replace( /<\/html>/i, `${injection}</html>` )
        } else {
            html += injection
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
            const client = new Client( socket, this )
            this.clients.push( client )
            if ( this.model ) this.pushModel( client )
            if ( this.onConnect ) this.onConnect( client )
            socket.on( 'disconnect', () => {
                this.clients = this.clients.filter( c => c.socket != socket )
                if ( this.onDisconnect ) this.onDisconnect( client )
            } )
        } )
        this.http.listen( this.port, () => {
            if ( this.onStart ) this.onStart( this.port )
        } )
    }
    getClient ( id ) { return this.clients.find( c => c.id === `${id}` ) }
    tellClient ( id, json ) {
        const client = this.getClient( id )
        if ( client ) client.tell( json )
    }
    sendModelChange ( key, client ) {
        const doIt = c => {
            if ( c.canSee( key ) )
                c.socket.emit( 'model write', {
                    key : key,
                    value : this.model.get( key )
                } )
        }
        if ( client ) { doIt( client ) } else { this.clients.map( doIt ) }
    }
    pushModel ( client ) {
        if ( !this.model ) return
        client.socket.emit( 'new model' )
        for ( let key of this.model.keys() )
            this.sendModelChange( key, client )
    }
    setModel ( model ) {
        this.model = model
        this.clients.map( client => this.pushModel( client ) )
        model.changed = key => this.sendModelChange( key )
    }
}

class Client {
    constructor ( socket, server ) {
        this.socket = socket
        this.server = server
        this.id = null
        socket.on( 'client message', json => this.heard( json ) )
        socket.on( 'request id', id => this.setId( id ) )
    }
    setId ( id ) {
        const existing = this.server.getClient( id )
        const change = !existing || existing === this
        if ( change ) this.id = `${id}`
        this.socket.emit( 'set id', `${id}` )
        return change
    }
    tell ( json ) { this.socket.emit( 'server message', json ) }
    heard ( json ) { } // subclasses/instances override
    canSee ( key ) { return true } // subclasses/instances override
}

module.exports.GatherRound = GatherRound
