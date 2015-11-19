/**
 * Control to Examine Objects. Rotates the Camera around a center, zooms in and out and pans the camera. 
 *
 * @namespace GIScene
 * @class Control.OrbitZoomPan
 * @constructor
 * @extends GIScene.Control
 * @param {THREE.Camera} object The camera object to be used with this control
 * @param {DOMElement} [domElement] The DOM Element to which the mouse events will be added
 * 
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * modified by m.auer
 */

GIScene.Control.OrbitZoomPan = function ( object, domElement ) {
	
	GIScene.Control.call( this );

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.center = null; //will be first set on activate
	
	this.userZoom = true;
	this.userZoomSpeed = 1.0;

	this.userRotate = true;
	this.userRotateSpeed = 1.0;

	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// mca
	this.userPan = true;
	this.userPanSpeed = 0.825;

	
	// internals

	var scope = this;

	var EPS = 0.000001;
	var PIXELS_PER_ROUND = 1800;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var zoomStart = new THREE.Vector2();
	var zoomEnd = new THREE.Vector2();
	var zoomDelta = new THREE.Vector2();

	//mca
	var _eye = new THREE.Vector3(),
	_panStart = new THREE.Vector2(),
	_panEnd = new THREE.Vector2();

	var phiDelta = 0;
	var thetaDelta = 0;
	var scale = 1;

	var lastPosition = new THREE.Vector3();

	var STATE = { NONE : -1, ROTATE : 0, ZOOM : 1, PAN: 2 }; //mca
	var state = STATE.NONE;

	// events

	var changeEvent = { type: 'change' };


	this.rotateLeft = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		thetaDelta -= angle;

	};

	this.rotateRight = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		thetaDelta += angle;

	};

	this.rotateUp = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		phiDelta -= angle;

	};

	this.rotateDown = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		phiDelta += angle;

	};

	this.zoomIn = function ( zoomScale ) {

		if ( zoomScale === undefined ) {

			zoomScale = getZoomScale();

		}

		scale /= zoomScale;

	};

	this.zoomOut = function ( zoomScale ) {

		if ( zoomScale === undefined ) {

			zoomScale = getZoomScale();

		}

		scale *= zoomScale;

	};
	
	//mca inserted from TrackballControls _this-->scope
	this.panCamera = function () {

		var mouseChange = _panEnd.clone().sub( _panStart );
		
		if ( mouseChange.lengthSq() ) {

			mouseChange.multiplyScalar( _eye.length() * scope.userPanSpeed );  //panSpeed

			// var pan = _eye.clone().cross( scope.object.up ).setLength( mouseChange.x );
			// pan.add( scope.object.up.clone().setLength( mouseChange.y ) );
			var pan = _eye.clone().cross( scope.object.up ).setLength( mouseChange.x );
			pan.sub( _eye.clone().cross( _eye.clone().cross( scope.object.up ) ).setLength( mouseChange.y ) ); //mca: don't pan along y axis, pan perpendicular to eye vector
			

			scope.object.position.add( pan );
			var oldCenter = scope.center.clone();
			scope.center.add( pan ); //target-->center

			_panStart = _panEnd;

		}

	};

	this.update = function () {
		
		if (state != STATE.PAN) {
		
			var position = this.object.position;
			var offset = position.clone().sub( this.center );
	
			// angle from z-axis around y-axis
	
			var theta = Math.atan2( offset.x, offset.z );
	
			// angle from y-axis
	
			var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );
	
			if ( this.autoRotate ) {
	
				this.rotateLeft( getAutoRotationAngle() );
	
			}
	
			theta += thetaDelta;
			phi += phiDelta;
	
			// restrict phi to be betwee EPS and PI-EPS
	
			phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );
	
			var radius = offset.length();
			offset.x = radius * Math.sin( phi ) * Math.sin( theta );
			offset.y = radius * Math.cos( phi );
			offset.z = radius * Math.sin( phi ) * Math.cos( theta );
			//zoom perspective
			offset.multiplyScalar( scale );
			//zoom ortho; mca
			if(this.object.inOrthographicMode){
				this.object.toOrthographic();
			}
			
			
			position.copy( this.center ).add( offset );
	
			this.object.lookAt( this.center );
	
			thetaDelta = 0;
			phiDelta = 0;
			scale = 1;
		}
		//mca PAN target --> center
		else {
			_eye.copy( scope.object.position ).sub( scope.center );
			scope.panCamera();
			scope.object.position.addVectors( scope.center, _eye );
			//scope.object.lookAt( scope.center );
		}
		//mca end

		if ( lastPosition.distanceTo( this.object.position ) > 0 ) {
			/**
			 *@event change 
			 */
			this.dispatchEvent( changeEvent );
			lastPosition.copy( this.object.position );
		}

	}.bind(this);


	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.userZoomSpeed );

	}

	function onMouseDown( event ) {
		/**
		 *@event beforechange 
		 */
		scope.dispatchEvent({type:'beforechange'});
		
		if ( !scope.userRotate ) return;

		event.preventDefault();

		if ( event.button === 0 ){	//|| event.button === 2 ) {

			state = STATE.ROTATE;

			rotateStart.set( event.clientX, event.clientY );

		} else if ( event.button === 1 ) {

			state = STATE.ZOOM;

			zoomStart.set( event.clientX, event.clientY );

		} 
		//mca
		else if (event.button === 2) {
			state = STATE.PAN;
			_panStart = _panEnd = new THREE.Vector2(event.clientX, event.clientY).multiplyScalar(1/500);
		}

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );

	}

	function onMouseMove( event ) {

		event.preventDefault();
		
		
		
		if ( state === STATE.ROTATE ) {

			rotateEnd.set( event.clientX, event.clientY );
			rotateDelta.subVectors( rotateEnd, rotateStart );

			scope.rotateLeft( 2 * Math.PI * rotateDelta.x / PIXELS_PER_ROUND * scope.userRotateSpeed );
			scope.rotateUp( 2 * Math.PI * rotateDelta.y / PIXELS_PER_ROUND * scope.userRotateSpeed );

			rotateStart.copy( rotateEnd );

		} else if ( state === STATE.ZOOM ) {

			zoomEnd.set( event.clientX, event.clientY );
			zoomDelta.subVectors( zoomEnd, zoomStart );

			if ( zoomDelta.y > 0 ) {

				scope.zoomIn();

			} else {

				scope.zoomOut();

			}

			zoomStart.copy( zoomEnd );

		}
		//mca
		else if ( state === STATE.PAN ) {
			_panEnd = new THREE.Vector2(event.clientX, event.clientY).multiplyScalar(1/500);
		};

	}

	function onMouseUp( event ) {

		if ( ! scope.userRotate ) return;

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		state = STATE.NONE;
		/**
		 *@event afterchange 
		 */
		scope.dispatchEvent({type:'afterchange'});
	}

	function onMouseWheel( event ) {

		if ( ! scope.userZoom ) return;

		if ( ( event.wheelDelta && event.wheelDelta > 0 ) || ( event.detail && event.detail > 0 ) ) {

			scope.zoomOut();

		} else {

			scope.zoomIn();

		}

	}
	
	
	var onCenter = function(event){
		  
		this.center = event.content.center;
		
	}.bind(this);
	
	var onChange = function(event){
		
		this.scene.center = event.target.center.clone();
		this.object.target.position.setZ(-this.object.position.distanceTo(event.target.center));
		
	};
	
	/**
	 * Activates this Control
	 * 
	 * @method activate
	 *  
	 */
	this.activate = function(){
		if(this.isActive) return;
		
		this.center = this.scene.center.clone();//new THREE.Vector3();
		this.object.up.set(0,1,0);
		//if(this.center.distanceTo(this.object.position)< 0.01){this.object.position.add(new THREE.Vector3(0,0,0.01));}
		var dir= new THREE.Vector3(0,0,-1); //cameras default direction
		dir.applyQuaternion(this.object.quaternion); //cameras actual direction
		dir.normalize();
		if(this.center.distanceTo(this.object.position)< 0.01){this.object.position.sub(dir.multiplyScalar(0.01));}
		
		this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
		this.domElement.addEventListener( 'mousedown', onMouseDown, false );
		this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
		this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); //Firefox
		this.addEventListener('change', onChange);
		this.scene.addEventListener('center', onCenter);
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
		this.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		this.domElement.removeEventListener( 'mousewheel', onMouseWheel, false );
		this.domElement.removeEventListener( 'DOMMouseScroll', onMouseWheel, false ); //Firefox
		this.addEventListener('change', onChange);
		this.scene.removeEventListener('center', onCenter);
		//remove from render loop
		this.scene.removeEventListener("beforeRender", this.update);
		
		//call super class method
		GIScene.Control.prototype.deactivate.call(this);
	};
	
};


GIScene.Control.OrbitZoomPan.prototype = Object.create( GIScene.Control.prototype );


