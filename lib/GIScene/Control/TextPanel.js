/**
 * The Compass Control provides a panel on which you can add text.
 * 
 * @namespace GIScene
 * @class Control.TextPanel
 * @constructor
 * @extends GIScene.Control
 * @param {Object} [config] object properties may be: width, height, text:['Line1','Line2'], textAlign:'left|start|center|end|right', pxFromLeft, pxFromTop, fontSize, lineSpace, fontFamily, fontStyle, color, halo
 */

GIScene.Control.TextPanel = function(config) {
	
	//make this a control
	GIScene.Control.call(this);
	
	var defaults = {
		width:256,
		height:100,
		text: ['Hello World','Zeile 2'],
		textAlign: 'start',
		pxFromLeft:0,
		pxFromTop :400,
		fontSize: 10,
		lineSpace :6,
		fontFamily: 'sans-serif',
		fontStyle: 'normal',
		color: 'ivory',
		halo: 'black'
	};
	
	/**
	 * The config which is used to initialize the CameraLight-Control. Merged from defaults and passed config Object.
	 * 
	 * @property config
	 * @type Object
	 */
	this.config = GIScene.Utils.mergeObjects(defaults, config || {});
	this.height = this.config.height;
	var text = (this.config.text instanceof Array)? this.config.text : [this.config.text];
	var numLines = text.length;
	var horizontalOffset = (this.config.textAlign == 'left' || this.config.textAlign == 'start')? 0 : (this.config.textAlign == 'center')? this.config.width/2 : this.config.width; //last case is 'right' or 'end'	
	
	this.canvas2d = document.createElement('canvas');
	this.canvas2d.width = this.config.width;
	this.canvas2d.height = this.height;
	this.context2d = this.canvas2d.getContext('2d');
	this.context2d.textBaseline = 'middle';
	this.context2d.font = this.config.fontStyle + ' ' + this.config.fontSize + 'pt ' + this.config.fontFamily;
	// this.context2d.lineWidth = 0.5;
	this.context2d.textAlign = this.config.textAlign;
	this.context2d.fillStyle = this.config.color;
	this.context2d.shadowColor = this.config.halo;
	this.context2d.shadowBlur = 3;
	
	this.texture = new THREE.Texture(this.canvas2d);
	// this.texture.flipY = false;
	
	
	var spriteMaterial = new THREE.SpriteMaterial({ map : this.texture, opacity:1  });
	this.sprite = new THREE.Sprite(spriteMaterial);
	this.sprite.scale.set( this.config.width, this.height, 1 );
	// this.sprite.position.set((-this.scene.canvas.width/2) + this.config.width/2 + this.config.pxFromLeft,this.config.pxFromTop, 0);
	
	this.update = function() {
		this.context2d.clearRect(0,0,this.config.width, this.height);
		//render lines
		for (var i=0; i < numLines; i++){
			this.context2d.fillText(text[i], horizontalOffset,this.height/2 - ((numLines-1)*(this.config.fontSize + this.config.lineSpace)/2) + i*(this.config.fontSize + this.config.lineSpace));
		}
		this.texture.needsUpdate=true;
	}.bind(this);
	
	this.setText = function(newText) {
		text = (newText instanceof Array)? newText : [newText];
		numLines = text.length;
		this.update();
	}.bind(this);
	
	/**
	 * Activates this Control
	 * 
	 * @method activate
	 *  
	 */
	this.activate = function(){
		if(this.isActive) return;
		
		this.scene.spriteRoot.add(this.sprite);
		this.sprite.position.set((-this.scene.canvas.width/2) + this.config.width/2 + this.config.pxFromLeft,this.config.pxFromTop, 0);
		this.texture.needsUpdate=true;
		this.update();
		//eventListeners
		//hang in render loop
		// this.scene.addEventListener("cameraChange", this.update);
		
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
		//remove from render loop
		//this.scene.removeEventListener("cameraChange", this.update);
		
		//call super class method
		GIScene.Control.prototype.deactivate.call(this);
	};
	

};
//Inherit from GIScene.Control
GIScene.Control.TextPanel.prototype = Object.create( GIScene.Control.prototype );
