
let app = require( 'express' )()
let http = require( 'http' ).createServer( app )
let path = require( 'path' )
let io = require( 'socket.io' )( http )

app.get( '/', ( request, result ) => {
    result.send(
`
<html>
    <head>
        <script src='/socket.io/socket.io.js'></script>
        <script>
            let socket = io()
        </script>
    </head>
    <body>
        <p>Empty page.</p>
    </body>
</html>
` )
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

