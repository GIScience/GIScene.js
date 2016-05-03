/**
 * A control which adds a sprite to the viewport for interactive movement of a directional light source.
 * The Light will always stay relative to the camera. This ensures to keep a chosen lighting angle while moving the camera.
 * Changing interactively the lighting angle gives the user a good impression of surface characteristics.
 * 
 * @namespace GIScene
 * @class Control.CameraLight
 * @constructor
 * @extends GIScene.Control
 * @param {THREE.Camera} camera
 * @param {THREE.DirectionalLight} light 
 * @param {Object} [config] config.<properties> are: maxHorizontalAngle, maxVerticalAngle both Numbers in degrees between 0..90
 * 
 */

GIScene.Control.CameraLight = function (camera, light, config){
	
	//make this a control
	GIScene.Control.call(this);
	
	var defaults = {
		maxHorizontalAngle	: 65,
		maxVerticalAngle	: 65
	};
	
	/**
	 * The config which is used to initialize the CameraLight-Control. Merged from defaults and passed config Object.
	 * 
	 * @property config
	 * @type Object
	 */
	this.config = GIScene.Utils.mergeObjects(defaults, config || {});
	this.camera = camera;
	this.light = light || new THREE.DirectionalLight(0xffffff, 0.5);
	this.pivotLight = new THREE.Object3D();
	this.domElement = null; //will be set in this.activate()
	var degrees = new THREE.Vector2(0,0); //illumination angles
	
	this.maxHorizontalAngle	= this.config.maxHorizontalAngle; 
	this.maxVerticalAngle	= this.config.maxVerticalAngle;
	
	
	var STATE = { NONE : -1, PAN: 1 }; 
	var state = STATE.NONE;
	var isMouseover = false;
	
	
	//var spriteTexture = THREE.ImageUtils.loadTexture( GIScene.LIBRARYPATH + GIScene.RESOURCESPATH.replace(/([^\/])$/, "$1/") +"resources/images/sprite1.png" );
	// spriteTexture.flipY=false;
	var imgDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QTg5OEJENDc1ODUyMTFFMEExNjhDMjM3RjM1NjdBMkYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QTg5OEJENDg1ODUyMTFFMEExNjhDMjM3RjM1NjdBMkYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpBODk4QkQ0NTU4NTIxMUUwQTE2OEMyMzdGMzU2N0EyRiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpBODk4QkQ0NjU4NTIxMUUwQTE2OEMyMzdGMzU2N0EyRiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PpQl4IgAABkpSURBVHja7F0JbFzH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";


	var spriteTexture = new THREE.Texture(null);
	var spriteImg = new Image();
		spriteImg.onload = function() {
			spriteTexture.image = spriteImg;
			spriteTexture.needsUpdate = true;
		};
		spriteImg.src = imgDataURL;
	
	var spriteMaterial = new THREE.SpriteMaterial({ map : spriteTexture, opacity:0.7  });
	this.sprite = new THREE.Sprite(spriteMaterial);
	this.sprite.scale.set( 50, 50, 1 );
	
	
	var panStart, panEnd, panDelta;
	
	/**
	 * Moves the UI graphic sprite and changes the light position accordingly
	 * 
	 * @method panSprite
	 * @param {THREE.Vector2()} panDelta A Vector used to translate the UI-graphic in Pixels  
	 */
	this.panSprite = function (panDelta) {
		
		var p = this.sprite.position;
		//pan sprite
		p.set(p.x+panDelta.x, p.y-panDelta.y, p.z);
		//move light		
		this.updateLightPosition();
		
	};
	
	/**
	 * Updates the light position to the correct angle according to sprite.position
	 * 
	 * @method updateLightPosition 
	 */
	this.updateLightPosition = function(){
		
		var normalizedDeviceCoordinate = this.sprite.position.clone();
		normalizedDeviceCoordinate.x /= this.scene.canvas.width/2;
		normalizedDeviceCoordinate.y /= this.scene.canvas.height/2;
		
		degrees = normalizedDeviceCoordinate.clone().set(normalizedDeviceCoordinate.x * this.maxHorizontalAngle, normalizedDeviceCoordinate.y * -this.maxVerticalAngle);
		this.pivotLight.rotation.set(THREE.Math.degToRad(degrees.y),THREE.Math.degToRad(degrees.x),0);
		
	};
	
	/**
	 * Returns the position of the light in polar angles relative to the light.target and the camera.position
	 * 
	 * @method getIlluminationAngles
	 * @return {Object} illuminationAngles an object with two properties: "theta" and "phi" containing the actual values in degrees
	 */
	this.getIlluminationAngles = function(){
		var illumAngles = {
			'theta' : degrees.x,
			'phi'	: degrees.y
		};
		return illumAngles;
	};
	
	// this.update = function () {
		// //currently not in use
	// };
	
	var onMouseDown = function(event){
		
		if(isMouseover){
			/**
			 * Fires on mouse down but before mouse moved
			 * 
			 * @event panstart 
			 */
			this.dispatchEvent( {type:'panstart'} );
			state = STATE.PAN;
			var relativeScreenCoords = GIScene.Utils.getRelativeScreenCoordsFromDOMEvent(this.domElement, event);
			panStart = relativeScreenCoords;
			
			this.domElement.addEventListener( 'mouseup', onMouseUp, false );
		}
	}.bind(this);
	
	var onMouseMove = function(event){
		
		var viewportCoords = GIScene.Utils.getViewportCoordsFromDOMEvent(this.domElement, event);
		viewportCoords.x *= this.scene.canvas.width/2;
		viewportCoords.y *= this.scene.canvas.height/2;
		
		var distance = viewportCoords.distanceTo(this.sprite.position);
		
		if (distance <= Math.max(this.sprite.scale.x, this.sprite.scale.y)/2){
			if(isMouseover == false){
				//over
				this.sprite.material.opacity = 1;
			}
			
			isMouseover = true;
			
		} else {
			if(isMouseover == true){
				//out
				this.sprite.material.opacity = 0.7;
			}
			isMouseover = false;
		}
		if (state == STATE.PAN){
			
			panEnd = GIScene.Utils.getRelativeScreenCoordsFromDOMEvent(this.domElement, event);
			panDelta = panEnd.clone().sub(panStart);
			this.panSprite(panDelta);
			panStart = panEnd;
			
			/**
			 * Fires while panning
			 * 
			 * @event pan
			 */
			this.dispatchEvent( {type:'pan'} );
		}
	}.bind(this);
	
	var onMouseUp = function(event){
		
		if(state == STATE.PAN){
			/**
			 * Fires on mouse up after a pan operation
			 * 
			 * @event panend 
			 */
			
			this.dispatchEvent( {type:'panend'} );
		}
		
		state = STATE.NONE;
		
		this.domElement.removeEventListener( 'mouseup', onMouseUp, false );
	}.bind(this);
	
	
	var onCameraChange = function(event){
		
		// var camTargetWorld = this.camera.localToWorld(this.camera.target.position.clone());
		// this.light.target.position = camTargetWorld;
		// this.light.position.setZ(this.camera.target.position.z);
		
		// this.light.position.setZ(this.camera.position.distanceTo(camTargetWorld));	
		// if(state != STATE.PAN)return; //@TODO Käs
		// this.light.target.position = camTargetWorld;
		
	}.bind(this);
	
	/**
	 * Activates this Control
	 * 
	 * @method activate
	 *  
	 */
	this.activate = function(){
		if(this.isActive) return;
		
		//var camTargetWorld = this.camera.target.parent.localToWorld(this.camera.target.position.clone());
		//var camTargetWorld = new THREE.Vector3().getPositionFromMatrix(this.camera.target.matrixWorld); //-r76
		var camTargetWorld = new THREE.Vector3().setFromMatrixPosition(this.camera.target.matrixWorld);//+r76
		
		//reset pivot
		this.pivotLight.rotation.set(0,0,0);
		//pivot Light should be identical with camera target position. simply add it as child;
		this.camera.target.add(this.pivotLight);
		
		this.light.position.set(0,0,this.camera.position.distanceTo(camTargetWorld));
		this.pivotLight.add(this.light);
		
		//dont update light.target manually
		//this.light.target.position.copy(camTargetWorld); //= camTargetWorld.clone(); // this only works for OrbitZoomPan: this.scene.center;
		//instead add to cam target
		this.light.target.position.set(0,0,0);
		this.camera.target.add( this.light.target );
		
		this.domElement = this.scene.canvas;
		// var initialSpritePosition = GIScene.Utils.transformViewportCoordsToRelativeScreenCoords(new THREE.Vector2(0,0),this.domElement.offsetWidth, this.domElement.offsetHeight);
		// this.sprite.position.set(initialSpritePosition.x,initialSpritePosition.y,0);
		this.sprite.position.set(0,0,0);		this.scene.spriteRoot.add(this.sprite);
		
		//events
		this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
		this.domElement.addEventListener( 'mousemove', onMouseMove, false );
		this.domElement.addEventListener( 'mousedown', onMouseDown, false );
		
		//this.scene.addEventListener('cameraChange', onCameraChange);
		
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
		
		this.scene.spriteRoot.remove(this.sprite);
		
		//detach light.target from camera.target
		THREE.SceneUtils.detach(this.light.target, this.camera.target, this.scene.root);
		
		//detach light from pivot (keep last light world-position)
		THREE.SceneUtils.detach(this.light, this.light.parent, this.scene.root);
		
		
		//remove pivot from camera target
		this.camera.target.remove(this.pivotLight);
		
		
		this.domElement.removeEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
		this.domElement.removeEventListener( 'mousemove', onMouseMove, false );
		this.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		
		//this.scene.removeEventListener('cameraChange', onCameraChange);
		
		//call super class method
		GIScene.Control.prototype.deactivate.call(this);
	};
	
	
};

//Inherit from GIScene.Control
GIScene.Control.CameraLight.prototype = Object.create( GIScene.Control.prototype );