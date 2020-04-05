
const { GatherRound } = require( '../server' )
const path = require( 'path' )

const server = new GatherRound()
server.setClientScriptFile( path.join( __dirname, 'client.js' ) )
server.setMainPageFile( path.join( __dirname, 'index.html' ) )
server.onStart = port => console.log( `Started on port ${port}` )
server.onConnect = socket => {
    console.log( 'Connection' )
    server.tellClient( socket, 'Can you hear me?' )
}
server.onDisconnect = () => console.log( 'Disconnection' )
server.onMessage = json => console.log( 'Client said:', json )
server.start()
