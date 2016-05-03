/** GIScene.Layer.Grid() is a layer type that loads Tiles from a url based on a Grid. 
 * 
 * @namespace GIScene
 * @class Layer.Grid
 * @constructor
 * @extends GIScene.Layer
 * @param {String} name the layer name for display purposes
 * @param {Object} [config] the layer configuration object
 */ 

GIScene.Layer.Grid = function(name, config){
	
	//make this a Layer
	GIScene.Layer.apply(this,[name, config]);
	
	var defaults = {
		//grid : new GIScene.Grid({origin: new GIScene.Coordinate2(0,0),tileSize: 1024}), //origin, tilesize
		origin: new GIScene.Coordinate2(0,0),
		tileSizes: [1024], 
		
		terrainHeight:71,
		maxNumTiles:25,
		maxDistance:10000,
		computeTileIndicesHandler:'default', //function to determine the tiles to be loaded, can differ from default for analysis reasons
		service:null,
		maxExtent:null, //
		lodDistanceFactor: 1,
		overrideMaterialHandler : null, //will be called for each object after assigning the overrideMaterial with an event.content object as parameter: {object:{Object3D}, material:{THREE.Material}, layer: GIScene.Layer}
		//@TODO sharedOverrideMaterial if only attached to single objects like in wmsoverlay textures and materials could be disposed when deleting tiles, if one mateial is schared by all tiles then material must be kept when deleting tiles
		// hasSharedOverrideMaterial : true, //set to false to make the tilecache delete materials and textures from tiles when deleted
		virtualSelectionAccessor : null 
	};
	
	this.config = GIScene.Utils.mergeObjects(defaults, this.config);
	
	this.url = null;
	this.format = null;
	this.boundingBox = null; //?? will change frequently
	this.verticalAxis = null;
	
	this.origin			= this.config.origin;
	this.tileSizes		= this.config.tileSizes.sort(function(a,b){return b-a;}); //sort descending
	this.grid 			= null;// will be set onSetScene //her could be gridset instead of grid  // this.config.grid;
	this.terrainHeight 	= this.config.terrainHeight;
	var _terrainHeight	= null; //will initialized in init() and adapted to the scene offset onSetScene
	this.maxNumTiles 	= this.config.maxNumTiles; 
	this.maxDistance	= this.config.maxDistance;
	this.maxExtent		= this.config.maxExtent;
	var _maxExtent		= null; //will initialized in init() and adapted to the scene offset onSetScene
	this.lodDistanceFactor = this.config.lodDistanceFactor;
	this.distanceReferencePoint = null; // will be calulated in getNewTiles
	this.computeTileIndicesHandler = null; // set in init()
	this.overrideMaterialHandler = null;
	this.virtualSelection = [];
	this.virtualSelectionAccessor = this.config.virtualSelectionAccessor;
	// this.hasSharedOverrideMaterial = this.config.hasSharedOverrideMaterial;
	
	var doAutoUpdate	= false;
	var autoUpdateIntervalId;
	
	//tileHandling
	this.load = []; //tiles to load
	this.remove = []; //tiles to remove
	
	this.loading = new GIScene.Grid.TileStore(); //holds the xhr request while loading //new GIScene.Grid.IndexStore();
	this.loaded  = new GIScene.Grid.TileStore(); //tiles already loaded
	this.cache	 = new GIScene.Grid.TileStore({
												maxLength:200
												// deleteMaterials: !this.hasSharedOverrideMaterial ,
												// deleteTextures:	 !this.hasSharedOverrideMaterial 
												});
	 	
	this.init = function(){
		this.name = name;
	  	this.url = this.config.url;
	  	this.format = this.config.format;
	  	this.verticalAxis = this.config.verticalAxis || "Y"; 
	  	this.boundingBox = new THREE.Box3();
	  	
	  	this.setTerrainHeight(this.terrainHeight);
	  	this.setMaxExtent(this.maxExtent);
	  	
	  	this.setComputeTileIndicesHandler(this.config.computeTileIndicesHandler);
	  	
	};
	
	var autoUpdate = function() { 
		if(doAutoUpdate){
			doAutoUpdate=false;
			this.update();
			doAutoUpdate=true;
		}
	}.bind(this);
	
	/**
	 * Starts the automatic loading and removing of tiles dependant on the camera perspective
	 * 
	 * @method startUpdate 
	 */
	this.startUpdate = function() { doAutoUpdate = true; autoUpdateIntervalId = window.setInterval(autoUpdate,500);console.log("Layer.Grid():startUpdate()");};
	
	/**
	 * Stops the automatic loading and removing of tiles dependent on the camera perspective
	 * 
	 * @method stopUpdate 
	 */
	this.stopUpdate = function() { window.clearInterval(autoUpdateIntervalId); doAutoUpdate = false;};
	
	this.setComputeTileIndicesHandler = function(handler) {
		this.computeTileIndicesHandler = ( handler == 'default')? this.getNewTilesFromQuadtree : handler;
	};
	
	var errorMaterial = new THREE.MeshBasicMaterial({color:0x55FF55, opacity:0.5, wireframe:false});
	this.getErrorTile = function(gridIndex) {
		
		// var material = new THREE.MeshBasicMaterial({color:0x55FF55, opacity:0.5, wireframe:false});
		var errorTile = new THREE.Mesh(new THREE.CubeGeometry(gridIndex.tileSize, 4, gridIndex.tileSize), errorMaterial);	
		errorTile.name = "errorTile_"+gridIndex.toString();
		//var centroid = GIScene.Grid.prototype.getCentroidFromIndex(gridIndex);//this.grid.getCentroidFromIndex(gridIndex);
		var centroid = this.grid.getCentroidFromIndex(gridIndex);//this.grid.getCentroidFromIndex(gridIndex);
		errorTile.position.set(centroid.x, (this.terrainHeight - this.offset.z), centroid.y);
		return errorTile;
	};
	
	/**
	 * Loads a tile by specifiying a GIScene.Grid.Index
	 * 
	 * @method loadTile
	 * @param {GIScene.Grid.Index} gridIndex
	 */	
	this.loadTile = function(gridIndex, generalize, specialize) {  //GIScene.Grid.Index
		if(!gridIndex)return;
		// console.log("loadTile",gridIndex);
		//get from cache
		var tileFromCache = this.cache.getTile(gridIndex); //object3d or false
		
		if(tileFromCache){
			
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
			// console.log("hasUnsharedWmsTextureLoaded", hasUnsharedWmsTextureLoaded)
			//if part of specialize keep in cache until all are loaded
			
			
			
			
			// var descendants = specialize[gridIndex.toString()];
			// var isPartOfSpecialize = false;
			// if(descendants){
				// isPartOfSpecialize = descendants.some(function(e,i,a){return gridIndex.equals(e);});
				// alert("Hallo");
				// console.log("isPartOfSpecialize", isPartOfSpecialize);
				// var allLoaded = descendants.every(function(e,i,a){
									// return this.cache.getTile(e) !== false;		//später in cache schauen statt loaded
								// });
				// if(allLoaded){
						// this.removeTile(gridIndex);
						// isPartOfSpecialize = false;
					// }
			// }
			//else add immediately
			// if(! isPartOfSpecialize){
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
			//remove Tiles from generalize
			//test this.removeTiles(generalize[gridIndex.toString()]);
			
			
			
			//remove Tile from spezialize if all are loaded
			// var descendants = specialize[gridIndex.toString()];
			// if(descendants){
				// var allLoaded = descendants.every(function(e,i,a){
									// return this.loaded.getTile(e) !== false;		//später in cache schauen statt loaded
								// });
				// if(allLoaded){this.removeTile(gridIndex);}
			// }
			
		}else{
			//load tile and push to cache
		
			var onSuccess = function(result) {
				
				//handle errors, when server gives a 200 result but not a model,e.g. hmtl error website
				var errorTile = false;
				if(!(result instanceof THREE.Object3D)){
					result = this.getErrorTile(gridIndex);
				    errorTile = true;
				}
				
				//rotate model if z is up
				if(this.verticalAxis.toUpperCase() == "Z" && !errorTile){
					result.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI/2 ) );
				}
				
				
				this.loading.remove(gridIndex); //mca2
			
			//mca	this.loaded.add(gridIndex,result);
				this.cache.add(gridIndex,result);
				
				//setOverrideMaterial
				if(!errorTile)this.setOverrideMaterial(result, this.config.overrideMaterial);
				
				
				//onload event
				/**
				 *Fires after a tile is loaded. A reference to the tile can be found at event.content.tile 
				 *
				 *@event tileload
				 *  
				 */
				this.dispatchEvent({type:'tileload', content:{tile:result}});
				
				//add to layer when texture is loaded
				// var material = null;
				// result.traverse(function(object){
					// if(!material){
						// if(object.material){material = object.material;}
					// }
				// });
// 				
				// if(material){
					// var onSetTexture = function(event){
						// this.loadTile(gridIndex);
						// material.removeEventListener("settexture", onSetTexture);
					// }.bind(this);
// 					
					// material.addEventListener("settexture", onSetTexture);
				// }
				
				//add to layer
				// mca this.root.add(result);
				//remove Tiles from generalize
				// console.log("removeTiles", gridIndex.toString(), generalize);
				// this.removeTiles(generalize[gridIndex.toString()]);
				
			}.bind(this);
			
			var onError = function(e) {
				
				var result = this.getErrorTile(gridIndex);
				
				this.loading.remove(gridIndex); 
			
				this.cache.add(gridIndex,result);
			}.bind(this);
			
			if(this.loading.getTile(gridIndex) === false){
			
				var requestUrl = this.config.service.getGetSceneUrl(gridIndex, this.grid);
				
				var loader = new GIScene.ModelLoader(); //need a loader for every parallel request
				loader.load(requestUrl, this.format, onSuccess, null, onError);
				
				this.loading.add(gridIndex, loader);
				//?????mca3
				// this.oldTiles.push(gridIndex);
			}
			
			
		// var object = this.getErrorTile(gridIndex);
		// this.loaded[gridIndex.toString()] = object; //@TODO remove reference before layer is disposed
		// this.root.add(object);
		}
	};
	
	/**
	 * loads several tiles by specifying an array of GIScene.Grid.Index objects
	 * @method loadTiles
	 * @param {Array of GIScene.Grid.Index} tileArray 
	 */
	this.loadTiles = function(tileArray, generalize, specialize) { 
		if(!tileArray)return;
		for(var i=0,j=tileArray.length; i<j; i++){
		  this.loadTile(tileArray[i], generalize, specialize);
		};	
	};
	
	/**
	 * Removes a tile or aborts its loading by specifiying a GIScene.Grid.Index
	 * 
	 * @method removeTile
	 * @param {GIScene.Grid.Index} gridIndex
	 */	
	this.removeTile = function(gridIndex, generalize){
		if(!gridIndex)return;
		// console.log("removeTile", gridIndex);
		
		// abort while still loading but not further needed
		var xhrIsLoading = this.loading.getTile(gridIndex);
		if(xhrIsLoading) {
			/*console.log(xhrIsLoading);*/
			xhrIsLoading.abort(); 
			this.loading.remove(gridIndex); 
			// if(generalize && gridIndex.toString() in generalize){console.log("removeTile:abortGeneralize");this.oldTiles.push.apply(this.oldTiles,generalize[gridIndex.toString()])};
			return;
		}
				
		var object = this.loaded.getTile(gridIndex);
		
		if(object instanceof THREE.Object3D){
			this.root.remove(object);
			this.loaded.remove(gridIndex);
			this.cache.add(gridIndex, object);
			//ontileremove event
			/**
			 *Fires after a tile is removed from the scene. A reference to the tile can be found at event.content.tile 
			 *
			 *@event tileremove
			 *  
			 */
			this.dispatchEvent({type:'tileremove', content:{tile:object}});
		}
		
	};
	
	/**
	 * removes or aborts the loading of several tiles by specifying an array of GIScene.Grid.Index objects
	 * @method removeTiles
	 * @param {Array of GIScene.Grid.Index} tileArray 
	 */
	this.removeTiles = function(tileArray, generalize) {
		if(!tileArray)return;
		for(var i=0,j=tileArray.length; i<j; i++){
		  this.removeTile(tileArray[i], generalize);
		};
	};
	
	/**
	 * computes the visible tiles of the current camera view 
	 * 
	 * @method getNewTilesFromQuadtree
	 * @return {Array of GIScene.Grid.Index} newTiles
	 */
	this.getNewTilesFromQuadtree = function() {
		// console.log("Layer.Grid():getNewTiles()");
		// console.log(this);
		
		/*
		 *returns Array of THREE.Vector2() while first and last index values (points) are identical  
		 */
		var intersectFrustrumAtTerrainHeight = function(terrainHeight){		//getCuttingPolygon
			// console.log("Layer.Grid():getNewTiles():intersectFrustrumAtTerrainHeight()");
			// console.log(this);
				//topology of frustum  hierarchy: points (n|f)_(t|b)_(l|r)
				var points = {
					//near
					"n_t_l" : new THREE.Vector3(-1, 1,-1),
					"n_t_r" : new THREE.Vector3( 1, 1,-1),
					"n_b_r" : new THREE.Vector3( 1,-1,-1),
					"n_b_l" : new THREE.Vector3(-1,-1,-1),
					//far
					"f_t_r" : new THREE.Vector3( 1, 1, 1),
					"f_t_l" : new THREE.Vector3(-1, 1, 1),
					"f_b_l" : new THREE.Vector3(-1,-1, 1),
					"f_b_r" : new THREE.Vector3( 1,-1, 1)
				};
				
				var lines = {
					//near counterclockwise
					"n_t":{	geometry: new THREE.Line3(points.n_t_r, points.n_t_l) },
					"n_r":{ geometry: new THREE.Line3(points.n_b_r, points.n_t_r) },
					"n_b":{ geometry: new THREE.Line3(points.n_b_l, points.n_b_r) },
					"n_l":{ geometry: new THREE.Line3(points.n_t_l, points.n_b_l) },
					
					//far ccw
					"f_t":{ geometry: new THREE.Line3(points.f_t_l, points.f_t_r) },
					"f_r":{ geometry: new THREE.Line3(points.f_t_r, points.f_b_r) },
					"f_b":{ geometry: new THREE.Line3(points.f_b_r, points.f_b_l) },
					"f_l":{ geometry: new THREE.Line3(points.f_b_l, points.f_t_l) },
					
					//sides from near to far
					"t_l":{ geometry: new THREE.Line3(points.n_t_l, points.f_t_l) },
					"b_l":{ geometry: new THREE.Line3(points.n_b_l, points.f_b_l) },
					"b_r":{ geometry: new THREE.Line3(points.n_b_r, points.f_b_r) },
					"t_r":{ geometry: new THREE.Line3(points.n_t_r, points.f_t_r) }
				};
				 
				var cells = {
					"near"	:[lines.n_l, lines.n_t, lines.n_r, lines.n_b],
					"far" 	:[lines.f_r, lines.f_b, lines.f_l, lines.f_t],
					"left"	:[lines.n_l, lines.t_l, lines.f_l, lines.b_l],
					"top"	:[lines.n_t, lines.t_r, lines.f_t, lines.t_l],
					"right"	:[lines.n_r, lines.b_r, lines.f_r, lines.t_r],
					"bottom":[lines.n_b, lines.b_l, lines.f_b, lines.b_r]
				};
				
				lines.n_t.left = cells.near;
				lines.n_t.right= cells.top;
				
				lines.n_r.left = cells.near;
				lines.n_r.right= cells.right;
				
				lines.n_b.left = cells.near;
				lines.n_b.right= cells.bottom;
				
				lines.n_l.left = cells.near;
				lines.n_l.right= cells.left;
				
				lines.f_t.left = cells.far;
				lines.f_t.right= cells.top;
				
				lines.f_r.left = cells.far;
				lines.f_r.right= cells.right;
				
				lines.f_b.left = cells.far;
				lines.f_b.right= cells.bottom;
				
				lines.f_l.left = cells.far;
				lines.f_l.right= cells.left;
				
				lines.t_l.left = cells.left;
				lines.t_l.right= cells.top;
				
				lines.b_l.left = cells.bottom;
				lines.b_l.right= cells.left;
				
				lines.b_r.left = cells.right;
				lines.b_r.right= cells.bottom;
				
				lines.t_r.left = cells.top;
				lines.t_r.right= cells.right;
				
				var projector = new THREE.Projector();
				
				//project points to world Coordinates
				for (point in points){
					projector.unprojectVector(points[point], this.scene.camera);
					//console.log(point+ ": " + points[point].toArray());
				}
				
				// var terrainHeight = 0; //has to be set dynamically
				var plane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0,1,0), new THREE.Vector3(0,terrainHeight,0));
				
				var  polygonPoints=[],firstCell, firstLine;
				//iterate through lines
				
				//find first cell with cutted lines	
				var setFirstCellAndPoint = function() {
					for (cell in cells) {
						//console.log('Cell: '+ cell);
						//find first point
						for (var i=0;i<4;i++) { //lines in cell
							var point = plane.intersectLine(cells[cell][i].geometry);
							//console.log("intersect check: " +i + " "+ point);
							if (point) {
								//console.log("1.PolygonPoint: " + point.toArray().toString() +" Cell: "+cell + " Line: "+ i);
								polygonPoints.push(point);
								firstCell = cells[cell];
								firstLine = cells[cell][i];
								return;
							}
						}
					}
				}; 
		
				var getRestOfPoints = function(cell, firstLine) {
					for(var i=0;i<4;i++){ //line in cell
						if(cell[i] !== firstLine){
							var point = plane.intersectLine(cell[i].geometry);
							if (point) {
								//console.log("PolygonPoint: " + point.toArray().toString()+ " Cell: "+ cell + " Line: "+i);
								polygonPoints.push(point);
								if(!(polygonPoints[0].equals(polygonPoints[polygonPoints.length-1]))){
									var nextCell = (cell[i].left === cell)? cell[i].right : cell[i].left;
									// (cell[i].left === cell)?console.log('nextCell: rightCell'):console.log('nextCell: leftCell') ;
									getRestOfPoints(nextCell, cell[i]);
								}
							}
						}
					}
				};
				
				// start algorithm
				
				setFirstCellAndPoint();
				if(firstCell)getRestOfPoints(firstCell, firstLine);
				//console.log('Polygon: '+polygonPoints.length);
				
				//flatten polygon to 2D
				for(var i=0,j=polygonPoints.length; i<j; i++){
				  polygonPoints[i] = GIScene.Utils.vector3ToVector2(polygonPoints[i]);
				};
				
			return polygonPoints; //Array of THREE.Vector2
			}.bind(this);
		
		var addBufferToPolygon = function(polygon, bufferDistance) {
			if ( polygon.length < 4 ){return polygon;}; // at least a triangle
			var isCCW = function(poylgon) { // convex polygon only
				var firstDirVector2  = new GIScene.Line2().fromPoints(polygon[0], polygon[1]).directionVector;
				var secondDirVector2 = new GIScene.Line2().fromPoints(polygon[1], polygon[2]).directionVector;
				var firstDirVector3 = new THREE.Vector3(firstDirVector2.x,firstDirVector2.y, 0);
				var secondDirVector3 = new THREE.Vector3(secondDirVector2.x,secondDirVector2.y, 0);
				var normal = THREE.Vector3.prototype.crossVectors(firstDirVector3, secondDirVector3);
				return (normal.z < 0)? true : false ;
			};
			// console.log("addBufferToPolygon", polygon.length, bufferDistance);
			// console.log(new GIScene.Line2().fromPoints(polygon[polygon.length-2], polygon[polygon.length-1]));
			
			if(!isCCW(polygon)){polygon.reverse();}
			 
			var bufferedPolygon = [];
			
			//first intersection
			bufferedPolygon.push(
						new GIScene.Line2().fromPoints(polygon[polygon.length-2], polygon[polygon.length-1])
						.moveRight(bufferDistance)
						.intersect(
							new GIScene.Line2().fromPoints(polygon[0], polygon[1])
							.moveRight(bufferDistance)
						)
					);
			// console.log(bufferedPolygon[0]);
			//rest of intersections
			for (var i=0; i < polygon.length-2; i++){
					
					bufferedPolygon.push(
						new GIScene.Line2().fromPoints(polygon[i], polygon[i+1])
						.moveRight(bufferDistance)
						.intersect(
							new GIScene.Line2().fromPoints(polygon[i+1], polygon[i+2])
							.moveRight(bufferDistance)
						)
					);
					// console.log(i);
			}
			
			bufferedPolygon.push(new THREE.Vector2(bufferedPolygon[0].x, bufferedPolygon[0].y) );
			// console.log(bufferedPolygon.length);
			// console.log(polygon[0]);
			// console.log(bufferedPolygon[0]);
			return bufferedPolygon;
		};
		
		var clipCuttingPolygonByMaxDistance = function(polygon, radius) {
			// console.log("Layer.Grid():getNewTiles():clipCuttingPolygonByMaxDistance()");
			// console.log(this);
			var isCCW = function(vertices) {
				var polygonArea = function() {
					var area = 0;
					for (var i = 0; i < vertices.length; i++) {
						j = (i + 1) % vertices.length;
						area += vertices[i][0] * vertices[j][1];
						area -= vertices[j][0] * vertices[i][1];
					}
					return area / 2;
				};
				
				var clockwise = polygonArea() > 0;
				return !clockwise;
			}; 

			var createCirclePolygon = function(origin, radius){
				// console.log("Layer.Grid():getNewTiles():clipCuttingPolygonByMaxDistance():createCirclePolygon()");
				// console.log(this);
				var sides = 24;
				var angle = Math.PI * ((1/sides) - (1/2));
				var rotatedAngle, x, y;
				var points = [];
				for(var i=0; i<sides; ++i) {
					rotatedAngle = angle + (i * 2 * Math.PI / sides); //orig angle -
					x = origin.x + (radius * Math.cos(rotatedAngle));
					y = origin.y + (radius * Math.sin(rotatedAngle));
					//points.push(new THREE.Vector2(x, y));
					points.push([x,y]);
				}
				return points;
			};
			
			//Sutherland-Hodgman-Algorithm for Polygon Clipping with a convex clipPolygon
			//Adapted from http://rosettacode.org/wiki/Sutherland-Hodgman_polygon_clipping#JavaScript
			var clip = function(subjectPolygon, clipPolygon) {
				// console.log("Layer.Grid():getNewTiles():clipCuttingPolygonByMaxDistance():clip()");
				// console.log(this);
				// subjectPolygon.pop();
				// subjectPolygon.forEach(function(e,i,a){a[i]= e.toArray();});
				//console.log(subjectPolygon.length);
				//clipPolygon.pop();
				// clipPolygon.forEach(function(e,i,a){a[i]= e.toArray();});
				//console.log(clipPolygon);

	            var clip1, clip2, the_s, the_e;
	            var inside = function (the_p) {
	                return (clip2[0]-clip1[0])*(the_p[1]-clip1[1]) > (clip2[1]-clip1[1])*(the_p[0]-clip1[0]);
	            };
	            var intersection = function () {
	                var dc = [ clip1[0] - clip2[0], clip1[1] - clip2[1] ],
	                    dp = [ the_s[0] - the_e[0], the_s[1] - the_e[1] ],
	                    n1 = clip1[0] * clip2[1] - clip1[1] * clip2[0],
	                    n2 = the_s[0] * the_e[1] - the_s[1] * the_e[0],
	                    n3 = 1.0 / (dc[0] * dp[1] - dc[1] * dp[0]);
	                return [(n1*dp[0] - n2*dc[0]) * n3, (n1*dp[1] - n2*dc[1]) * n3];
	            };
	            var outputList = subjectPolygon;
	            clip1 = clipPolygon[clipPolygon.length-1];
	            // for (j in clipPolygon) {
	            for (var j=0,ln_j=clipPolygon.length;j<ln_j;j++) {
	                /*var*/ clip2 = clipPolygon[j];
	                var inputList = outputList;
	                outputList = [];
	                the_s = inputList[inputList.length - 1]; //last on the input list
	                // for (i in inputList) {
	                for (var i=0,ln=inputList.length; i < ln; i++) {
	                    var the_e = inputList[i];
	                    if (inside(the_e)) {
	                        if (!inside(the_s)) {
	                            outputList.push(intersection());
	                        }
	                        outputList.push(the_e);
	                    }
	                    else if (inside(the_s)) {
	                        outputList.push(intersection());
	                    }
	                    the_s = the_e;
	                }
	                clip1 = clip2;
	            }
	            //console.log("outputList: " +outputList);
	           // outputList.forEach(function(e,i,a){a[i]=new THREE.Vector2().fromArray(e);});
	           	// outputList.push(outputList[0]);
	           	return outputList;
	       }.bind(this);
	        
	        //start algorithm
	        
	        var extentPolygon = (_maxExtent)? _maxExtent.toPolygonV2() : null;
	        // console.log('clipcuttingpolybyextent._maxExtent', _maxExtent.max, this.distanceReferencePoint);
			if(extentPolygon) {
								extentPolygon.forEach(function (e,i,a){ a[i] = e.toVector2().toArray(); });
								extentPolygon.reverse();
							}
	        
	        // console.log("CCW extent: "+ isCCW(extentPolygon));
	        var subjPoly = createCirclePolygon(this.distanceReferencePoint, radius); //Array of Arrays
 	        // console.log("CCW circle: "+ isCCW(subjPoly));
 	        //console.log(polygon);
 	        polygon.pop();
 	        polygon.forEach(function(e,i,a){a[i]= e.toArray();});
 	        if(isCCW(polygon)){polygon.reverse();}
 	        // console.log("CCW frustum cut: "+ isCCW(polygon));
	        var clippedPoly = clip(subjPoly, polygon);//clip(polygon, subjPoly );//
	        //@TODO if maxExtent clip by its bbox rectangle
			// console.log(polygon);
			// console.log(subjPoly);
			// console.log(clippedPoly); //before clipped with maxExtent
			// console.log(extentPolygon);
// 			
			// console.log("CCW clippedPoly: "+ isCCW(clippedPoly));
			if (extentPolygon){
				clippedWithExtent = clip(extentPolygon,clippedPoly);
				//clippedWithExtent = clip(clippedPoly,extentPolygon);
				clippedPoly = clippedWithExtent;
			}
			
			//add first point as last
			if(clippedPoly.length > 0){ 
				clippedPoly.push(clippedPoly[0]);
				// console.log(clippedPoly);
				clippedPoly.forEach(function(e,i,a){a[i]=new THREE.Vector2().fromArray(e);});
				}
			// console.log('clippedPoly',clippedPoly.length);
	        return clippedPoly;
	        
		}.bind(this);
		
		/*
		 * restrict Polygon by angle and distance to camera
		 * 
		 * 5 degress could be a housenumber
		 */
		var restrictPolygonByAngleAndDistance = function(polygon, camera, minAngleDeg, maxDistance) {
			
			var minAngleDeg = minAngleDeg || 5;
			var minAngleRad = THREE.Math.degToRad(minAngleDeg);
			var tanMinAngle = Math.tan(minAngleRad);
			// var camerapos = camera.position.clone();
			// var PI_2 = Math.PI/2;
			//reduce by angle
			//check n-1 points of polygon nth point same as first of they undergo minAngleDeg
			//
			var angleToCam = function(point) {
				var camSubPoint = camera.position.clone().sub(point);
				var camSubPointOnPlane = camSubPoint.clone().setY(0);
				var angleToCamera = camSubPoint.angleTo(camSubPointOnPlane);
				return angleToCamera;
			};
			
			for(var i=0,j=polygon.length; i<j; i++){
				var camSubPoint = camera.position.clone().sub(polygon[i]);
				var camSubPointOnPlane = camSubPoint.clone().setY(0);
				var angleToCamera = camSubPoint.angleTo(camSubPointOnPlane);
				// var angleToCamera = angleToCam(polygon[i]);
				// console.log("angleToCamera: " + THREE.Math.radToDeg(angleToCamera) );
				if (angleToCamera < minAngleRad){
					//move point towards camera to meet angle restrictions
					// console.log("height: " + camSubPoint.clone().sub(camSubPointOnPlane).length()  );
					var distCamSubPointOnPlaneToTarget = camSubPoint.clone().sub(camSubPointOnPlane).length() / tanMinAngle;
					// console.log("distCamSubPointOnPlaneToTarget: " + distCamSubPointOnPlaneToTarget);
					var target = polygon[i].clone().sub(camSubPointOnPlane).normalize().multiplyScalar(distCamSubPointOnPlaneToTarget);
					// console.log("new deg: "+ THREE.Math.radToDeg(angleToCam(target)));
					
					polygon[i] = target;
				}
			};
			return polygon;
		};
		
		/**
		 * @method getOutlineTiles
		 * @private
 		 * @param {Array of THREE.Vector3} polygon
		 */
		var getOutlineTiles = function(polygon, tileSize) {
			// console.log("Layer.Grid():update():getNewTiles():getOutlineTiles()");
			// console.log(this);
			var outlineTiles=[];
			var gridLines2d =[];
			
			// var getV2fromV3 = function(v3) {
				// var v2 = new THREE.Vector2(v3.x, v3.z);
				// return v2;
			// };
			
			//get 2D Lines from Polygon and convert coordinates to grid index coords
			for(var i=0,j=polygon.length-1; i<j; i++){
			  var line = new GIScene.Grid.GridLine(this.grid.getIndexFromPoint2d( polygon[i], tileSize ) , this.grid.getIndexFromPoint2d( polygon[i+1], tileSize ));
			  // console.log(line.start.x +" "+ line.start.y);
			  gridLines2d.push(line);
			};
			
			//getTilesFromLines 
			
			
			
			for(var i=0,j=gridLines2d.length; i<j; i++){
			  outlineTiles = outlineTiles.concat(this.grid.getTilesFromGridLine(gridLines2d[i])); 
			};
			
			//get unique tiles!!, remove duplicates
			return GIScene.Utils.removeDuplicatesFromArray(outlineTiles);
		}.bind(this);
		
		
		var getFillTiles = function(outlineTiles){
			// console.log("Layer.Grid():update():getNewTiles():getFillTiles()");
			// console.log(this);
			
			//scanline
			
			//sort by y
			ySortedOutlineTiles={};
			for(var i=0,j=outlineTiles.length; i<j; i++){
				(outlineTiles[i].y.toString() in ySortedOutlineTiles)? ySortedOutlineTiles[outlineTiles[i].y.toString()].push(outlineTiles[i].x) : ySortedOutlineTiles[outlineTiles[i].y.toString()] = [outlineTiles[i].x]; 
			};
			// console.log(ySortedOutlineTiles);
			//only fill if scanline hits 2 x values
			var fillTiles = [];
			for(scanline in ySortedOutlineTiles){
				var xValues = ySortedOutlineTiles[scanline].sort(function(a,b){return a-b;}); //x always from l to r
				//console.log(xValues);
				if (xValues.length > 1){
					var y = parseInt(scanline);
					// console.log(y);
					var number=0, startX=0;
					// if (xValues.length == 2){
						// number = xValues[1] - xValues[0] - 1;
						// startX = xValues[0];	
					// }
					// else //4 or more xvalues
					// {
					for(var i=1,j=xValues.length; i<j; i++){
					  //find start
					  if(xValues[i] - xValues[i-1] != 1){
					  	number = xValues[i] - xValues[i-1] -1;
					  	startX = i-1;//xValues[i-1];
					  }
					 }
					 // console.log("number: " + number);
					 // console.log("startX: " + startX);
					 // console.log("xValues: "+ xValues);
					//}
					//fillTiles
					for(var i=0,j=number; i<j; i++){
						//console.log("xValues[i+startX]"+parseInt(xValues[startX]+i+1));
					  fillTiles.push(new GIScene.Grid.Index(xValues[startX]+i+1,y,this.grid.tileSize));
					};
				}
			}
			return fillTiles;
		}.bind(this);
		
		/////
		//+ Jonas Raoni Soares Silva
		//@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]
		//@param poly {Array of Objects with x and y property. Last element equals the first element.}
		//@param pt {Object with x and y propery}
		// adapted by M.Auer
		//
		var isPointInPoly = function (poly, pt){
		    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
		        ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
		        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
		        && (c = !c);
		    return c;
		};
		
		//tile intersects polygon
		var tileIntersectsPolygon = function(tile, polygon) {
			// console.log("tileIntersectsPolygon");

				// from http://www.java-gaming.org/index.php?topic=22590.0
			   function linesIntersect( x1,  y1,  x2,  y2,  x3,  y3,  x4,  y4){
			      // Return false if either of the lines have zero length
			      if (x1 == x2 && y1 == y2 ||
			            x3 == x4 && y3 == y4){
			         return false;
			      }
			      // Fastest method, based on Franklin Antonio's "Faster Line Segment Intersection" topic "in Graphics Gems III" book (http://www.graphicsgems.org/)
			      var ax = x2-x1;
			      var ay = y2-y1;
			      var bx = x3-x4;
			      var by = y3-y4;
			      var cx = x1-x3;
			      var cy = y1-y3;
			
			      var alphaNumerator = by*cx - bx*cy;
			      var commonDenominator = ay*bx - ax*by;
			      if (commonDenominator > 0){
			         if (alphaNumerator < 0 || alphaNumerator > commonDenominator){
			            return false;
			         }
			      }else if (commonDenominator < 0){
			         if (alphaNumerator > 0 || alphaNumerator < commonDenominator){
			            return false;
			         }
			      }
			      var betaNumerator = ax*cy - ay*cx;
			      if (commonDenominator > 0){
			         if (betaNumerator < 0 || betaNumerator > commonDenominator){
			            return false;
			         }
			      }else if (commonDenominator < 0){
			         if (betaNumerator > 0 || betaNumerator < commonDenominator){
			            return false;
			         }
			      }
			      if (commonDenominator == 0){
			         // This code wasn't in Franklin Antonio's method. It was added by Keith Woodward.
			         // The lines are parallel.
			         // Check if they're collinear.
			         var y3LessY1 = y3-y1;
			         var collinearityTestForP3 = x1*(y2-y3) + x2*(y3LessY1) + x3*(y1-y2);   // see http://mathworld.wolfram.com/Collinear.html
			         // If p3 is collinear with p1 and p2 then p4 will also be collinear, since p1-p2 is parallel with p3-p4
			         if (collinearityTestForP3 == 0){
			            // The lines are collinear. Now check if they overlap.
			            if (x1 >= x3 && x1 <= x4 || x1 <= x3 && x1 >= x4 ||
			                  x2 >= x3 && x2 <= x4 || x2 <= x3 && x2 >= x4 ||
			                  x3 >= x1 && x3 <= x2 || x3 <= x1 && x3 >= x2){
			               if (y1 >= y3 && y1 <= y4 || y1 <= y3 && y1 >= y4 ||
			                     y2 >= y3 && y2 <= y4 || y2 <= y3 && y2 >= y4 ||
			                     y3 >= y1 && y3 <= y2 || y3 <= y1 && y3 >= y2){
			                  return true;
			               }
			            }
			         }
			         return false;
			      }
			      return true;
			   }
			
			var tileCorners = this.grid.getCornerCoordsFromIndex(tile);
			for(var i=0,j=polygon.length-1; i<j; i++){
				//iterate segments
				var tileIntersects =		linesIntersect(tileCorners[0].x,tileCorners[0].y, tileCorners[1].x,tileCorners[1].y, polygon[i].x, polygon[i].y, polygon[i+1].x, polygon[i+1].y )
										||	linesIntersect(tileCorners[1].x,tileCorners[1].y, tileCorners[2].x,tileCorners[2].y, polygon[i].x, polygon[i].y, polygon[i+1].x, polygon[i+1].y )
										||	linesIntersect(tileCorners[2].x,tileCorners[2].y, tileCorners[3].x,tileCorners[3].y, polygon[i].x, polygon[i].y, polygon[i+1].x, polygon[i+1].y )
										||	linesIntersect(tileCorners[3].x,tileCorners[3].y, tileCorners[0].x,tileCorners[0].y, polygon[i].x, polygon[i].y, polygon[i+1].x, polygon[i+1].y )
										;  
				if(tileIntersects)return true;  
			}
			return false;
			;
		}.bind(this);
			
		
		
		//reduce to maxNumTiles
		var workingVector = new THREE.Vector3();
		var distToCam = function (elementA, elementB) {
			var cameraPosition = this.scene.camera.position.clone();
			var centroidA = this.grid.getCentroidFromIndex(elementA);
			workingVector.set(centroidA.x, this.terrainHeight, centroidA.y);
			var distA = cameraPosition.distanceTo(workingVector);
			var centroidB = this.grid.getCentroidFromIndex(elementB);
			workingVector.set(centroidB.x, this.terrainHeight, centroidB.y);
			var distB = cameraPosition.distanceTo(workingVector);
			return distA - distB;
		}.bind(this);
		
		//area of 2D Polygon
		var getPolygonArea = function(polygon) {
	        var area = 0.0;
	        if ( polygon.length > 2 ) {
	            var sum = 0.0;
	            for (var i=0, len=polygon.length; i < len-1; i++) {
	                var b = polygon[i];
	                var c = polygon[i+1];
	                sum += (b.x + c.x) * (c.y - b.y);
	            }
	            area = - sum / 2.0;
	        }
	        return Math.abs(area);
	   };

		// calculates the point projected from the bottom center of the viewport on the plane at terrainHeight
		var getCenterBottomPoint = function() {
			var nearB = new THREE.Vector3(0,-1,1);
			var farB  = new THREE.Vector3(0,-1,-1);
			var nearT = new THREE.Vector3(0,1,1);
			var farT  = new THREE.Vector3(0,1,-1);
			
			var projector = new THREE.Projector();
			var nearBWorld = projector.unprojectVector(nearB, this.scene.camera);
			var farBWorld = projector.unprojectVector(farB, this.scene.camera);
			var nearTWorld = projector.unprojectVector(nearT, this.scene.camera);
			var farTWorld = projector.unprojectVector(farT, this.scene.camera);
			var checkLineB = new THREE.Line3(nearB, farB);
			var checkLineT = new THREE.Line3(nearT, farT);
			var checkPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0,1,0), new THREE.Vector3(0,_terrainHeight,0));
			var centerBottomPoint = checkPlane.intersectLine(checkLineB);
			var centerTopPoint = checkPlane.intersectLine(checkLineT);
			var distanceReferencePoint = (centerBottomPoint)? centerBottomPoint : centerTopPoint;
			var centerBottomPoint2d = (distanceReferencePoint)?new THREE.Vector2(distanceReferencePoint.x, distanceReferencePoint.z) : null;
			return centerBottomPoint2d;
		}.bind(this);
		
		//============================================================
		//start algorithm
		//============================================================
		
		//get Height from existing tiles average or sample??
		
		var polygonPoints = intersectFrustrumAtTerrainHeight(_terrainHeight);//getHeight automatically
		// var polygonPointsFrustrumCut = polygonPoints.length;
		//add buffer around polygon
		//console.log(this.name+" intersectFrustrum", polygonPoints.length, getPolygonArea(polygonPoints), _terrainHeight);
		polygonPoints = addBufferToPolygon(polygonPoints, this.tileSizes[this.tileSizes.length-1]);
		
		
		// var poly3d=[];
		// for(var i=0,j=polygonPoints.length; i<j; i++){
			// poly3d.push(GIScene.Utils.vector2ToVector3(polygonPoints[i],_terrainHeight)); 
		// };
		// var line_geom = new THREE.Geometry();
		// line_geom.vertices = poly3d;
		// _polygon = new THREE.Line(line_geom);
		// this.scene.root.add(_polygon);
		
		//get centerbottom point of viewport on terrainHeight plane as reference for maxDistance calculations		
		var oldDistanceReferencePoint = this.distanceReferencePoint;
		this.distanceReferencePoint = getCenterBottomPoint() || oldDistanceReferencePoint;
		if(!this.distanceReferencePoint){return [];}
		

		//get clipped polygon
		polygonPoints = clipCuttingPolygonByMaxDistance(polygonPoints, this.maxDistance);
		//console.log(this.name+" clipCuttingPolygonByMaxDistance", polygonPoints.length);
		// poly3d = [];
		// for(var i=0,j=polygonPoints.length; i<j; i++){
		  // poly3d.push(GIScene.Utils.vector2ToVector3(polygonPoints[i],_terrainHeight)); 
		// };
		// var line_geom = new THREE.Geometry();
		// line_geom.vertices = poly3d;
		// _polygon = new THREE.Line(line_geom);
		// this.scene.root.add(_polygon);
		
		
		if(false){
		//Bresenham way
		console.time('bresenham');
		var outlineTiles = getOutlineTiles(polygonPoints); //Bresenham Lines
		//console.log("outlineTiles: "+outlineTiles.length);
		//console.log("tileSize: "+this.grid.tileSize);
		//console.log("terrainHeight: "+this.terrainHeight);
		
		var fillTiles = getFillTiles(outlineTiles); //scanline algorithm
		
		var allTiles = outlineTiles.concat(fillTiles);
		// console.log("numAllTiles: "+allTiles.length);
		
		
		
		//reduce
		// allTiles.sort(distToCam);
		// allTiles.length = this.maxNumTiles;
		
		// console.timeEnd('bresenham');
		//Bresenham way End
		}
		
		// allTiles=[];
		//Quadtree way
		if(true){
		// console.time('quadtree');
		// var origTileSize = this.grid.tileSize;  //@TODO use smallest TileSize this.tileSizes Math.min.apply(null,this.tileSizes);
		var smallestTileSize = Math.min.apply(null,this.tileSizes);
		var biggestTileSize  = Math.max.apply(null,this.tileSizes);
		var area = getPolygonArea(polygonPoints);
		//console.log(this.name+" area", area);
		var estNumberOfAllTiles = area/Math.pow(biggestTileSize,2);
		// var tileSizeFactor = Math.pow(2, Math.round(Math.log(Math.sqrt(area)/this.grid.tileSize)/Math.LN2));//nearest power of 2 on log scale (wikipedia)
		var tileSizeFactor = Math.pow(2, Math.round(Math.log(Math.sqrt(area)/smallestTileSize)/Math.LN2));//nearest power of 2 on log scale (wikipedia)
		
		// var tempTileSize= origTileSize*tileSizeFactor;
		var tempTileSize= smallestTileSize*tileSizeFactor;
		
		// console.log("Quadtree");
		/*console.log("origTileSize: "+origTileSize);
		console.log("area: "+area);
		console.log("estNumberOfAllTiles: "+estNumberOfAllTiles);
		console.log("tileSizeFactor: "+tileSizeFactor);
		console.log("tempTileSize: "+tempTileSize);
		*/
		if (estNumberOfAllTiles > 10000){
			var confirmed = confirm("estNumberOfAllTiles: "+Math.round(estNumberOfAllTiles)+". Stop calculating?");
			if(confirmed)return [];
		}
		
		var rootNodes;
		if(tileSizeFactor > 1){
			//this.grid.tileSize=tempTileSize;
			rootNodes = getOutlineTiles(polygonPoints, tempTileSize);
		}
		else {
			rootNodes = getOutlineTiles(polygonPoints, smallestTileSize);
		}
		// this.grid.tileSize=origTileSize;
		
		var traverseCriteria = function(node) {
			//tile is overlapping clipped viewport polygon
			var centroid2 = this.grid.getCentroidFromIndex(node);//v2
			var tileCorners = this.grid.getCornerCoordsFromIndex(node);
			
			var isTileOverlappingPolygon =		
												isPointInPoly(polygonPoints, tileCorners[0])
											||	isPointInPoly(polygonPoints, tileCorners[1])
											||	isPointInPoly(polygonPoints, tileCorners[2])
											||	isPointInPoly(polygonPoints, tileCorners[3])
											||	isPointInPoly(polygonPoints, centroid2)
											||	tileIntersectsPolygon(node, polygonPoints)
											;
			
			return isTileOverlappingPolygon;
			
			
		}.bind(this);
		
		var isLeafNode = function(node) {
			var isLeaf = false;
			
				
				
				if(node.tileSize <= this.tileSizes[0] && node.tileSize > this.tileSizes[this.tileSizes.length-1]){ //all tileSizes exept the smallest one
					var nodeCentroid = this.grid.getCentroidFromIndex(node);
					
					//is in distance of distanceReferencePoint
					// if(this.distanceReferencePoint.distanceTo(nodeCentroid) > node.tileSize * this.lodDistanceFactor){
						// isLeaf = true;
					// }
					//is in distance of camera
					//var camPos = new THREE.Vector2(this.scene.camera.position.x, this.scene.camera.position.z);
					var nodeCentroid3d = new THREE.Vector3(nodeCentroid.x, _terrainHeight, nodeCentroid.y);
					if(this.scene.camera.position.distanceTo(nodeCentroid3d) > node.tileSize * this.lodDistanceFactor){
						isLeaf = true;
					}
					
				}else if(node.tileSize == this.tileSizes[this.tileSizes.length-1]){
					isLeaf = true;
				}
				
				
			
			
			return isLeaf;
		}.bind(this);
		
		var onTileIsLeaf = function(node) {
				//@TODO better check for 3d distance OR checkfor distance to point on ground projected from centerbottom of viewport
				//var camera2d = new THREE.Vector2(this.scene.camera.position.x,this.scene.camera.position.z);
				
				
				// var nodeCentroid = this.grid.getCentroidFromIndex(node);
				// if(this.distanceReferencePoint.distanceTo(nodeCentroid)<= this.maxDistance)
					allTiles.push(node);
		}.bind(this);
		
		var allTiles = [];
		for(var i=0,j=rootNodes.length; i<j; i++){
		  this.grid.traverseIf(rootNodes[i],traverseCriteria,isLeafNode,onTileIsLeaf);
		};
		// console.timeEnd("quadtree");
		}
		//Quadtree way end
		
		// log2 = document.getElementById('log2');
		// log2.innerHTML = "PolyPts: "+ polygonPoints.length
		// +" PolyFrutrumCutPts: "+ polygonPointsFrustrumCut;
						// +"RootNodes: "+ rootNodes.length
						// +" TempTS: "+ tempTileSize
						// +" DRPt: "+ this.distanceReferencePoint.toArray();
						
		
		return allTiles;
	};
	
	/**
	 * updates the current tiles, loads new tiles and removes old ones
	 * @method update
	 */
	var oldTilesString=[];
	this.oldTiles=[];
	this.update = function() {
		// console.log("Layer.Grid():update()");
		// console.log(this);
		//console.time("update");
		var  newTiles, remove, keep, load;
		
		newTiles = this.computeTileIndicesHandler();
		
		// console.time('string');
		// var newTilesString = new Array(newTiles.length);
// 		
		// newTiles.forEach(function(item){
								// newTilesString.push(JSON.stringify(item));
		// });
// 		
		// var remove = oldTilesString.filter(function (item, index, array) {
		                       // return newTilesString.indexOf(item) == -1;
		                      // });
		// var keep = oldTilesString.filter(function (item, index, array) {
		                       // return newTilesString.indexOf(item) != -1;
		                       // });                       
// 		                       
		// var load = newTilesString.filter(function (item, index,array){
		                        // return  oldTilesString.indexOf(item) == -1;
		                   // });
		// console.timeEnd('string');
		
		// console.time('obj');
		
		
		
		
		this.remove = this.oldTiles.filter(function(v,ix,a){
			return !(newTiles.some(function(v_){
				return (v_.equals(v));
			}));
		});
		
		//just for error checking, not needed in production
		// var keep_ = this.oldTiles.filter(function(v,ix,a){
			// return (newTiles.some(function(v_){
				// return (v_.equals(v));
			// }));
		// });
		
		this.load = newTiles.filter(function (v,ix,a){
			return !(this.oldTiles.some(function(v_){
				return (v_.equals(v));
			}));
		}.bind(this));
		
		
		
		
		//remove load items from newTiles(oldTiles in next iteration), add loaded later but not in loading
		this.oldTiles = newTiles.filter(function(v,ix,a){
			return !(this.load.some(function(v_){
				return (v_.equals(v));
			}));
		}.bind(this));
		// this.oldTiles = newTiles;
		
		
		
		// console.log("generalize", generalize);
		
		// gehe alle remove durch und checke ob desendantOf load
		
		//which are parents to be removed by a number of children. Load x and remove parent
		// load has parent in remove?
		var specialize = {}; // {"parent":[descendants]}
		//gehe alle load durch und checke ob sie abstammende sind von einem remove
		
		//SPECIALIZE
		this.load.forEach(function(el, il, al){
			
			this.remove.forEach(function (er, ir, ar){
				if(this.grid.isDescendantOf(el, er)){
					// if(!specialize[er.toString()]) {specialize[er.toString()] = [];};
					// specialize[er.toString()].push(el);
					
					// if(this.specialize.getTile(er) === false){
						// this.specialize.add(er,[el]);
					// }
					// else{
						// this.specialize.object.push(el);
					// }
					// console.log("specialize", this.specialize);
					//not yet removed 
					this.oldTiles.push(ar[ir]); //keep in oldTiles for next iteration check
					ar[ir] = null; //do not remove
				}
			}.bind(this));
		}.bind(this) );
// 		
		// //check for specialize remove. Remove parent if all children are in loaded
		// for(parent in this.specialize.store){
			// var descendants = this.specialize.store[parent].object;
			// var allLoaded = descendants.every(function(e,i,a){
				// return this.loaded.getTile(e);
			// }.bind(this));
			// if(allLoaded){
// 				
				// this.specialize.remove(new GIScene.Grid.Index().fromString(parent));
				// this.remove.push(new GIScene.Grid.Index().fromString(parent));
			// }else{
				// // auto update specialize???
				// this.specialize.remove(new GIScene.Grid.Index().fromString(parent));
				// newTiles.push(new GIScene.Grid.Index().fromString(parent));
			// }
		// }
		//
		
		
		//find out which of the new ones replace children. Load one remove all descendants
		// load has children in remove?
		// generalize
		var generalize = {};
		
		this.load.forEach(function(el,il,al){
			this.remove.forEach(function(er, ir, ar){
				if(this.grid.isDescendantOf(er, el)){
					// if(!generalize[el.toString()]) {generalize[el.toString()] = [];};
					//add remove index to generalize for later removement
					// console.log("generalizePush", er);
					// generalize[el.toString()].push(er);
					// console.log("generalize", generalize);
					//remove generalize descentands from immediately remove array
					// this.remove = this.remove.filter(function(e,i,a){
						// return e.toString() != er.toString();
					// });
					//not yet removed 
					this.oldTiles.push(ar[ir]); //keep in oldTiles for next iteration check
					ar[ir] = null; //do not remove
					
				}
			}.bind(this)); 
		}.bind(this));
		//______
		// else{
			//find out which ones to remove immediately
			// remove rest immediately
		// }
		
		
		


		// console.timeEnd('obj');
		
		// console.log(remove.length);
		// console.log(keep.length);
		// console.log(load.length);
		// console.log(this.remove.length);
		// console.log(keep_.length);
		// console.log(this.load.length);
		                   
		//removeTiles(remove); //cancelTiles in Loading queue
		//keepInCacheTiles
		//deleteTiles
			
		//sort load by distance to camera
		// this.removeTiles(this.abort, generalize);
		
		this.loadTiles(this.load, generalize, specialize);
		this.removeTiles(this.remove, generalize);
		
		//check loading tiles for abortion
		this.abort = 
		this.loading.indexStore.store.filter(function(v,ix,a){
			return !(this.load.some(function(v_){
				return (v_.equals(new GIScene.Grid.Index().fromString(v)));
			}));
		}.bind(this));
		//console.log("abort", this.abort.length);
		this.removeTiles(this.abort, generalize);
		
		// this.oldTiles = newTiles;
		// oldTilesString = newTilesString;
		// console.timeEnd("update");
	};
	
	/**
	 * set an approximate terrain height at which the view frustrum will be cut horizontally to determine the visible tiles to be loaded
	 * @method setTerrainHeight
	 * @param {Number} height the terrain height in coordinate reference system (CRS) units (e.g. meters)
	 */
	this.setTerrainHeight = function(height) {
		this.terrainHeight = height;
		_terrainHeight = (this.scene)? this.terrainHeight - this.scene.config.offset.z : this.terrainHeight;
		// console.log(_terrainHeight);
	};
	
	/**
	 * set the max extent of the layer to restrict loading of tiles to a rectangle/bounding box
	 * @method setMaxExtent
	 * @param {GIScene.Extent2} maxExtent2 a 2D bounding box in coordinate reference system (CRS) units 
	 */
	this.setMaxExtent = function(maxExtent2) {
		if(maxExtent2){
			if(this.scene){
				var offset2 = new GIScene.Coordinate2(this.scene.config.offset.x, this.scene.config.offset.y); 
				var min = maxExtent2.min.clone().sub(offset2);
				var max = maxExtent2.max.clone().sub(offset2);
				_maxExtent = new GIScene.Extent2(new GIScene.Coordinate2(min.x, min.y), new GIScene.Coordinate2(max.x, max.y));
				
			}
			else{
				_maxExtent = this.maxExtent;
			}
			
			// console.log(this.name+ ' _maxExtent', _maxExtent);
		}
	};
	
	/**
	 * switches the visibility of the layer on or off
	 * @method setVisibility
	 * @param {Boolean} visibility 
	 */
	this.setVisibility = function(visibility) {
		(visibility)?this.startUpdate():this.stopUpdate();
		GIScene.Layer.Grid.prototype.setVisibility.call(this, visibility);
	};
	
	//start auto initialization 
	this.init();
	
	// when added to a scene 
	var onSetScene = function(event) {
		console.log('Grid.onSetScene ' + this.name);
		var scene = event.content;
		
		this.grid = (scene) ? new GIScene.Grid({origin:this.origin, tileSizes:this.tileSizes, sceneOffset:scene.config.offset})
								 : null
								 ;
		//_terrainHeight = this.terrainHeight - scene.config.offset.z;
		this.setTerrainHeight(this.terrainHeight);
		
		//this.maxExtent = (this.maxExtent)? this.maxExtent[0].toVector3(). : null;
		this.setMaxExtent(this.maxExtent);
		
		(scene) ? this.startUpdate() : this.stopUpdate();
	}.bind(this);
	this.addEventListener('setScene', onSetScene);
	
	
	if(this.config.overrideMaterialHandler){
		//this.addEventListener('afterSetOverrideMaterial', this.config.overrideMaterialHandler);
		this.setOverrideMaterialHandler(this.config.overrideMaterialHandler);
	}
	
	if(this.attributeReader){
		
		var setAttributes = function(event) {
			
			var root = (!!event)? event.content.tile : this.root;
			
			root.traverse(function(object){
				if( ! ("gisceneAttributes" in object.userData) ){object.userData.gisceneAttributes = {}; }
				for (attr in this.attributeReader){
					object.userData.gisceneAttributes[attr] = this.attributeReader[attr](object);
				}
			}.bind(this) );
		}.bind(this);
		
		//check for already loaded objects
		setAttributes();
		//check all new loaded objects on load event
		this.addEventListener('tileload', setAttributes);
	}
	
	//if(this.virtualSelectionAccessor){
	
		
		// var selectVirtualSelection = function(event) {
// 			
			// var root = (!!event)? event.content.tile : this.root;
			// var matches = [];
			// for (var i=0,l=this.virtualSelection.length; i < l ; i++){
				// var match = GIScene.Utils.getObjectsBy(root, function(object){
					// return this.virtualSelectionAccessor(object) == this.virtualSelection[i];
				// }.bind(this));
				// //Array.prototype.push.apply( matches, match);
				// if(match.length > 0){
					// this.selectControl.select(match[i]);
					// this.virtualSelection.splice(i,1);
				// }		
			// }	 
		// }.bind(this);
// 		
		// var restoreVirtualSelection = function(event) {
			// var tile = event.content.tile;
// 			
			// tile.traverse(function(object){
				// if(object.userData.isSelected){
					// this.virtualSelection.push(this.virtualSelectionAccessor(object));
					// this.selectControl.unselect(object);
				// }
			// }.bind(this));
// 			
		// }.bind(this);
		
	var selectSelectionQueryStack = function(event) {
		if(this.selectionQueryStack){
			this.selectByAttributes(this.selectionQueryStack,event.content.tile);
		}
		
	}.bind(this);
	
	var unselectAllOnTileRemove = function(event) {
		var tile = event.content.tile;
		
		tile.traverse(function(object){
				if(object.userData.isSelected){
					this.selectControl.unselect(object);
				}
			}.bind(this)
		);
		
	}.bind(this);
	
	//check already loaded
	//selectVirtualSelection();
	if(this.selectionQueryStack)this.selectByAttributes(this.selectionQueryStack);
	
	//check future added tiles
	this.addEventListener('tileadd', selectSelectionQueryStack);
	
	//unselect all on tile remove
	this.addEventListener('tileremove',unselectAllOnTileRemove);
		
	
};

//Inherit from GIScene.Layer
GIScene.Layer.Grid.prototype = Object.create( GIScene.Layer.prototype );


//Prototype Methods

GIScene.Layer.Grid.prototype.setOverrideMaterial = function(node, overrideMaterial) {
	
	//set material to loaded tiles
	GIScene.Layer.prototype.setOverrideMaterial.apply(this, [node, overrideMaterial]);
	
	//set material to cached tiles
	var tileStore = this.cache.store;
	for(tile in tileStore){
		var object = tileStore[tile].object;
		GIScene.Layer.prototype.setOverrideMaterial.apply(this, [object, overrideMaterial]);
	}
	
};

GIScene.Layer.Grid.prototype.setOverrideMaterialHandler = function(overrideMaterialHandler) {
	if(overrideMaterialHandler){
		//remove the old
		if(this.overrideMaterialHandler){
			this.removeEventListener('afterSetOverrideMaterial', this.overrideMaterialHandler);
		}
		//set the new
		this.overrideMaterialHandler = overrideMaterialHandler;
		this.addEventListener('afterSetOverrideMaterial', this.overrideMaterialHandler);
	}
	else{
		if(this.overrideMaterialHandler){
			this.removeEventListener('afterSetOverrideMaterial', this.overrideMaterialHandler);
		}
	}
	
};

GIScene.Layer.Grid.prototype.setActiveStyle = function(style){
	
	if( !style ||  (typeof style == 'string' && style.toLowerCase() == "default") ){
			style = this.styles[0];
		}
	
	//is layer grid?
	// var isGridLayer = layer instanceof GIScene.Layer.Grid;				
	// console.log("isGridLayer", isGridLayer);
	
	var recursive = style.recursive; //TODO implement recursive as parameter of setOverrideMaterial
	var material = style.material;
	var selectionType = (style.rootObjects)? "byObjects" : (style.rootObjectKeyAttribute)? "byAttributes" : "selectAll";
	
	//isMaterrial RasterOverlay or WMSOvwerlay
	var isWMSOverlayMaterial = material instanceof GIScene.WMSOverlayMaterial;
	console.log("isWMSOverlayMaterial",isWMSOverlayMaterial);
	
	if(/*isGridLayer && */ isWMSOverlayMaterial){
		this.setOverrideMaterialHandler(GIScene.OverrideMaterialHandler.WMS);
		
	}else{
		this.setOverrideMaterialHandler(null);
		
	}
	
	GIScene.Layer.prototype.setActiveStyle.apply(this, [style]); //@TODO instead of using super class method, implement event driven updates onTileAdd similar to selection queryStack 
	
};
