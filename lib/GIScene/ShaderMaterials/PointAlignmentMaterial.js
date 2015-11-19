/**
 * The PointAlignmentMaterial highlights fragments whose normals are heading to a given point.
 * 
 * @namespace GIScene
 * @class PointAlignmentMaterial
 * @constructor
 * @param {THREE.Vector3} point
 * @param {Number} maxDeviationDeg
 * @param {Number} maxUpDeviationDeg
 * 
 */

GIScene.PointAlignmentMaterial = function(point, maxDeviationDeg, maxUpDeviationDeg) {
	
	var _point = point || new THREE.Vector3(0,0,0);
	var _maxDeviationDeg = maxDeviationDeg || 15.0;
	var _maxUpDeviationDeg = maxUpDeviationDeg || 5.0;
	var _emissive = new THREE.Color( 0x000000 );
	
	Object.defineProperty(this, 'point', {
	    get: function() {
	      return _point;
	    },
	    set: function(value) {
	      _point = value;
	      this.uniforms.uPoint.value = value;
	    }
	  });
	  
	  Object.defineProperty(this, 'maxDeviationDeg', {
	    get: function() {
	      return _maxDeviationDeg;
	    },
	    set: function(value) {
	      _maxDeviationDeg = value;
	      this.uniforms.maxDeviationDeg.value = value;
	    }
	  });
	  
	  Object.defineProperty(this, 'maxUpDeviationDeg', {
	    get: function() {
	      return _maxUpDeviationDeg;
	    },
	    set: function(value) {
	      _maxUpDeviationDeg = value;
	      this.uniforms.maxUpDeviationDeg.value = value;
	    }
	  });
	  
	  Object.defineProperty(this, 'emissive', {
	    get: function() {
	      return _emissive;
	    },
	    set: function(value) {
	      _emissive = value;
	      this.uniforms.emissive.value = value;
	    }
	  });
	
	
	
	var parameters = {
		
		uniforms : {

			"opacity" : 		{type : "f",  value : 1.0},
			"uPoint"  : 		{type : "v3", value : this.point},
			"maxDeviationDeg" : {type : "f",  value : this.maxDeviationDeg},
			"maxUpDeviationDeg":{type : "f",  value : this.maxUpDeviationDeg},
			"emissive" : 		{type : "c",  value : this.emissive}

		},

		vertexShader : [
			"varying vec3 vNormal;", 
			"varying vec3 vWorldPosition;",
			"uniform vec3 emissive;",
			
			THREE.ShaderChunk["morphtarget_pars_vertex"], 
			
			"void main() {", 
				"vNormal = normalize(  normal );", 
				
				THREE.ShaderChunk["morphtarget_vertex"], 
				THREE.ShaderChunk["default_vertex"], 
				//THREE.ShaderChunk[ "worldpos_vertex" ],
				"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
				"vWorldPosition = worldPosition.xyz;",
			"}"
			].join("\n"),

		fragmentShader : [
			"uniform float opacity;", 
			"uniform vec3 uPoint;", 
			"uniform float maxDeviationDeg;", 
			"uniform float maxUpDeviationDeg;",
			"uniform vec3 emissive;",
			
			"varying vec3 vNormal;", 
			"varying vec3 vWorldPosition;",
			"float red;", 
			"float maxDeviation;", 
			"float maxUpDeviation;",
			
			"const float M_PI = 3.14159265358979323846;", 
			"vec3 hDir;", 
			"uniform mat4 modelMatrix;", 
			
			"void main() {", 
				"vec3 worldNormal = mat3( modelMatrix[ 0 ].xyz, modelMatrix[ 1 ].xyz, modelMatrix[ 2 ].xyz ) * vNormal;", 
				"worldNormal = normalize( worldNormal );", 
				"maxDeviation = maxDeviationDeg * (M_PI / 180.0);",
				"maxUpDeviation = maxUpDeviationDeg * (M_PI / 180.0);",
	
				// 3D Direction
				//"red = (maxDeviation - acos(dot(worldNormal, compassDirection))) / maxDeviation;",
	
				//2D Direction (Aspect)
				//project face normal on horizontal plane
				// "hDir = worldNormal -  ( dot(worldNormal, vec3(0.0,1.0,0.0)) * vec3(0.0,1.0,0.0));",
				// "red = (maxDeviation - acos(dot(normalize(hDir), compassDirection))) / maxDeviation;",
		
				//exclude flat and almost flat areas from beeing colorized
				"float upDeviation = acos(dot(normalize(worldNormal), vec3(0.0,1.0,0.0)));", //deviation from up vector
				
				"if (upDeviation < maxUpDeviation || upDeviation > M_PI - maxUpDeviation)",
				"{",
					// "red = 0.0;",
					"gl_FragColor = vec4( vec3(0.5)+emissive, opacity );",
				"}",
				"else",
				"{",
				//3D direction to point
				"vec3 direction = uPoint-vWorldPosition;",
				
				//project directions on horizontal plane
				"vec3 hDirection = direction - ( dot(direction, vec3(0.0,1.0,0.0)) * vec3(0.0,1.0,0.0));",
				"vec3 hNormalDirection = worldNormal -  ( dot(worldNormal, vec3(0.0,1.0,0.0)) * vec3(0.0,1.0,0.0));",
				
				//angle between horizontal directions
				"float angle = acos(dot(normalize(hNormalDirection), normalize(hDirection)));",
				
				"red = (maxDeviation - angle) / maxDeviation;", //colorValue between 0..1
				
				"gl_FragColor = vec4( vec3(1.0,1.0-red,1.0-red) + emissive, opacity );",
				
				"}",
				
			
			"}"
			].join("\n")
	};
	
	THREE.ShaderMaterial.call(this, parameters);
	
	this.point = point || new THREE.Vector3(0,0,0);
	this.maxDeviationDeg = maxDeviationDeg || 15.0;
	this.maxUpDeviationDeg = maxUpDeviationDeg || 5.0;
	this.emissive = new THREE.Color( 0x000000 );
	
};

GIScene.PointAlignmentMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

GIScene.PointAlignmentMaterial.prototype.clone = function() {
	
	var material = new GIScene.PointAlignmentMaterial();
	
	THREE.ShaderMaterial.prototype.clone.call( this, material );
	
	material.point = this.point.clone();
	
	material.maxDeviationDeg = this.maxDeviationDeg;
	
	material.maxUpDeviationDeg = this.maxUpDeviationDeg;
	
	material.emissive = this.emissive;
	
	return material;
};


