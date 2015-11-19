/** 
 * Represents a mathematical 2D Line
 * 
 * @namespace GIScene
 * @class Line2
 * @constructor
 * @param {THREE.Vector2} positionVector2
 * @param {THREE.Vector2} directionVector2
 * 
 */

GIScene.Line2 = function(positionVector2, directionVector2) {
	this.positionVector = positionVector2; //THREE.Vector2
	this.directionVector = directionVector2;
};



GIScene.Line2.prototype.getNormalizedNormalRight = function() {
	return new THREE.Vector2(-this.directionVector.y, this.directionVector.x).normalize();
};

GIScene.Line2.prototype.getNormalizedNormalLeft = function() {
	return new THREE.Vector2(this.directionVector.y, -this.directionVector.x).normalize();
};

/**
 * Creates a Line2 by specifying two points somewhere on that line 
 * @method fromPoints
 * @param {THREE.Vector2} pointA2
 * @param {THREE.Vector2} pointB2
 * @return {GIScene.Line2}
 */
GIScene.Line2.prototype.fromPoints = function(pointA2, pointB2) {
	
	this.positionVector = pointA2.clone();
	this.directionVector = pointB2.clone().sub(pointA2);
	
	return this;
};

/**
 * Computes the intersection point between this line and a second one 
 * @method intersect
 * @param {Object} line2
 * @return {THREE.Vector2} instersectionPoint
 */
GIScene.Line2.prototype.intersect = function(line2) {
	//@TODO check for parallel
	
	var rv1 = this.directionVector;
	var rv2 = line2.directionVector;
	var ov1 = this.positionVector;
	var ov2 = line2.positionVector;
	
	//first line
	//	r		s		constants
	// rv1.x  -rv2.x  = ov2.x - ov1.x
	//second line
	// rv1.y  -rv2.y  = ov2.y - ov1.y
	
	var r1 = rv1.x;
	var s1 = -rv2.x;
	var c1 = ov2.x - ov1.x;
	var r2 = rv1.y;
	var s2 = -rv2.y;
	var c2 = ov2.y - ov1.y;
	// if first line r=0 exchange lines
	if(r1 == 0 ){
	var r1Temp = r1;
	var s1Temp = s1;
	var c1Temp = c1;
	r1=r2;
	s1=s2;
	c1=c2;
	r2=r1Temp;
	s2=s1Temp;
	c2=c1Temp;
	}
	
	//first line r to 1
	c1 /= r1;
	s1 /= r1;
	r1 = 1;  // r1 /=r1;
	
	// second line r to 0
	var factor = -r2;
	r2 += r1*factor;
	s2 += s1*factor;
	c2 += c1*factor;
	
	//second line s to 1
	factor = 1/s2;
	//r2 += r1*factor;  yet is zero
	//s2 = 1 // *= factor; 
	c2 *= factor;
	
	//first line s to 0
	factor = -s1;
	//r1
	//s1 = 0 // += s2*factor;
	c1 += c2*factor;
	
	var r = c1;
	// var s = c2;
	
	var instersectionPoint = ov1.add(rv1.multiplyScalar(r));
	
	return instersectionPoint;
	
};

GIScene.Line2.prototype.moveLeft = function(distance) {
	 var normal = this.getNormalizedNormalLeft();
	 this.positionVector = this.positionVector.add(normal.multiplyScalar(distance));
	 return this;
};

GIScene.Line2.prototype.moveRight = function(distance) {
	 var normal = this.getNormalizedNormalRight();
	 this.positionVector = this.positionVector.add(normal.multiplyScalar(distance));
	 return this;
};