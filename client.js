
/*
 * This script will be injected by server.js (in this same folder) into every
 * page it serves.  Thus every page on the site has access to the JS tools
 * defined below.
 */

/*
 * This global variable will contain the connection to the server.
 * It starts out as null, of course, but is updated when connection happens.
 * Pages on the site should not write to this value; it is set up when a user
 * connects.
 */
let socket = null
/*
 * This global variable should contain the class (constructor) for the model
 * that this client will share with the server.  It starts out as null so that
 * each page can replace it with whichever model that page uses.  (One page on
 * a site might use a chat model, another a card game model, etc.)  It is used
 * in some events below to initialize a fresh model when the server tells us to.
 * Pages on the site should replace this null value with whichever constructor
 * is appropriate for that page.
 */
let ModelClass = null
/*
 * The actual state of the room, as far as this user can see it, will be stored
 * in this global variable.  It, too, starts as null, because we have no state
 * yet (and don't even know the ModelClass yet).  Pages on the site should not
 * assign a value to this variable; it is set up and kept up-to-date
 * automatically in response to messages from the server.  Similarly, pages
 * should not alter the contents of this variable; treat it as read-only.  (To
 * affect the state of the room, use say() to talk to the server, asking it to
 * make the change and propagate it to all users in this room.  The say()
 * function is defined and documented further below.)
 */
let model = null

/*
 * This function reaches out from the client to connect to the server.  It
 * should be called by every client page representing a room, as soon as the
 * page has finished loading.
 */
const connect = () => {
    // Create a socket and try to connect to the server.
    socket = io()
    // When the server sends a message, call our global handler.
    // (See further below for information about this handler.)
    socket.on( 'server message', msg => {
        if ( window.heard ) window.heard( msg )
    } )
    // When the server tells us to replace our model with a fresh one, do so.
    // (See further below for information about the model changed handler.)
    socket.on( 'new model', msg => {
        if ( ModelClass ) {
            model = new ModelClass()
            model.changed = window.changed
        }
    } )
    // When the server tells us to update our model with new information, do so.
    // (This will trigger the model changed handler mentioned further below.)
    socket.on( 'model write', obj => {
        if ( model ) model.set( obj.key, obj.value )
    } )
}

/*
 * A convenience function for sending messages to the server.  Because it is
 * global, any client page can, at any time, call say( jsonDataHere ).
 */
const say = msg => {
    socket.emit( 'client message', msg )
}

/*
 * Because some clients will want to dynamically generate new rooms, and will
 * need to give them IDs, we create a convenience function that will generate
 * IDs that are guaranteed to be both unique and extremely unlikely to guess.
 */
const randomHash = () =>
    new Date().getTime().toString( 36 ) +
    parseInt( `${Math.random()}`.substring( 2 ) ).toString( 36 )

/*
 * Here we set up two global variables that can store event handlers for
 * messages from the server.
 *  1. window.changed(key,old,value) will be called any time the model changes,
 *     which happens only in response to messages from the server.  The key is
 *     the portion of the model that changed, "old" is the old value, and
 *     "value" is the new value.  The page will always want to respond to this
 *     event by updating the visual presentation of the model on the page.
 *  2. window.heard(json) will be called only if the server wants to send some
 *     other kind of message to this page, which may or may not happen,
 *     depending on how you've chosen to structure your application.  It is what
 *     clients hear when the server calls socket.say(json) on the client's
 *     socket.
 */
window.changed = null // replace with your listener
window.heard = null // replace with your listener
