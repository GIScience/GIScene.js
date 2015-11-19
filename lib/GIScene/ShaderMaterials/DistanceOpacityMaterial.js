/**
 * A Material which sets opacity according to the distance to the camera. 
 * Close parts will be transparent, so you could watch inside a building, while the walls in the back are still opaque.
 * 
 * @namespace GIScene
 * @class DistanceOpacityMaterial
 * @constructor
 * @param {Number} near distance from where opacity begins
 * @param {Number} far  distance from where opacity will be 1.0
 *  
 */

GIScene.DistanceOpacityMaterial = function(near,far) {
	var near = near || 15.0;
	var far  = far  || 30.0;
	
	var parameters = {
				transparent:true,
				lights: true,
				side:2,
				uniforms: THREE.UniformsUtils.merge( [
		
					THREE.UniformsLib[ "common" ],
					THREE.UniformsLib[ "fog" ],
					THREE.UniformsLib[ "lights" ],
					THREE.UniformsLib[ "shadowmap" ],
		
					{
						"ambient"  : { type: "c", value: new THREE.Color( 0xaaaaaa ) },
						"emissive" : { type: "c", value: new THREE.Color( 0x000000 ) },
						"wrapRGB"  : { type: "v3", value: new THREE.Vector3( 1, 1, 1 ) },
					
						"mNear": { type: "f", value: near },
						"mFar" : { type: "f", value: far }
					}
		
				] ),
		
				vertexShader: [
		
					"#define LAMBERT",
		
					"varying vec3 vLightFront;",
		
					"#ifdef DOUBLE_SIDED",
		
						"varying vec3 vLightBack;",
		
					"#endif",
		
					THREE.ShaderChunk[ "map_pars_vertex" ],
					THREE.ShaderChunk[ "lightmap_pars_vertex" ],
					THREE.ShaderChunk[ "envmap_pars_vertex" ],
					THREE.ShaderChunk[ "lights_lambert_pars_vertex" ],
					THREE.ShaderChunk[ "color_pars_vertex" ],
					THREE.ShaderChunk[ "morphtarget_pars_vertex" ],
					THREE.ShaderChunk[ "skinning_pars_vertex" ],
					THREE.ShaderChunk[ "shadowmap_pars_vertex" ],
		
					"void main() {",
		
						THREE.ShaderChunk[ "map_vertex" ],
						THREE.ShaderChunk[ "lightmap_vertex" ],
						THREE.ShaderChunk[ "color_vertex" ],
		
						THREE.ShaderChunk[ "morphnormal_vertex" ],
						THREE.ShaderChunk[ "skinbase_vertex" ],
						THREE.ShaderChunk[ "skinnormal_vertex" ],
						THREE.ShaderChunk[ "defaultnormal_vertex" ],
		
						THREE.ShaderChunk[ "morphtarget_vertex" ],
						THREE.ShaderChunk[ "skinning_vertex" ],
						THREE.ShaderChunk[ "default_vertex" ],
		
						THREE.ShaderChunk[ "worldpos_vertex" ],
						THREE.ShaderChunk[ "envmap_vertex" ],
						THREE.ShaderChunk[ "lights_lambert_vertex" ],
						THREE.ShaderChunk[ "shadowmap_vertex" ],
		
					"}"
		
				].join("\n"),
		
				fragmentShader: [
					//mca
					"uniform float mNear;",
					"uniform float mFar;",
					
					
					"uniform float opacity;",
		
					"varying vec3 vLightFront;",
		
					"#ifdef DOUBLE_SIDED",
		
						"varying vec3 vLightBack;",
		
					"#endif",
		
					THREE.ShaderChunk[ "color_pars_fragment" ],
					THREE.ShaderChunk[ "map_pars_fragment" ],
					THREE.ShaderChunk[ "lightmap_pars_fragment" ],
					THREE.ShaderChunk[ "envmap_pars_fragment" ],
					THREE.ShaderChunk[ "fog_pars_fragment" ],
					THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
					THREE.ShaderChunk[ "specularmap_pars_fragment" ],
		
					"void main() {",
					
						
						
						
						"gl_FragColor = vec4( vec3 ( 1.0 ), opacity );",
		
						THREE.ShaderChunk[ "map_fragment" ],
						THREE.ShaderChunk[ "alphatest_fragment" ],
						THREE.ShaderChunk[ "specularmap_fragment" ],
		
						"#ifdef DOUBLE_SIDED",
		
							//"float isFront = float( gl_FrontFacing );",
							//"gl_FragColor.xyz *= isFront * vLightFront + ( 1.0 - isFront ) * vLightBack;",
		
							"if ( gl_FrontFacing )",
								"gl_FragColor.xyz *= vLightFront;",
							"else",
								"gl_FragColor.xyz *= vLightBack;",
		
						"#else",
		
							"gl_FragColor.xyz *= vLightFront;",
		
						"#endif",
		
						THREE.ShaderChunk[ "lightmap_fragment" ],
						THREE.ShaderChunk[ "color_fragment" ],
						THREE.ShaderChunk[ "envmap_fragment" ],
						THREE.ShaderChunk[ "shadowmap_fragment" ],
		
						THREE.ShaderChunk[ "linear_to_gamma_fragment" ],
		
						THREE.ShaderChunk[ "fog_fragment" ],
						
						//mca
						"float depth_ = gl_FragCoord.z / gl_FragCoord.w;",
						"float distOpacity = smoothstep( mNear, mFar, depth_ );",
						"gl_FragColor = vec4( gl_FragColor.rgb, distOpacity );",
						"if (distOpacity < 0.01) discard;", //depthBuffer will not be written
					"}"
		
				].join("\n")
		
			};
	
	THREE.ShaderMaterial.call(this, parameters);
};

GIScene.DistanceOpacityMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );