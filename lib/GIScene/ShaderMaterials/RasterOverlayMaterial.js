/**
 * This Material renders a georeferenced texture on a mesh without using textureCoordinates, but realWorldCoordinates of each fragment(pixel).
 * 
 * @namespace GIScene
 * @class RasterOverlayMaterial
 * @constructor
 * @param {Object} config an Object with config properties
 * @example
 * 		rasterOverlayMaterial = new GIScene.RasterOverlayMaterial({
				lowerLeft: 	new GIScene.Coordinate2(llX, llY), //the lower left coordinate of the image boundingBox
				upperRight:	new GIScene.Coordinate2(urX, urY), //the upper right coordinate of the image boundingBox
				offset2:	new GIScene.Coordinate2(offsetX,offsetY), //optional
				url:"http://www.example.com/rasterimage.jpg",
				crossOrigin:"anonymous"	
				// texture: texture //instead of url you can also pass an existing texture	
		});
 * 
 */

GIScene.RasterOverlayMaterial = function(config) {
	//config-options: 
	//url or texture
	//crossOrigin default "anonymous" || "use-credentials"
	//lowerLeft (compute BBOX)
	//upperRight (compute BBOX)--> no offset needed
	//??? sceneOffset or LayerOffset??? translate??
	
	var defaults = {
		texture: null,
		url: null,
		crossOrigin : "anonymous",
		lowerLeft : new GIScene.Coordinate2(-100,-100), //GIScene.Coordinate2
		upperRight: new GIScene.Coordinate2(100,100), //GIScene.Coordinate2
		offset2: null,  //GIScene.Coordinate2
		isShared:true,  //if object will be disosed do not dispose material and its textures
		//standards
		emissive : new THREE.Color(0x000000)
	};
	
	/**
	 * The config which is used to initialize the RasterOverlayMaterial. Merged from defaults and passed config Object.
	 * 
	 * @property config
	 * @type Object
	 */
	this.config = GIScene.Utils.mergeObjects(defaults, config || {});
	
	//@TODO convert geo coordinates into system coordinates inclusive substraction of offset
	// var offset  = (offset) ? offset : new THREE.Vector2(0,0);
	// var lowerLeft  = lowerLeft.sub(offset)  || new THREE.Vector2(-100,-100);
	// var upperRight = upperRight.sub(offset) || new THREE.Vector2(100,100);
	this.url = this.config.url;
	this.crossOrigin = this.config.crossOrigin;
	this.offset2  = (this.config.offset2) ? this.config.offset2 : new GIScene.Coordinate2(0,0);
	this.lowerLeft  = this.config.lowerLeft.sub(this.offset2)  || new GIScene.Coordinate2(-100,-100);
	this.upperRight = this.config.upperRight.sub(this.offset2) || new GIScene.Coordinate2(100,100);
	this.texture = this.config.texture || new THREE.Texture();
	this.isShared = this.config.isShared;
	
	//standards
	var em = this.config.emissive;
	
	Object.defineProperty(this, 'emissive', {
	    get: function() {
	      console.log('get! emissive');
	      return em;
	    },
	    set: function(value) {
	      em = value;
	      this.uniforms.emissive.value = value;
	    }
	  });
	
	
	if (this.url){
		this.setTextureFromUrl(this.url, this.crossOrigin);
	}
	
	var parameters = {
				transparent:true,
				lights: true,
				side:0,
				shading: THREE.SmoothShading,
				uniforms: THREE.UniformsUtils.merge( [
		
					THREE.UniformsLib[ "common" ],
					THREE.UniformsLib[ "fog" ],
					THREE.UniformsLib[ "lights" ],
					THREE.UniformsLib[ "shadowmap" ],
		
					{
						"diffuse" : { type: "c", value: new THREE.Color( 0x36421E ) },
						"ambient"  : { type: "c", value: new THREE.Color( 0x36421E ) },
						"emissive" : { type: "c", value: this.emissive/*new THREE.Color( 0x000000 ) */},
						"wrapRGB"  : { type: "v3", value: new THREE.Vector3( 1, 1, 1 ) },
					
						// "mNear": { type: "f", value: near },
						// "mFar" : { type: "f", value: far }
						"tOverlay"   : { type: "t",  value : this.texture},
						"lowerLeft"  : { type: "v2", value : this.lowerLeft},
						"upperRight" : { type: "v2", value : this.upperRight}
					}
		
				] ),
		
				vertexShader: [
				
					"varying vec3 vWorldPosition;", //mca
					"varying vec3 vLightingOnly;",//mca
					
					THREE.ShaderChunk[ 'meshlambert_vert' ]
					
					
				].join("\n"),
				vertexShader_r63: [
					"varying vec3 vWorldPosition;",
		
					"#define LAMBERT",
		
					"varying vec3 vLightFront;",
					
					"varying vec3 vLightingOnly;",//mca
		
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
						//mca THREE.ShaderChunk[ "lights_lambert_vertex" ],
								"vLightFront = vec3( 0.0 );",

								"#ifdef DOUBLE_SIDED",
						
									"vLightBack = vec3( 0.0 );",
						
								"#endif",
						
								"transformedNormal = normalize( transformedNormal );",
						
								"#if MAX_DIR_LIGHTS > 0",
						
								"for( int i = 0; i < MAX_DIR_LIGHTS; i ++ ) {",
						
									"vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );",
									"vec3 dirVector = normalize( lDirection.xyz );",
						
									"float dotProduct = dot( transformedNormal, dirVector );",
									"vec3 directionalLightWeighting = vec3( max( dotProduct, 0.0 ) );",
						
									"#ifdef DOUBLE_SIDED",
						
										"vec3 directionalLightWeightingBack = vec3( max( -dotProduct, 0.0 ) );",
						
										"#ifdef WRAP_AROUND",
						
											"vec3 directionalLightWeightingHalfBack = vec3( max( -0.5 * dotProduct + 0.5, 0.0 ) );",
						
										"#endif",
						
									"#endif",
						
									"#ifdef WRAP_AROUND",
						
										"vec3 directionalLightWeightingHalf = vec3( max( 0.5 * dotProduct + 0.5, 0.0 ) );",
										"directionalLightWeighting = mix( directionalLightWeighting, directionalLightWeightingHalf, wrapRGB );",
						
										"#ifdef DOUBLE_SIDED",
						
											"directionalLightWeightingBack = mix( directionalLightWeightingBack, directionalLightWeightingHalfBack, wrapRGB );",
						
										"#endif",
						
									"#endif",
						
									"vLightFront += directionalLightColor[ i ] * directionalLightWeighting;",
						
									"#ifdef DOUBLE_SIDED",
						
										"vLightBack += directionalLightColor[ i ] * directionalLightWeightingBack;",
						
									"#endif",
						
								"}",
						
								"#endif",
						
								"#if MAX_POINT_LIGHTS > 0",
						
									"for( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {",
						
										"vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );",
										"vec3 lVector = lPosition.xyz - mvPosition.xyz;",
						
										"float lDistance = 1.0;",
										"if ( pointLightDistance[ i ] > 0.0 )",
											"lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );",
						
										"lVector = normalize( lVector );",
										"float dotProduct = dot( transformedNormal, lVector );",
						
										"vec3 pointLightWeighting = vec3( max( dotProduct, 0.0 ) );",
						
										"#ifdef DOUBLE_SIDED",
						
											"vec3 pointLightWeightingBack = vec3( max( -dotProduct, 0.0 ) );",
						
											"#ifdef WRAP_AROUND",
						
												"vec3 pointLightWeightingHalfBack = vec3( max( -0.5 * dotProduct + 0.5, 0.0 ) );",
						
											"#endif",
						
										"#endif",
						
										"#ifdef WRAP_AROUND",
						
											"vec3 pointLightWeightingHalf = vec3( max( 0.5 * dotProduct + 0.5, 0.0 ) );",
											"pointLightWeighting = mix( pointLightWeighting, pointLightWeightingHalf, wrapRGB );",
						
											"#ifdef DOUBLE_SIDED",
						
												"pointLightWeightingBack = mix( pointLightWeightingBack, pointLightWeightingHalfBack, wrapRGB );",
						
											"#endif",
						
										"#endif",
						
										"vLightFront += pointLightColor[ i ] * pointLightWeighting * lDistance;",
						
										"#ifdef DOUBLE_SIDED",
						
											"vLightBack += pointLightColor[ i ] * pointLightWeightingBack * lDistance;",
						
										"#endif",
						
									"}",
						
								"#endif",
						
								"#if MAX_SPOT_LIGHTS > 0",
						
									"for( int i = 0; i < MAX_SPOT_LIGHTS; i ++ ) {",
						
										"vec4 lPosition = viewMatrix * vec4( spotLightPosition[ i ], 1.0 );",
										"vec3 lVector = lPosition.xyz - mvPosition.xyz;",
						
										"float spotEffect = dot( spotLightDirection[ i ], normalize( spotLightPosition[ i ] - worldPosition.xyz ) );",
						
										"if ( spotEffect > spotLightAngleCos[ i ] ) {",
						
											"spotEffect = max( pow( spotEffect, spotLightExponent[ i ] ), 0.0 );",
						
											"float lDistance = 1.0;",
											"if ( spotLightDistance[ i ] > 0.0 )",
												"lDistance = 1.0 - min( ( length( lVector ) / spotLightDistance[ i ] ), 1.0 );",
						
											"lVector = normalize( lVector );",
						
											"float dotProduct = dot( transformedNormal, lVector );",
											"vec3 spotLightWeighting = vec3( max( dotProduct, 0.0 ) );",
						
											"#ifdef DOUBLE_SIDED",
						
												"vec3 spotLightWeightingBack = vec3( max( -dotProduct, 0.0 ) );",
						
												"#ifdef WRAP_AROUND",
						
													"vec3 spotLightWeightingHalfBack = vec3( max( -0.5 * dotProduct + 0.5, 0.0 ) );",
						
												"#endif",
						
											"#endif",
						
											"#ifdef WRAP_AROUND",
						
												"vec3 spotLightWeightingHalf = vec3( max( 0.5 * dotProduct + 0.5, 0.0 ) );",
												"spotLightWeighting = mix( spotLightWeighting, spotLightWeightingHalf, wrapRGB );",
						
												"#ifdef DOUBLE_SIDED",
						
													"spotLightWeightingBack = mix( spotLightWeightingBack, spotLightWeightingHalfBack, wrapRGB );",
						
												"#endif",
						
											"#endif",
						
											"vLightFront += spotLightColor[ i ] * spotLightWeighting * lDistance * spotEffect;",
						
											"#ifdef DOUBLE_SIDED",
						
												"vLightBack += spotLightColor[ i ] * spotLightWeightingBack * lDistance * spotEffect;",
						
											"#endif",
						
										"}",
						
									"}",
						
								"#endif",
						
								"#if MAX_HEMI_LIGHTS > 0",
						
									"for( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {",
						
										"vec4 lDirection = viewMatrix * vec4( hemisphereLightDirection[ i ], 0.0 );",
										"vec3 lVector = normalize( lDirection.xyz );",
						
										"float dotProduct = dot( transformedNormal, lVector );",
						
										"float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;",
										"float hemiDiffuseWeightBack = -0.5 * dotProduct + 0.5;",
						
										"vLightFront += mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight );",
						
										"#ifdef DOUBLE_SIDED",
						
											"vLightBack += mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeightBack );",
						
										"#endif",
						
									"}",
						
								"#endif",
								
								"vLightingOnly = vLightFront;", //mca
						
								"vLightFront = vLightFront * diffuse + ambient * ambientLightColor + emissive;",
						
								"#ifdef DOUBLE_SIDED",
						
									"vLightBack = vLightBack * diffuse + ambient * ambientLightColor + emissive;",
						
								"#endif",
								
								
						THREE.ShaderChunk[ "shadowmap_vertex" ],
						
						
						"vWorldPosition = worldPosition.xyz;",
					"}"
		
				].join("\n"),
		
				fragmentShader: [
					//mca
					// "uniform float mNear;",
					// "uniform float mFar;",
					"varying vec3 vWorldPosition;",
					"uniform vec2 lowerLeft;",
					"uniform vec2 upperRight;",
					"uniform sampler2D tOverlay;",
					
					"uniform vec3 ambient;",
					"uniform vec3 diffuse;",
					"uniform vec3 emissive;",
					"uniform vec3 ambientLightColor;",
					
					"uniform float opacity;",
		
					"varying vec3 vLightFront;",
					
					"varying vec3 vLightingOnly;",//mca
		
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
						// "if(vWorldPosition.x >= lowerLeft.x && vWorldPosition.x <= upperRight.x && -vWorldPosition.z >= lowerLeft.y && -vWorldPosition.z <= upperRight.y)",
							// "{",
								// "vec2 worldPosGeo = vec2(vWorldPosition.x, -vWorldPosition.z);",
								// "vec4 tColor = texture2D(tOverlay,  (worldPosGeo-lowerLeft) / (upperRight - lowerLeft));",
								// // use emissive for selection, don't subtract it  "gl_FragColor = mix(gl_FragColor,vec4(((gl_FragColor.rgb - emissive - (ambient * ambientLightColor) )/diffuse) * tColor.rgb, opacity ),tColor.a) ;",
								// "gl_FragColor = mix(gl_FragColor,vec4((((gl_FragColor.rgb - emissive - (ambient * ambientLightColor) )/diffuse) +emissive)* tColor.rgb, opacity ),tColor.a) ;",
// 								
								// //new test
// 								
								// // "gl_FragColor =  mix(vec4(1.0),tColor, tColor.a);",
// 								
							// "}",
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
						//this was ShaderChunk color_fragment
						"#ifdef USE_COLOR",
							
							"gl_FragColor = gl_FragColor * vec4( vColor, opacity );",

						"#endif",
						THREE.ShaderChunk[ "envmap_fragment" ],
						THREE.ShaderChunk[ "shadowmap_fragment" ],
		
						THREE.ShaderChunk[ "linear_to_gamma_fragment" ],
		
						THREE.ShaderChunk[ "fog_fragment" ],
						
						//mca
						// "float depth_ = gl_FragCoord.z / gl_FragCoord.w;",
						// "float distOpacity = smoothstep( mNear, mFar, depth_ );",
						// "gl_FragColor = vec4( gl_FragColor.rgb, distOpacity );",
						// "if (distOpacity < 0.01) discard;", //depthBuffer will not be written
						
						"if(vWorldPosition.x >= lowerLeft.x && vWorldPosition.x <= upperRight.x && -vWorldPosition.z >= lowerLeft.y && -vWorldPosition.z <= upperRight.y)",
							"{",
								"vec2 worldPosGeo = vec2(vWorldPosition.x, -vWorldPosition.z);",
								"vec4 tColor = texture2D(tOverlay,  (worldPosGeo-lowerLeft) / (upperRight - lowerLeft));",
								// use emissive for selection, don't subtract it  "gl_FragColor = mix(gl_FragColor,vec4(((gl_FragColor.rgb - emissive - (ambient * ambientLightColor) )/diffuse) * tColor.rgb, opacity ),tColor.a) ;",
								//"gl_FragColor = mix(gl_FragColor,vec4(((gl_FragColor.rgb - (ambient * ambientLightColor) )/diffuse) * tColor.rgb, opacity ),tColor.a) ;",
								
								//new test
								
								//"gl_FragColor =  mix(vec4(vec3(1.0),opacity),vec4(tColor.rgb* (((vLightFront-emissive-(ambient * ambientLightColor))/diffuse)+emissive), opacity), tColor.a);",
								//"gl_FragColor =  mix(gl_FragColor,vec4(tColor.rgb* (((vLightFront-emissive-(ambient * ambientLightColor))/diffuse)+emissive+ambientLightColor), opacity), tColor.a);",
								//"gl_FragColor =  mix(gl_FragColor,vec4(tColor.rgb* (((vLightFront-emissive-(ambient * ambientLightColor)))+emissive+ambientLightColor), opacity), tColor.a);",
								//"gl_FragColor =  mix(gl_FragColor,vec4(tColor.rgb* (((vLightFront-emissive-(ambient * ambientLightColor)) / diffuse)+emissive+ambientLightColor), opacity), tColor.a);",
								"gl_FragColor =  mix(gl_FragColor,vec4(tColor.rgb * (vLightingOnly + ambientLightColor + emissive), opacity), tColor.a);",
								  
								
							"}",
						
					"}"
		
				].join("\n")		
	};
	
	THREE.ShaderMaterial.call(this, parameters);
	
	
	
};

GIScene.RasterOverlayMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

/**
 * Sets the upper right corner coordinate of the bounding box which georeferences the texture
 * @method setUpperRight
 * @param {GIScene.Coordinate2} coord2 Coordinate in CRS units
 */
GIScene.RasterOverlayMaterial.prototype.setUpperRight = function(coord2) {
	this.upperRight = coord2.sub(this.offset2);
	this.uniforms.upperRight.value = this.upperRight;
};

/**
 * Sets the lower left corner coordinate of the bounding box which georeferences the texture
 * @method setLowerLeft
 * @param {GIScene.Coordinate2} coord2 Coordinate in CRS units
 */
GIScene.RasterOverlayMaterial.prototype.setLowerLeft = function(coord2) {
	this.lowerLeft = coord2.sub(this.offset2);
	this.uniforms.lowerLeft.value = this.lowerLeft;
};

/**
 * Sets a raster image as overlay texture
 * @method setTexture
 * @param {THREE.Texture} texture
 */
GIScene.RasterOverlayMaterial.prototype.setTexture = function(texture) {
	this.texture = this.uniforms.tOverlay.value = texture;
	/**
	 *@event settexture fires after a new texture has been set to the material
	 */
	this.dispatchEvent({type:"settexture", content:{texture:texture}});
};

/**
 * asyncronously loads and attaches a texture by specifiing a url to an image and optionally updates the material uniforms (lowerLeft and upperRight)
 * 
 * @method setTextureFromUrl
 * @param {String} url
 * @param {String} crossOrigin either "anonymous" or "use-credentials"
 * @param {Function} callback function after texture has been loaded and attached to material
 */
GIScene.RasterOverlayMaterial.prototype.setTextureFromUrl = function(url, crossOrigin, onSetTexture) {
	this.crossOrigin = (crossOrigin)? crossOrigin : this.crossOrigin;
	this.url = url;
	var texLoader = new THREE.TextureLoader();
	texLoader.setCrossOrigin(this.crossOrigin);
	var onOverlayLoad = function(e){
		if(onSetTexture) {onSetTexture();}
		this.setTexture(e);
	}.bind(this);
	texLoader.load(this.url, onOverlayLoad);
};

/**
 * Sets an offset which will be subtracted from real world coordinates in case the geometry uses also an offset (scene.offset)
 * @method setOffset2
 * @param {GIScene.Coordinate2} coord2
 */
GIScene.RasterOverlayMaterial.prototype.setOffset2 = function(coord2) {
	var offset2Old = this.offset2;
	this.offset2 = coord2;
	this.setLowerLeft(this.lowerLeft.add(offset2Old));
	this.setUpperRight(this.upperRight.add(offset2Old));
};

/**
 * Clones the material. BUT reuses the texture without cloning it.
 * @method clone
 * @return {GIScene.RasterOverlayMaterial} material 
 */
GIScene.RasterOverlayMaterial.prototype.clone = function() {
	var material = new GIScene.RasterOverlayMaterial();
	material.config = GIScene.Utils.mergeObjects(material.config, this.config);
	material.url = this.url;
	material.crossOrigin = this.crossOrigin;
	material.offset2  = this.offset2;
	material.lowerLeft  = this.lowerLeft;
	material.upperRight = this.upperRight;
	material.texture = this.texture;
	
	material.uniforms.lowerLeft.value = this.uniforms.lowerLeft.value;
	material.uniforms.upperRight.value = this.uniforms.upperRight.value;
	material.uniforms.tOverlay.value = this.uniforms.tOverlay.value;
	
	// THREE.ShaderMaterial.prototype.clone.call(this);
	
	return material;
};