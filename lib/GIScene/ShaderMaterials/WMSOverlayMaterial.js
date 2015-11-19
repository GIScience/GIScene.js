/**
 * special raster overlay material to use OGC-WMS services as image source 
 * 
 * @namespace GIScene
 * @class WMSOverlayMaterial
 * @constructor
 * @param {Object} config the config object for the material
 * @param {Object} params the OGC-WMS params for the request string
 */

GIScene.WMSOverlayMaterial = function(config, params) {
	//inherit
	GIScene.RasterOverlayMaterial.apply(this, [config]);
	
	var defaults = {
		wmsServiceUrl : "",
		crossOrigin : "anonymous"
	};
	
	var defaultParams = {
		service : "WMS",
		request : "GetMap",
		version : "1.1.1",
		format  : "image/png",
		srs		: "EPSG:32616",
		layers	: null,
		styles	: "",
		bbox	: null,
		width	: "256",
		height	: "256"
	};
	
	/**
	 * The config which is used to initialize the WMSOverlayMaterial. Merged from defaults and passed config Object.
	 * 
	 * @property config
	 * @type Object
	 */
	this.config = GIScene.Utils.mergeObjects(defaults, config || {});
	this.params = GIScene.Utils.mergeObjects(defaultParams, params || {});
	
	//make sure that url ends with ?
	this.wmsServiceUrl = (this.config.wmsServiceUrl=="")?"":this.config.wmsServiceUrl.trim().replace(/(\/|\?)*$/,"?");
	
	if (this.params.bbox){this.setLLURFromBboxParam();}
	
	if (!this.config.wmsServiceUrl==""){
		this.setTextureFromUrl(this.getGetMapUrl(), this.config.crossOrigin);
	}
	
	
};

GIScene.WMSOverlayMaterial.prototype = Object.create(GIScene.RasterOverlayMaterial.prototype);

/**
 * set BBOX paramter string from internal lowerLeft and upperRight properties 
 * @method setBboxParamFromLLUR
 */
GIScene.WMSOverlayMaterial.prototype.setBboxParamFromLLUR = function() {
	this.params.bbox = this.lowerLeft.clone().add(this.offset2).toArray().toString() + "," + this.upperRight.clone().add(this.offset2).toArray().toString();
};

/**
 * set internal lowerLeft and upperRight properties from params.bbox
 * @method setLLURFromBboxParam
 */
GIScene.WMSOverlayMaterial.prototype.setLLURFromBboxParam = function() {
	var bboxCoords = this.params.bbox.split(",");
	this.setLowerLeft(new GIScene.Coordinate2(bboxCoords[0],bboxCoords[1]));
	this.setUpperRight(new GIScene.Coordinate2(bboxCoords[2],bboxCoords[3]));
};

/**
 * Returns a URL with OGC-WMS parameters based on the material params
 * @method getGetMapUrl
 * @return {String} getMapUrl
 */
GIScene.WMSOverlayMaterial.prototype.getGetMapUrl = function() {
	if (!this.params.bbox){this.setBboxParamFromLLUR();}
	
	var getMapUrl = [
						this.wmsServiceUrl,
						"SERVICE="	+ this.params.service,
						"REQUEST="	+ this.params.request,
						"VERSION="	+ this.params.version,	
						"FORMAT=" 	+ this.params.format,
						"SRS="		+ this.params.srs,
						"LAYERS="	+ this.params.layers, 
						"STYLES="	+ this.params.styles,
						"BBOX=" 	+ this.params.bbox,
						"WIDTH="		+ this.params.width,
						"HEIGHT="	+ this.params.height
						
					].join("&");
	return getMapUrl;
};

/**
 * Clones the material. BUT reuses the texture without cloning it.
 * @method clone
 * @return {GIScene.WMSOverlayMaterial} material 
 */ 
GIScene.WMSOverlayMaterial.prototype.clone = function() {
	var material = new GIScene.WMSOverlayMaterial(); //this.config, this.params
	
	material.config = GIScene.Utils.mergeObjects(material.config, this.config);
	
	material.params = GIScene.Utils.mergeObjects(material.params, this.params);
	
	//make sure that url ends with ?
	material.wmsServiceUrl = this.wmsServiceUrl;
	
	//from RasterOverlayMaterial
	material.url = this.url;
	material.crossOrigin = this.crossOrigin;
	material.offset2  = this.offset2;
	material.lowerLeft  = this.lowerLeft;
	material.upperRight = this.upperRight;
	material.texture = this.texture;
	
	material.uniforms.lowerLeft.value = this.uniforms.lowerLeft.value;
	material.uniforms.upperRight.value = this.uniforms.upperRight.value;
	material.uniforms.tOverlay.value = this.uniforms.tOverlay.value;
	// GIScene.RasterOverlayMaterial.prototype.clone.call(this);
	
	// material.config = GIScene.Utils.mergeObjects(this.config, {});
	// material.params = GIScene.Utils.mergeObjects(this.params, {});
	// material.wmsServiceUrl = this.wmsServiceUrl;
	return material;
};