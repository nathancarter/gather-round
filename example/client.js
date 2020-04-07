
/*
 * When a new chat room is created, set it up in the two ways documented below:
 */
window.onload = () => {
    // Attach to the "Send" button an event that uses the global say() function
    // to send the contents of the chat text box to the server.
    // (Note that we do not actually update the UI here; the definitive state of
    // the room is on the server; we wait to hear back from it.)
    document.getElementById( 'send' ).addEventListener( 'click', event => {
        say( { chat : document.getElementById( 'nextChat' ).value } )
    } )
    // Connect to the server.
    connect()
}

/*
 * We will use the MapModel class that comes built into this library.
 */
ModelClass = MapModel

/*
 * Whenever the model changes, we pay attention to the one key we know how to
 * handle: "chats".  If that was the change, update the UI by showing all the
 * chats to the user in the chats DIV.
 */
window.changed = ( key, oldValue, newValue ) => {
    if ( key == 'chats' )
        document.getElementById( 'chats' ).innerHTML =
            newValue.map( line => `<p>${line}</p>` ).join( '\n' )
}

/*
 * This has no functionality that the user can see in the page.
 * It is here only to show that the client and server are permitted to
 * communicate independent of the model, if your application happens to need
 * that.
 */
window.heard = msg => {
    console.log( `I (client ${socket.id}) heard from server: ${msg}` )
    say( 'I heard you!' )
}
