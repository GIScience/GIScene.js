/** 
 * Represents a 2D bounding box in geo coordinates (z = height)
 * 
 * @namespace GIScene
 * @class Extent2
 * @constructor
 * @param {GIScene.Coordiante2} minCoordinate2 the lower left corner coordinate
 * @param {GIScene.Coordiante2} maxCoordinate2 the upper right corner coordinate
 */

GIScene.Extent2 = function(minCoordinate2, maxCoordinate2) {
	//inherit methods from THREE.Box2
	THREE.Box2.apply(this,[minCoordinate2, maxCoordinate2]);	
};

GIScene.Extent2.prototype = Object.create(THREE.Box2.prototype);	
/**
 * will be used in Layer.Grid to reduce tile loading to maxExtent 
 * @method toPolygonV2
 * @return {Array of GIScene.Coordinate2} poly
 */
GIScene.Extent2.prototype.toPolygonV2	= function() {
			var min = this.min;
			var max = this.max;
			//var poly = [new GIScene.Coordinate2(min.x,min.y),new GIScene.Coordinate2(min.x,max.y),new GIScene.Coordinate2(max.x,max.y),new GIScene.Coordinate2(max.x,min.y)];
			var poly = [new GIScene.Coordinate2(min.x,min.y),new GIScene.Coordinate2(max.x,min.y),new GIScene.Coordinate2(max.x,max.y),new GIScene.Coordinate2(min.x,max.y)];
			return poly;
};
	
/**
 * Creates a new GIScene.Extent2 object by passing a THREE.Box3
 * @method fromBox3
 * @param {THREE.Box3} box3
 * @return {GIScene.Extent2}
 */	
GIScene.Extent2.prototype.fromBox3 = function(box3) {
	this.min = new GIScene.Coordinate2(box3.min.x, -box3.max.z);
	this.max = new GIScene.Coordinate2(box3.max.x, -box3.min.z);
	return this;
};

/**
 * @method clone
 * @return {GIScene.Extent2} 
 */
GIScene.Extent2.prototype.clone = function() {
	return new GIScene.Extent2( this.min, this.max );
};