
let app = require( 'express' )()
let http = require( 'http' ).createServer( app )
let path = require( 'path' )
let io = require( 'socket.io' )( http )
let fs = require( 'fs' )

app.get( '/', ( request, result ) => {
    result.send(
`
<html>
    <head>
        <script src='client.js'></script>
    </head>
    <body>
        <p>Empty page.</p>
    </body>
</html>
` )
} )

const socketClient = fs.readFileSync( path.join(
    __dirname, 'node_modules', 'socket.io-client', 'dist', 'socket.io.js' ) )
const myClient = fs.readFileSync( path.join( __dirname, 'client.js' ) )
app.get( '/client.js', ( request, result ) => {
    result.send( `${socketClient}\n\n${myClient}` )
} )

io.on( 'connection', socket => {
    console.log( 'Connection started' )
    socket.on( 'disconnect', () => {
        console.log( 'Connection ended' )
    } )
} )

http.listen( 9999, () => {
    console.log( 'Server started' )
} )
