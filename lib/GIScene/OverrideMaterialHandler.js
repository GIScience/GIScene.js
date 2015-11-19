/**
 * Abstract base class to implement override material handler. 
 * These are functions that will be called on each object just after the override Material will be assigned to each object by using the Layer-event "afterOverrideMaterial"
 * These handlers should be referenced in the overrideMaterialHandler property of the Layer
 * 
 * @namespace GIScene
 * @class OverrideMaterialHandler
 */

GIScene.OverrideMaterialHandler = function(event) {
	this.object = event.content.object;
	this.overrideMaterial = event.content.overrideMaterial;
	this.layer = event.content.layer;
};