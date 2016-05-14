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
		isShared:true,  //if object will be disposed do not dispose material and its textures
		//standards
		color: 0xacc485, // diffuse
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
	      this.uniforms.emissive.value = new THREE.Color(value);
	    }
	  });
	
	var color = this.config.color;
	Object.defineProperty(this, 'color', {
		get	  : function() {return color;},
		set	  : function(newColor){
			color = newColor;
			this.uniforms.diffuse.value = new THREE.Color(newColor);
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
				uniforms: THREE.UniformsUtils.merge([
					  
					  THREE.ShaderLib.lambert.uniforms, 
					  
					  {
					  	"tOverlay"   : { type: "t",  value : this.texture},
						"lowerLeft"  : { type: "v2", value : this.lowerLeft},
						"upperRight" : { type: "v2", value : this.upperRight},
						"emissive" 	 : { type: "c", value: new THREE.Color(this.emissive)/*new THREE.Color( 0x000000 ) */},
						"diffuse"    : { type: "c", value: new THREE.Color(this.color) },
					  }
				]),
				
		
				vertexShader: [
				
					"varying vec3 vWorldPosition;", //mca
					//"varying vec3 vLightingOnly;",//mca
					
					//THREE.ShaderChunk[ 'meshlambert_vert' ],
					"#define LAMBERT",

					"varying vec3 vLightFront;",
					
					"#ifdef DOUBLE_SIDED",
					
					"	varying vec3 vLightBack;",
					
					"#endif",
					
					"#include <common>",
					"#include <uv_pars_vertex>",
					"#include <uv2_pars_vertex>",
					"#include <envmap_pars_vertex>",
					"#include <bsdfs>",
					"#include <lights_pars>",
					"#include <color_pars_vertex>",
					"#include <morphtarget_pars_vertex>",
					"#include <skinning_pars_vertex>",
					"#include <shadowmap_pars_vertex>",
					"#include <logdepthbuf_pars_vertex>",
					"#include <clipping_planes_pars_vertex>",
					
					"void main() {",
					
					"	#include <uv_vertex>",
					"	#include <uv2_vertex>",
					"	#include <color_vertex>",
					
					"	#include <beginnormal_vertex>",
					"	#include <morphnormal_vertex>",
					"	#include <skinbase_vertex>",
					"	#include <skinnormal_vertex>",
					"	#include <defaultnormal_vertex>",
					
					"	#include <begin_vertex>",
					"	#include <morphtarget_vertex>",
					"	#include <skinning_vertex>",
					"	#include <project_vertex>",
					"	#include <logdepthbuf_vertex>",
					"	#include <clipping_planes_vertex>",
					
					"	#include <worldpos_vertex>",
					"	#include <envmap_vertex>",
					"	#include <lights_lambert_vertex>",
					"	#include <shadowmap_vertex>",
					
					
					
					"vWorldPosition = worldPosition.xyz;", //mca
					
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
					
					//meshlambert_frag
					"uniform vec3 diffuse;",
					"uniform vec3 emissive;",
					"uniform float opacity;",
					 
					"varying vec3 vLightFront;",
					 
					"#ifdef DOUBLE_SIDED",
					 
					"	varying vec3 vLightBack;",
					 
					"#endif",
					 
					"#include <common>",
					"#include <packing>",
					"#include <color_pars_fragment>",
					"#include <uv_pars_fragment>",
					"#include <uv2_pars_fragment>",
					"#include <map_pars_fragment>",
					"#include <alphamap_pars_fragment>",
					"#include <aomap_pars_fragment>",
					"#include <lightmap_pars_fragment>",
					"#include <emissivemap_pars_fragment>",
					"#include <envmap_pars_fragment>",
					"#include <bsdfs>",
					"#include <lights_pars>",
					"#include <fog_pars_fragment>",
					"#include <shadowmap_pars_fragment>",
					"#include <shadowmask_pars_fragment>",
					"#include <specularmap_pars_fragment>",
					"#include <logdepthbuf_pars_fragment>",
					"#include <clipping_planes_pars_fragment>",
					 
					"void main() {",
					 
					"	#include <clipping_planes_fragment>",
					 
					"	vec4 diffuseColor = vec4( diffuse, opacity );",
					"	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );",
					"	vec3 totalEmissiveRadiance = emissive;",
					 
					"	#include <logdepthbuf_fragment>",
					"	#include <map_fragment>",
					"	#include <color_fragment>",
					"	#include <alphamap_fragment>",
					"	#include <alphatest_fragment>",
					"	#include <specularmap_fragment>",
					"	#include <emissivemap_fragment>",
					 
					"	// accumulation",
					"	reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );",
					
					"   vec3 mca_indirectDiffuse = reflectedLight.indirectDiffuse;",//mca copy of line above
					 
					"	#include <lightmap_fragment>",
					
					"   mca_indirectDiffuse *= BRDF_Diffuse_Lambert( vec3(1.0) );",//mca white
					
					"	reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );",
					 
					"	#ifdef DOUBLE_SIDED",
					 
					"		reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;",
					
					"	#else",
					 
					"		reflectedLight.directDiffuse = vLightFront;",
					 
					"	#endif",
					 
					"   vec3 mca_directDiffuse = reflectedLight.directDiffuse;", //mca copy of front or backside light
					
					"	mca_directDiffuse *= BRDF_Diffuse_Lambert( vec3(1.0) ) * getShadowMask();", //mca
					 
					"	reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();",
					 
					"	// modulation",
					"	#include <aomap_fragment>",
					 
					"	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",
					
					"   vec3 mca_outgoingLight = mca_directDiffuse + mca_indirectDiffuse + totalEmissiveRadiance;", //mca 
					 
					"	#include <envmap_fragment>",
					 
					"	gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
					 
					"	#include <premultiplied_alpha_fragment>",
					"	#include <tonemapping_fragment>",
					"	#include <encodings_fragment>",
					"	#include <fog_fragment>",
					
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
								//"gl_FragColor =  mix(gl_FragColor,vec4(tColor.rgb * (vLightingOnly + ambientLightColor + emissive), opacity), tColor.a);",
								// "gl_FragColor =  mix(gl_FragColor,vec4(tColor.rgb * (outgoingLight), opacity), tColor.a);", //everything green
								// "gl_FragColor =  mix(gl_FragColor,vec4(tColor.rgb * (reflectedLight.directDiffuse), opacity), tColor.a);",
								// "gl_FragColor =  vec4(reflectedLight.directDiffuse, 1);", //dark shades
								//"gl_FragColor =  vec4(reflectedLight.indirectDiffuse, 1);",  //diffuse color dark without shades
								//"gl_FragColor =  vec4(totalEmissiveRadiance, 1);",  // the emissive color
								// "gl_FragColor =  vec4(( vLightFront ), opacity);",  //white shaded
								"gl_FragColor =  mix(gl_FragColor,vec4(tColor.rgb * (mca_outgoingLight), opacity), tColor.a);", 
								
								  
								
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