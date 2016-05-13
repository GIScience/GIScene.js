/**
 * The Pick-Control lets you pick an Object by clicking. 
 * As a result you get the an Object containing various information on the clicked point or event.content == false.
 * 
 * The click-Event content looks like this:
 * 
 * 		{
 *  		distance: 	{Number in Scene units},
 *  		object:		{A reference to the clicked object},
 *  		face:		{A reference to the clicked face},
 *  		faceIndex:	{Index Number of the geomerty.faces Array},
 *  		point:		{The intersection point on the clicked face as THREE.Vector3}
 * 		}
 * 
 * @namespace GIScene
 * @class Control.Pick
 * @constructor
 * @extends GIScene.Control
 * @param {THREE.Camera} camera
 * @param {Object} [config] Configuration properties. e.g. {color : new THREE.Color(0xff0000)}
 * 
 */

GIScene.Control.Pick = function(camera, config){
	//make this a control
	GIScene.Control.call(this);
	
	this.camera = camera;
	var defaults = {
		color: new THREE.Color( 0x00ff00 )
	};
	/**
	 * The config which is used to initialize the Control. Merged from defaults and passed config Object.
	 * 
	 * @property config
	 * @type Object
	 */
	this.config = GIScene.Utils.mergeObjects(defaults, config || {}); 
	
	this.domElement = null; //will be set on activate
	this.pickables = [];	//must be set after objects/layers have been loaded
	var mouse = new THREE.Vector3(0,0,1);
	// var projector = new THREE.Projector(); //-r76
	var raycaster = new THREE.Raycaster(); //+r76
	var pickSymbol = THREE.ImageUtils.loadTexture( GIScene.LIBRARYPATH + GIScene.RESOURCESPATH.replace(/([^\/])$/, "$1/") +"resources/images/particle_cross.png");
	var resultsLayerConfig = {
		"layerGroup" : "User-generated"
	};
	var resultsLayer = new GIScene.Layer("Picked Coordinate", resultsLayerConfig);
	var pickedPointGeom = new THREE.Geometry();
	pickedPointGeom.vertices[0]=new THREE.Vector3(0,0,0);
	var pickedPointMaterial = new THREE.PointsMaterial({ //new THREE.ParticleBasicMaterial({ //r76
												color:this.config.color,
												sizeAttenuation:false,
												size:32,
												map:pickSymbol,
												alphaTest:0.5	
											});
	// var pickedPoint = new THREE.ParticleSystem(pickedPointGeom, pickedPointMaterial); //-r76
	var pickedPoint = new THREE.Points(pickedPointGeom, pickedPointMaterial); //+r76
	pickedPoint.visible=false;
	resultsLayer.root.add(pickedPoint);
	
	var onMouseDown = function(event) {
		var viewPortCoords = GIScene.Utils.getViewportCoordsFromDOMEvent(this.domElement,event);
		mouse.set(viewPortCoords.x, viewPortCoords.y, 1);
	}.bind(this);
	
	var onMouseUp = function(event){
		//get mouse ScreenCoords
		var viewPortCoords = GIScene.Utils.getViewportCoordsFromDOMEvent(this.domElement,event);
		
		//only set if down and up coords are the same
		if(mouse.equals(new THREE.Vector3().set(viewPortCoords.x, viewPortCoords.y, 1)) ){
			mouse.set(viewPortCoords.x, viewPortCoords.y, 1);
			// var ray = projector.pickingRay(mouse, this.camera); //-r76
			raycaster.setFromCamera(mouse, this.camera.activeCam); //+r76
			var pickResults = raycaster.intersectObjects(this.pickables);
			// var pickResult = (pickResults.length > 0) ? pickResults[0] : false;
			var pickResult;
			for(var i=0; i < pickResults.length; i++){
				if(pickResults[i].object.geometry && pickResults[i].object.visible){
					pickResult = pickResults[i];
					break;
				};
			};
			if(pickResult){
				this.drawPickResult(pickResult);
			}	
			/**
			 * The click event contains a content property with an result object or false
			 * 
			 * @event click
			 */
			//pickResult has the following properties: distance, face, faceIndex, object, point
			this.dispatchEvent({type:'click', content:pickResult});
			
		}
	}.bind(this);
	
	/**
	 * Draws a cross symbol to where the user has picked.
	 * 
	 * @method drawPickResult
	 * @param  {Object} pickResult A Raycaster intersect object 
	 */
	this.drawPickResult = function(pickResult) {
		pickedPoint.visible=true;
		var pickedPointCoords = pickResult.point;
		//create Layer for Result
		
		//create point object
		
		pickedPointGeom.vertices[0] = pickedPointCoords;
		pickedPointGeom.verticesNeedUpdate = true;
	
	
		
		
	};
	
	/**
	 * Activates this Control
	 * 
	 * @method activate
	 *  
	 */
	this.activate = function(){
		if(!this.isActive){
			this.domElement = this.scene.canvas;
			resultsLayer.config.offset = this.scene.config.offset;
			this.scene.addLayer(resultsLayer);
			
			
			//eventListeners
			this.domElement.addEventListener('mousedown',onMouseDown, false);
			this.domElement.addEventListener('mouseup',onMouseUp, false);
			
			//call super class method
			GIScene.Control.prototype.activate.call(this);
		}
	};
	
	/**
	 * Deactivates this Control
	 * 
	 * @method deactivate
	 *  
	 */
	this.deactivate = function(){
		
		if(this.isActive){
			this.domElement.removeEventListener('mousedown',onMouseDown, false);
			this.domElement.removeEventListener('mouseup',onMouseUp, false);
			this.scene.removeLayer(resultsLayer);
			pickedPoint.visible=false;
			
			//call super class method
			GIScene.Control.prototype.deactivate.call(this);
		}
	};
	
};

//Inherit from GIScene.Control
GIScene.Control.Pick.prototype = Object.create( GIScene.Control.prototype );