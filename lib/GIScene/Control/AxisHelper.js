/**
 * The AxisHelper Control provides a graphical information on the current camera orientation in 3D space.
 * 
 * @namespace GIScene
 * @class Control.AxisHelper
 * @constructor
 * @extends GIScene.Control
 * @param {THREE.Camera} camera 
 * @param {Object} [config] you can configure the size with an config object {size:50}
 */

GIScene.Control.AxisHelper = function(camera, config) {
	
	//make this a control
	GIScene.Control.call(this);
	
	var defaults = {
		//positioning in px from canvas border
		size:50
	};
	
	/**
	 * The config which is used to initialize the AxisHelper-Control. Merged from defaults and passed config Object.
	 * 
	 * @property config
	 * @type Object
	 */
	this.config = GIScene.Utils.mergeObjects(defaults, config || {});
	
	this.camera = camera;
	this.axisHelper = new THREE.AxisHelper(this.config.size);
	
	var update = function() {
	
		this.axisHelper.rotation.setFromRotationMatrix(this.camera.matrixWorldInverse.extractRotation(this.camera.matrixWorldInverse));	
		
	}.bind(this);
	
	var onResize = function() {
		
		this.axisHelper.position.set((-this.scene.canvas.width/2)+60,(-this.scene.canvas.height/2)+60,0);
	
	}.bind(this);
	
	/**
	 * Activates this Control
	 * 
	 * @method activate
	 *  
	 */
	this.activate = function(){
		if(this.isActive) return;
		
		this.scene.spriteRoot.add(this.axisHelper);
		this.axisHelper.position.set((-this.scene.canvas.width/2)+60,(-this.scene.canvas.height/2)+60,0);

		update();
		
		//eventListeners
		//hang in render loop
		this.scene.addEventListener("cameraChange", update);
		window.addEventListener('resize', onResize, false);
		
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
		
		this.scene.spriteRoot.remove(this.axisHelper);
		
		//remove from render loop
		this.scene.removeEventListener("cameraChange", update);
		window.removeEventListener('resize', onResize, false);
 		
		//call super class method
		GIScene.Control.prototype.deactivate.call(this);
	};
	

};
//Inherit from GIScene.Control
GIScene.Control.AxisHelper.prototype = Object.create( GIScene.Control.prototype );
