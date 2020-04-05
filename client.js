
let server = null
let clientId = null
let clientCB = null
let ModelClass = null
let model = null

const connect = () => {
    server = io()
    server.on( 'set id', newId => {
        clientId = newId
        if ( clientCB ) clientCB( newId )
    } )
    server.on( 'server message', msg => {
        if ( window.heard ) window.heard( msg )
    } )
    server.on( 'new model', msg => {
        if ( ModelClass ) {
            model = new ModelClass()
            model.changed = window.changed
        }
    } )
    server.on( 'model write', obj => {
        if ( model ) model.set( obj.key, obj.value )
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
window.changed = null // replace with your listener
