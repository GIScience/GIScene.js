/**
 * The Line of Sight Process calculates the visibility bewtween two points in the scene
 * 
 * @namespace GIScene
 * @class Process.LineOfSight_simpleClient
 * @constructor
 * @extends GIScene.Process 
 * 
 * @author mcauer https://github.com/mcauer
 */
GIScene.Process.LineOfSight_simpleClient = function() {
	
	var config = {
		identifier		: "GIScene:lineOfSight",
		title			: "Line of Sight",
		abstract		: "Given two locations and possible obstacle objects this process will compute the visibility between the two locations and provides a graphical 3D line.",
		metadata		: null,
		processVersion	: "1.0",
		description		: {inputs:[
								{
									identifier: 'GIScene:lineOfSight:observerPoint',
									title:    'Observer Point', 
									abstract: 'Point of Observer, where the line of sight starts.', 
									dataType:  'GIScene.Coordinate3', //long geo coords
									maxOccurs: 1,
								},
								{
									identifier: 'GIScene:lineOfSight:observerOffset',
									title:	'Observer Offset',
									abstract:	'Additional height offset to observer point.',
									dataType:	'Number',
									minOccurs: 0,
									maxOccurs: 1,
									defaultValue:0
								},
								{	identifier: 'GIScene:lineOfSight:targetPoint',
									title:    'Tartget Point', 
									abstract: 'Point of Target, where the line of sight ends.', 
									dataType:   'GIScene.Coordinate3', //long geo coords
									minOccurs: 1,
									maxOccurs: 1
								},
								{
									identifier: 'GIScene:lineOfSight:targetOffset',
									title:	'Target Offset',
									abstract:	'Additional height offset to target point.',
									dataType:	'Number',
									minOccurs: 0,
									maxOccurs: 1,
									defaultValue:0
								},
								{
									identifier: 'GIScene:lineOfSight:obstacleLayers',
									title:    'Obstacle Layers',
									abstract: 'Layers whose objects are possible obstacles to be reflected in the calculation.',
									dataType  : 'Array(GIScene.Layer)',
									minOccurs: 1,
									maxOccurs: 'unbounded' //like in xml
								}
							],
							outputs:[
								{
									identifier: 'GIScene:lineOfSight:lineOfSight',
									title:	'Line Of Sight',
									abstract:	'The calculated Line of Sight between observer and target.',
									dataType:	'THREE.Object3D' //???
									
								},
								{
									identifier: 'GIScene:lineOfSight:isVisible',
									title:	'Target is visible',
									abstract:	'The result of the visibility calculation.',
									dataType:	'boolean'
								}
							]
						}
	};
	
	//make this a Process
	GIScene.Process.apply(this, [config]);

	
	//setDefaults	
	this.config.description.inputs.forEach( function(e, i, a) {
		if (e.defaultValue != undefined) {
			//console.log(e, e.defaultValue, e.identifier);
			this.setInput(e.identifier, e.defaultValue);
		}
	}.bind(this)); 
	
	this.raycaster	= new THREE.Raycaster();
	
	var lineMatVisible = new THREE.LineBasicMaterial({color: new THREE.Color(0x00ff00)});
	var lineMatNotVisible = new THREE.LineBasicMaterial({color: new THREE.Color(0xff0000)});
	
	
	
	/**
	 * run the process with the inputs that have been set before
	 *  @method execute
	 *  @param {Function} [onExecute] callback that will be called when process is finished
	 *  
	 */
	
	this.execute = function(onExecute) {
		// var observerV3 		= this.data.inputs['GIScene:lineOfSight:observerPoint'];
		var observerC3 		= this.data.inputs['GIScene:lineOfSight:observerPoint'];
		console.log('observerc3');
		console.log(observerC3);
		var observerOffset 	= this.data.inputs['GIScene:lineOfSight:observerOffset'];	
		//var targetV3		= this.data.inputs['GIScene:lineOfSight:targetPoint'];
		var targetC3		= this.data.inputs['GIScene:lineOfSight:targetPoint'];
		var targetOffset	= this.data.inputs['GIScene:lineOfSight:targetOffset'];
		var obstacleLayers	= this.data.inputs['GIScene:lineOfSight:obstacleLayers'];	
		
		var onExecute = onExecute || function(){};
		
		//@TODO evaluate inputs (occurences etc.)
		var scene = obstacleLayers[0].scene; // get scene from layers, better set scene as a process param?
		
		//short graphic coords
		var observerV3 		= observerC3.clone().sub(scene.config.offset).toVector3();
		var targetV3		= targetC3.clone().sub(scene.config.offset).toVector3();
		
		var start 		= observerV3.clone().add(new THREE.Vector3(0,observerOffset,0)); //short graphic coords
		var end			= targetV3.clone().add(new THREE.Vector3(0,targetOffset,0));
		var direction 	= end.clone().sub(start).normalize();
		// var loading = new GIScene.Grid.TileStore(); // need it per layer
		var intersections; 
		var nearestIntersection = null;
		var numCheckedLayers = 0;
		var targetIsVisible;
		
		//global analysis state
		var analysisDone= false;
		
		
		this.raycaster.set(start, direction); //(origin, direction) direction must be normalized
		
		this.raycaster.far = start.distanceTo(end);//targetV3.clone().sub(observerV3).length();
		
		console.log("far", this.raycaster.far);
		
		/**
		 * 
		 * @method getNearestIntersectionObject
		 * @private
		 * @param {THREE.Vector3} referencePoint
		 * @param {Object} intersectionObjectA object returned from Raycaster.intersectObjects() method
		 * @param {Object} intersectionObjectB object returned from Raycaster.intersectObjects() method
		 * @return {Object} nearestIntersectionObject
		 */
		var getNearestIntersectionObject = function(referencePoint, intersectionObjectA, intersectionObjectB) {
			//only valid if both are created by the same ray
			return ( intersectionObjectA.distance < intersectionObjectB.distance )?
					 intersectionObjectA
					:
					 intersectionObjectB
					;
			
			// return ( referencePoint.distanceTo(intersectionObjectA.point) < referencePoint.distanceTo(intersectionObjectB.point) )?
					  // intersectionObjectA
					 // :
					  // intersectionObjectB
					 // ;
			
		};
		
		//returns true if newIntersection is nearest
		var updateNearestIntersection = function(nearestIntersection_, newIntersection) {
			if ( !!(newIntersection) ){ //intersections found
			  	if(!nearestIntersection){ 
			  		nearestIntersection = newIntersection;
			  		updateAllNearestIntersectionTileIndices();
			  		return true;
			  	}
			  	else{
			  		nearestIntersection = getNearestIntersectionObject(start,nearestIntersection_,newIntersection);
			  		if(nearestIntersection === newIntersection){
			  				updateAllNearestIntersectionTileIndices();
			  				return true;
			  			};
			  		
			  		};
			  	}
			 else { //no intersections found
			 	return false;
			 }
		};
		
		var updateAllNearestIntersectionTileIndices = function() {
			
			//only do it for gridlayers, stop in phase of static layer checking
			if(!gridLayers[0].LineOfSightAnalysisController){return;}
			
			for(var i=0,j=gridLayers.length; i<j; i++){
			  
			  var layer = gridLayers[i];
			  
			  var nearestIntersectionGridIndex = (nearestIntersection)? layer.grid.getIndexFromPoint2d(GIScene.Utils.vector3ToVector2(nearestIntersection.point), layer.LineOfSightAnalysisController.smallestTileSize) : undefined;
			  
			  layer.LineOfSightAnalysisController.analysisTiles.forEach(function(e,idx,a){
								  			if(nearestIntersectionGridIndex && e.equals(nearestIntersectionGridIndex)){layer.LineOfSightAnalysisController.nearestIntersectionTileIndex = idx;}
								 		}.bind(this)
								 );
			};
		};
		
		
		// //find indexOf first element with true if no undefined is found before, otherwise if 
		// undefined before return -1
		// if no undefined is found and all are false return false
		var getIndexOfFirstIntersectionTile = function(ctrl){
		  var first = false;
		  for (var i=0,j=ctrl.length;i<j;i++){
		
		    if(ctrl[i] === undefined)	{first = -1;	break;}
		    if(ctrl[i] === true)		{first = true;	break;}
		  
		  }
		  return first;
		};
		
		//all from here must be wrapped in a returnResults function
		var returnResults = function(layer/*, loading, computeTileIndicesHandler*/) {
			
			if (layer) {var losCtrl = layer.LineOfSightAnalysisController;}
			if(losCtrl){ //only available in gridLayers
				var computeTileIndicesHandler = losCtrl.computeTileIndicesHandler;
				var loading = losCtrl.loading;	
			}
			
			
			if(layer && loading){
				//abort all still loading in a finished layer
				var aborts = 0;
				for ( tile in loading.store ){
					loading.store[tile].object.abort();
					aborts++;
					loading.remove(new GIScene.Grid.Index().fromString(tile));
				}
				console.log(layer.name + ": optimized uncached tiles by abort running requests: " + aborts);
			}
			
			//restore original state
		  	if(computeTileIndicesHandler) layer.computeTileIndicesHandler = computeTileIndicesHandler;
			
			//wait until last layer has finished 
			if( !( numCheckedLayers == obstacleLayers.length ) ){
				console.log("Number of checked Layers",numCheckedLayers);	
				return;
				}
			
			//all layers are checked now
			analysisDone = true;
			console.log("Number of checked Layers",numCheckedLayers, "Ready.");
			
			
			//return to normal work
			
			gridLayers.forEach(function(layer,i,a){ 
					
					layer.startUpdate(); 
					
					//cleanup
					layer.LineOfSightAnalysisController = null;
					losCtrl = null;
					delete layer.LineOfSightAnalysisController;
					
				});
			
			//evaluate intersections
			console.log("THE END");
			
			// var targetIsVisible = true;
			var visibilityLines;
			var group = new THREE.Object3D();
			
			if( nearestIntersection ) { 
				targetIsVisible = false; 
				
				//visLine
				var geomVis = new THREE.Geometry();
				geomVis.vertices = [start,nearestIntersection.point];
				var visLine = new THREE.Line(geomVis, lineMatVisible);
				//notVisLine
				var geomNotVis = new THREE.Geometry();
				geomNotVis.vertices = [nearestIntersection.point,end];
				var notvisLine = new THREE.Line(geomNotVis, lineMatNotVisible);
				
				group.add(visLine);
				group.add(notvisLine);
				}
			else {
				targetIsVisible = true;
				var geom = new THREE.Geometry();
				geom.vertices = [start,end];
				var visLine = new THREE.Line(geom, lineMatVisible);
				
				group.add(visLine);
			}
			
			this.data.outputs['GIScene:lineOfSight:lineOfSight'] = group;
			this.data.outputs['GIScene:lineOfSight:isVisible']	 = targetIsVisible;
			
			this.dispatchEvent({type:'execute', content : this.data});
			
			onExecute(this.data);
			
		}.bind(this);
		
		var checkUncachedTile = function(index, layer/*, loading, controlArray, uncachedTiles, uncachedTilesIndex, computeTileIndicesHandler,analysisState, nearestIntersectionTileIndex*/) {
			
			var losCtrl = layer.LineOfSightAnalysisController;
			
			var loading = losCtrl.loading;
			var controlArray = losCtrl.controlArray;
			var uncachedTilesIndex = losCtrl.uncachedTilesIndex;
			
			var gridIndex = losCtrl.uncachedTiles[index];
			
						
			var requestUrl = layer.config.service.getGetSceneUrl(gridIndex, layer.grid);
			
			var onSuccess = function(result) { //result is a THREE.Scene Object
				
				
				
				var checkIntersection = true;
				
				console.log(layer.name + ': LineOfSight:load uncached tiles:onSuccess',index);
				
				if (losCtrl.layerChecked){
					console.log(layer.name + ": Analysis already DONE!");
					return;
				}; //for async callbacks after first intersection already found
				
				//remove from loading
				loading.remove(gridIndex);
				
				//TODO don't check intersection if already nearer tile is checked positive (from other uncached tile / layer)
				console.log("nearestIntersectionTileIndex",losCtrl.nearestIntersectionTileIndex);
				//short hack only for current layer
				if(index > losCtrl.nearestIntersectionTileIndex) {console.log("already behind nearest intersection. SKIP processing loaded tile.");checkIntersection = false;controlArray[uncachedTilesIndex[index]] = false;/*return;*/}
				//long hack across all layers 
				// if(nearestIntersection){
					// var tileCenter = layer.grid.getCentroidFromIndex(gridIndex); //Vec2 short graphic coords
					// // var boundingRadius = Math.sqrt( 2 * Math.pow(gridIndex.tileSize*0.5, 2) );
					// // var nearestIntTileCenterDistance = tileCenter.distanceTo( GIScene.Utils.vector3ToVector2(nearestIntersection.point) );
// 					
					// // if (nearestIntTileCenterDistance > boundingRadius){
						// // console.log(layer.name + ": optimize uncached tiles. Already nearer intersection found. Skip analysisTiles index" + uncachedTilesIndex[index]);
						// // //return false;
						// // checkIntersection = false;
						// // controlArray[uncachedTilesIndex[index]] = false;
					// // }
// 					
					// if( GIScene.Utils.vector3ToVector2(nearestIntersection.point.clone().sub(start)).length() < tileCenter.clone().sub(GIScene.Utils.vector3ToVector2(start)).length() ){
						// console.log(layer.name + ": optimize uncached tiles. Already nearer intersection found. Skip analysisTiles index" + uncachedTilesIndex[index]);
						// //return false;
						// // return; 
						// checkIntersection = false;
						// controlArray[uncachedTilesIndex[index]] = false;
					// }
				// }
				
				if (checkIntersection){
					//rotate model if z is up
					if(layer.verticalAxis.toUpperCase() == "Z"){
						result.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI/2 ) );
					}
					
					//setOverrideMaterial
					layer.setOverrideMaterial(result, layer.config.overrideMaterial);
					
					layer.root.add(result);
			  		result.updateMatrixWorld();
			  		
			  		//TODO OPTIONALLY compute BBOX
			  		result.traverse(function(object){if(object.geometry){object.geometry.computeBoundingBox();}});
			  		
			  		//TODO may be wait for after render, so that everything is updated correctly?
			  		intersections = this.raycaster.intersectObject(layer.root, true);
			  		
			  		//TODO if no obstruction point needed then if intersections.length > 0 indicates visibility false and the whole process can be stopped here
			  		if(intersections.length > 0){
				  		var isNearestTile = updateNearestIntersection(nearestIntersection, intersections[0]);
				  		
				  		if(isNearestTile){losCtrl.nearestIntersectionTileIndex = uncachedTilesIndex[index]; }
				  		console.log("nearestIntersectionTileIndex", losCtrl.nearestIntersectionTileIndex);
				  		
				  		controlArray[uncachedTilesIndex[index]] = true;
			  		}
			  		else{
			  			controlArray[uncachedTilesIndex[index]] = false;
			  		}
			  		layer.root.remove(result);
				}
				
		  		
		  		//add tile to cache to make use of having loaded it for after analysis visualization
		  		layer.cache.add(gridIndex,result);
				
			//if there is no tile before left to be checked and an intersection was found here: continue the loop to the next layer
			//check if all tiles have been tested then execute returnResults()
			var firstIntersectionTile = getIndexOfFirstIntersectionTile(controlArray);
			console.log("doreturnResults?", firstIntersectionTile !== -1);
			console.log("intersectionsLength: ", intersections.length);
			console.log("Loading Requests:" , loading.length);
			if(firstIntersectionTile !== -1){
				numCheckedLayers++;
				losCtrl.layerChecked = true;
				console.log(layer.name +" : firstIntersection found! Layer checked by UNCACHED!");
				returnResults(layer/*, loading, computeTileIndicesHandler*/);
			}
			
			
			}.bind(this);
			
			var onError = function(event) {
				console.log(event);
				
				console.log(layer.name + ': LineOfSight:load uncached tiles:onError',index);
				
				//remove from loading
				loading.remove(gridIndex);
				alert ("XHRError");
								
			}.bind(this);//TODO Sceneloader will never throw it // now it should
			
			var loader = new GIScene.ModelLoader(); //need a loader for every parallel request
			loader.load(requestUrl, layer.format, onSuccess, undefined, onError);
			loading.add(gridIndex,loader);
		}.bind(this);
		
		
		/////////////////////
		// START ANALIZING //
		/////////////////////
		
		//get layers to be included in analysis
				
		//find out which are Grid and which not
		var gridLayers = [];
		var staticLayers = [];
		obstacleLayers.forEach(function(e,i,a){
			if (e instanceof GIScene.Layer.Grid){gridLayers.push(e);}
			else {staticLayers.push(e);}
		});
		
		console.log("obstacle layers", obstacleLayers.length);
		console.log("static layers", staticLayers.length);
		console.log("grid layers", gridLayers.length);
		
		//first check the STATIC layers then the more complicated gridLayers
		for(var i=0,j=staticLayers.length; i<j; i++){
		  
		  intersections = this.raycaster.intersectObject(staticLayers[i].root, true);
		  
		  //TODO if no obstruction point needed then if intersections.length > 0 indicates visibility false and the whole process can be stopped here
		  
		  //check which intersection is the first (nearest to start)
		  if(intersections.length > 0) updateNearestIntersection(nearestIntersection, intersections[0]);
		  
		  numCheckedLayers++;
		  console.log(staticLayers[i].name +" : Layer checked STATIC!");
		  returnResults();
		  
		}; //static layer check end
		
		
		
		//INIT gridlayers checking for checking
		for(var i=0,j=gridLayers.length; i<j; i++){
			
			var layer = gridLayers[i];
			var grid = layer.grid;
			
			//controller object for each grid layer
			layer.LineOfSightAnalysisController = {};
		  	var losCtrl = layer.LineOfSightAnalysisController;
		  		  
		  	losCtrl.layerChecked = false;
		  	losCtrl.loading = new GIScene.Grid.TileStore();
		    losCtrl.smallestTileSize = grid.tileSizes[grid.tileSizes.length-1]; //tilesizes are sorted from big to small
		    
		    //get AnalysisTiles per layer
			var observerV2 = new GIScene.Coordinate2().fromVector2( GIScene.Utils.vector3ToVector2(observerV3.clone().add(grid._sceneOffset)) );
			var targetV2 =   new GIScene.Coordinate2().fromVector2( GIScene.Utils.vector3ToVector2(  targetV3.clone().add(grid._sceneOffset)) );
			  
			var optimizedTarget1 = (nearestIntersection)? new GIScene.Coordinate2().fromVector2( GIScene.Utils.vector3ToVector2(  nearestIntersection.point.clone().add(grid._sceneOffset)) ) : targetV2;
			//8-connected rasterline (DDA grid traversal algorithm)
			var woOptimizedTarget = grid.getTilesFromLineIntersection(observerV2,targetV2,losCtrl.smallestTileSize);
			losCtrl.analysisTiles = grid.getTilesFromLineIntersection(observerV2,optimizedTarget1,losCtrl.smallestTileSize);
			  
			console.log(layer.name + ": "+ optimizedTarget1.toArray());
			console.log(layer.name + ": optimized number of tiles: " + losCtrl.analysisTiles.length +"/"+ woOptimizedTarget.length + " " + ((losCtrl.analysisTiles.length *100) / woOptimizedTarget.length) + "%");
			
			losCtrl.controlArray = new Array(losCtrl.analysisTiles.length);
 
			//check each analysisTile for obstructions: first chached tiles synchronously, then uncached tiles asnchronuously
			//tiles have to be loaded and added to the scene, to be sure that all matrices are applied correctly when tested with Raycaster

			//store layer function to be restored after the analysis
			losCtrl.computeTileIndicesHandler = layer.computeTileIndicesHandler;

			// remove all tiles
			//better in future: remove tiles in two steps to be sure that the analysis tile get into the cache at last
			layer.stopUpdate();
			layer.computeTileIndicesHandler = function() {
				return [];
			};
			layer.update();
			//this removes all tiles from the scene

			//first check available tiles from cache
			losCtrl.cachedTiles = [];	//Objects
			losCtrl.cachedTilesIndex = [];
			losCtrl.uncachedTiles = [];	//TileIndex
			losCtrl.uncachedTilesIndex = [];

			//var nearestIntersectionTileIndex;//analysisTiles Array Index
			losCtrl.nearestIntersectionTileIndex = undefined;

			losCtrl.analysisTiles.forEach( function(e, i, a) {

				var tileFromCache = layer.cache.getTile(e);
				if (tileFromCache) {
					losCtrl.cachedTiles.push(tileFromCache);  //Object3D
					losCtrl.cachedTilesIndex.push(i);
				} else {
					losCtrl.uncachedTiles.push(e);  	//Grid.Index
					losCtrl.uncachedTilesIndex.push(i);
				}
			}.bind(this));

			console.log(layer.name + ": cached / uncached tiles", losCtrl.cachedTiles.length, losCtrl.uncachedTiles.length); 

			
		}
		
		//////////////////////////////////////////////////////////// 
		//START checking ALL gridlayers CACHED tiles synchronously//
		////////////////////////////////////////////////////////////
		for(var i=0,j=gridLayers.length; i<j; i++){
		  
		  var layer = gridLayers[i];
		  var losCtrl = layer.LineOfSightAnalysisController;
		  
		  	  
		  console.log("Start Analyzing " + layer.name);
		  console.log(layer.name + ": Analyzing "+ losCtrl.cachedTiles.length +" CACHED tiles");
		  
		  
		  // CHECK CACHED TILES
		  for(var iiii=0,jjjj=losCtrl.cachedTiles.length; iiii<jjjj; iiii++){
		  	
		  	var tileFromCache = losCtrl.cachedTiles[iiii];
		  	
		  	layer.root.add(tileFromCache);
		  		
	  		//TODO may be wait for after render, so that everything is updated correctly?
	  		intersections = this.raycaster.intersectObject(layer.root, true);
	  		
	  		//TODO if no obstruction point needed then if intersections.length > 0 indicates visibility false and the whole process can be stopped here
	  		if(intersections.length > 0){
	  			var isNearestTile = updateNearestIntersection(nearestIntersection, intersections[0]);
	  		
	  			if(isNearestTile){losCtrl.nearestIntersectionTileIndex = losCtrl.cachedTilesIndex[iiii]; }
	  			console.log("nearestIntersectionTileIndex", losCtrl.nearestIntersectionTileIndex);
	  			losCtrl.controlArray[losCtrl.cachedTilesIndex[iiii]] = true;
	  		}
	  		else{
	  			losCtrl.controlArray[losCtrl.cachedTilesIndex[iiii]] = false;
	  		}
	  		
	  		layer.root.remove(tileFromCache);
	  		
	  		var firstIntersectionTile = getIndexOfFirstIntersectionTile(losCtrl.controlArray); // true (first found), false (all checked but none found) or -1 (keep on checking)
	  		console.log(layer.name + ' :firstIntersectionTile', firstIntersectionTile, losCtrl.controlArray.length);
	  		if(firstIntersectionTile !== -1){
	  			numCheckedLayers++;
	  			console.log(layer.name +" : firstIntersection found! Layer checked by CACHED!");
				returnResults(layer/*, loading, computeTileIndicesHandler*/);
				
				losCtrl.layerChecked = true;
				break; //no more cached tile testing
			}
		  };
		  //if(layerChecked){continue;} //when checked by cached no testing of uncached --> test next layer
		  
		} //DONE checking all gridlayers CACHED tiles
		  
		 
		 if( analysisDone ) return; 
		  
		 ///////////////////////////////////////////////////////////////
		 //START checking ALL gridlayers UNCACHED tiles asynchronously//
		 ///////////////////////////////////////////////////////////////
		 for(var i=0,j=gridLayers.length; i<j; i++){ 
		  
		  var layer = gridLayers[i];
		  var losCtrl = layer.LineOfSightAnalysisController;
		  if (losCtrl.layerChecked){ return; };
		  //OPTIMIZE
		  //reduce uncachedTiles according to former found intersections
		  //2nd reduction if uncached are left but found intersection in cached
		  if(nearestIntersection){
		  	var deleteFromIndex = null;
		  	for(var iii=losCtrl.uncachedTilesIndex.length-1, jjj=0; iii>=jjj; iii--){
				if(losCtrl.uncachedTilesIndex[iii] >= losCtrl.nearestIntersectionTileIndex){
					deleteFromIndex = iii;
				}
			  };
			  
			 if(deleteFromIndex != null){
			 	console.log('controlArray:before', losCtrl.controlArray);
			 	var uncached_orig_length = losCtrl.uncachedTiles.length;
			 	
			 	losCtrl.uncachedTiles.splice(deleteFromIndex,Number.MAX_VALUE); //???
			 	
			 	//update controlArray
			 	for(var v = deleteFromIndex, vi = uncached_orig_length/*uncachedTiles.length*/; v < vi; v++){
			 		losCtrl.controlArray[losCtrl.uncachedTilesIndex[v]] = false;
			 	}
			 	
			 	//update uncachedTilesIndex
			 	losCtrl.uncachedTilesIndex.splice(deleteFromIndex,Number.MAX_VALUE); //???
			 	 
			 	console.log(layer.name + ": optimized number of uncached tiles: " + uncached_orig_length +"-->"+ losCtrl.uncachedTiles.length);
			 	// console.log('controlArray:after', losCtrl.controlArray);
			 }
		  }
		  
		  
		  //CHECK remaining UNCACHED tiles (async)
		  console.log(layer.name + ": Analyzing "+ losCtrl.uncachedTiles.length +" UNCACHED tiles");
		  for(var ii=0,jj=losCtrl.uncachedTiles.length; ii<jj; ii++){
					
			if (checkUncachedTile(ii, layer/*, loading, controlArray, uncachedTiles, uncachedTilesIndex,computeTileIndicesHandler,analysisState, nearestIntersectionTileIndex*/) === false) { continue; }
			
		  };
		  
		  
		}; // gridLayer check end
		
	};
		
};

//Inherit from GIScene.Layer
GIScene.Process.LineOfSight_simpleClient.prototype = Object.create( GIScene.Process.prototype );