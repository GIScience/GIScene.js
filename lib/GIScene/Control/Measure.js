/**
 * The Measure-Control lets you pick two points of an Object by clicking. 
 * As a result you get the an Object containing the measured distance in scene units.
 * 
 * The measure-Event content looks like this:
 * 
 * 		{
 * 			distance: 			{Number in Scene units},
 * 			angleToNorth : 		{Number angle in degrees}
 * 		}
 * 
 * @namespace GIScene
 * @class Control.Measure
 * @constructor
 * @extends GIScene.Control
 * @param {THREE.Camera} camera
 * @param {Object} [config] Configuration properties. e.g. {color : new THREE.Color(0xff0000)}
 * 
 */

GIScene.Control.Measure = function(camera, config){
	//make this a control
	GIScene.Control.call(this);
	
	this.camera = camera;
	var defaults = {
		color: new THREE.Color( 0xff0000 )
	};
	/**
	 * The config which is used to initialize the Control. Merged from defaults and passed config Object.
	 * 
	 * @property config
	 * @type Object
	 */
	this.config = GIScene.Utils.mergeObjects(defaults, config || {}); 
	
	this.domElement = null; //will be set on activate
	this.measureables = [];	//must be set after objects/layers have been loaded
	var mouse = new THREE.Vector3(0,0,1);
	// var projector = new THREE.Projector(); //-r76
	var raycaster = new THREE.Raycaster(); //+r76
	var textureLoader = new THREE.TextureLoader(); //+r76
	var pickSymbol = null; 
	var resultsLayer = null;
	var pickedPointMaterial = null;
	var measureLineMaterial = null;
	
	
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
			var activeCam = (this.camera instanceof THREE.CombinedCamera)? this.camera.activeCam : this.camera;
			raycaster.setFromCamera(mouse, activeCam); //+r76
			var pickResults = raycaster.intersectObjects(this.measureables); //+r76
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
		}
	}.bind(this);
	
	/**
	 * Draws a cross symbol to where the user has picked and a connection line.
	 * 
	 * @method drawPickResult
	 * @param  {Object} pickResult A Raycaster intersect object 
	 */
	this.drawPickResult = function(pickResult) {
		
		if(resultsLayer.root.children.length<2){
			var pickedPointCoords = pickResult.point;
			//create point object
			pickedPointGeom = new THREE.Geometry();
			pickedPointGeom.vertices.push(pickedPointCoords);
		}
		
		if(resultsLayer.root.children.length==1){
			// set second point 
			// var pickedPoint = new THREE.ParticleSystem(pickedPointGeom.clone(), pickedPointMaterial); //-r76
			var pickedPoint = new THREE.Points(pickedPointGeom.clone(), pickedPointMaterial); //+r76
			resultsLayer.root.add(pickedPoint);
			
			//set measure Line
			var measureLineGeom = new THREE.Geometry();
			var measurePoint1 = resultsLayer.root.children[0].geometry.vertices[0];
			var measurePoint2 = resultsLayer.root.children[1].geometry.vertices[0];
			
			measureLineGeom.vertices.push(measurePoint1);
			measureLineGeom.vertices.push(measurePoint2);
			
			var measureLine = new THREE.Line(measureLineGeom, measureLineMaterial);
			resultsLayer.root.add(measureLine);
			
			// //draw in foreground
			// var measureLineHidden = new THREE.Line(measureLineGeom.clone(), measureLineHiddenMaterial);
			// foregroundScene.add(measureLineHidden);
			// this.scene.renderer.autoClear = false;
			// this.scene.addEventListener('beforeRender', onBeforeRender);
			// this.scene.addEventListener('afterRender', onAfterRender);
			
			//calc angle to v3 0,0,-1
			var north = new THREE.Vector3(0,0,-1);
			var mp2_2d = measurePoint2.clone().setY(0);
			var mp1_2d = measurePoint1.clone().setY(0);
			var measureDirection = mp2_2d.sub(mp1_2d);
			var isEastSide = (measureDirection.x >= 0)?true:false;
			var angle = north.angleTo(measureDirection);
			if(!isEastSide)angle = Math.PI*2 - angle;
			var angleDeg = THREE.Math.radToDeg(angle);
			
			var measureResult = {
				distance : measurePoint1.distanceTo(measurePoint2),
				angleToNorth : angleDeg
			};
			
			/**
			 * The measure event contains a content property with an result object
			 * 
			 * @event measure
			 */
			//pickResult has the following properties: distance, face, faceIndex, object, point
			this.dispatchEvent({type:'measure', content:measureResult});
		}
		
		if(resultsLayer.root.children.length==0){
			// set first point
			// var pickedPoint = new THREE.ParticleSystem(pickedPointGeom.clone(), pickedPointMaterial); //-r76
			var pickedPoint = new THREE.Points(pickedPointGeom.clone(), pickedPointMaterial); //+r76
			resultsLayer.root.add(pickedPoint);
		}
		
	};
	
	/**
	 * Activates this Control
	 * 
	 * @method activate
	 *  
	 */
	this.activate = function(){
		if(this.isActive) return;
		
		this.domElement = this.scene.canvas;
		resulstLayerConfig = {
			offset : this.scene.config.offset,
			layerGroup : "User-generated"
		};
		resultsLayer = new GIScene.Layer("Measurements", resulstLayerConfig);
		this.scene.addLayer(resultsLayer);
		//pickSymbol = THREE.ImageUtils.loadTexture( GIScene.LIBRARYPATH + GIScene.RESOURCESPATH.replace(/([^\/])$/, "$1/") +"resources/images/particle_cross.png"); //-r76
		var url = GIScene.LIBRARYPATH + GIScene.RESOURCESPATH.replace(/([^\/])$/, "$1/") +"resources/images/particle_cross.png";
		pickSymbol = textureLoader.load(url); 
			
  		pickedPointMaterial = new THREE.PointsMaterial({  
										color:this.config.color,
										sizeAttenuation:false,
										size:32,
										map:pickSymbol,
										alphaTest:0.5	
									});
		
		
		// pickedPointMaterial = new THREE.PointsMaterial({  //new THREE.ParticleBasicMaterial({ //r76
												// color:this.config.color,
												// sizeAttenuation:false,
												// size:32,
												// map:pickSymbol,
												// alphaTest:0.5	
											// });
		measureLineMaterial = new THREE.LineBasicMaterial({
												color: this.config.color,
												linewidth:1
											});
		// measureLineHiddenMaterial = new THREE.LineBasicMaterial({
												// color: new THREE.Color(0xff0000),
												// linewidth:1
											// });
											
		
		//eventListeners
		this.domElement.addEventListener('mousedown',onMouseDown, false);
		this.domElement.addEventListener('mouseup',onMouseUp, false);
		
		//call super class method
		GIScene.Control.prototype.activate.call(this);
	};
	
	/**
	 * Deactivates this Control
	 * 
	 * @method deactivate
	 *  
	 */
	this.deactivate = function(){
		if(!this.isActive) return;
		
		this.domElement.removeEventListener('mousedown',onMouseDown, false);
		this.domElement.removeEventListener('mouseup',onMouseUp, false);
		this.scene.disposeLayer(resultsLayer);
		
		//call super class method
		GIScene.Control.prototype.deactivate.call(this);
	};
	
};

//Inherit from GIScene.Control
GIScene.Control.Measure.prototype = Object.create( GIScene.Control.prototype );