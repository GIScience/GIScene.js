/**
 * This Control enables to render a Scene with a Screen Space Ambient Occlusion (SSAO) effect.
 * 
 * @namespace GIScene
 * @class Control.SSAO
 * @constructor
 * @extends GIScene.Control
 */
GIScene.Control.SSAO = function() {
	
	//inherit
	GIScene.Control.call(this);
	
	var scenePass;
	var ssaoEffect;
	var fxaaEffect;
	var depthTarget;
	var depthShader;
	var depthUniforms;
	var depthMaterial;
	var depthCam;
	var activeCam;
	
	var updateDepthCam = function() {
		
		// if(depthCam !== undefined && depthCam.parent !== undefined){
			// this.scene.camera.remove(depthCam);
		// }
		
		//depthCam
		activeCam = (this.scene.camera instanceof THREE.CombinedCamera)? 
							( (this.scene.camera.inPerspectiveMode)? this.scene.camera.cameraP : this.scene.camera.cameraO ) 
						: 
							this.scene.camera;
						
		depthCam = activeCam.clone();
		this.scene.camera.add(depthCam);
		
		// depthCam = new THREE.PerspectiveCamera();
		// //POSITION
		// depthCam.fov	= activeCam.fov;
		// depthCam.aspect = activeCam.aspect;
		depthCam.near	= 0.1;
		depthCam.far	= 1000;
		depthCam.updateProjectionMatrix();
		//console.log(depthCam);
		//updateSsaoUniforms();//mca
		
	}.bind(this);
	
	var updateSsaoUniforms = function() {
		ssaoEffect.uniforms[ 'tDepth' ].value = depthTarget;
		ssaoEffect.uniforms[ 'size' ].value.x = this.scene.canvas.width;
		ssaoEffect.uniforms[ 'size' ].value.y = this.scene.canvas.height;
		ssaoEffect.uniforms[ 'cameraNear' ].value = depthCam.near;
		ssaoEffect.uniforms[ 'cameraFar' ].value = depthCam.far;
	}.bind(this);
	
	var onBeforeRender = function() {
// activeCam = (this.scene.camera instanceof THREE.CombinedCamera)? 
							// ( (this.scene.camera.inPerspectiveMode)? this.scene.camera.cameraP : this.scene.camera.cameraO ) 
						// : 
							// this.scene.camera;
		// activeCam = this.scene.camera.cameraP.clone();
// 							
		this.scene.root.overrideMaterial = depthMaterial;//new THREE.MeshDepthMaterial({blending: THREE.NoBlending});
		// activeCam.near = 0.1;
		// activeCam.far = 1500;
		// activeCam.updateProjectionMatrix();
		this.scene.renderer.clearTarget(depthTarget,true, true, false); //color, depth, stencil
		this.scene.renderer.render(this.scene.root, depthCam, depthTarget);
		
		// activeCam.near = this.scene.config.near;
		// activeCam.far = this.scene.config.far;
		// activeCam.updateProjectionMatrix();
		this.scene.root.overrideMaterial = null;
// 		
		// this.scene.root.overrideMaterial = null;

	}.bind(this); 
	
	var onChangedProjection = function(event) {
		console.log("chPrj2",activeCam);
		updateDepthCam();
		
	};
	
	var onResize = function() {
		
		updateDepthCam();
		depthTarget = new THREE.WebGLRenderTarget( this.scene.canvas.width, this.scene.canvas.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
		updateSsaoUniforms();
		fxaaEffect.uniforms[ 'resolution' ].value.set( 1 / this.scene.canvas.width, 1 / this.scene.canvas.height );
		
	}.bind(this);
	
	this.activate_ = function() {
		if(!this.isActive){


		scenePass = new THREE.RenderPass( this.scene.root, this.scene.camera );
		ssaoEffect = new THREE.ShaderPass( THREE.SSAOShader );
		
		depthTarget = new THREE.WebGLRenderTarget( this.scene.canvas.width, this.scene.canvas.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
		depthShader = THREE.ShaderLib[ "depthRGBA" ];
		depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );
		depthMaterial = new THREE.ShaderMaterial( { fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms } );
		depthMaterial.blending = THREE.NoBlending;
		
		this.scene.addEventListener('beforeRender', onBeforeRender);
					// function(){
		// 		
					// this.scene.root.overrideMaterial = depthMaterial;//new THREE.MeshDepthMaterial({blending: THREE.NoBlending});
					// this.scene.camera.cameraP.near = 0.1;
					// this.scene.camera.cameraP.far = 1500;
					// this.scene.camera.cameraP.updateProjectionMatrix();
					// this.scene.renderer.clearTarget(depthTarget,true, true, true);
					// this.scene.renderer.render(this.scene.root, this.scene.camera, depthTarget);
		// 			
					// this.scene.camera.cameraP.near = this.scene.config.near;
					// this.scene.camera.cameraP.far = this.scene.config.far;
					// this.scene.camera.cameraP.updateProjectionMatrix();
					// this.scene.root.overrideMaterial = null;
		// 		
				// }.bind(this)
			// );
			
		ssaoEffect.uniforms[ 'tDepth' ].value = depthTarget;
		ssaoEffect.uniforms[ 'size' ].value.x = this.scene.canvas.width;
		ssaoEffect.uniforms[ 'size' ].value.y = this.scene.canvas.height;
		ssaoEffect.uniforms[ 'cameraNear' ].value = this.scene.camera.near;
		ssaoEffect.uniforms[ 'cameraFar' ].value = this.scene.camera.far;
		ssaoEffect.uniforms[ 'onlyAO' ].value = 1;
		ssaoEffect.renderToScreen = true;
		
		this.scene.effectComposer.addPass(scenePass);
		this.scene.effectComposer.addPass(ssaoEffect);

}

			//call super class method
			GIScene.Control.prototype.activate.call(this);
	};
	
	this.activate = function() {
		if(!this.isActive){
			
			//depth map
			depthTarget = new THREE.WebGLRenderTarget( this.scene.canvas.width, this.scene.canvas.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
				depthShader = THREE.ShaderLib[ "depthRGBA" ];
				depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );
			depthMaterial = new THREE.ShaderMaterial( { fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms } );
				depthMaterial.blending = THREE.NoBlending;
			
			//depthCam
			updateDepthCam();
			
			//define passes
			scenePass  = new THREE.RenderPass( this.scene.root, this.scene.camera );
			ssaoEffect = new THREE.ShaderPass( THREE.SSAOShader );
			fxaaEffect = new THREE.ShaderPass( THREE.FXAAShader );
		
			updateSsaoUniforms();
			ssaoEffect.renderToScreen = true;
			fxaaEffect.uniforms[ 'resolution' ].value.set( 1 / this.scene.canvas.width, 1 / this.scene.canvas.height );
			fxaaEffect.renderToScreen = false;
			//add beforeRender Event
			this.scene.addEventListener('beforeRender2', onBeforeRender);
		
			//be sure, there are no other passes active
			//add passes
			this.scene.effectComposer.passes = [scenePass, fxaaEffect, ssaoEffect];
			// this.scene.effectComposer.addPass(scenePass);
			// this.scene.effectComposer.addPass(ssaoEffect);
			
			
			
			//add other events
			window.addEventListener('resize', onResize, false);
			this.scene.camera.addEventListener('changedProjection', onChangedProjection);
			
			//call super class method
			GIScene.Control.prototype.activate.call(this);
		}
	};
	
	this.deactivate = function() {
	if(this.isActive){
		
		//remove passes
		this.scene.effectComposer.passes = [];
		
		//remove depthCam
		this.scene.camera.remove(depthCam);
		
		//remove Events
		this.scene.removeEventListener('beforeRender2', onBeforeRender);
		window.removeEventListener('resize', onResize, false);
		this.scene.camera.removeEventListener('changedProjection', onChangedProjection);
		
		//call super class method
		GIScene.Control.prototype.deactivate.call(this);
	}
	};
	
};

GIScene.Control.SSAO.prototype = Object.create(GIScene.Control.prototype);