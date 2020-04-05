
class MapModel {
    constructor () { this.contents = new Map() }
    get ( key ) { return this.contents.get( key ) }
    set ( key, value ) {
        const old = this.contents.get( key )
        this.contents.set( key, value )
        if ( this.changed && JSON.stringify( old ) != JSON.stringify( value ) )
            this.changed( key, old, value )
    }
    keys () { return this.contents.keys() }
    has ( key ) { return this.contents.has( key ) }
}

if ( typeof( module ) !== 'undefined' && module.exports )
    module.exports.MapModel = MapModel
