
let app = require( 'express' )()
let http = require( 'http' ).createServer( app )
let path = require( 'path' )

app.get( '/', ( request, result ) => {
    result.sendFile( path.join( __dirname, 'index.html' ) )
} )

http.listen( 9999, () => {
    console.log( 'Server started' )
} )

