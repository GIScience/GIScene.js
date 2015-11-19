/**
 * Pan Control. *experimental, not ready to use*
 * 
 * @namespace GIScene
 * @class Control.Pan 
 * @constructor
 * @extends GIScene.Control
 * @param {THREE.Camera} object The camera object to be used with this control
 * @param {DOMElement} [domElement] The DOM Element to which the mouse events will be added
 */

GIScene.Control.Pan = function( object, domElement ){
	
	//Make this a Control
	GIScene.Control.call(this);
	
	//Make this an EventDispatcher
	THREE.EventDispatcher.call( this );
	
	STATE = { NONE : -1, PAN : 0}; //mouse event.button = 0:left 1:click wheel 2: right 
	var _this = this;
	
	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;
	
	//API
	this.panSpeed = 0.825;
	
	//internals
	this.target = new THREE.Vector3();

	var lastPosition = new THREE.Vector3();

	var _keyPressed = false,
	_state = STATE.NONE,


	_eye = new THREE.Vector3(),

	// _rotateStart = new THREE.Vector3(),
	// _rotateEnd = new THREE.Vector3(),
// 
	// _zoomStart = new THREE.Vector2(),
	// _zoomEnd = new THREE.Vector2(),


	_panStart = new THREE.Vector2(),
	_panEnd = new THREE.Vector2();
	
	
	
	this.panCamera = function () {

		var mouseChange = _panEnd.clone().sub( _panStart );
		
		if ( mouseChange.lengthSq() ) {

			mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );

			var pan = _eye.clone().cross( _this.object.up ).setLength( mouseChange.x );
			pan.add( _this.object.up.clone().setLength( mouseChange.y ) );


			_this.object.position.add( pan );
			_this.target.add( pan );

			//if ( _this.staticMoving ) {

				_panStart = _panEnd;

			// } else {
// 
				// _panStart.add( mouseChange.subVectors( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor ) );
// 
			// }


		}

	};
	
	
	
	this.update = function () {
		_eye.copy( _this.object.position ).sub( _this.target );
		_this.panCamera();
		_this.object.position.Vectors( _this.target, _eye );
		_this.object.lookAt( _this.target );
	};
	

	mousedown = function (event) {
		_state = STATE.PAN;
	  	_panStart = _panEnd = new THREE.Vector2(event.clientX, event.clientY).multiplyScalar(1/500);  //_this.getMouseOnScreen( event.clientX, event.clientY );
	};
	
	mousemove = function (event) {
		if(_state == STATE.PAN){
			_panEnd = new THREE.Vector2(event.clientX, event.clientY).multiplyScalar(1/500); //_this.getMouseOnScreen( event.clientX, event.clientY );
		}
	};
	
	mouseup = function (event) {
		_state = STATE.NONE;
	}; 
	
	
	this.activate = function () {  
		if(this.isActive) return;
		
		this.domElement.addEventListener( 'mousedown', mousedown, false );
		this.domElement.addEventListener( 'mousemove', mousemove, false );
		this.domElement.addEventListener( 'mouseup', mouseup, false );
		
		//call super class method
		GIScene.Control.prototype.activate.call(this);
	};
	
	this.deactivate = function () {
		if(!this.isActive) return;
		
		this.domElement.removeEventListener( 'mousedown', mousedown, false );
		this.domElement.removeEventListener( 'mousemove', mousemove, false );
		this.domElement.removeEventListener( 'mouseup', mouseup, false );
		
		//call super class method
		GIScene.Control.prototype.deactivate.call(this);
	};
	
};
