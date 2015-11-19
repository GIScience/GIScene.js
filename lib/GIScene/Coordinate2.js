/**
 * GIScene.Coordinate2 represents a 2 dimensional coordinate like in geographic or geodesic coordinate reference systems.

 * @namespace GIscene
 * @class Coordinate2
 * @constructor
 *
 * @param {Object} x east-west direction
 * @param {Object} y south-north direction
 */
GIScene.Coordinate2 = function (x,y){
 
 	THREE.Vector2.apply(this, [x,y]);
      
};

GIScene.Coordinate2.prototype = Object.create(THREE.Vector2.prototype);

/**
 * @method toVector2
 * @return {THREE.Vector2}
 */
GIScene.Coordinate2.prototype.toVector2 = function() {
		return new THREE.Vector2(this.x, -this.y);
	};

/**
 * @method fromVector2
 * @param {THREE.Vector2} v2
 * @return {GIScene.Coordinate2}
 */
GIScene.Coordinate2.prototype.fromVector2 = function(v2){
        this.x =  v2.x;
        this.y = -v2.y; 
        return this;
    };

/**
 * @method clone
 * @return {GIScene.Coordinate2} 
 */
GIScene.Coordinate2.prototype.clone = function() {
	return new GIScene.Coordinate2( this.x, this.y);
};