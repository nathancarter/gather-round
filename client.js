
let socket = null
let ModelClass = null
let model = null

const connect = () => {
    socket = io()
    socket.on( 'server message', msg => {
        if ( window.heard ) window.heard( msg )
    } )
    socket.on( 'new model', msg => {
        if ( ModelClass ) {
            model = new ModelClass()
            model.changed = window.changed
        }
    } )
    socket.on( 'model write', obj => {
        if ( model ) model.set( obj.key, obj.value )
    } )
}

const say = msg => {
    socket.emit( 'client message', msg )
}

window.heard = null // replace with your listener
window.changed = null // replace with your listener
