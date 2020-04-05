
connect()

window.serverToldMe = json => {
    console.log( 'Heard from server:', json )
    tellServer( 'I heard you!' )
}
