
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
    }
    setMainPageFile ( absolutePath ) {
        this.setMainPageHTML( String( fs.readFileSync( absolutePath ) ) )
    }
    setMainPageHTML ( html ) {
        const toInject = '<script src="client.js"></script>'
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
    setClientScriptJS ( js ) {
        this.clientScript = `${socketClient}\n\n${gatherClient}\n\n${js}`
    }
    start () {
        this.app.get( '/', ( request, result ) => {
            result.send( this.mainPage )
        } )
        this.app.get( '/client.js', ( request, result ) => {
            result.send( this.clientScript )
        } )
        this.io.on( 'connection', socket => {
            if ( this.onConnect ) this.onConnect( socket )
            socket.on( 'disconnect', () => {
                if ( this.onDisconnect ) this.onDisconnect( socket )
            } )
        } )
        this.http.listen( this.port, () => {
            if ( this.onStart ) this.onStart( this.port )
        } )
    }
}

module.exports.GatherRound = GatherRound
