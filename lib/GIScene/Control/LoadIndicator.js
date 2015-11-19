/**
 * The LoadIndicator-Control provides visual feedback about the current state of loading activity.
 * 
 * @namespace GIScene
 * @class Control.LoadIndicator
 * @constructor
 * @extends GIScene.Control
 */

GIScene.Control.LoadIndicator = function(){
	//make this a control
	GIScene.Control.call(this);
	
	this.domElement = null; //will be set on activate
	
	this.indicatorElement = null; 
	
	var loaderCounter = 0;
	
	
	var createIndicatorElement = function() {
		var div = document.createElement('div');
		div.setAttribute('id','GIScene_LoadIndicator_wrapper');	
		div.setAttribute('style', 'bottom: 20px;font-family: Sans-serif;left: 50%;opacity: 1;position: absolute;text-shadow: 0 0 2px #000000;color:#FFFFFF;font-weight:bold;letter-spacing:2px;');
		div.textContent = 'Loading...';
		return div;
	};
	
	var onBeforeLoad = function() {
		if(loaderCounter==0){
			this.domElement.appendChild(this.indicatorElement);
		}
		loaderCounter++;
	}.bind(this);

	var onLoad = function() {
		loaderCounter--;
		if(loaderCounter==0){
			this.domElement.removeChild(this.indicatorElement);
		}
	}.bind(this);
	
	/**
	 * Activates this Control
	 * 
	 * @method activate
	 *  
	 */
	this.activate = function(){
		if(this.isActive) return;
		
		this.domElement = this.scene.containerDiv;
		this.indicatorElement = createIndicatorElement();									
		
		//eventListeners
		
		GIScene.ModelLoader.prototype.addEventListener('beforeLoad', onBeforeLoad);
		GIScene.ModelLoader.prototype.addEventListener('load', onLoad);
		GIScene.ModelLoader.prototype.addEventListener('abort', onLoad);
		
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
		
		GIScene.ModelLoader.prototype.removeEventListener('beforeLoad', onBeforeLoad);
		GIScene.ModelLoader.prototype.removeEventListener('load', onLoad);
		GIScene.ModelLoader.prototype.removeEventListener('abort', onLoad);
		
		//call super class method
		GIScene.Control.prototype.deactivate.call(this);
	};
	
};

//Inherit from GIScene.Control
GIScene.Control.LoadIndicator.prototype = Object.create( GIScene.Control.prototype );