/**
 * Loader class to load different formats
 * 
 * @namespace GIScene
 * @class ModelLoader
 * @constructor
 * 
 */

GIScene.ModelLoader = function () {
	
	this.url    = null;
	this.format = null;
	var usercallback = null;
	this.loader = null;
	
	var callback = function(geometry, materials){
		
		// console.log("ModelLoader:callback()");
		
		if(this.format == GIScene.Format.Scene){
			var result = geometry.scene; //SceneLoader returns a result object not geometry
		}
		
		else {//callback for other formats than GIScene.Format.Scene

			//Mesh or Points (ParticleSystem)?
			// var objectType = (geometry.faces.length == 0) ? "ParticleSystem" : "Mesh"; //-r76
			var objectType = (geometry.index && geometry.index.count != 0) ? "Mesh" : "Points"; //+r76		
			
			//if material is defined use it else use default material
			
			if (materials && materials.length != 0 /*no empty array*/) {

				//MeshFaceMaterial 
				if (materials.length >= 2) {
					materials = new THREE.MeshFaceMaterial(materials);
				} else if (!materials[0].map && materials[0].name.toLowerCase() == "default") {
					//if there is only a debug material use a default MeshLambert or ParticleMaterial 
					if (objectType == "Mesh"){
					materials = new THREE.MeshLambertMaterial({
						color : 0xD2B48C, //0xFFFF66(gelb),
						ambient : 0x8B7355, //0x7B7B33,
						emissive : 0x000000,
						shading : THREE.FlatShading
					});
					} else {
						// materials = new THREE.ParticleBasicMaterial({color: new THREE.Color(0x0), size:0.2}); //brown 0xD2B48C //-r76
						materials = new THREE.PointsMaterial({color: new THREE.Color(0x0), size:0.2}); //brown 0xD2B48C //+r76
					}
				// } else if ( objectType == "ParticleSystem" ){ //-r76
				} else if ( objectType == "Points" ){ //+r76
					// if Points (ParticleSystem) try to use some of the MeshMaterialProperties
					materials[0].size = 0.2;
					materials[0].vertexColors = THREE.VertexColors;
					// materials = new THREE.ParticleBasicMaterial( materials[0] ); //-r76
					materials = new THREE.PointsMaterial( materials[0] ); //+r76					
				}else {
					// Material is Mesh Basic, Lambert or Phong Material as specified in file
					materials = materials[0];
				}
				
			} else {
				//no material defined: guess one!
				
				//Meshes
				if (objectType == "Mesh"){
					//Meshes with vertexColors
					if (geometry.faces[0].vertexColors.length > 0) {
						materials = new THREE.MeshLambertMaterial({
							shading : THREE.FlatShading,
							vertexColors : THREE.VertexColors
						});
					} else if (geometry.faces[0].color.getHex() != 0xFFFFFF ) {
						// Meshes with faceColors (white is default so if set it will probably differ)
						materials = new THREE.MeshLambertMaterial({
							shading : THREE.FlatShading,
							vertexColors : THREE.FaceColors
						});
					} else {
						//default fallback material
						materials = new THREE.MeshLambertMaterial({
						color : 0xD2B48C, //0xFFFF66(gelb),
						ambient : 0x8B7355, //0x7B7B33,
						emissive : 0x000000,
						shading : THREE.FlatShading
					});
					}
				}//is Mesh end
				
				//ParticleSystems
				else{
					materials =undefined;//= new THREE.ParticleBasicMaterial({ vertexColors: THREE.VertexColors , size:0.2}); //0xD2B48C brown
				}
			}

			
			
// 			
			// if (!materials || materials.length == 0 || (materials.length == 1 && !materials[0].map && materials[0].name.toLowerCase() == "default")) {
				// //particles
// 
				// if (geometry.faces.length == 0) {
					// alert('particles');
					// materials = new THREE.ParticleBasicMaterial({
						// size : 1
					// });
				// } else
				// //@TODO how to determine Lines?
				// //if geometry has vertexColors other material
				// if (geometry.faces[0].vertexColors.length > 0) {
					// materials = new THREE.MeshLambertMaterial({
						// // color : 0xD2B48C, //0xFFFF66(gelb),
						// // ambient: 0x8B7355, //0x7B7B33,
						// // emissive : 0x000000,
						// shading : THREE.FlatShading,
						// vertexColors : THREE.VertexColors
					// });
				// } else {
					// materials = new THREE.MeshLambertMaterial({
						// color : 0xD2B48C, //0xFFFF66(gelb),
						// ambient : 0x8B7355, //0x7B7B33,
						// emissive : 0x000000,
						// shading : THREE.FlatShading,
						// // vertexColors:THREE.VertexColors
					// });
				// }
			// } else {
				// materials = new THREE.MeshFaceMaterial(materials);
			// }
			
			geometry.dynamic = true;

			var mesh = new THREE[ objectType ](geometry, materials); //Mesh or Points (ParticleSystem)

			var result = new THREE.Scene();

			result.add(mesh);
		}
					
			
		/** The load event is triggered after a model/scene has been loaded from an asynchronous XmlHttpRequest.
		 *	The returned event object has a content property with a THREE.Scene() Object containing the model as child.
		 *  @event load 
		 */
		this.dispatchEvent( { type: 'load', content: result } );
		if(usercallback)usercallback(result);
	}.bind(this);
	
	var callbackCTM = function(geometry) { //BufferGeometry
		
		var material;
		
		//find out if has vertex colors
		if ("color" in geometry.attributes){
			material = new THREE.MeshLambertMaterial({
							//shading : THREE.FlatShading,
							vertexColors : THREE.VertexColors
						});
		} else { //@TODO check for faceColors
			//default fallback material
			material = new THREE.MeshLambertMaterial({
			color : 0xD2B48C, //0xFFFF66(gelb),
			ambient : 0x8B7355, //0x7B7B33,
			emissive : 0x000000,
			//shading : THREE.FlatShading
		});
		}
		
		var mesh = new THREE.Mesh(geometry, material); 

		var result = new THREE.Scene();

		result.add(mesh);
		
		/** The load event is triggered after a model/scene has been loaded from an asynchronous XmlHttpRequest.
		 *	The returned event object has a content property with a THREE.Scene() Object containing the model as child.
		 *  @event load 
		 */
		this.dispatchEvent( { type: 'load', content: result } );
		if(usercallback)usercallback(result);
		
	}.bind(this);
	
	/**
	 * load function to load Models from different formats. 
	 * 
	 * @method load
	 * @param {String} url
	 * @param {Integer} format use constants defined in GIScene.Format
	 * 
	 * 
	 * To get the resulting THREE.Scene() Object add an event listener on 'load':
	 * @example
	 modelLoader.addEventListener('load', onload);
	 modelLoader.load(url, format);
	 * 
	 * 
	 */
	
	this.load = function(url, format, onSuccess, onProgress, onError){
		var retries = 5;
		usercallback = onSuccess;
		/** The load event is triggered before a model/scene will be loaded
		 *
		 *  @event beforeLoad 
		 */
		this.dispatchEvent( { type: 'beforeLoad', content: null } );
		
		this.url = url;
		this.format = format;
		
		switch (format){
			case GIScene.Format.JSON:
				this.loader = new THREE.JSONLoader();
				// loader.withCredentials = true;
				// loader.crossOrigin = 'use-credentials';
				this.loader.load(url, callback);
				break;	
			case GIScene.Format.JSONBinary:
				this.loader = new THREE.BinaryLoader();
				// loader.withCredentials = true;
				// loader.crossOrigin = 'use-credentials';
				this.loader.load(url, callback);
				break;
			case GIScene.Format.CTM:
				this.loader = new THREE.CTMLoader();
				//loader.withCredentials = true;
				// loader.crossOrigin = 'use-credentials';
				this.loader.load(url, callbackCTM, {useWorker:true, useBuffers:false});
				break;
			case GIScene.Format.Scene:
				this.loader = new THREE.SceneLoader();
				
				var onSceneError = function(event) {
					retries--;
		            if(retries > 0) {
		                console.log("Retrying...: "+url);
		                setTimeout(function(){this.loader.load(url, callback, onProgress, onSceneError);}.bind(this), 1000);
		            } else {
		                //I tried and I tried, but it just wouldn't work!
		                console.error("Tried 5 times without success: " + url);
		                onError(event);
		            }
					
					
					// this.loader.load(url, callback, onProgress, onError);
				}.bind(this);
				
				// this.loader.loader.request.withCredentials = true; //???
				// this.loader.crossOrigin = 'use-credentials';
				this.loader.load(url, callback, onProgress, onSceneError); //onError
				break;
			default:
				console.log('Unknown Format. - GIScene/ModelLoader.js');			
		};
		// return loader;
	};
	
	/**
	 * abort function to abort a running request
	 * fires an abort event
	 * 
	 * @method abort
	 *  
	 */
	this.abort = function() {
		if(this.loader.loader && this.loader.loader.request){ //Only for Sceneloader at the moment
			this.loader.loader.request.abort();
			/** The abort event is triggered after a model/scene request was aborted
			 *
			 *  @event abort 
			 */
			this.dispatchEvent( { type: 'abort', content: null } );
		}
		else{console.log("abort for this loader not yet implemented.");}
	};
};



//Provide EventDispatcher Functions
GIScene.ModelLoader.prototype = {
	
	constructor : GIScene.ModelLoader,
	
	addEventListener: THREE.EventDispatcher.prototype.addEventListener,
	hasEventListener: THREE.EventDispatcher.prototype.hasEventListener,
	removeEventListener: THREE.EventDispatcher.prototype.removeEventListener,
	dispatchEvent: THREE.EventDispatcher.prototype.dispatchEvent
	
};