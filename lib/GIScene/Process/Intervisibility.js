/**
 * The Intervisibility Process calculates the intervisibility between two points in the scene. 
 * It takes different observer offset and target offset heights into account.
 * 
 * @namespace GIScene
 * @class Process.Intervisibility
 * @constructor
 * @extends GIScene.Process 
 * 
 * @author mcauer https://github.com/mcauer
 */
GIScene.Process.Intervisibility = function(scene) {
	
	var config = {
		identifier		: "GIScene:intervisibility",
		title			: "Intervisibility",
		abstract		: "Given two loactions, observer and target offsets and possible obstacle objects this process will compute the intervisibility between each observer and target of the two loactions and provides graphical 3D lines.",
		metadata		: null,
		processVersion	: "1.0",
		description		: {inputs:[
								{
									identifier: 'GIScene:intervisibility:points',
									title:    'Intervisibility Points', 
									abstract: 'Two points between the intervisibility will be calculated. Each point should provide attributes about observer and target offset.', 
									dataType: 'Array of GIScene.Coordinate3',  //'Array of THREE.Vector3', //???
									minOccurs: 1,
									maxOccurs: 1,
								},
								{
									identifier: 'GIScene:intervisibility:observerOffsets',
									title:	'Observer Offsets',
									abstract:	'Additional height offsets to the observer points.',
									dataType:	'Array of Number',
									minOccurs: 0,
									maxOccurs: 1,
									defaultValue:[]
								},
								{
									identifier: 'GIScene:intervisibility:targetOffsets',
									title:	'Target Offsets',
									abstract:	'Additional height offsets to the target points.',
									dataType:	'Array of Number',
									minOccurs: 0,
									maxOccurs: 1,
									defaultValue:[]
								},
								{
									identifier: 'GIScene:intervisibility:obstacleLayers',
									title:    'Obstacle Layers',
									abstract: 'Layers with possible obstacles to be reflected in the calculation.',
									dataType  : 'Array(GIScene.Layer)',
									minOccurs: 1,
									maxOccurs: 1 
								}
							],
							outputs:[
								// {
									// identifier: 'GIScene:intervisibility:intervisibilityPoints',
									// title:	'Intervisibility Points',
									// abstract:	'The points used in the calculation (ground?, observer, target). The target point will have a visibility attribute "isVisible" with 0: not visible 1:visible',
									// dataType:	'THREE.Object3D' //???
// 									
								// },
								{
									identifier: 'GIScene:intervisibility:intervisibilityLines',
									title:	'Intervisibility Lines',
									abstract:	'The calculated Lines of Sight between observers and targets.',
									dataType:	'THREE.Object3D' //???
									
								},
								{
									identifier: 'GIScene:intervisibility:intervisibility',
									title:	'Intervisibility',
									abstract:	'The result of the intervisibility calculation.'
												+'<ul>'
												+'<li>"00": Both observer can NOT see their targets.</li>'
												+'<li>"01": The target of the second point is visible to the observer of the first one.</li>'
												+'<li>"10": The target of the first point is visible to the observer of the second one.</li>'
												+'<li>"11": Both observer can see their targets. They are intervisible.</li>'
												+'</ul>'
												,
									dataType:	'String'
								},{
									identifier: 'GIScene:intervisibility:intervisibilityLine',
									title:		'Intervisibility Line',
									abstract:	'One feature (LineString) representing the relation between the two tested points, indicated by it\'s intervisibility attribute',
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

	
	var lineMatVisible = new THREE.LineBasicMaterial({color: new THREE.Color(0x00ff00)});
	var lineMatNotVisible = new THREE.LineBasicMaterial({color: new THREE.Color(0xff0000)});
	
		
	this.execute = function(onExecute) {
		
		var intervisibilityPointsC3	= this.data.inputs['GIScene:intervisibility:points']; // Array of long geo coords
		var observerOffsets 		= this.data.inputs['GIScene:intervisibility:observerOffsets'];
		var targetOffsets 			= this.data.inputs['GIScene:intervisibility:targetOffsets'];
		var obstacleLayers				= this.data.inputs['GIScene:intervisibility:obstacleLayers'];
		    onExecute = onExecute || function(){};
		var numFinishedProcesses = 0;
		var isTwoLineProcess = ( observerOffsets.length > 0 || targetOffsets.length > 0 );
		
		var intervisibilityPointsV3 = [intervisibilityPointsC3[0].toVector3(), intervisibilityPointsC3[1].toVector3()]; //long graphic coords
		
		var createLine = function(start, end, isVisible) {
			var mat = (isVisible)? lineMatVisible : lineMatNotVisible ;
			var geom = new THREE.Geometry();
			geom.vertices = [start,end];
			var visLine = new THREE.Line(geom, mat);
			var attributes = {"isVisible": isVisible};
			visLine.userData.gisceneAttributes = attributes;
			visLine.name = "Line of Sight";
			return visLine;
		};
		
		var finalize = function() {			
			
			var group = new THREE.Object3D();
			group.userData.gisceneAttributes = {};
			group.name = "Intervisibility";
					
			//toLine
			var toIsVisible = toProcess.getOutput('GIScene:lineOfSight:isVisible');
			var toStart = intervisibilityPointsV3[0].clone().add(new THREE.Vector3(0, observerOffsets[0] || 0,0));
			var toEnd	= intervisibilityPointsV3[1].clone().add(new THREE.Vector3(0,   targetOffsets[1] || 0,0));
			var toLine  = createLine(toStart, toEnd, toIsVisible);
			group.add(toLine);
			
			//fromLine
			if(isTwoLineProcess){
				var fromIsVisible = fromProcess.getOutput('GIScene:lineOfSight:isVisible');
				var fromStart = intervisibilityPointsV3[1].clone().add(new THREE.Vector3(0, observerOffsets[1] || 0,0));
				var fromEnd	  = intervisibilityPointsV3[0].clone().add(new THREE.Vector3(0,   targetOffsets[0] || 0,0));
				var fromLine  = createLine(fromStart, fromEnd, fromIsVisible);
				group.add(fromLine);
			}
			
			var intervisibility = (isTwoLineProcess)? (Number(fromIsVisible)+ "" + Number(toIsVisible)) : (Number(toIsVisible)+ "" + Number(toIsVisible));
			group.userData.gisceneAttributes["intervisibility"] = intervisibility;
			
			this.data.outputs['GIScene:intervisibility:intervisibilityLines'] = group;
			
			// "00", "01", "10", "11"						
			this.data.outputs['GIScene:intervisibility:intervisibility'] = intervisibility;
			
			//GeoJSON Feature
			var geoJSON = {
				"type": "Feature",
		        "geometry": {"type": "LineString", "coordinates": [intervisibilityPointsC3[0].toArray(), intervisibilityPointsC3[1].toArray()]},
		        "properties": {
		        				"intervisibility": intervisibility
		        			  }
			};
			if(scene.config.projection){
				geoJSON["crs"] = {
									"type": "name",
									"properties": {
									"name": scene.config.projection
									}
							};
			}
			this.data.outputs['GIScene:intervisibility:intervisibilityLine'] = JSON.stringify(geoJSON);
			
			/**
			 *@event execute event has a content property referring to the processes data object with inputs and outputs 
			 */
			 
			this.dispatchEvent({type:'execute', content:this.data});
			
			onExecute(this.data);
			
		}.bind(this);
		
		//start processing
		
		var toProcess = new GIScene.Process.LineOfSight_simpleClient();
		
		toProcess.setInput('GIScene:lineOfSight:observerPoint', intervisibilityPointsC3[0]);
		if( !!observerOffsets[0] ){toProcess.setInput('GIScene:lineOfSight:observerOffset', observerOffsets[0]);}
		toProcess.setInput('GIScene:lineOfSight:targetPoint', intervisibilityPointsC3[1]);
		if( !!targetOffsets[1] ){toProcess.setInput('GIScene:lineOfSight:targetOffset', targetOffsets[1]);}
		toProcess.setInput('GIScene:lineOfSight:obstacleLayers', obstacleLayers);
		
		
			
		
		if(isTwoLineProcess){
			//two lines of sight
			var fromProcess = new GIScene.Process.LineOfSight_simpleClient();
			
			fromProcess.setInput('GIScene:lineOfSight:observerPoint', intervisibilityPointsC3[1]);
			if( !!observerOffsets[1] ){fromProcess.setInput('GIScene:lineOfSight:observerOffset', observerOffsets[1]);}
			fromProcess.setInput('GIScene:lineOfSight:targetPoint', intervisibilityPointsC3[0]);
			if( !!targetOffsets[0] ){fromProcess.setInput('GIScene:lineOfSight:targetOffset', targetOffsets[0]);}
			fromProcess.setInput('GIScene:lineOfSight:obstacleLayers', obstacleLayers);
			
			
			
		}
		
		//start first process
		var onExecuteToProcess =  function(data) {
			
			// numFinishedProcesses++;
			
			if(!isTwoLineProcess /*|| numFinishedProcesses == 2*/){
				finalize();
			}else{
				//start second process
				var onExecuteFromProcess = function(data) {
				
				//numFinishedProcesses++;
				
				//if(numFinishedProcesses == 2){
					finalize();
				//}
				}.bind(this);
				
				fromProcess.execute(onExecuteFromProcess);
			}
			
		}.bind(this);
		
		toProcess.execute(onExecuteToProcess);
		
	};
};

//Inherit from GIScene.Layer
GIScene.Process.Intervisibility.prototype = Object.create( GIScene.Process.prototype );