/**
 * The Line of Sight Process calculates the visibility between two points in the scene. 
 * Obstacles can be specified as layers.
 * Inputs can be specified as layers.
 * 
 * @namespace GIScene
 * @class Process.LineOfSight_Layer
 * @constructor
 * @extends GIScene.Process 
 */
GIScene.Process.LineOfSight_Layer = function() {
	
	var config = {
		identifier		: "GIScene:lineOfSight:layer",
		title			: "Line of Sight - Layer input",
		abstract		: "Given two loactions and possible obstacle layers, this process will compute the visibility between the two loactions and provides a graphical 3D line.",
		metadata		: null,
		processVersion	: "1.0",
		description		: {inputs:[
			//TODO chang inputs to layer mode
								{
									identifier: 'GIScene:lineOfSight:observerPoint',
									title:    'Observer Point', 
									abstract: 'Point of Observer, where the line of sight starts.', 
									dataType:   'THREE.Vector3', //???
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
									identifier: 'GIScene:lineOfSight:obstacles',
									title:    'Obstacles',
									abstract: 'Possible obstacles to be reflected in the calculation.',
									dataType  : 'Array(THREE.Mesh)',
									minOccurs: 1,
									maxOccurs: 1 //????
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
	
		
	this.execute = function() {
		
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
GIScene.Process.LineOfSight_Layer.prototype = Object.create( GIScene.Process.prototype );