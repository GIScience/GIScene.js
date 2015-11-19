/** 
 * Base Object wich gives the namespace for all other classes of the library.
 * Defines global constants used in other classes 
 
	@module GIScene
	@main GIScene
	
	@class GIScene
	@static
	
	@author mcauer https://github.com/mcauer
*/

var GIScene = {
	/**
	 * 
	 * @property VERSION
	 * @type String
	 * @final
	 * @public 
	 * 
	 * 
	 * */
	VERSION:"1.0.1",
	
	/**
	 * The Path to where this file is stored
	 * 
	 * @property LIBRARYPATH
	 * @type String
	 * @final
	 * @public
	 */
	LIBRARYPATH: null,
	
	/**
	 * Constants for setting bitmask flags on working material to indicate that it is still in use by some control
	 *  
	 * @property WORKINGMATERIALFLAGS
	 * @type Object
	 * @final
	 * @public
	 * @example
	 * 		WORKINGMATERIALFLAGS:{
				SELECT:1,	//material is highlighted by GIScene.Control.Select
				WIRE:2,		//wireframe state has been changed
				SHADING:4,	//shading mode ( smooth | flat ) has been changed
				SIDE:8,		//face culling has been changed ( front | back | double )
				MAP:16,		//texture has been turned off
				OPACITY:32, //opacity value has been changed
				VERTEXCOLORS:64, //vertexColors ( noColors | faceColors | vertexColors )
				DIFFUSE:128, //diffuseColor ( THREE.Color )
				AMBIENT:256 //ambientColor ( THREE.Color )
			}
	 */
	WORKINGMATERIALFLAGS:{
		SELECT:1,	//material is highlighted by GIScene.Control.Select
		WIRE:2,		//wireframe state has been changed
		SHADING:4,	//shading mode ( smooth | flat ) has been changed
		SIDE:8,		//face culling has been changed ( front | back | double )
		MAP:16,		//texture has been turned off
		OPACITY:32, //opacity value has been changed
		VERTEXCOLORS:64, //vertexColors ( noColors | faceColors | vertexColors )
		DIFFUSE:128, //diffuseColor ( THREE.Color )
		AMBIENT:256 //ambientColor ( THREE.Color )
	},
	
	
	
	/**
	 * For internal use only.
	 *
	 * @property idCounter
	 * @type Number
	 */
	idCounter:0
};
// auto detect librarypath
var scripts = document.getElementsByTagName('script');
GIScene.LIBRARYPATH = scripts[scripts.length-1].src.replace(/\/GIScene\.js$/, '/');
GIScene.LIBRARYPATH = GIScene.LIBRARYPATH.replace(/\/GIScene_.*\.js$/, '/');


/**
	 * The relative path from the script folder (where GIScene_x.x.x.js is stored) to the "resources" folder
	 * 
	 * @property RESOURCESPATH
	 * @type String
	 * @final
	 * @public
	 */
GIScene.RESOURCESPATH = "";
