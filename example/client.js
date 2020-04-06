
window.onload = () => {
    document.getElementById( 'send' ).addEventListener( 'click', event => {
        say( { chat : document.getElementById( 'nextChat' ).value } )
    } )
    connect()
}

ModelClass = MapModel

window.changed = ( key, oldValue, newValue ) => {
    if ( key == 'chats' )
        document.getElementById( 'chats' ).innerHTML =
            newValue.map( line => `<p>${line}</p>` ).join( '\n' )
}

window.heard = msg => {
    console.log( `I (client ${socket.id}) heard from server: ${msg}` )
    say( 'I heard you!' )
}
