/**
 * OverrideMaterialHandler to assign WMS images to objects, like terrain tiles.
 * Works only with GIScene.RasterOverlayMaterial
 * 
 * @namespace GIScene
 * @class OverrideMaterialHandler.WMS
 */

GIScene.OverrideMaterialHandler.WMS = function(event) {
	//inherit from abstact base class
	GIScene.OverrideMaterialHandler.apply(this,[event]);
	//only act when material is WMSOverlayMateriakl and on objects containing geometry
	if( !(this.overrideMaterial instanceof GIScene.WMSOverlayMaterial)  || !this.object.geometry)return;
	
	var onSetTexture = function() {
		//set uniforms after new texture has been loaded, use old uniforms and texture during loading time
		objOverrideMaterial.uniforms.lowerLeft.value = objOverrideMaterial.lowerLeft;
		objOverrideMaterial.uniforms.upperRight.value = objOverrideMaterial.upperRight;	
		objOverrideMaterial.unsharedWmsTextureLoaded = true;
		
		
	}.bind(this);
	
	var bbox2 = new GIScene.Extent2().fromBox3(new THREE.Box3().setFromObject(this.object));
	var objOverrideMaterial = this.overrideMaterial.clone();
	
	objOverrideMaterial.waitForTexture = true;
	
	// objOverrideMaterial.setTexture(new THREE.Texture());
	// objOverrideMaterial.setTexture(null);
	objOverrideMaterial.lowerLeft = bbox2.min;
	// objOverrideMaterial.uniforms.lowerLeft.value = objOverrideMaterial.lowerLeft;
	objOverrideMaterial.upperRight = bbox2.max;
	// objOverrideMaterial.uniforms.upperRight.value = objOverrideMaterial.upperRight;
	
	objOverrideMaterial.isShared = false; //material and texture will be deleted in GIScene.Grid.TileStore.removeOldestEntry()	
	
	objOverrideMaterial.setBboxParamFromLLUR();
	
	//assign material
	this.object.material = objOverrideMaterial;
	objOverrideMaterial.setTextureFromUrl(objOverrideMaterial.getGetMapUrl(), objOverrideMaterial.config.crossOrigin, onSetTexture);
	// console.log("objOverrideMaterial",objOverrideMaterial);
	// //assign material
	// this.object.material = objOverrideMaterial;
};

GIScene.OverrideMaterialHandler.WMS.prototype = Object.create(GIScene.OverrideMaterialHandler.prototype);
