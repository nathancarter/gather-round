
const { GatherLobby, GatherRoom } = require( '../server' )
const { MapModel } = require( '../map-model' )
const path = require( 'path' )

const makeChatRoom = server => {
    const model = new MapModel()
    server.setModel( model )
    model.set( 'chats', [ ] )
    const old = server.onConnect
    server.onConnect = socket => {
        if ( old ) old( socket )
        socket.heard = msg => {
            if ( msg.hasOwnProperty( 'chat' ) ) {
                model.set( 'chats', [ ...model.get( 'chats' ),
                                      `${socket.id} says: ${msg.chat}` ] )
            } else {
                console.log( `Heard from ${socket.id}: ${msg}` )
            }
        }
    }
}

const lobby = new GatherLobby()
lobby.onStart = port => console.log( `Started on port ${port}` )
lobby.onConnect = socket => {
    console.log( `Connected client ${socket.id}` )
    socket.say( 'Can you hear me?' )
    console.log( 'Current client IDs:', lobby.sockets.map( c => c.id ) )
}
lobby.onDisconnect = socket => {
    console.log( `Disconnected client ${socket.id}` )
    console.log( 'Current client IDs:', lobby.sockets.map( c => c.id ) )
}
lobby.addScript( path.join( __dirname, '..', 'map-model.js' ) )
lobby.addScript( path.join( __dirname, 'client.js' ) )
makeChatRoom( lobby )
lobby.addRoomFile( '/chatroom', path.join( __dirname, 'index.html' ), () => {
    const room = new GatherRoom()
    makeChatRoom( room )
    return room
} )
lobby.setMainPageFile( path.join( __dirname, 'index.html' ) )
lobby.start()
