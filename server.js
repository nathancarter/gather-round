
/*
 * Import all required modules
 */
const app = require( 'express' )
const http = require( 'http' )
const path = require( 'path' )
const io = require( 'socket.io' )
const fs = require( 'fs' )
const url = require( 'url' )

/*
 * Pre-load socket.io and our own client library.
 */
const socketClient = fs.readFileSync( path.join(
    __dirname, 'node_modules', 'socket.io-client', 'dist', 'socket.io.js' ) )
const gatherClient = fs.readFileSync( path.join( __dirname, 'client.js' ) )

/*
 * Define a function that will inject arbitrary HTML script tags (given in the
 * second parameter) into the appropriate part of the page (the head if
 * possible, or near there if not).
 */
const injected = ( html, injection ) =>
    /<head>/i.test( html ) ? html.replace( /<head>/i, `<head>${injection}` ) :
    /<html>/i.test( html ) ? html.replace( /<html>/i, `<html>${injection}` ) :
    /<body>/i.test( html ) ? html.replace( /<body>/i, `${injection}<body>` ) :
                             injection + html

/*
 * Users interact with the server by being in a room, which can receive messages
 * from them and send them messages.  This is the main class for rooms.
 */
class GatherRoom {
    /*
     * Keep track of the list of users connected to this room.
     */
    constructor () {
        this.sockets = [ ]
    }
    /*
     * Set up a user when it connects to this room.
     */
    addSocket ( socket ) {
        // keep references in both directions
        this.sockets.push( socket )
        socket.gatherRoom = this
        // connect an event handler for all incoming client messages
        socket.on( 'client message', msg => {
            if ( socket.heard ) socket.heard( msg )
        } )
        // if this class has an event handler for connections, run it
        if ( this.onConnect ) this.onConnect( socket )
        // reverse the above two actions later when this user disconnects
        socket.on( 'disconnect', () => {
            this.sockets = this.sockets.filter( c => c != socket )
            if ( this.onDisconnect ) this.onDisconnect( socket )
        } )
        // if this instance has a model for room state, tell it to the new user
        if ( this.model ) this.pushModel( socket )
    }
    /*
     * This relation says whether a given user can "see" (know about) a given
     * element of this room's state, as indexed by the second parameter.  By
     * default, all users can see everything.  For private chats or games with
     * not all information shared, this would need to be customized.
     */
    canSee ( socket, key ) { return true } // subclasses/instances may override
    /*
     * Call sendModelChange(key) to tell all users in this room about the new
     * value associated to the given key in this room's state (model).
     * Call sendModelChange(key,socket) to tell just one user.
     */
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
    /*
     * Call this to tell the given user about the entirety of this room's
     * current state, from scratch.  Useful when connecting new users.
     */
    pushModel ( socket ) {
        if ( !this.model ) return
        socket.emit( 'new model' )
        for ( let key of this.model.keys() )
            this.sendModelChange( key, socket )
    }
    /*
     * Have this room track its state using the give model.  This is a three-
     * step process; see comments below.
     */
    setModel ( model ) {
        // store the model so we can refer to it later
        this.model = model
        // tell all users connected to this room that our state has changed
        this.sockets.map( client => this.pushModel( socket ) )
        // watch for any future changes and inform users of them at that time
        model.changed = key => this.sendModelChange( key )
    }
}

/*
 * The lobby is a special room, the one that runs the main site server, and
 * welcomes new users.  From the lobby, connections to other rooms are possible.
 */
class GatherLobby extends GatherRoom {
    /*
     * Like an ordinary room, except also sets up all the data for being the
     * web and socket server for the entire site.
     */
    constructor () {
        // ordinary room constructor
        super()
        // server tools built on express and socket.io
        this.app = app()
        this.http = http.createServer( this.app )
        this.io = io( this.http )
        this.port = 80
        // initially we have no pages, no scripts, and no rooms; each app must
        // customize these itself
        this.setMainPageHTML( '' )
        this.scripts = [ ]
        this.otherPages = { }
        this.rooms = { }
    }
    /*
     * Specify the main page that the site should serve (on the / path) by
     * giving either the absolute path to an HTML file on disk or the HTML as a
     * string, in one of these functions.
     */
    setMainPageFile ( absolutePath ) {
        this.setMainPageHTML( String( fs.readFileSync( absolutePath ) ) )
    }
    setMainPageHTML ( html ) { this.mainPage = html }
    /*
     * Specify a JavaScript file on disk that should be added to every page that
     * this site serves.
     */
    addScript ( filename ) { this.scripts.push( filename ) }
    /*
     * Add other rooms to the site.  To do so, specify these things:
     *  1. the path from which the room will be served on the site, e.g.,
     *     /chats or /foosball or whatever
     *  2. the HTML that should be served when users visit that path (either by
     *     providing the HTML string itself or an absolute path to a file)
     *  3. a setup function that will be called to create new instances of
     *     GatherRoom when new rooms need to be created.
     * That is, this toolkit support multiple instances of each type of room,
     * so that you might have /chats/room1, /chats/welcome-area, etc., rather
     * than just /chats, so we may need a way to repeatedly build new rooms.
     */
    addRoomHTML ( path, html, setup ) { this.otherPages[path] = { setup, html } }
    addRoomFile ( path, absolutePath, setup ) {
        this.addRoomHTML( path, String( fs.readFileSync( absolutePath ) ), setup )
    }
    /*
     * Launch the server that will serve the whole site and listen for socket
     * connections also.
     */
    start () {
        // compute which scripts must be injected into each page, and a function
        // that does the injection
        const allScripts = [ '/socket-client.js', '/gather-client.js' ]
        this.scripts.map( ( filename, index ) => {
            allScripts.push( `/user-script-${index}.js` )
            this.app.get( `/user-script-${index}.js`, ( request, result ) => {
                result.sendFile( filename )
            } )
        } )
        const withScripts = ( html ) => injected( html,
            allScripts.map( s => `<script src='${s}'></script>` ).join( '\n' ) )
        // embed scripts into the main page and set it up to serve on path /
        this.mainPage = withScripts( this.mainPage )
        this.app.get( '/', ( request, result ) => result.send( this.mainPage ) )
        // for each other page, embed scripts and set it up to be served as well
        for ( let path in this.otherPages ) {
            if ( this.otherPages.hasOwnProperty( path ) ) {
                this.otherPages[path].html =
                    withScripts( this.otherPages[path].html )
                this.app.get( path + '/*', ( request, result ) =>
                    result.send( this.otherPages[path].html ) )
            }
        }
        // the two main scripts we will always need to serve are the socket.io
        // client script and our own client script; they live at these paths:
        this.app.get( '/socket-client.js', ( request, result ) =>
            result.send( socketClient ) )
        this.app.get( '/gather-client.js', ( request, result ) =>
            result.send( gatherClient ) )
        // when a new user connects by socket, figure out which room to put the
        // connection in, based on the path on which they connected
        this.io.on( 'connection', socket => {
            // let them know about the lobby, even if they aren't in it at first
            socket.gatherLobby = this
            // install the "say" convenience function
            socket.say = function ( msg ) { this.emit( 'server message', msg ) }
            // compute the room they belong in based on their request's path
            const path = url.parse( socket.handshake.headers.referer ).pathname
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
            // if we found a room for them, connect them to it
            if ( !target ) return console.error( 'Could not connect:', path )
            target.addSocket( socket )
        } )
        // fire up the server
        this.http.listen( this.port, () => {
            if ( this.onStart ) this.onStart( this.port )
        } )
    }
}

module.exports.GatherRoom = GatherRoom
module.exports.GatherLobby = GatherLobby
