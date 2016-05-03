/** GIScene.Layer.Fixed() is a simple layer type that loads a Model or a Scene from a url. 
 *  It doesn't care about BoundingBoxes, Frustums, LODs or geographic grids.
 * 
 * @namespace GIScene
 * @class Layer.Fixed
 * @constructor
 * @extends GIScene.Layer
 * @param {String} name the layer name for display purposes
 * @param {Object} [config] the layer configuration object
 * @example
 * 
 * 	var onload = function(event){// do something when model is loaded};
 * 	var layerconfig = {
 * 		url: "./path/myModel.json",
 * 		format: GIScene.Format.JSON,
 * 		verticalAxis : "Z",
 * 		listeners:[{'load':onload}]
 * 	};
 * 	var layer = new GIScene.Layer.Fixed("My Layer", layerconfig);
 * 	scene.addLayer(layer);
 * 
 */ 

GIScene.Layer.Fixed = function(name, config){
	
	//make this a Layer
	GIScene.Layer.apply(this, [name]);
	
	this.config = GIScene.Utils.mergeObjects(this.config, config);
	
	this.url = null;
	this.format = null;
	this.boundingBox = null;
	this.verticalAxis = null;
	this.listeners = null;
	
	var onload = function(event){
		// console.log("Fixed:onload");
		var result = event.content;
		if(this.verticalAxis.toUpperCase() == "Z"){
			result.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI/2 ) );
		}
		//setOverrideMaterial
		this.setOverrideMaterial(result, this.config.overrideMaterial);

		this.root.add(result);
		
		this.boundingBox = new THREE.Box3().setFromObject(this.root);
		
		//update selectables
		if(this.selectControl){
			this.selectControl.selectables = GIScene.Utils.getDescendants(this.root); //r76
		}
		
		/**
		 * Fires after layer is loaded. 
		 * event.content holds a reference to the layer
		 * @event load 
		 */
		this.dispatchEvent({type:'load', content: this});
	}.bind(this);
	
	this.init = function(){
		this.name = name;
	  if(this.config.url && "format" in this.config){
	  	this.url = this.config.url;
	  	this.format = this.config.format;
	  	this.verticalAxis = this.config.verticalAxis || "Y";
	  	this.boundingBox = new THREE.Box3();
	  	this.listeners = this.config.listeners;
	  	for(var i=0,j=this.listeners.length; i<j; i++){
			for(type in this.listeners[i])
			this.addEventListener(type, this.listeners[i][type]);
		  };
	  	
	  	this.loader.addEventListener('load', onload);
	  	this.loader.load(this.url, this.format);
	  }
	  else {console.error('url or format missing in layer config!');}
	};
	
	//start auto initialization 
	this.init();
};

//Inherit from GIScene.Layer
GIScene.Layer.Fixed.prototype = Object.create( GIScene.Layer.prototype );