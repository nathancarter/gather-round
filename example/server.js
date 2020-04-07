
/*
 * This file is the main file for the application.  It will be run on the server
 * to spin up the entire web app, serve all the pages, and respond to all
 * clients connections and transmissions.  See the README.md file in this folder
 * for an explanation of what this application does.
 */

/*
 * Import all the required modules.
 */
const { GatherLobby, GatherRoom } = require( '../server' )
const { MapModel } = require( '../map-model' )
const path = require( 'path' )

/*
 * This function takes a GatherRoom as input and sets it up as a chat room.  We
 * provide this here rather than subclassing GatherRoom because we will apply it
 * to both GatherRoom and GatherLobby instances, independently.
 */
const makeChatRoom = server => {
    // Create the definitive copy of the model, which gets synced out to clients
    // (but clients never sync their content in to the server).  Initialize it
    // to have an empty list of chats.
    const model = new MapModel()
    server.setModel( model )
    model.set( 'chats', [ ] )
    // Extend the server's onConnect handler so that it not only does its former
    // duty, but also adds an event listener for all incoming client messages,
    // as documented below:
    const old = server.onConnect
    server.onConnect = socket => {
        if ( old ) old( socket )
        socket.heard = msg => {
            // If the client sent us a chat, append it to the list of chats.
            // The model.set() function automatically calls the model's
            // changed() handler, which the server is listening to, since we
            // called server.setModel(), above.  This will therefore notify all
            // clients of the change without our having to explicitly do so.
            if ( msg.hasOwnProperty( 'chat' ) ) {
                model.set( 'chats', [ ...model.get( 'chats' ),
                                      `${socket.id} says: ${msg.chat}` ] )
            // Otherwise, just print a debugging message about some other
            // transmission we hard from teh client.  This is just to show that
            // your client-server communication doesn't always have to be about
            // the state of the model.
            } else {
                console.log( `Heard from ${socket.id}: ${msg}` )
            }
        }
    }
}

/*
 * Create the application lobby.  Add some handlers that print information to
 * the console, not because those messages are needed, but because they
 * illustrate what this kind of data looks like when you see them printed.
 */
const lobby = new GatherLobby()
lobby.onStart = port => console.log( `Started on port ${port}` )
lobby.onConnect = socket => {
    console.log( `Connected client ${socket.id}` )
    socket.say( 'Can you hear me?' ) // just an example, no real need for this
    console.log( 'Current client IDs:', lobby.sockets.map( c => c.id ) )
}
lobby.onDisconnect = socket => {
    console.log( `Disconnected client ${socket.id}` )
    console.log( 'Current client IDs:', lobby.sockets.map( c => c.id ) )
}
/*
 * Tell the application that it should include in every page on this site the
 * script that defines the MapModel class and our the client.js file for this
 * example app.
 */
lobby.addScript( path.join( __dirname, '..', 'map-model.js' ) )
lobby.addScript( path.join( __dirname, 'client.js' ) )
/*
 * Convert the lobby into a chat room.
 */
makeChatRoom( lobby )
/*
 * Permit arbitrary other chat rooms at /chatroom/ANYTHING.  The index.html file
 * in this folder lets users navigate to two other such rooms.  Each of those
 * other rooms also uses the same file, and thus will look exactly like the
 * lobby, other than the different set of chat messages users will encounter in
 * each.  Most apps would have different pages for each room, of course.
 */
lobby.addRoomFile( '/chatroom', path.join( __dirname, 'index.html' ), () => {
    const room = new GatherRoom()
    makeChatRoom( room )
    return room
} )
/*
 * Define the main page for the app and start the app.
 */
lobby.setMainPageFile( path.join( __dirname, 'index.html' ) )
lobby.start()
