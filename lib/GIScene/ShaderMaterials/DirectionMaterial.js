/**
 * Visualizes a specified direction by color coding faces which are perpendicular to that direction within a specified deviation.
 * 
 * @namespace GIScene
 * @class DirectionMaterial
 * @constructor
 * @param {THREE.Vector3} direction
 * @param {Number} maxDeviationDeg A Number specifying the maximum deviation from direction to which the colorramp is streched 
 */

GIScene.DirectionMaterial = function(direction, maxDeviationDeg) {
	
	var direction = direction || new THREE.Vector3(0,0,-1); //default to North
	var maxDeviationDeg = maxDeviationDeg || 15.0;
	
	var parameters = {
		shading : THREE.SmoothShading,
		uniforms : {

			"opacity" : 		{type : "f",  value : 1.0},
			"direction": 		{type : "v3", value : direction},
			"maxDeviationDeg" : {type : "f",  value : maxDeviationDeg},
			//compassDirectionDeg degrees
			//maxDeviationDeg degrees

		},

		vertexShader : [
			"varying vec3 vNormal;", 
			
			THREE.ShaderChunk["morphtarget_pars_vertex"], 
			
			"void main() {", 
				"vNormal = normalize(  normal );", 
				
				THREE.ShaderChunk["morphtarget_vertex"], 
				THREE.ShaderChunk["default_vertex"], 
			"}"
			].join("\n"),

		fragmentShader : [
			"uniform float opacity;", 
			"uniform vec3 direction;", 
			"uniform float maxDeviationDeg;", 
			
			"varying vec3 vNormal;", 
			"float red;", 
			"float maxDeviation;", 
			"const float M_PI = 3.14159265358979323846;", 
			// "vec3 hDir;", 
			"uniform mat4 modelMatrix;", 
			
			"void main() {", 
				"vec3 worldNormal = mat3( modelMatrix[ 0 ].xyz, modelMatrix[ 1 ].xyz, modelMatrix[ 2 ].xyz ) * vNormal;", 
				"worldNormal = normalize( worldNormal );", 
				"maxDeviation = maxDeviationDeg * (M_PI / 180.0);",
	
				// 3D Direction
				"red = (maxDeviation - acos(dot(worldNormal, direction))) / maxDeviation;",
	
				//2D Direction (Aspect)
				//project face normal on horizontal plane
				// "hDir = worldNormal -  ( dot(worldNormal, vec3(0.0,1.0,0.0)) * vec3(0.0,1.0,0.0));",
				// "red = (maxDeviation - acos(dot(normalize(hDir), vec3(0.0,0.0,-1.0)))) / maxDeviation;",
		
				"gl_FragColor = vec4( 1.0,1.0-red,1.0-red, opacity );",
			
			"}"
			].join("\n")
	}; 	
	
	THREE.ShaderMaterial.call(this, parameters);

};

GIScene.DirectionMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );