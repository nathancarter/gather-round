
let server = null
let clientId = null
let clientCB = null

const connect = () => {
    server = io()
    server.on( 'set id', newId => {
        clientId = newId
        if ( clientCB ) clientCB( newId )
    } )
    server.on( 'server message', msg => {
        if ( window.heard ) window.heard( msg )
    } )
}

const say = msg => {
    server.emit( 'client message', msg )
}

const requestId = ( id, successCB, failureCB ) => {
    const oldId = clientId
    clientCB = newId => {
        clientCB = null
        callback = newId == oldId ? failureCB : successCB
        if ( callback ) callback()
    }
    server.emit( 'request id', id )
}

window.heard = null // replace with your listener
