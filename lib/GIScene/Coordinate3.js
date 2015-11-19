/**
 * GIScene.Coordinate3 represents a 3 dimensional coordinate in a right-handed system with z(height) upwards, like in geographic or geodesic coordinate reference systems.

 * @namespace GIscene
 * @class Coordinate3
 * @constructor
 *
 * @param {Object} x east-west direction
 * @param {Object} y south-north direction
 * @param {Object} z height
 */
GIScene.Coordinate3 = function (x,y,z){
 
 	THREE.Vector3.apply(this,[x,y,z]);
    
};

GIScene.Coordinate3.prototype = Object.create(THREE.Vector3.prototype);

/**
 * @method toVector3
 * @return {THREE.Vector3}
 */
GIScene.Coordinate3.prototype.toVector3 = function() {
		return new THREE.Vector3(this.x, this.z, -this.y);
	};

/**
 * @method fromVector3
 * @param {THREE.Vector3} v3
 * @return {GIScene.Coordinate3}
 */
GIScene.Coordinate3.prototype.fromVector3 = function(v3){
    this.x =  v3.x;
    this.y = -v3.z; 
    this.z =  v3.y;
    return this;
};

/**
 * @method clone
 * @return {GIScene.Coordinate3} 
 */
GIScene.Coordinate3.prototype.clone = function() {
	return new GIScene.Coordinate3( this.x, this.y, this.z );
};