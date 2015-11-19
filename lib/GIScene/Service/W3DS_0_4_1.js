/**
 * Service Interface to load data from a W3DS OGC Discussion Paper Specification Implementation
 * 
 * @namespace GIScene
 * @class Service.W3DS_0_4_1
 * @constructor
 * @extends GIScene.Service
 * @param {Object} config a config object for this class
 * @param {Object} params an object to specify service parameters, e.g. layer, crs, offset
 */

GIScene.Service.W3DS_0_4_1 = function(config, params) {
	
	var defaults = {
		url:null,
		withCredentials :false,
		tileSizes : null
	};
	
	var defaultParams = {
		service : "W3DS",
		version : "0.4.1",
		format  : "model/threejs",
		crs		: null,
		layer	: null,
		offset	: null,
		lods	: null
	};
	

//Properties
	this.config = GIScene.Utils.mergeObjects(defaults, config);
	this.params = GIScene.Utils.mergeObjects(defaultParams, params);
	
	this.url = this.config.url.trim().replace(/(\/|\?)*$/,"?");
	
	// var xhr = new XMLHttpRequest();

//W3DS Methods

//getCapabilities

//getLayerInfo

//getFeatureInfo

//getScene
	this.getGetSceneUrl = function(gridIndex, grid) {
		var request		= "GetScene";
		var tileSize = gridIndex.tileSize;
		var boundingBox = grid.getBoundingBoxFromIndex(gridIndex);
		var lowerLeft	= new GIScene.Coordinate2().fromVector2(new THREE.Vector2(boundingBox.left, boundingBox.bottom)).add(grid.sceneOffset).toArray().join(","); //???
		var upperRight	= new GIScene.Coordinate2().fromVector2(new THREE.Vector2(boundingBox.right, boundingBox.top)).add(grid.sceneOffset).toArray().join(",");
		
//this.origin.toVector2().clone().sub(GIScene.Utils.vector3ToVector2(_sceneOffset));
		var paramsString = [
							"SERVICE="	+ this.params.service,
							"REQUEST="	+ request,
							"VERSION="	+ this.params.version,	
							"CRS="		+ this.params.crs,
							"BOUNDINGBOX=" + lowerLeft+","+upperRight,
							// "MINHEIGHT="+
							// "MAXHEIGHT="+
							// "SPATIALSELECTION="+"contains_center", //option not supported
							"FORMAT=" 	+ this.params.format,
							"LAYERS="	+ this.params.layer, //layers vs layer??
							// "STYLES="+
							(this.params.lods)   ? "LOD="	 + this.params.lods   : "", //should be LODS see OGC Discussion Paper
							// "LODSELECTION="+
							// "TIME="+
							(this.params.offset) ? "OFFSET=" + this.params.offset : ""
							// "EXCEPTIONS=+"
							// "BACKGROUND="+
							// "LIGHT="+
							// "VIEWPOINTS="+
							].join("&");
		
		return this.url + paramsString;		

	};

	this.getGetTileUrl = function(gridIndex){
		var method = "GET";
		var tileLevel 	= this.config.tileSizes.indexOf(gridIndex.tileSize);
		var tileCol		= gridIndex.x;
		var tileRow		= gridIndex.y;
		var request		= "GetTile";
				
		var paramsString = [
							"SERVICE="	+ this.params.service,
							"REQUEST="	+ request,
							"VERSION="	+ this.params.version,
							"FORMAT=" 	+ this.params.format,
							"CRS="		+ this.params.crs,
							"LAYER="	+ this.params.layer,
							"TILELEVEL="+ tileLevel,
							"TILECOL="	+ tileCol,
							"TILEROW="	+ tileRow	
							].join("&");
		
		return this.url + paramsString;		
	};
	
	 /** getTile Requset to retrieve tiles from a W3DS Service
	 * 
	 * @method getTile
	 * @param {Object} params specify the following properties: {String} layer, {Number} tileLevel, {Number} tileCol, {Number} tileRow
	 * @param {Function} onSuccess will be called with the response when the request was successful
	 * @param {Function} onError will be called when the request failed
	 */
	
	this.getTile = function(gridIndex, onSuccess,  onError){
		
		var url = this.getGetTileUrl(gridIndex);

		onSuccess		= onSuccess || function() {};
		onError			= onError	|| function() {};
		var xhr = new XMLHttpRequest();
		xhr.addEventListener('load' , onSuccess, false);
		xhr.addEventListener('error', onError  , false);
		xhr.addEventListener('error', function(e) {console.log("Error on GIScene.Service.W3DS_0_4_0");console.log(e);}, false);
		xhr.open(method, url, true);
		//xhr.setRequestHeader("Authorization", "Basic " + btoa("mauer:Kangoo.2000"));
		xhr.withCredentials = this.config.withCredentials;
		try {xhr.send(null);}
		catch (e){console.log(e);}
		;
	};
	

};

//Inherit
GIScene.Service.W3DS_0_4_0.prototype = Object.create(GIScene.Service.prototype);
