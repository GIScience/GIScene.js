/**
 * This Control diplays the Object position coordinates in a TextPanel
 * 
 * @namespace GIScene
 * @class Control.ObjectPosition
 * @constructor
 * @extends GIScene.Control
 * @param {THREE.Object3D} object
 */

GIScene.Control.ObjectPosition = function(object) {
	
	//make this a control
	GIScene.Control.call(this);
	
	//this.domElement = null;
	this.object = object;
	this.height = 3*18;
	this.textPanel = new GIScene.Control.TextPanel(
		{
			height: this.height,
			width : 200,
			textAlign: 'left',
			pxFromLeft:10,
			fontSize:10,
			//pxFromTop: this.scene.canvas.height - this.height
		}
	);
	
	this.updateCoords = function() {
		var a = [];
		this.object.position.clone().add(this.scene.config.offset.toVector3()).toArray().forEach(function (el) {
		  a.push(el.toFixed(3));
		});
		this.textPanel.setText(['Height: '+a[1],'X Y: '+a[0]+' '+ -a[2]]);
	}.bind(this);
	
	var onResize = function() {
		// this.textPanel.sprite.position.setY((-this.scene.canvas.height/2) + (this.height/2));
		this.textPanel.sprite.position.set((-this.scene.canvas.width/2) + this.textPanel.config.width/2 + this.textPanel.config.pxFromLeft,(-this.scene.canvas.height/2) + (this.height/2), 0);
	}.bind(this); 


	this.activate = function() {
		if(this.isActive) return;
		
		this.textPanel.setScene(this.scene),
		this.textPanel.activate();
		// this.textPanel.sprite.position.setY((-this.scene.canvas.height/2) + (this.height/2));
		this.textPanel.sprite.position.set((-this.scene.canvas.width/2) + this.textPanel.config.width/2 + this.textPanel.config.pxFromLeft,(-this.scene.canvas.height/2) + (this.height/2), 0);
		
		this.scene.addEventListener('cameraChange', this.updateCoords);
		window.addEventListener('resize', onResize, false);
		
		GIScene.Control.prototype.activate.call(this);
	};
	
	this.deactivate = function() {
		if(!this.isActive) return;
		
		this.textPanel.deactivate();
		this.scene.removeEventListener('cameraChange', this.updateCoords);
		window.removeEventListener('resize', onResize, false);
		
		GIScene.Control.prototype.deactivate.call(this);
	};
};

//Inherit from GIScene.Control
GIScene.Control.ObjectPosition.prototype = Object.create( GIScene.Control.prototype );