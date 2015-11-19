/**
 * Tiled multi LOD grid layer using the W3DS v0.4.0 OGC Discussion Paper Specification to load georeferenced 3D data
 * inherits from GIScene.Layer.Grid
 * 
 * @namespace GIScene
 * @class Layer.W3DS_0_4_0
 * @constructor
 * @extends GIScene.Layer.Grid
 * @param {String} name the layer name 
 * @param {Object} [config] a configuration object
 * @example
 * 			var layerconfig = {
				 url:"http://www.example.org/w3ds", 
				 // withCredentials:true,
				 layer:"DEM",
				 crs:"EPSG:32616", 
				 origin:new GIScene.Coordinate2(264495.0,1639108.0),
				 offset:new GIScene.Coordinate3(264495.0,1639108.0,600), //w3ds GetScene offset param from this
				 tileSizes:[1024,512,256,128], 
				 terrainHeight:600,
				 maxExtent: new GIScene.Extent2(new GIScene.Coordinate2(264495.0, 1639108.0), new GIScene.Coordinate2(274495.0, 1649108.0)),
				 maxDistance: 10000,
				 lodDistanceFactor :1.5,
				 format:GIScene.Format.Scene,
				 overrideMaterial : wmsOverlayMaterial,
				 overrideMaterialHandler : GIScene.OverrideMaterialHandler.WMS //only together with GIScene.WMSOverlayMaterial
				 // overrideMaterial : new THREE.MeshBasicMaterial({wireframe:true})
			};
			var layer = new GIScene.Layer.W3DS_0_4_0("w3ds",layerconfig);
			scene.addLayer(layer);
 * 
 */

GIScene.Layer.W3DS_0_4_0 = function(name, config) {
	
	GIScene.Layer.Grid.apply(this, [name, config]);
	
	var defaults = {
		layer	: null,
		crs		: null,
		tileSizes : [1024,512,256,128]
	};
	
	// this.config = GIScene.Utils.mergeObjects(this.config, defaults);
	this.config = GIScene.Utils.mergeObjects(defaults, this.config);
	
	var w3dsConfig = {
		url: this.url,
		withCredentials : this.config.withCredentials,
		tileSizes : this.config.tileSizes
	};
	
	var w3dsParams = {
		crs: this.config.crs,
		layer : this.config.layer,
		offset : null
	};
	
	this.config.service = new GIScene.Service.W3DS_0_4_0(w3dsConfig, w3dsParams);
	
	var onSetScene = function(event) {
		console.log("w3ds onSetScene");
		var scene = event.content;
		this.config.service.params.offset = (scene) ? this.grid.sceneOffset.toArray().join(",") : null;
	}.bind(this);
	this.addEventListener('setScene', onSetScene);
};

GIScene.Layer.W3DS_0_4_0.prototype = Object.create(GIScene.Layer.Grid.prototype);
