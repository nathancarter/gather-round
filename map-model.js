
/*
 * The state of a room is called a "model" (a la model/view/controller).
 * This library provides just one type of model, a simple key-value store, built
 * on the built-in JavaScript Map class.  The most important aspects of a model
 * class are exhibited in this one; they are:
 *  1. You must have set(key,value) and get(key).
 *  2. You must call model.changed(key,oldValue,newValue) when changes occur.
 *  3. Your model code must be runnable in node.js on the server side and in
 *     browsers on the client side.
 */

/*
 * The MapModel class simply exposes a built-in JavaScript map, with a change
 * event wrapped around the set() method.  Every other method is passed directly
 * through to the underlying Map.
 */
class MapModel {
    // build a Map
    constructor () { this.contents = new Map() }
    // look up keys/values in internal Map
    get ( key ) { return this.contents.get( key ) }
    keys () { return this.contents.keys() }
    has ( key ) { return this.contents.has( key ) }
    // Set value using internal Map, then, if the user has assigned a
    // model.changed function, call it as the callback to notify about this
    // change.  We notify only if the set() was an actual change, as compared by
    // serializing the old/new JSON values and comparing those serializations.
    set ( key, value ) {
        const old = this.contents.get( key )
        this.contents.set( key, value )
        if ( this.changed && JSON.stringify( old ) != JSON.stringify( value ) )
            this.changed( key, old, value )
    }
}

/*
 * If we're being run in node, then this is a module, and we need to export
 * the above class.  If we're not, then this is the browser, and the class is
 * therefore alreay defined at global scope.
 */
if ( typeof( module ) !== 'undefined' && module.exports )
    module.exports.MapModel = MapModel
