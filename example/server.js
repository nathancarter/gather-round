
const { GatherRound } = require( '../server' )
const path = require( 'path' )

const server = new GatherRound()
server.setClientScriptFile( path.join( __dirname, 'client.js' ) )
server.setMainPageFile( path.join( __dirname, 'index.html' ) )
server.onStart = port => console.log( `Started on port ${port}` )

server.onConnect = client => {
    let counter = 0
    while ( server.getClient( counter ) ) counter++
    client.setId( counter )
    console.log( `Connected client ${client.id}` )
    client.tell( 'Can you hear me?' )
    client.heard = msg => console.log( `Client ${client.id} said: ${msg}` )
    console.log( 'Current client IDs:', server.clients.map( c => c.id ) )
}
server.onDisconnect = client => {
    console.log( `Disconnected client ${client.id}` )
    console.log( 'Current client IDs:', server.clients.map( c => c.id ) )
}
server.start()
