/**
 * Control to simulate walking. Use keybord controls.
 *
 * @namespace GIScene
 * @class Control.Walk
 * @constructor
 * @extends GIScene.Control
 * @param {THREE.Camera} object The camera object to be used with this control
 * @param {DOMElement} [domElement] The DOM Element to which the mouse events will be added
 * 
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 * @author modified by m.auer
 */

GIScene.Control.Walk = function ( object, domElement ) {
	
	GIScene.Control.call( this );

	this.object = object;
	this.target = new THREE.Vector3( 0, 0, 0 );
	this.center = null;
	
	this.bodyPivot = null;//activate: new THREE.Object3D();//mca

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	this.movementSpeed = 1.0*5;
	this.lookSpeed = 0.005*5;
	this.maxMovementSpeed = 100;
	this.minMovementSpeed = 0.01;
	
	this.jumpOffset = 1.0; //scene units, e.g. meters

	this.lookVertical = true;
	this.autoForward = false;
	// this.invertVertical = false;

	this.activeLook = false;//true; you get crazy when everything is moving all the time

	this.heightSpeed = false;
	this.heightCoef = 1.0;
	this.heightMin = 0.0;
	this.heightMax = 1.0;

	this.constrainVertical = false;
	this.verticalMin = 0;
	this.verticalMax = Math.PI;

	this.autoSpeedFactor = 0.0;

	// this.mouseX = 0;
	// this.mouseY = 0;
	var mouse = new THREE.Vector3();
	// var projector 	= new THREE.Projector(); //-r76
	var raycaster = new THREE.Raycaster(); //+r76
	
	this.mouseStart = new THREE.Vector2();
	this.mouseEnd = new THREE.Vector2();
	this.mouseDelta = new THREE.Vector2();

	this.lat = 0;
	this.oldLat = 0;
	this.lon = 0;
	this.phi = 0;
	this.theta = 0;

	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;
	this.freeze = false;

	this.mouseDragOn = false;

	this.viewHalfX = 0;
	this.viewHalfY = 0;

	if ( this.domElement !== document ) {

		this.domElement.setAttribute( 'tabindex', -1 );

	}

	//

	// this.handleResize = function () {
// 
		// if ( this.domElement === document ) {
// 
			// this.viewHalfX = window.innerWidth / 2;
			// this.viewHalfY = window.innerHeight / 2;
// 
		// } else {
// 
			// this.viewHalfX = this.domElement.offsetWidth / 2;
			// this.viewHalfY = this.domElement.offsetHeight / 2;
// 
		// }
// 
	// };

	this.onMouseDown = function ( event ) {

		document.addEventListener( 'mousemove', this.onMouseMove, false );

		if ( this.domElement !== document ) {

			this.domElement.focus();

		}

		event.preventDefault();
		event.stopPropagation();

		if ( this.activeLook ) {

			switch ( event.button ) {

				case 0: this.moveForward = true; break;
				case 2: this.moveBackward = true; break;

			}

		}

		this.mouseEnd.set( event.clientX, event.clientY ); //mca
		this.mouseStart.set( event.clientX, event.clientY ); //mca
		
		//update lat
		this.oldLat += this.lat;
		this.lat = 0;
		this.mouseDelta.set(0,0);//set(0,this.lat*5);

		this.mouseDragOn = true;
		
		

	}.bind(this);

	this.onMouseUp = function ( event ) {
		
		document.removeEventListener( 'mousemove', this.onMouseMove, false );

		event.preventDefault();
		event.stopPropagation();

		if ( this.activeLook ) {

			switch ( event.button ) {

				case 0: this.moveForward = false; break;
				case 2: this.moveBackward = false; break;

			}

		}

		this.mouseDragOn = false;
		
		//mca
		this.oldLat += this.lat;
		this.lat = 0;

	}.bind(this);

	this.onMouseMove = function ( event ) {

		// if ( this.domElement === document ) {
// 
			// this.mouseX = event.pageX - this.viewHalfX;
			// this.mouseY = event.pageY - this.viewHalfY;
// 
		// } else {
// 
			// this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
			// this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;
// 
		// }
		
		//mca
		this.mouseEnd.set( event.clientX, event.clientY ); //mca
		this.mouseDelta.subVectors(this.mouseEnd, this.mouseStart);//mca
		
	}.bind(this);

	this.onKeyDown = function ( event ) {

		//event.preventDefault();

		switch ( event.keyCode ) {

			case 73: /*I*/
			case 38: /*up*/this.moveForward = true; break;
			
			case 87: /*W*/ this.lookUp = true;break;

			case 74: /*J*/
			case 37: /*left*/ this.rotateLeft = true;break;
			
			case 65: /*A*/ this.moveLeft = true; break;

			case 75: /*K*/
			case 40: /*down*/this.moveBackward = true; break;
			
			case 83: /*S*/ this.lookDown = true; break;

			case 76: /*L*/
			case 39: /*right*/this.rotateRight = true; break;
			
			case 68: /*D*/ this.moveRight = true; break;

			case 82: /*R*/ this.moveUp = true; break;
			case 70: /*F*/ this.moveDown = true; break;

			case 81: /*Q*/ this.freeze = !this.freeze; break;
			
			//faster
			case 107:/*NUM+*/
			//FF
			case 171:/*+ (DEU, ESP)*/ 
			case 61: /*+ (US)*/ 
			//Chrome
			case 187: /*+ (DEU, US, ESP)*/
				this.movementSpeed = Math.min(this.movementSpeed *= 1.5, this.maxMovementSpeed);  break;
			
			//slower
			case 109:/*NUM-*/
			//FF(
			case 163:/*# */
			case 173:/*- (DEU, US, ESP)*/ 
			//Chrome
			case 191: /*# (DEU)*/
			case 189: /*- (DEU, US, ESP)*/
				this.movementSpeed = Math.max(this.movementSpeed /= 1.5, this.minMovementSpeed); break;

		}

	}.bind(this);

	this.onKeyUp = function ( event ) {

		switch( event.keyCode ) {
			
			case 73: /*I*/
			case 38: /*up*/this.moveForward = false; break;
			
			case 87: /*W*/ this.lookUp = false;break;

			case 74: /*J*/
			case 37: /*left*/this.rotateLeft = false;break;
			
			case 65: /*A*/ this.moveLeft = false; break;

			case 75: /*K*/
			case 40: /*down*/this.moveBackward = false; break;
			
			case 83: /*S*/ this.lookDown = false; break;

			case 76: /*L*/
			case 39: /*right*/this.rotateRight = false; break;
			
			case 68: /*D*/ this.moveRight = false; break;

			case 82: /*R*/ this.moveUp = false; break;
			case 70: /*F*/ this.moveDown = false; break;

		}

	}.bind(this);

	this.update = function( /*delta*/ ) {

		delta = this.scene.delta;
		
		if ( this.freeze ) {

			return;

		}

		if ( this.heightSpeed ) {

			var y = THREE.Math.clamp( this.object.position.y, this.heightMin, this.heightMax );
			var heightDelta = y - this.heightMin;

			this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

		} else {

			this.autoSpeedFactor = 0.0;

		}

		var actualMoveSpeed = delta * this.movementSpeed;

		if ( this.moveForward || ( this.autoForward && !this.moveBackward ) ) this.bodyPivot.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
		if ( this.moveBackward ) this.bodyPivot.translateZ( actualMoveSpeed );

		if ( this.moveLeft ) this.bodyPivot.translateX( - actualMoveSpeed );
		if ( this.moveRight ) this.bodyPivot.translateX( actualMoveSpeed );

		if ( this.moveUp ) this.bodyPivot.translateY( actualMoveSpeed );
		if ( this.moveDown ) this.bodyPivot.translateY( - actualMoveSpeed );

		var actualLookSpeed = delta * this.lookSpeed;

		if ( !this.activeLook ) {

			actualLookSpeed = 0;

		}

		var verticalLookRatio = 1;

		if ( this.constrainVertical ) {

			verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

		}

		// this.lon += this.mouseX * actualLookSpeed;
		
		if( this.mouseDragOn && Math.abs(this.mouseDelta.x) > 5) {
			var dXSign = this.mouseDelta.x / Math.abs(this.mouseDelta.x);
			this.lon += dXSign * Math.min( (Math.abs(this.mouseDelta.x)-5) / 20, delta * this.lookSpeed *800);
		}
		if( this.rotateLeft  /* || (this.mouseDragOn && this.mouseDelta.x < 0 )*/ ) this.lon -= delta * this.lookSpeed *800;//2;//mca
		if( this.rotateRight /* || (this.mouseDragOn && this.mouseDelta.x > 0 )*/ ) this.lon += delta * this.lookSpeed *800;//2;//mca
		
		if( this.lookVertical && this.mouseDragOn) this.lat =  /*verticalLookRatio * */ this.mouseDelta.y / 5;
		if( this.lookVertical && this.lookUp) this.oldLat -= delta * this.lookSpeed *800;//2;//mca
		if( this.lookVertical && this.lookDown) this.oldLat += delta * this.lookSpeed *800;//2;//mca
		
		// if( this.lookVertical ) {
			// if()this.lat -= this.mouseY * actualLookSpeed * verticalLookRatio;	
		// }

		this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
		this.phi = THREE.Math.degToRad( 90 /*- this.lat*/ );

		this.theta = THREE.Math.degToRad( this.lon );

		if ( this.constrainVertical ) {

			this.phi = THREE.Math.mapLinear( this.phi, 0, Math.PI, this.verticalMin, this.verticalMax );

		}

		var targetPosition = this.target,
			position = this.bodyPivot.position;

		targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
		targetPosition.y = position.y + 100 * Math.cos( this.phi );
		targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );

		this.bodyPivot.lookAt( targetPosition );
		
		//apply position and horizontal rotation to camera
		
		this.object.position.copy(position);
		//this.object.quaternion.copy(this.bodyPivot.quaternion);
		
		//create vertical rotation
		var q = new THREE.Quaternion();
		q.setFromAxisAngle(new THREE.Vector3(1,0,0),THREE.Math.degToRad(-10 - this.oldLat - this.lat));
		//apply horiz and vert rotation
		this.object.quaternion.multiplyQuaternions(this.bodyPivot.quaternion, q);// multiply(q);
		
		
		//this.object.rotation.set(this.object.rotation.x,this.bodyPivot.rotation.y,this.object.rotation.z);
		
		// this.center.set(position.x, position.y, position.z);
		 
		/**
		 * Fires when camera position or rotation is changed 
		 *
		 *@event change 
		 */
		this.dispatchEvent({type:'change'});

	}.bind(this);
	
		var onDoubleClick = function( event ){
		event.preventDefault();
		//get mouse ScreenCoords
		var viewPortCoords = GIScene.Utils.getViewportCoordsFromDOMEvent(this.domElement,event);
		
		//only set if down and up coords are the same	
		mouse.set(viewPortCoords.x, viewPortCoords.y, 1);
		// var ray = projector.pickingRay(mouse, this.object); //-r76
		raycaster.setFromCamera(mouse, this.object); //+r76
		var pickables = GIScene.Utils.getDescendants(this.scene.root).filter(function (e,i,a){return e.geometry;}); //r76 //@TODO currently all scene objects are pickable 
		var pickResults = raycaster.intersectObjects(pickables);
		
		var pickResult;
		for(var i=0; i < pickResults.length; i++){
			if(pickResults[i].object.geometry && pickResults[i].object.visible){
				pickResult = pickResults[i];
				break;
			};
		};
		if(pickResult){
			
			// this.deactivate();
			var _onCenter = function(event) {
				this.scene.removeEventListener("center", _onCenter);
				// this.activate();
				this.scene.addEventListener("beforeRender", this.update);
			}.bind(this);
			this.scene.addEventListener("center", _onCenter);
			this.scene.removeEventListener("beforeRender", this.update);
			var offsetPoint = pickResult.point.clone().add(new THREE.Vector3(0,1,0));
			var offsetDir = this.object.position.clone().sub(offsetPoint).normalize();//keep a little distance from the picked point
			var newCenter = offsetPoint;//@TODO distfromfacenormal .add(offsetDir.clone().multiplyScalar(this.jumpOffset));
			// this.scene.center = this.center = newCenter.clone();
			
			this.scene.setCenter(newCenter, offsetDir.clone().multiplyScalar(this.jumpOffset),500);

			/**
			 * Fires when camera position or rotation is changed 
			 *
			 *@event change 
			 */
			this.dispatchEvent({type:'change'});
		}	
	}.bind(this);
	
////////OLD PART

	
	var onCenter = function(event){
		  
		this.center = event.content.center;
		
		
		this.bodyPivot.matrix.copy(this.object.matrixWorld); //mca
		this.bodyPivot.updateMatrixWorld();//mca
		this.bodyPivot.position.copy(this.object.position);
		this.bodyPivot.quaternion.setFromRotationMatrix(this.object.matrixWorld);
		
		
		// this.bodyPivot = this.object.clone();
		
		//keep former camera orientation
		var dir= new THREE.Vector3(0,0,-1); //cameras default direction
		var north= dir.clone();
		var up = new THREE.Vector3(0,1,0);
		dir.applyQuaternion(this.bodyPivot.quaternion); //cameras actual direction
		var dirOnPlane = dir.clone().projectOnPlane(up);
		var isEastside = (dirOnPlane.clone().cross(up).angleTo(north) > Math.PI/2) ? true : false;
		var angleToNorth = dirOnPlane.angleTo(north);
		var compassAngle = (isEastside) ? angleToNorth : Math.PI*2 - angleToNorth;
		var compassDegrees = THREE.Math.radToDeg(compassAngle);		
		
		this.lon = compassDegrees+90; // set former camera orientation
		this.lat = THREE.Math.radToDeg(dir.angleTo(this.scene.camera.up))-90-10-this.oldLat; // set former camera pitch

	}.bind(this);
	
	var onChange = function(event){
		
		this.center = this.object.localToWorld(this.object.target.position.clone());
		
		this.scene.center = this.center;//;event.target.center.clone();
		
		this.scene.dispatchEvent('cameraChange');
		//camera and camera target are the same in this control
		//this.object.target.position.setZ(-this.object.position.distanceTo(event.target.center));
		
	}.bind(this);
	
	/**
	 * Activates this Control
	 * 
	 * @method activate
	 *  
	 */
	this.activate = function(){
		if(this.isActive) return;
		
		//this.center = this.scene.camera.position.clone();//this.scene.center.clone();//new THREE.Vector3();
		this.scene.camera.target.position.setZ(-this.jumpOffset);
		this.center = this.scene.camera.localToWorld(this.scene.camera.target.position.clone());
		this.scene.setCenter(this.center, this.scene.camera.position.clone().sub(this.center), 0);
		
		this.bodyPivot = new THREE.Object3D();
		this.bodyPivot.applyMatrix(this.object.matrixWorld); //martixWorld?
		this.bodyPivot.matrixWorldNeedsUpdate = true;
		
		//keep former camera orientation
		var dir= new THREE.Vector3(0,0,-1); //cameras default direction
		var north= dir.clone();
		var up = new THREE.Vector3(0,1,0);
		dir.applyQuaternion(this.bodyPivot.quaternion); //cameras actual direction
		var dirOnPlane = dir.clone().projectOnPlane(up);
		var isEastside = (dirOnPlane.clone().cross(up).angleTo(north) > Math.PI/2) ? true : false;
		var angleToNorth = dirOnPlane.angleTo(north);
		var compassAngle = (isEastside) ? angleToNorth : Math.PI*2 - angleToNorth;
		var compassDegrees = THREE.Math.radToDeg(compassAngle);		
		
		this.lon = compassDegrees+90; // set former camera orientation
		this.lat = THREE.Math.radToDeg(dir.angleTo(this.scene.camera.up))-90-10-this.oldLat; // set former camera pitch
		
		//set eventListeners
		this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
		//this.domElement.addEventListener( 'mousemove', this.onMouseMove, false );
		this.domElement.addEventListener( 'mousedown', this.onMouseDown, false );
		document.addEventListener( 'mouseup', this.onMouseUp, false );
		this.domElement.addEventListener( 'keydown', this.onKeyDown, false );
		this.domElement.addEventListener( 'keyup', this.onKeyUp, false );
		this.domElement.addEventListener( 'dblclick', onDoubleClick, false );
		
		this.addEventListener('change', onChange);
		this.scene.addEventListener('center', onCenter);
		
		//hang in render loop
		this.scene.addEventListener("beforeRender", this.update);
		// this.scene.addEventListener("afterRender", this.update);
		
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
		
		this.domElement.removeEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

		//this.domElement.removeEventListener( 'mousemove', this.onMouseMove, false );
		this.domElement.removeEventListener( 'mousedown', this.onMouseDown, false );
		document.removeEventListener( 'mouseup', this.onMouseUp, false );
		this.domElement.removeEventListener( 'keydown', this.onKeyDown, false );
		this.domElement.removeEventListener( 'keyup', this.onKeyUp, false );
		this.domElement.removeEventListener( 'dblclick', onDoubleClick, false );
		
		this.removeEventListener('change', onChange);
		this.scene.removeEventListener('center', onCenter);
		
		//hang in render loop
		this.scene.removeEventListener("beforeRender", this.update);
		// this.scene.removeEventListener("afterRender", this.update);
		
		//set camera and target
		// var dir= new THREE.Vector3(0,0,-1); //cameras default direction
		// dir.applyQuaternion(this.object.quaternion); //cameras actual direction
		// dir.normalize();
		// this.scene.center.add(dir); //add 1m offset between camera and scene center to make orbit cotrols work better after WALK
		// this.object.target.position.setZ(-1);
		
		//call super class method
		GIScene.Control.prototype.deactivate.call(this);
	};
	
};


GIScene.Control.Walk.prototype = Object.create( GIScene.Control.prototype );


