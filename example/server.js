
const { GatherRound } = require( '../server' )
const { MapModel } = require( '../map-model' )
const path = require( 'path' )

const server = new GatherRound()

const model = new MapModel()
server.setModel( model )
model.set( 'chats', [ ] )

server.onStart = port => console.log( `Started on port ${port}` )
server.onConnect = socket => {
    console.log( `Connected client ${socket.id}` )
    socket.say( 'Can you hear me?' )
    socket.heard = msg => {
        if ( msg.hasOwnProperty( 'chat' ) ) {
            model.set( 'chats', [ ...model.get( 'chats' ),
                                  `${socket.id} says: ${msg.chat}` ] )
        } else {
            console.log( `Heard from ${socket.id}: ${msg}` )
        }
    }
    console.log( 'Current client IDs:', server.sockets.map( c => c.id ) )
}
server.onDisconnect = socket => {
    console.log( `Disconnected client ${socket.id}` )
    console.log( 'Current client IDs:', server.sockets.map( c => c.id ) )
}

server.addScript( path.join( __dirname, '..', 'map-model.js' ) )
server.addScript( path.join( __dirname, 'client.js' ) )
server.setMainPageFile( path.join( __dirname, 'index.html' ) )
server.start()
