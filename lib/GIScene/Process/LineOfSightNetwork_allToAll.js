/**
 * The Line of Sight Network (all to all) Process calculates the intervisibility between all points in the given dataset (point layer)
 * 
 * @namespace GIScene
 * @class Process.LineOfSightNetwork_allToAll
 * @constructor
 * @extends GIScene.Process 
 * 
 * @author mcauer https://github.com/mcauer
 */
GIScene.Process.LineOfSightNetwork_allToAll = function() {
	
	var config = {
		identifier		: "GIScene:lineOfSight:network:allToall",
		title			: "Line of Sight Network (all to all)",
		abstract		: "Given an input set of point locations with each of them providing an attribute for an observer offset and a target offset, this process will compute the intervisibility between the two locations by computing two lines of sights between each pair of points. Always from the observer offset of one point to the target offset of the other.",
		metadata		: null,
		processVersion	: "1.0",
		description		: {inputs:[
								{
									identifier: 'GIScene:lineOfSight:network:intervisibilityPoints',
									title:    	'Intervisibility Points (layer)', 
									abstract: 	'Layer with points, which will be checked for intervisibility.', 
									dataType:   'GIScene.Layer', //.Points 
									minOccurs: 1,
									maxOccurs: 1,
								},
								{
									identifier: 'GIScene:lineOfSight:network:observerOffsetAttribute',
									title:	'Observer Offset Attribute',
									abstract:	'Attribute with additional height offsets to observer points.',
									dataType:	'String',
									minOccurs: 0,
									maxOccurs: 1,
									defaultValue:""
								},
								{	identifier: 'GIScene:lineOfSight:network:targetOffsetAttribute',
									title:    'Tartget Offset Attribute', 
									abstract: 'Attribute with additional height offsets to target points.', 
									dataType:   'String', 
									minOccurs: 0,
									maxOccurs: 1,
									defaultValue:""
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
									identifier: 'GIScene:lineOfSight:network:intervisibilityNetwork',
									title:		'Intervisibility Network',
									abstract:	'A set of calculated Line of Sights between observer and target points.',
									dataType:	'THREE.Object3D' //???
								},
								{
									identifier: 'GIScene:lineOfSight:network:numberOfVisibleTargets',
									title:		'Number of visible targets',
									abstract:	'The number of visible targets or unobstructed individual line of sights.',
									dataType:	'Number' 
								},
								{
									identifier: 'GIScene:lineOfSight:network:numberOfObstructedTargets',
									title:		'Number of obstructed targets',
									abstract:	'The number of not visible targets or obstructed individual line of sights.',
									dataType:	'Number' 
								},
								{
									identifier: 'GIScene:lineOfSight:network:numberOfIntervisiblePairs',
									title:		'Number of intervisible pairs',
									abstract:	'The number of intervisible pairs of input points.',
									dataType:	'Number'
								},
								{
									identifier: 'GIScene:lineOfSight:network:intervisibilityLines',
									title:		'Intervisibility Lines',
									abstract:	'FeatureCollection (LineStrings) representing the relations between the tested pairs of points, indicated by their intervisibility attributes.',
									dataType:	'GeoJSON'
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

	

	
	/**
	 * run the process with the inputs that have been set before
	 * To get notified when the process is finished add an event listener on the execute event. The event will provide a content propery with a data object with all input and output values of the process 
	 * 
	 * @method execute
	 * @param {Function} [onExecute] callback when process is finished
	 * 
	 * @example
	 * 		var doSomething = function(event){
	 * 			var outputs = event.content.outputs;
	 * 			//do something with the results
	 * 		}
	 * 		process.addEventListener('execute', doSomething);
	 * 		process.execute();
	 */
	
	this.execute = function(onExecute) {
		
			onExecute 			= onExecute || function(){};
		var inPointsLayer		= this.data.inputs['GIScene:lineOfSight:network:intervisibilityPoints'];
		var observerOffsetAttr 	= this.data.inputs['GIScene:lineOfSight:network:observerOffsetAttribute'];
		var targetOffsetAttr 	= this.data.inputs['GIScene:lineOfSight:network:targetOffsetAttribute'];
		var obstacleLayers		= this.data.inputs['GIScene:lineOfSight:obstacleLayers'];
		
		var numFinishedProcesses = 0;
		
		
		var points = []; // short graphic coords
		var observerOffsets = [];
		var targetOffsets = [];
		
		//get points from layer
		inPointsLayer.root.traverse(function(object){
			if(object.geometry){
				var vertex = object.geometry.vertices[0];
				var vertexWorld = object.localToWorld(vertex.clone()); //short graphic coords
				if(inPointsLayer.scene){
					var coordC3 = new GIScene.Coordinate3().fromVector3(vertexWorld).add(inPointsLayer.scene.config.offset); //long geo coords
					points.push(coordC3);
				}
				else {
					console.error("LineOfSightNetwork_allToAll: Layer: " + inPointsLayer.name + " must be added to scene before analysing.");
					return;
					}
				
				observerOffsets.push(object.userData.gisceneAttributes[observerOffsetAttr] || 0);
				targetOffsets.push(object.userData.gisceneAttributes[targetOffsetAttr] || 0);
			}
		}.bind(this));
		
		var numOfProcesses = (points.length-1)*(points.length/2); //number of intervisibility processes to wait for;
		var processQueue = new Array(numOfProcesses);
		
		var group = new THREE.Object3D();
		group.name = "Intervisibility Network";
		group.userData.gisceneAttributes = {};
		
		var numVisTargets = 0;
		var numUnvisTargets = 0;
		var numOfIntervisiblePairs = 0;
		var geoJSONFeatures = [];
		
		//finalize
		var finalize = function() {
			//add stats
			group.userData.gisceneAttributes["numVisTargets"] = numVisTargets;
			group.userData.gisceneAttributes["numUnvisTargets"] = numUnvisTargets;
			group.userData.gisceneAttributes["numIntervisiblePairs"] = numOfIntervisiblePairs;
			
			this.data.outputs['GIScene:lineOfSight:network:intervisibilityNetwork'] = group;
			this.data.outputs['GIScene:lineOfSight:network:numberOfVisibleTargets'] = numVisTargets;
			this.data.outputs['GIScene:lineOfSight:network:numberOfObstructedTargets'] = numUnvisTargets;
			this.data.outputs['GIScene:lineOfSight:network:numberOfIntervisiblePairs'] = numOfIntervisiblePairs;
			
			var geoJSON = {
				"type" : "FeatureCollection",
				"features" : geoJSONFeatures
			};
			if(inPointsLayer.scene.config.projection){
				geoJSON["crs"] = {
									"type": "name",
									"properties": {
									"name": inPointsLayer.scene.config.projection
									}
							};
			}
			this.data.outputs['GIScene:lineOfSight:network:intervisibilityLines'] = JSON.stringify(geoJSON);
			
			/**
			 *@event execute event has a content property referring to the processes data object with inputs and outputs 
			 */	 
			this.dispatchEvent({type:'execute', content:this.data});
			
			onExecute(this.data);
			
		}.bind(this);
		
		//collect async process results
		
		var onExecuteIntervisProcess = function(data) {
			numFinishedProcesses++;
			console.log("onExecuteIntervis",numFinishedProcesses,"of",numOfProcesses);
			console.log(data);
			var intervisLines = data.outputs['GIScene:intervisibility:intervisibilityLines'];
			group.add(intervisLines);
			
			
			var intervis = data.outputs['GIScene:intervisibility:intervisibility'];
			numVisTargets += parseInt(intervis) % 9;
			numUnvisTargets += 2 - parseInt(intervis) % 9;
			numOfIntervisiblePairs += (parseInt(intervis) % 9 == 2)? 1 : 0;
			
			var geoJSONFeature = JSON.parse(data.outputs['GIScene:intervisibility:intervisibilityLine']);
			delete geoJSONFeature.crs;
			geoJSONFeatures.push(geoJSONFeature);
			
			this.dispatchEvent({type:"progress", content:{total:numOfProcesses, finished:numFinishedProcesses}});
			
			if(numFinishedProcesses == numOfProcesses){
				finalize();
			}else{
				//start next process in queue
				processQueue[numFinishedProcesses].execute(onExecuteIntervisProcess);
			}
		}.bind(this);
		
		//start analysing 
		var queueCounter = 0;
		for(var start=0, l=points.length; start<l-1; start++){
  
		  for(var end=start+1;end < l;end++){
		      
		      var intervisProcess = new GIScene.Process.Intervisibility(inPointsLayer.scene);
		      
		      //setInputs
		      var inputs = {
		      	'GIScene:intervisibility:points'			: [points[start], points[end]],
				'GIScene:intervisibility:observerOffsets'	: [observerOffsets[start], observerOffsets[end]],
				'GIScene:intervisibility:targetOffsets'		: [targetOffsets[start], targetOffsets[end]],
				'GIScene:intervisibility:obstacleLayers'	: obstacleLayers
		      };
		      intervisProcess.setInputs(inputs);
		      
		      //execute has to be quesed one after another
		      //intervisProcess.execute(onExecuteIntervisProcess);
		      processQueue[queueCounter++] = intervisProcess;
		      
		  }
		}
		
		//start working down the queue
		//start first process in queue
		processQueue[0].execute(onExecuteIntervisProcess);
		
	};
};

//Inherit from GIScene.Layer
GIScene.Process.LineOfSightNetwork_allToAll.prototype = Object.create( GIScene.Process.prototype );