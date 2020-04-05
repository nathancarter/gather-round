
let server = null

const connect = () => {
    server = io()
    server.on( 'server message', json => {
        if ( window.serverToldMe ) window.serverToldMe( json )
    } )
}

const tellServer = ( json ) => {
    server.emit( 'client message', json )
}

window.serverToldMe = null // replace with your listener
