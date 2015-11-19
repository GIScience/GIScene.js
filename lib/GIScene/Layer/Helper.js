/**
 * A Helper Layer has a property isTangible = false.
 * This helps to determine objects which shouldn't be reflected in ray intersections, e.g. during visibility analysis.
 * 
 * @namespace GIScene
 * @class Layer.Helper
 * @constructor
 * @extends GIScene.Layer
 * @param {String} name the layer name for display purposes
 * @param {Object} [config] the layer configuration object
 * 
 */
GIScene.Layer.Helper = function(name, config) {
	
	GIScene.Layer.apply(this, [name,config]);
	
	this.isTangible = false;
	
};

GIScene.Layer.Helper.prototype = Object.create(GIScene.Layer.prototype);
