/**
 * Edge Detection Control to render scenes with FreiChen Filter 
 * 
 * @namespace GIScene
 * @class Control.EdgeDetectionFreiChen
 * @constructor
 * @extends GIScene.Control
 */

GIScene.Control.EdgeDetectionFreiChen = function() {
	
	//inherit
	GIScene.Control.call(this);
	
	var scenePass = null;
	var edgeEffect = null;
	var intensity = 1.0; // 0.0 ... 1.0
	var invert = 1.0; //black on white 0.0 || 1.0
	var threshold = 0.5; // 0.0 ... 1.0
	
	var onResize = function() {
		
		edgeEffect.uniforms[ 'aspect' ].value.set(this.scene.canvas.width,this.scene.canvas.height);
		fxaaEffect.uniforms[ 'resolution' ].value.set( 1 / this.scene.canvas.width, 1 / this.scene.canvas.height );
		
	}.bind(this);
	
	this.setIntensity = function(value) {
		intensity = value;
		if(edgeEffect){edgeEffect.uniforms[ 'intensity' ].value = intensity;}
	};
	
	this.getIntensity = function() {
		return intensity;
	};
	
	this.setThreshold = function(value){
		threshold = value;
		if(edgeEffect){edgeEffect.uniforms[ 'threshold' ].value = threshold;}
	};
	
	this.getThreshold = function() {
		return threshold;
	};
	
	this.invert = function() {
		invert = (invert == 1.0)? 0.0 : 1.0;
		if(edgeEffect){edgeEffect.uniforms[ 'invert' ].value = invert;}
	};
	
	this.activate = function() {
		if(!this.isActive){
depthShader = THREE.ShaderLib[ "depthRGBA" ];
		depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );
		depthMaterial = new THREE.ShaderMaterial( { fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms } );
		depthMaterial.blending = THREE.NoBlending;
		// depthMaterial.uniforms.mNear.value = 0.1;
		// depthMaterial.uniforms.mFar.value = 1;
		
			scenePass = new THREE.RenderPass( this.scene.root, this.scene.camera /*, depthMaterial*/ );
			
			unpackDepthRGBAEffect = new THREE.ShaderPass( THREE.UnpackDepthRGBAShader );
			unpackDepthRGBAEffect.renderToScreen = false;
			
			edgeEffect = new THREE.ShaderPass( THREE.EdgeShader );
			edgeEffect.uniforms[ 'aspect' ].value.set(this.scene.canvas.width,this.scene.canvas.height);
			edgeEffect.uniforms[ 'intensity' ].value = intensity;
			edgeEffect.uniforms[ 'invert' ].value = invert;
			edgeEffect.uniforms[ 'threshold' ].value = threshold;
			edgeEffect.renderToScreen = false;
			
			fxaaEffect = new THREE.ShaderPass( THREE.FXAAShader );
			fxaaEffect.uniforms[ 'resolution' ].value.set( 1 / this.scene.canvas.width, 1 / this.scene.canvas.height );
			fxaaEffect.renderToScreen = true;
			
			this.scene.effectComposer.addPass(scenePass);
			//this.scene.effectComposer.addPass(unpackDepthRGBAEffect);
			this.scene.effectComposer.addPass(edgeEffect);
			this.scene.effectComposer.addPass(fxaaEffect);
			
			//register events
			window.addEventListener('resize', onResize, false);
			
			//call super class method
			GIScene.Control.prototype.activate.call(this);
			
		}
	};
		
	this.deactivate = function() {
		if(this.isActive){
			
			//remove passes
			this.scene.effectComposer.passes = [];
			
			//remove Events
			window.removeEventListener('resize', onResize, false);
			
			
			//call super class method
			GIScene.Control.prototype.deactivate.call(this);
		}
	};
	
};

GIScene.Control.EdgeDetectionFreiChen.prototype = Object.create(GIScene.Control.prototype);
