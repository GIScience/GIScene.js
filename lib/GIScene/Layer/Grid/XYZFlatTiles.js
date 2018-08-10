
GIScene.Layer.XYZFlatTiles = function( name, config ) {
	//overwrite defaults of parent
	var defaults = {
			zoomlevels: 19,
			tileSizes :[], // [20037508.3427892*2,20037508.3427892],//, 20037508.3427892/2], //20037508.3427892 -> zommlevel 1
			
			terrainHeight :0,
			origin: new GIScene.Coordinate2(-20037508.3427892,20037508.3427892),
			//extent a little bit smaller than tiles
			maxExtent : new GIScene.Extent2(new GIScene.Coordinate2(-20037508,-20037508),new GIScene.Coordinate2(20037508,20037508))
		};

	this.config = GIScene.Utils.mergeObjects(defaults, config || {}); //overwrite XYZ with user config
	
	//create tileSizes
	const earthRadius = 40075016.6855784;
	for (var i = 0; i < this.config.zoomlevels; i++) {
		
		this.config.tileSizes.push(earthRadius / Math.pow(2,i) );
		
	}
	
	GIScene.Layer.Grid.apply(this, [name, this.config]); //create a GridLayer with xyz config
	
	/**
	 * Loads a tile by specifiying a GIScene.Grid.Index
	 * 
	 * @method loadTile
	 * @param {GIScene.Grid.Index} gridIndex
	 */	
	this.loadTile = function(gridIndex) {  //GIScene.Grid.Index
		if(!gridIndex)return;
		// console.log("loadTile",gridIndex);
		//get from cache
		var tileFromCache = this.cache.getTile(gridIndex); //object3d or false
		
		if(tileFromCache){
			console.log("XYZ: get Tile from cache");
			//check material 
			
			var material = null;
			tileFromCache.traverse(function(object){
				if(!material){
					if(object.material){material = object.material;}
				}
			});
			
			var hasUnsharedWmsTextureLoaded = false;
			if(material && material.waitForTexture){
				hasUnsharedWmsTextureLoaded = material.unsharedWmsTextureLoaded;
			}
			
			if(hasUnsharedWmsTextureLoaded || !material || !material.waitForTexture){
			// this.loading.remove(gridIndex);//mca2
			this.root.add(tileFromCache);
			
			this.cache.remove(gridIndex);
			this.loaded.add(gridIndex, tileFromCache);
			
			//update selectables
			if(this.selectControl){
				this.selectControl.selectables = GIScene.Utils.getDescendants(this.root); //r76
			}
			
			//ontileadd event
			/**
			 *Fires after a tile is added to the scene. A reference to the tile can be found at event.content.tile 
			 *
			 *@event tileadd
			 *  
			 */
			this.dispatchEvent({type:'tileadd', content:{tile:tileFromCache}});
			
			//add to oldTiles because all have been removed before (loaded and loading). Keep oldTiles updated.
			this.oldTiles.push(gridIndex);
			}
			
			
		}else{
			//create tile
			console.log("XYZ: create Tile");
			
			//get boundingbox from grid
			var centroid = this.grid.getCentroidFromIndex(gridIndex); //GIScene.Coordinate2
			centroid = new THREE.Vector3(centroid.x,this.terrainHeight, centroid.y);
			
			
			var zoomlevel = this.getZoomlevelFromTileSize(gridIndex.tileSize);
			var url = this.url.replace("{z}", zoomlevel);
			url = url.replace("{x}", gridIndex.x);
			url = url.replace("{y}", Math.max(Math.abs(gridIndex.y)-1,0));
			
			var texLoader = new THREE.TextureLoader();
			texLoader.setCrossOrigin("anonymous");
			var colorMap = texLoader.load(url);
			
			// create geometry and Mesh
			var geometry = new THREE.PlaneGeometry( gridIndex.tileSize, gridIndex.tileSize );
			
			//var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
			var material = new THREE.MeshLambertMaterial( {map: colorMap, depthTest:false} );
			
			var result = new THREE.Mesh( geometry, material );
			result.renderOrder = -1;
			
			//rotate model if z is up
			//if(this.verticalAxis.toUpperCase() == "Z" ){
				result.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI/2 ) );
			//}
			
			result.position.copy(centroid);
			this.cache.add(gridIndex,result);
			
			//setOverrideMaterial
			this.setOverrideMaterial(result, this.config.overrideMaterial);
			
			
			//onload event
			/**
			 *Fires after a tile is loaded. A reference to the tile can be found at event.content.tile 
			 *
			 *@event tileload
			 *  
			 */
			this.dispatchEvent({type:'tileload', content:{tile:result}});
			
		}
	};

	var onCameraChange = function(event) {
		var scene = event.target;
		var cam = scene.camera;
		
		var camHeight = cam.position.clone().add(scene.config.offset.toVector3()).y;
		
		var near = Math.max(1, camHeight * 0.7 );
		var far  = Math.max(5000, camHeight * 10);
		
		cam.activeCam.near = near;
		cam.activeCam.far = far;
		cam.activeCam.updateProjectionMatrix();
		console.log(camHeight,near,far, (far-near));
	};
	
	var onSetScene = function(event) {
		console.log("onSetScene:XYZFlatTiles");
		
		(this.scene)? 
			this.scene.addEventListener("cameraChange", onCameraChange)
		:
			null
		;
		
	}.bind(this);
	this.addEventListener('setScene', onSetScene);

};

GIScene.Layer.XYZFlatTiles.prototype = Object.create(GIScene.Layer.Grid.prototype);



GIScene.Layer.XYZFlatTiles.prototype.getZoomlevelFromTileSize = function(tileSize) {
	
	var zoomlevel = this.tileSizes.indexOf(parseFloat(tileSize));
	return zoomlevel;
}