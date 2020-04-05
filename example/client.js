
connect()

window.heard = msg => {
    console.log( `I (client ${clientId}) heard from server: ${msg}` )
    say( 'I heard you!' )
    askFor = Math.floor( Math.random() * 10 )
    requestId( askFor,
        () => say( `Now I have ID ${askFor}.` ),
        () => say( `Aw, I wanted to be ${askFor}.` ) )
}
