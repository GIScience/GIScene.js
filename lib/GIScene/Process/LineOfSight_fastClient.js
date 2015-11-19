/**
 * The Line of Sight Process calculates the visibility bewtween two points in the scene
 * 
 * @namespace GIScene
 * @class Process.LineOfSight_fastClient
 * @constructor
 * @extends GIScene.Process 
 */
GIScene.Process.LineOfSight_fastClient = function() {
	
	var config = {
		identifier		: "GIScene:lineOfSight",
		title			: "Line of Sight",
		abstract		: "Given two loactions and possible obstacle objects this process will compute the visibility between the two loactions and provides a graphical 3D line.",
		metadata		: null,
		processVersion	: "1.0",
		description		: {inputs:[
								{
									identifier: 'GIScene:lineOfSight:observerPoint',
									title:    'Observer Point', 
									abstract: 'Point of Observer, where the line of sight starts.', 
									dataType:   'THREE.Vector3', //??? short graphic coords
									minOccurs: 1,
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
									dataType:   'THREE.Vector3', //???
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

	//INPUTS
	// this.inputs.observerPoint  = null; //THREE.Vector3
	// this.inputs.targetPoint	= null; //THREE.Vector3
	// this.inputs.observerOffset = 0;
	// this.inputs.targetOffset	= 0;
	// this.inputs.obstacles		= null;
// 	
	// //OUTPUTS
	// this.ouputs.visibility = null;
	// this.ouputs.lineOfSight = null;
	
	// var inputParams = {
		// 'GIScene:lineOfSight:observerPoint'	: new THREE.Vector3(0,100,0),
		// 'GIScene:lineOfSight:observerOffset': 5,
		// 'GIScene:lineOfSight:targetPoint'	: new THREE.Vector3(0,-100,0),
		// 'GIScene:lineOfSight:targetOffset'	: 0,
		// 'GIScene:lineOfSight:obstacles'		: null//this.scene.root		
	// };
// 	
	// this.setInputs(inputParams);
	
	var lineMatVisible = new THREE.LineBasicMaterial({color: new THREE.Color(0x00ff00)});
	var lineMatNotVisible = new THREE.LineBasicMaterial({color: new THREE.Color(0xff0000)});
	
	
	
	/**
	 * run the process with the inputs that have been set before
	 *  @method execute
	 *  @return {object} data an object with all input and output values of the process
	 */
	
	this.execute = function() {
		var observerV3 		= this.data.inputs['GIScene:lineOfSight:observerPoint'];
		var observerOffset 	= this.data.inputs['GIScene:lineOfSight:observerOffset'];	
		var targetV3		= this.data.inputs['GIScene:lineOfSight:targetPoint'];
		var targetOffset	= this.data.inputs['GIScene:lineOfSight:targetOffset'];
		var obstacleLayers	= this.data.inputs['GIScene:lineOfSight:obstacleLayers'];	
		
		//@TODO evaluate inputs (occurences etc.)
		var scene = obstacleLayers[0].scene; // get scene from layers, better set sceen as a process param?
		
		var start 		= observerV3.clone().add(new THREE.Vector3(0,observerOffset,0)); //short graphic coords
		var end			= targetV3.clone().add(new THREE.Vector3(0,targetOffset,0));
		var direction 	= end.clone().sub(start).normalize();
		// var loading = new GIScene.Grid.TileStore(); // need it per layer
		var intersections; 
		var nearestIntersection = null;
		var numCheckedLayers = 0;
		var targetIsVisible;
		
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
			  		return true;
			  	}
			  	else{
			  		nearestIntersection = getNearestIntersectionObject(start,nearestIntersection_,newIntersection);
			  		return (nearestIntersection === newIntersection); 
			  		};
			  	}
			  	else { //no intersections found
			  		return false;
			    }
		};
		
		// //find indexOf first element with true if no undefined is found before, otherwise if 
		// undefined before return -1
		// no undefined is found and all are false return false
		var getIndexOfFirstIntersectionTile = function(ctrl){
		  var first = false;
		  for (var i=0,j=ctrl.length;i<j;i++){
		
		    if(ctrl[i] === undefined)	{first = -1;	break;}
		    if(ctrl[i] === true)		{first = true;	break;}
		  
		  }
		  return first;
		};
		
		//all from here must be wrapped in a returnResults function
		var returnResults = function(layer, loading, computeTileIndicesHandler) {
			
			if(layer && loading){
				//abort all still loading in a finished layer
				var aborts = 0;
				for ( tile in loading.store ){
					aborts++;
					loading.store[tile].object.abort();
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
			console.log("Number of checked Layers",numCheckedLayers, "Ready.");
			
			
			//return to normal work
			
			gridLayers.forEach(function(layer,i,a){ layer.startUpdate(); });
			
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
			
			return this.data;
			
		}.bind(this);
		
		var checkUncachedTile = function(index, layer, loading, controlArray, uncachedTiles, uncachedTilesIndex, computeTileIndicesHandler, nearestIntersectionTileIndex) {
			
			var gridIndex = uncachedTiles[index];
			
			//TODO immediately skip if tile is completely beyond nearestIntersection
			// if tileCenter is further away from nearestIntersection than the boundingRadius (circle)
			if(nearestIntersection){
				var tileCenter = layer.grid.getCentroidFromIndex(gridIndex); //Vec2 short graphic coords
				var boundingRadius = Math.sqrt( 2 * Math.pow(gridIndex.tileSize, 2) );
				
				if( GIScene.Utils.vector3ToVector2(nearestIntersection.point.clone().sub(start)).length < tileCenter.clone().sub(GIScene.Utils.vector3ToVector2(start)) ){
					console.log(layer.name + ": optimize uncached tiles. Already nearer intersection found. Skip analysisTiles index" + uncachedTilesIndex[index]);
					return false; 
				}
			}
			
			
			var requestUrl = layer.config.service.getGetSceneUrl(gridIndex, layer.grid);
			
			var onSuccess = function(result) { //result is a THREE.Scene Object
				
				console.log(layer.name + ': LineOfSight:load uncached tiles:onSuccess',index);
				
				//remove from loading
				loading.remove(gridIndex);
				
				//rotate model if z is up
				if(layer.verticalAxis.toUpperCase() == "Z"){
					result.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI/2 ) );
				}
				
				//setOverrideMaterial
				layer.setOverrideMaterial(result, layer.config.overrideMaterial);
				
				layer.root.add(result);
		  		result.updateMatrixWorld();
		  		
		  		//TODO may be wait for after render, so that everything is updated correctly?
		  		intersections = this.raycaster.intersectObject(layer.root, true);
		  		
		  		//TODO if no obstruction point needed then if intersections.length > 0 indicates visibility false and the whole process can be stopped here
		  		if(intersections.length > 0){
			  		var isNearestTile = updateNearestIntersection(nearestIntersection, intersections[0]);
			  		
			  		if(isNearestTile){nearestIntersectionTileIndex = uncachedTilesIndex[index]; }
			  		console.log("nearestIntersectionTileIndex", nearestIntersectionTileIndex);
			  		
			  		controlArray[uncachedTilesIndex[index]] = true;
		  		}
		  		else{
		  			controlArray[uncachedTilesIndex[index]] = false;
		  		}
		  		layer.root.remove(result);
		  		
		  		//add tile to cache to make use of having loaded it for after analysis visualization
		  		layer.cache.add(gridIndex,result);
				
				//TODO if there is no tile before left to be checked and an intersection was found here: continue the loop to the next layer
			//TODO check if all tiles have been tested then execute returnResults()
			var firstIntersectionTile = getIndexOfFirstIntersectionTile(controlArray);
			if(firstIntersectionTile !== -1){
				numCheckedLayers++;
				console.log(layer.name +" : firstIntersection found! Layer checked by UNCACHED!");
				returnResults(layer, loading, computeTileIndicesHandler);
			}
			
			
			}.bind(this);
			var onError = function() {};//TODO Sceneloader will never throw it
			
			var loader = new GIScene.ModelLoader(); //need a loader for every parallel request
			loader.load(requestUrl, layer.format, onSuccess, null, onError);
			loading.add(gridIndex,loader);
		}.bind(this);
		
		//get layers to be included in analysis
		//->obstacleLayers
		
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
		
		//first check the static layers then the more complicated gridLayers
		for(var i=0,j=staticLayers.length; i<j; i++){
		  
		  intersections = this.raycaster.intersectObject(staticLayers[i].root, true);
		  
		  //TODO if no obstruction point needed then if intersections.length > 0 indicates visibility false and the whole process can be stopped here
		  
		  //check which intersection is the first (nearest to start)
		  updateNearestIntersection(nearestIntersection, intersections[0]);
		  
		  numCheckedLayers++;
		  console.log(staticLayers[i].name +" : firstIntersection found! Layer checked STATIC!");
		  returnResults();
		  
		}; //static layer check end
		
		
		for(var i=0,j=gridLayers.length; i<j; i++){
		  
		  //get AnalysisTiles per layer
		  var layer = gridLayers[i];
		  var grid = layer.grid;
		  var smallestTileSize = grid.tileSizes[grid.tileSizes.length-1]; //tilesizes are sorted from big to small
		  var observerV2 = new GIScene.Coordinate2().fromVector2( GIScene.Utils.vector3ToVector2(observerV3.clone().add(grid._sceneOffset)) );
		  var targetV2 =   new GIScene.Coordinate2().fromVector2( GIScene.Utils.vector3ToVector2(  targetV3.clone().add(grid._sceneOffset)) );
		  
		  var optimizedTarget1 = (nearestIntersection)? new GIScene.Coordinate2().fromVector2( GIScene.Utils.vector3ToVector2(  nearestIntersection.point.clone().add(grid._sceneOffset)) ) : targetV2;
		  var woOptimizedTarget = grid.getTilesFromLineIntersection(observerV2,targetV2,smallestTileSize);
		  var analysisTiles = grid.getTilesFromLineIntersection(observerV2,optimizedTarget1,smallestTileSize);
		  var loading = new GIScene.Grid.TileStore();
		  
		  console.log("Start Analyzing " + layer.name);
		  console.log(layer.name + ": "+ optimizedTarget1.toArray());
		  console.log(layer.name + ": optimized number of tiles: " + analysisTiles.length +"/"+ woOptimizedTarget.length + " " + ((analysisTiles.length *100) / woOptimizedTarget.length) + "%");
		  
		  var controlArray = new Array(analysisTiles.length);
		  //check each analysisTile for obstructions asnchronuously
		  //tiles have to be loaded and added to the scene, to be sure that all matrices are applied correctly when tested with Raycaster
		  
		  //store layer function to be restores after the analysis
		  var computeTileIndicesHandler = layer.computeTileIndicesHandler;
		  
		  // remove all tiles
		  //better in future: remove tiles in two steps to be sure that the analysis tile get into the cache at last
		  layer.stopUpdate();
		  layer.computeTileIndicesHandler = function() {return [];};
		  layer.update(); //this removes all tiles from the scene
		  
		  //first check available tiles from cache
		  var cachedTiles	=[]; //Objects
		  var cachedTilesIndex = [];
		  var uncachedTiles	=[]; //TileIndex
		  var uncachedTilesIndex =[];
		  
		  var nearestIntersectionTileIndex;//analysisTiles Index //= (nearestIntersection)? layer.grid.getIndexFromPoint2d(GIScene.Utils.vector3ToVector2(nearestIntersection.point)) : undefined;
		  
		  var nearestIntersectionGridIndex = (nearestIntersection)? layer.grid.getIndexFromPoint2d(GIScene.Utils.vector3ToVector2(nearestIntersection.point),smallestTileSize) : undefined;
		  
		  
		  
		  
		  analysisTiles.forEach(function(e,i,a){
								  		if(nearestIntersectionGridIndex && e.equals(nearestIntersectionGridIndex)){nearestIntersectionTileIndex = i+1}
								  		var tileFromCache = layer.cache.getTile(e);
								  		if(tileFromCache){
								  			cachedTiles.push(tileFromCache);
								  			cachedTilesIndex.push(i);
								  		} 
								  		else {
								  			uncachedTiles.push(e);
								  			uncachedTilesIndex.push(i);
								  		}
					}.bind(this)
		  );
		  console.log("nearestIntersectionTileIndex", nearestIntersectionTileIndex);
		  console.log(layer.name + ": cached / uncached tiles", cachedTiles.length, uncachedTiles.length);
		  
		  console.log(layer.name + ": Analyzing "+ cachedTiles.length +" CACHED tiles");
		  
		  var layerChecked=false;
		  for(var iiii=0,jjjj=cachedTiles.length; iiii<jjjj; iiii++){
		  	
		  	var tileFromCache = cachedTiles[iiii];
		  	
		  	layer.root.add(tileFromCache);
		  		
	  		//TODO may be wait for after render, so that everything is updated correctly?
	  		intersections = this.raycaster.intersectObject(layer.root, true);
	  		
	  		//TODO if no obstruction point needed then if intersections.length > 0 indicates visibility false and the whole process can be stopped here
	  		if(intersections.length > 0){
	  			var isNearestTile = updateNearestIntersection(nearestIntersection, intersections[0]);
	  		
	  			if(isNearestTile){nearestIntersectionTileIndex = cachedTilesIndex[iiii]; }
	  			console.log("nearestIntersectionTileIndex", nearestIntersectionTileIndex);
	  			controlArray[cachedTilesIndex[iiii]] = true;
	  		}
	  		else{
	  			controlArray[cachedTilesIndex[iiii]] = false;
	  		}
	  		
	  		layer.root.remove(tileFromCache);
	  		
	  		var firstIntersectionTile = getIndexOfFirstIntersectionTile(controlArray); // true, false or -1
	  		console.log(layer.name + ' :firstIntersectionTile', firstIntersectionTile, controlArray.length);
	  		if(firstIntersectionTile !== -1){
	  			numCheckedLayers++;
	  			console.log(layer.name +" : firstIntersection found! Layer checked by CACHED!");
				returnResults(layer, loading, computeTileIndicesHandler);
				
				layerChecked = true;
				break; //no more cached tile testing
			}
		  };
		  if(layerChecked){continue;} //when checked by cached no testing of uncached --> test next layer
		  // cachedTiles.forEach(
		  	// function(tileFromCache,i,a){
		  		// layer.root.add(tileFromCache);
// 		  		
		  		// //TODO may be wait for after render, so that everything is updated correctly?
		  		// intersections = this.raycaster.intersectObject(layer.root, true);
// 		  		
		  		// //TODO if no obstruction point needed then if intersections.length > 0 indicates visibility false and the whole process can be stopped here
		  		// if(intersections.length > 0){
		  			// var isNearestTile = updateNearestIntersection(nearestIntersection, intersections[0]);
// 		  		
		  			// if(isNearestTile){nearestIntersectionTileIndex = cachedTilesIndex[i]; }
// 		  			
		  			// controlArray[cachedTilesIndex[i]] = true;
		  		// }
		  		// else{
		  			// controlArray[cachedTilesIndex[i]] = false;
		  		// }
// 		  		
// 		  		
		  		// layer.root.remove(tileFromCache);
// 		  		
		  		// var firstIntersectionTile = getIndexOfFirstIntersectionTile(controlArray); // true, false or -1
		  		// if(firstIntersectionTile !== -1){
		  			// numCheckedLayers++;
		  			// console.log(layer.name +" : firstIntersection found! Layer checked by CACHED!");
					// returnResults(layer, loading);
// 					
				// }
		  	// }.bind(this)
		  // );
		  
		  
		  
		  //reduce uncachedTiles according to former found intersections
		  //2nd reduction if uncached are left but found intersection in cached
		  if(nearestIntersection){
		  	var deleteFromIndex = null;
		  	for(var iii=uncachedTilesIndex.length-1, jjj=0; iii>=jjj; iii--){
				if(uncachedTilesIndex[iii] >= nearestIntersectionTileIndex){
					deleteFromIndex = iii;
				}
			  };
			  
			 if(deleteFromIndex != null){
			 	console.log('controlArray:before', controlArray);
			 	var uncached_orig_length = uncachedTiles.length;
			 	uncachedTiles.splice(deleteFromIndex,Number.MAX_VALUE); //???
			 	
			 	for(var v = deleteFromIndex, vi = uncached_orig_length/*uncachedTiles.length*/; v < vi; v++){
			 		controlArray[uncachedTilesIndex[v]] = false;
			 	}
			 	
			 	uncachedTilesIndex.splice(deleteFromIndex,Number.MAX_VALUE); //???
			 	
			 	//TODO update uncachedTileIndex and CONTROLARRAY 
			 	console.log(layer.name + ": optimized number of uncached tiles: " + uncached_orig_length +"-->"+ uncachedTiles.length);
			 	console.log('controlArray:after', controlArray);
			 }
		  }
		  
		  //load unavailable tiles and check async
		  //check remaining uncached tiles
		  console.log(layer.name + ": Analyzing "+ uncachedTiles.length +" UNCACHED tiles");
		  for(var ii=0,jj=uncachedTiles.length; ii<jj; ii++){
					
			if (checkUncachedTile(ii, layer, loading, controlArray, uncachedTiles, uncachedTilesIndex,computeTileIndicesHandler, nearestIntersectionTileIndex) === false) { continue; }
			
			// var gridIndex = uncachedTiles[ii]; 
// 			
			// var requestUrl = layer.config.service.getGetSceneUrl(gridIndex, layer.grid);
// 			
			// var onSuccess = function(result) { //result is a THREE.Scene Object
// 				
				// console.log('LineOfSight:load uncached tiles:onSuccess',ii);
// 				
				// layer.root.add(result);
// 		  		
		  		// //TODO may be wait for after render, so that everything is updated correctly?
		  		// intersections = this.raycaster.intersectObject(layer.root, true);
// 		  		
		  		// //TODO if no obstruction point needed then if intersections.length > 0 indicates visibility false and the whole process can be stopped here
		  		// if(intersections.length > 0){
			  		// var isNearestTile = updateNearestIntersection(nearestIntersection, intersections[0]);
// 			  		
			  		// if(isNearestTile){nearestIntersectionTileIndex = uncachedTilesIndex[ii]; }
// 			  		
			  		// controlArray[uncachedTilesIndex[ii]] = true;
		  		// }
		  		// else{
		  			// controlArray[uncachedTilesIndex[ii]] = false;
		  		// }
		  		// layer.root.remove(result);
// 		  		
		  		// //add tile to cache to make use of having loaded it for after analysis visualization
		  		// layer.cache.add(gridIndex,result);
// 				
				// //TODO if there is no tile before left to be checked and an intersection was found here: continue the loop to the next layer
			// //TODO check if all tiles have been tested then execute returnResults()
			// var firstIntersectionTile = getIndexOfFirstIntersectionTile(controlArray);
			// if(firstIntersectionTile !== -1){
				// return returnResults();
			// }
// 			
// 			
			// }.bind(this);
			// var onError = function() {};//TODO Sceneloader will never throw it
// 			
			// var loader = new GIScene.ModelLoader(); //need a loader for every parallel request
			// loader.load(requestUrl, layer.format, onSuccess, null, onError);
			
		  };
		  
		  // //restore original state
		  // layer.computeTileIndicesHandler = computeTileIndicesHandler;
		  // computeTileIndicesHandler = null;
		  // layer.startUpdate(); start upating all gridLayers later when analysis is finished 
		  
		}; // gridLayer check end
		
		

		
		
		
	};
		
	this.execute_ = function() {
		
		var observerV3 		= this.data.inputs['GIScene:lineOfSight:observerPoint'];
		var observerOffset 	= this.data.inputs['GIScene:lineOfSight:observerOffset'];	
		var targetV3		= this.data.inputs['GIScene:lineOfSight:targetPoint'];
		var targetOffset	= this.data.inputs['GIScene:lineOfSight:targetOffset'];
		var obstacles		= this.data.inputs['GIScene:lineOfSight:obstacles'];	
		
		var start 		= observerV3.clone().add(new THREE.Vector3(0,observerOffset,0));
		var end			= targetV3.clone().add(new THREE.Vector3(0,targetOffset,0));
		var direction 	= end.clone().sub(start).normalize();
		
		this.raycaster.set(start, direction); //(origin, direction) direction must be normalized
		
		this.raycaster.far = start.distanceTo(end);//targetV3.clone().sub(observerV3).length();
		
		console.log("far", this.raycaster.far);
		
		var intersections = this.raycaster.intersectObjects(obstacles, true);
		
		console.log("intersections",intersections);
		
		var targetIsVisible = true;
		var visibilityLines;
		var group = new THREE.Object3D();
		
		if( intersections.length > 0 ) { 
			targetIsVisible = false; 
			
			//visLine
			var geomVis = new THREE.Geometry();
			geomVis.vertices = [start,intersections[0].point];
			var visLine = new THREE.Line(geomVis, lineMatVisible);
			//notVisLine
			var geomNotVis = new THREE.Geometry();
			geomNotVis.vertices = [intersections[0].point,end];
			var notvisLine = new THREE.Line(geomNotVis, lineMatNotVisible);
			
			group.add(visLine);
			group.add(notvisLine);
			}
		else {
			var geom = new THREE.Geometry();
			geom.vertices = [start,end];
			var visLine = new THREE.Line(geom, lineMatVisible);
			
			group.add(visLine);
		}
		
		this.data.outputs['GIScene:lineOfSight:lineOfSight'] = group;
		this.data.outputs['GIScene:lineOfSight:isVisible']	 = targetIsVisible;
		
		console.log(this._listeners);
		this.dispatchEvent({type:'execute', content : this.data});
		
		return this.data;
		
	};
};

//Inherit from GIScene.Layer
GIScene.Process.LineOfSight_fastClient.prototype = Object.create( GIScene.Process.prototype );