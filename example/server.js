
const { GatherRound } = require( '../server' )
const { MapModel } = require( '../map-model' )
const path = require( 'path' )

const server = new GatherRound()

const model = new MapModel()
server.setModel( model )
model.set( 'chats', [ ] )

server.onStart = port => console.log( `Started on port ${port}` )
server.onConnect = client => {
    let counter = 0
    while ( server.getClient( counter ) ) counter++
    client.setId( counter )
    console.log( `Connected client ${client.id}` )
    client.tell( 'Can you hear me?' )
    client.heard = msg => {
        if ( msg.hasOwnProperty( 'chat' ) ) {
            model.set( 'chats', [ ...model.get( 'chats' ),
                                  `${client.id} says: ${msg.chat}` ] )
        }
    }
    console.log( 'Current client IDs:', server.clients.map( c => c.id ) )
}
server.onDisconnect = client => {
    console.log( `Disconnected client ${client.id}` )
    console.log( 'Current client IDs:', server.clients.map( c => c.id ) )
}

server.addScript( path.join( __dirname, '..', 'map-model.js' ) )
server.addScript( path.join( __dirname, 'client.js' ) )
server.setMainPageFile( path.join( __dirname, 'index.html' ) )
server.start()
