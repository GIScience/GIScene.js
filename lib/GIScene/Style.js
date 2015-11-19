/**
 * This class describes a style object with a name, title, material and definitions on which objects of a layer the style should be applied
 * 
 * @namespace GIScene
 * @class Style
 * @constructor
 * @param {Object} config 
 * @example
 * 		var style = new GIScene.Style({
 * 			name  : 	'myStyle1' 						// [optional] should be unique
 * 			title :	'My Style No. 1',					// something nice to display
 * 			material : new THREE.MeshBasicMaterial(),	// the material
 * 			rootObjectKeyAttribute 	: 'geom_id',		// [optional]
 * 			rootObjectKeyValues		: [22, 24, 42, 57],	// [optional]
 * 			recursive : true							// [optional] if all descendants should be styled the same way
 * 		});
 */

GIScene.Style = function(config) {
	
	var defaults = {
		name 	 	: null,
		title	 	: 'unnamed',
		material 	: null,
		// either nothing, direct Object references OR a list of objects specified by keyAttribute values
		rootObjects	: null, //array of objects to be styled
		rootObjectKeyAttribute : null, //unique and not null attribute
		rootObjectKeyValues : [], //List of "ID"s to be found in the rootObjectKeyAttribute 
		
		recursive	: true
	};
	
	this.config = GIScene.Utils.mergeObjects(defaults, config || {});
	
	//set class properties
	for ( property in this.config ){
		this[property] = this.config[property];
	}
	
	this.id		= GIScene.idCounter++;
	this.name	= this.config.name || this.id;
	
};