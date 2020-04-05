
connect()

ModelClass = MapModel

window.changed = ( key, oldValue, newValue ) => {
    if ( key == 'chats' ) {
        document.getElementById( 'chats' ).innerHTML =
            newValue.map( line => `<p>${line}</p>` ).join( '\n' )
    }
}

window.heard = msg => {
    console.log( `I (client ${clientId}) heard from server: ${msg}` )
    say( 'I heard you!' )
    askFor = Math.floor( Math.random() * 10 )
    requestId( askFor,
        () => say( `Now I have ID ${askFor}.` ),
        () => say( `Aw, I wanted to be ${askFor}.` ) )
}

document.getElementById( 'send' ).addEventListener( 'click', event => {
    say( { chat : document.getElementById( 'nextChat' ).value } )
} )
