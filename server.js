
const app = require( 'express' )
const http = require( 'http' )
const path = require( 'path' )
const io = require( 'socket.io' )
const fs = require( 'fs' )

const socketClient = fs.readFileSync( path.join(
    __dirname, 'node_modules', 'socket.io-client', 'dist', 'socket.io.js' ) )
const gatherClient = fs.readFileSync( path.join( __dirname, 'client.js' ) )

class GatherRound {
    constructor () {
        this.app = app()
        this.http = http.createServer( this.app )
        this.io = io( this.http )
        this.port = 80
        this.setMainPageHTML( '' )
        this.setClientScriptFile( path.join( __dirname, 'client.js' ) )
        this.clients = [ ]
    }
    setMainPageFile ( absolutePath ) {
        this.setMainPageHTML( String( fs.readFileSync( absolutePath ) ) )
    }
    setMainPageHTML ( html ) {
        const toInject = `
            <script src="socket-client.js"></script>
            <script src="gather-client.js"></script>
            <script src="user-client.js"></script>
        `
        if ( /<\/body>/i.test( html ) ) {
            html = html.replace( /<\/body>/i, `</body>${toInject}` )
        } else if ( /<\/html>/i.test( html ) ) {
            html = html.replace( /<\/html>/i, `${toInject}</html>` )
        } else {
            html += toInject
        }
        this.mainPage = html
    }
    setClientScriptFile ( absolutePath ) {
        this.setClientScriptJS( String( fs.readFileSync( absolutePath ) ) )
    }
    setClientScriptJS ( js ) { this.clientScript = js }
    start () {
        this.app.get( '/', ( request, result ) => {
            result.send( this.mainPage )
        } )
        this.app.get( '/socket-client.js', ( request, result ) => {
            result.send( socketClient )
        } )
        this.app.get( '/gather-client.js', ( request, result ) => {
            result.send( gatherClient )
        } )
        this.app.get( '/user-client.js', ( request, result ) => {
            result.send( this.clientScript )
        } )
        this.io.on( 'connection', socket => {
            const client = new Client( socket, this )
            this.clients.push( client )
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
}

module.exports.GatherRound = GatherRound
