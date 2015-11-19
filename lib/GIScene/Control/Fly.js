/**
 * Control to Fly over through a scene. 
 *
 * @namespace GIScene
 * @class Control.Fly
 * @constructor
 * @extends GIScene.Control
 * @param {THREE.Camera} object The camera object to be used with this control
 * @param {DOMElement} [domElement] The DOM Element to which the mouse events will be added
 * 
 * 
 * @author James Baicoianu / http://www.baicoianu.com/
 * @author modified by m.auer
 * 
 */

GIScene.Control.Fly = function ( object, domElement ) {
	
	GIScene.Control.call( this );

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;
	if ( domElement ) this.domElement.setAttribute( 'tabindex', -1 ); //focus domelement for key input

	// API
	
	this.center = null; //mca

	this.movementSpeed = 1.0;
	this.rollSpeed = 0.005;

	this.dragToLook = false;
	this.autoForward = false;

	// disable default target object behavior

	// internals

	this.tmpQuaternion = new THREE.Quaternion();

	this.mouseStatus = 0;

	this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
	this.moveVector = new THREE.Vector3( 0, 0, 0 );
	this.rotationVector = new THREE.Vector3( 0, 0, 0 );

	// this.handleEvent = function ( event ) {
// 
		// if ( typeof this[ event.type ] == 'function' ) {
// 
			// this[ event.type ]( event );
// 
		// }
// 
	// };

	var keydown = function( event ) {

		if ( event.altKey ) {

			return;

		}

		//event.preventDefault();

		switch ( event.keyCode ) {

			case 16: /* shift */ this.movementSpeedMultiplier = .1; break;

			case 87: /*W*/ this.moveState.forward = 1; break;
			case 83: /*S*/ this.moveState.back = 1; break;

			case 65: /*A*/ this.moveState.left = 1; break;
			case 68: /*D*/ this.moveState.right = 1; break;

			case 82: /*R*/ this.moveState.up = 1; break;
			case 70: /*F*/ this.moveState.down = 1; break;

			case 38: /*up*/ this.moveState.pitchUp = 1; break;
			case 40: /*down*/ this.moveState.pitchDown = 1; break;

			case 37: /*left*/ this.moveState.yawLeft = 1; break;
			case 39: /*right*/ this.moveState.yawRight = 1; break;

			case 81: /*Q*/ this.moveState.rollLeft = 1; break;
			case 69: /*E*/ this.moveState.rollRight = 1; break;

		}

		this.updateMovementVector();
		this.updateRotationVector();

	}.bind(this);

	var keyup = function( event ) {

		switch( event.keyCode ) {

			case 16: /* shift */ this.movementSpeedMultiplier = 1; break;

			case 87: /*W*/ this.moveState.forward = 0; break;
			case 83: /*S*/ this.moveState.back = 0; break;

			case 65: /*A*/ this.moveState.left = 0; break;
			case 68: /*D*/ this.moveState.right = 0; break;

			case 82: /*R*/ this.moveState.up = 0; break;
			case 70: /*F*/ this.moveState.down = 0; break;

			case 38: /*up*/ this.moveState.pitchUp = 0; break;
			case 40: /*down*/ this.moveState.pitchDown = 0; break;

			case 37: /*left*/ this.moveState.yawLeft = 0; break;
			case 39: /*right*/ this.moveState.yawRight = 0; break;

			case 81: /*Q*/ this.moveState.rollLeft = 0; break;
			case 69: /*E*/ this.moveState.rollRight = 0; break;

		}

		this.updateMovementVector();
		this.updateRotationVector();

	}.bind(this);

	var mousedown = function( event ) {

		if ( this.domElement !== document ) {

			this.domElement.focus();

		}

		event.preventDefault();
		event.stopPropagation();

		if ( this.dragToLook ) {

			this.mouseStatus ++;

		} else {

			switch ( event.button ) {

				case 0: this.moveState.forward = 1; break;
				case 2: this.moveState.back = 1; break;

			}

			this.updateMovementVector();

		}

	}.bind(this);

	var mousemove = function( event ) {

		if ( !this.dragToLook || this.mouseStatus > 0 ) {

			var container = this.getContainerDimensions();
			var halfWidth  = container.size[ 0 ] / 2;
			var halfHeight = container.size[ 1 ] / 2;

			this.moveState.yawLeft   = - ( ( event.pageX - container.offset[ 0 ] ) - halfWidth  ) / halfWidth;
			this.moveState.pitchDown =   ( ( event.pageY - container.offset[ 1 ] ) - halfHeight ) / halfHeight;

			this.updateRotationVector();

		}

	}.bind(this);

	var mouseup = function( event ) {

		event.preventDefault();
		event.stopPropagation();

		if ( this.dragToLook ) {

			this.mouseStatus --;

			this.moveState.yawLeft = this.moveState.pitchDown = 0;

		} else {

			switch ( event.button ) {

				case 0: this.moveState.forward = 0; break;
				case 2: this.moveState.back = 0; break;

			}

			this.updateMovementVector();

		}

		this.updateRotationVector();

	}.bind(this);

	this.update = function() {
		console.log('FLY.update()');
		delta = this.scene.delta;
		console.log("delta", delta);
		var moveMult = delta * this.movementSpeed;
		var rotMult = delta * this.rollSpeed;

		this.object.translateX( this.moveVector.x * moveMult );
		this.object.translateY( this.moveVector.y * moveMult );
		this.object.translateZ( this.moveVector.z * moveMult );
		
		/**
		 *@event change 
		 */
		this.dispatchEvent( {type:'change'} );
		
		this.tmpQuaternion.set( this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
		this.object.quaternion.multiply( this.tmpQuaternion );

		// expose the rotation vector for convenience
		this.object.rotation.setFromQuaternion( this.object.quaternion, this.object.rotation.order );


	}.bind(this);

	this.updateMovementVector = function() {
console.log("FLY.updateMovementVector()");
		var forward = ( this.moveState.forward || ( this.autoForward && !this.moveState.back ) ) ? 1 : 0;

		this.moveVector.x = ( -this.moveState.left    + this.moveState.right );
		this.moveVector.y = ( -this.moveState.down    + this.moveState.up );
		this.moveVector.z = ( -forward + this.moveState.back );

		//console.log( 'move:', [ this.moveVector.x, this.moveVector.y, this.moveVector.z ] );

	};

	this.updateRotationVector = function() {
console.log("FLY.updateRotationVector()");
		this.rotationVector.x = ( -this.moveState.pitchDown + this.moveState.pitchUp );
		this.rotationVector.y = ( -this.moveState.yawRight  + this.moveState.yawLeft );
		this.rotationVector.z = ( -this.moveState.rollRight + this.moveState.rollLeft );

		//console.log( 'rotate:', [ this.rotationVector.x, this.rotationVector.y, this.rotationVector.z ] );

	};

	this.getContainerDimensions = function() {

		if ( this.domElement != document ) {

			return {
				size	: [ this.domElement.offsetWidth, this.domElement.offsetHeight ],
				offset	: [ this.domElement.offsetLeft,  this.domElement.offsetTop ]
			};

		} else {

			return {
				size	: [ window.innerWidth, window.innerHeight ],
				offset	: [ 0, 0 ]
			};

		}

	};

	// function bind( scope, fn ) {
// 
		// return function () {
// 
			// fn.apply( scope, arguments );
// 
		// };
// 
	// };

	// this.domElement.removeEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
// 
	// this.domElement.addEventListener( 'mousemove', bind( this, this.mousemove ), false );
	// this.domElement.addEventListener( 'mousedown', bind( this, this.mousedown ), false );
	// this.domElement.addEventListener( 'mouseup',   bind( this, this.mouseup ), false );
// 
	// this.domElement.addEventListener( 'keydown', bind( this, this.keydown ), false );
	// this.domElement.addEventListener( 'keyup',   bind( this, this.keyup ), false );
// 
	// this.updateMovementVector();
	// this.updateRotationVector();
	
////////OLD PART

	
	var onCenter = function(event){
		  
		this.center = event.content.center;
		
	}.bind(this);
	
	var onChange = function(event){
		
		this.scene.center = event.target.center.clone();
		
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
		
		this.center = this.scene.center.clone();//new THREE.Vector3();
		//this.object.up.set(0,1,0);
		
		this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

		this.domElement.addEventListener( 'mousemove', mousemove, false );
		this.domElement.addEventListener( 'mousedown', mousedown, false );
		this.domElement.addEventListener( 'mouseup',   mouseup, false );
	
		this.domElement.addEventListener( 'keydown', keydown, false );
		this.domElement.addEventListener( 'keyup',   keyup, false );
		
		this.addEventListener('change', onChange);
		this.scene.addEventListener('center', onCenter);
	
		this.updateMovementVector();
		this.updateRotationVector();
		
		//hang in render loop
		this.scene.addEventListener("beforeRender", this.update);
		
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

		this.domElement.removeEventListener( 'mousemove', mousemove, false );
		this.domElement.removeEventListener( 'mousedown', mousedown, false );
		this.domElement.removeEventListener( 'mouseup',   mouseup, false );
	
		this.domElement.removeEventListener( 'keydown', keydown, false );
		this.domElement.removeEventListener( 'keyup',   keyup, false );
		
		this.removeEventListener('change', onChange);
		this.scene.removeEventListener('center', onCenter);
		
		//hang in render loop
		this.scene.removeEventListener("beforeRender", this.update);
		
		//call super class method
		GIScene.Control.prototype.deactivate.call(this);
	};
	
};


GIScene.Control.Fly.prototype = Object.create( GIScene.Control.prototype );


