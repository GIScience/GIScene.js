/**
 * Visualizes a specified compass direction (aspect) by color coding faces which are perpendicular to that direction within a specified deviation.
 * This is similar to the DirectionMaterial but only considers the horizontal angle of the face normals and not the vertical angle.
 * 
 * @namespace GIScene
 * @class AspectMaterial
 * @constructor
 * @param {THREE.Vector3} compassDirection
 * @param {Number} maxDeviationDeg A Number specifying the maximum deviation from compassDirection to which the colorramp is streched 
 */

GIScene.AspectMaterial = function(compassDirection, maxDeviationDeg) {
	
	var _compassDirection, 
		_maxDeviationDeg,
		_emissive = new THREE.Color( 0x000000 );
	
	Object.defineProperty(this, 'compassDirection', {
	    get: function() {
	      return _compassDirection;
	    },
	    set: function(value) {
	      _compassDirection = value;
	      this.uniforms.compassDirection.value = value;
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
	  
	  Object.defineProperty(this, 'emissive', {
	    get: function() {
	      return _emissive;
	    },
	    set: function(value) {
	      _emissive = value;
	      this.uniforms.uemissive.value = value;
	    }
	  });
	
	
	var parameters = {
		shading : THREE.SmoothShading,
		uniforms : {

			"opacity" : 		{type : "f",  value : 1.0},
			"compassDirection": {type : "v3", value : compassDirection},
			"maxDeviationDeg" : {type : "f",  value : maxDeviationDeg},
			"uemissive" : 		{type : "c",  value : this.emissive}
			//compassDirectionDeg degrees
			//maxDeviationDeg degrees

		},

		vertexShader : [
			"varying vec3 vNormal;", 
			"uniform vec3 uemissive;",
			
			THREE.ShaderChunk["morphtarget_pars_vertex"], 
			
			"void main() {", 
				"vNormal = normalize(  normal );", 
				
				THREE.ShaderChunk["morphtarget_vertex"], 
				THREE.ShaderChunk["default_vertex"], 
			"}"
			].join("\n"),

		fragmentShader : [
			"uniform float opacity;", 
			"uniform vec3 compassDirection;", 
			"uniform float maxDeviationDeg;", 
			"uniform vec3 uemissive;",
			
			"varying vec3 vNormal;", 
			"float red;", 
			"float maxDeviation;", 
			"const float M_PI = 3.14159265358979323846;", 
			"vec3 hDir;", 
			"uniform mat4 modelMatrix;", 
			
			"void main() {", 
				"vec3 worldNormal = mat3( modelMatrix[ 0 ].xyz, modelMatrix[ 1 ].xyz, modelMatrix[ 2 ].xyz ) * vNormal;", 
				"worldNormal = normalize( worldNormal );", 
				"maxDeviation = maxDeviationDeg * (M_PI / 180.0);",
	
				// 3D Direction
				//"red = (maxDeviation - acos(dot(worldNormal, compassDirection))) / maxDeviation;",
	
				//2D Direction (Aspect)
				
				//grey for flat regions
				
				

					//project face normal on horizontal plane
					"hDir = worldNormal -  ( dot(worldNormal, vec3(0.0,1.0,0.0)) * vec3(0.0,1.0,0.0));",
					
					"hDir = normalize(hDir);",
					
					//exclude flat and almost flat areas from beeing colorized
					"float upDeviation = acos(dot(normalize(worldNormal), vec3(0.0,1.0,0.0)));", //deviation from up vector
					
					"if (upDeviation < 0.017453292519943295 || upDeviation > M_PI - 0.017453292519943295)", //0.017453292519943295 is 1 deg is maxUpDeviation 
					"{",
						"gl_FragColor = vec4( vec3(0.5) + uemissive, opacity );",
					"}",
				
					
					"else {",
					
						"red = (maxDeviation - acos(dot(hDir, compassDirection))) / maxDeviation;",
			
						"gl_FragColor = vec4( vec3(1.0,1.0-red,1.0-red) + uemissive, opacity );",
				
					"}",
				
			"}"
			].join("\n")
	}; 	
	
	THREE.ShaderMaterial.call(this, parameters);
	
    //standards
	this.compassDirection = compassDirection || new THREE.Vector3(0,0,-1); //default to North
	this.maxDeviationDeg = maxDeviationDeg || 15.0;
	this.emissive = new THREE.Color( 0x000000 );
};

GIScene.AspectMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

GIScene.AspectMaterial.prototype.clone = function() {
	
	var material = new GIScene.AspectMaterial();
	
	THREE.ShaderMaterial.prototype.clone.call( this, material );
	
	material.compassDirection = this.compassDirection;
	
	material.emissive = this.emissive;
	
	return material;
};
