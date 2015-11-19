/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.XHRLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;
	
	//added by mca
	this.request = new XMLHttpRequest();
};

THREE.XHRLoader.prototype = {

	constructor: THREE.XHRLoader,

	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;
		// mca var request = new XMLHttpRequest();
		var request = this.request;
		
		if ( onLoad !== undefined ) {

			request.addEventListener( 'load', function ( event ) {

				onLoad( event.target.responseText );
				scope.manager.itemEnd( url );

			}, false );

		}

		if ( onProgress /*!== undefined*/ ) { //also don't go in if onProgress is null

			request.addEventListener( 'progress', function ( event ) {

				onProgress( event );

			}, false );

		}

		if ( onError !== undefined ) {

			request.addEventListener( 'error', function ( event ) {

				onError( event );

			}, false );

		}

		if ( this.crossOrigin !== undefined ) request.crossOrigin = this.crossOrigin;

		request.open( 'GET', url, true );
		// request.withCredentials = true; //mca
		request.send( null );

		scope.manager.itemStart( url );

	},

	setCrossOrigin: function ( value ) {

		this.crossOrigin = value;

	}

};
