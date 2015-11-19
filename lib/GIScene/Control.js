/**
 * Abstract class used for Control classes
 * 
 * @namespace GIScene
 * @class Control
 *  
 */

GIScene.Control = function () {
	
	/**
	 * @property scene
	 * @type GIScene.Scene 
	 */
	this.scene = null;
	
	/**
	 * @property isActive
	 * @type Boolean 
	 */
	this.isActive = false;
	
};


GIScene.Control.prototype = {
	
	constructor : GIScene.Control,
	
	/**
	 * Sets the scene property. This is automatically called on scene.addControl()
 	 * @method setScene
 	 * @param {Object} scene
	 */
	setScene : function(scene){this.scene = scene;},
	
	/**
	 * Activates this Control ...
	 * 
	 * @method activate
	 *  
	 */
	activate : function (){this.isActive = true;},
	
	/**
	 * Dectivates this Control ...
	 * 
	 * @method deactivate
	 *  
	 */
	deactivate : function (){this.isActive = false;},
	
	//Provide EventDispatcher Functions
	addEventListener : THREE.EventDispatcher.prototype.addEventListener,
	hasEventListener : THREE.EventDispatcher.prototype.hasEventListener,
	removeEventListener : THREE.EventDispatcher.prototype.removeEventListener,
	dispatchEvent : THREE.EventDispatcher.prototype.dispatchEvent
	
};