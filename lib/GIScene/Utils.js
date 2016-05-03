/**
 * Utility Class with convenience functions stored in a central place. 
 *
 * @namespace GIScene
 * @class Utils
 * @static 
 */
GIScene.Utils = {
	
	WorkingMaterial : {
		//set internal working material flag in a bitmask containing info about changed material propeties
		setFlag: function(object, materialPropertyName, propertyValue, FLAGCONSTANT) {
			
			//set or clear the flag
							 
			//if default clear flag: object.userData.workingMaterialFlags &= ~GIScene.WORKINGMATERIALFLAGS.VERTEXCOLORS;
			 if (propertyValue == 'default'){ object.userData.workingMaterialFlags &= ~FLAGCONSTANT; }
			 //else
			 else{
				 //if multi
				 if ("materials" in object.material){
				 	//check isHomogenous
				 	var isHomogenous = null;
				 	for (var i=1; i < object.userData.originalMaterial.materials.length; i++){
				 		if(propertyValue instanceof THREE.Color){
				 			isHomogenous = (object.userData.originalMaterial.materials[0][materialPropertyName].equals(object.userData.originalMaterial.materials[i][materialPropertyName]));
				 		}
				 		else{
				 			isHomogenous = (object.userData.originalMaterial.materials[0][materialPropertyName] == object.userData.originalMaterial.materials[i][materialPropertyName]);
				 		}
				 		
				 		
				 		if(!isHomogenous){break;}
				 	}
				 	//if isHomogenous
				 	if(isHomogenous){
				 		//if newVC != object.userData.originalMaterial.materials[0].vertexColors : set flag |=
				 		if(propertyValue instanceof THREE.Color){
				 			if(!propertyValue.equals(object.userData.originalMaterial.materials[0][materialPropertyName])){ object.userData.workingMaterialFlags |= FLAGCONSTANT; }
					 		//else clear flag &= ~
					 		else{object.userData.workingMaterialFlags &= ~FLAGCONSTANT;}
				 		}
				 		else{
				 			if(propertyValue != object.userData.originalMaterial.materials[0][materialPropertyName]){ object.userData.workingMaterialFlags |= FLAGCONSTANT; }
					 		//else clear flag &= ~
					 		else{object.userData.workingMaterialFlags &= ~FLAGCONSTANT;}
				 		}
				 		
				 		
				 	}
				 	//else (not homogenous)
				 	else{	
				 		//set flag: set flag |=
				 		object.userData.workingMaterialFlags |= FLAGCONSTANT;
				 	}
				 }
				 //else (single)
				 else{
				 	//if newVC != object.userData.originalMaterial.vertexColors : set flag |=
				 	if(propertyValue instanceof THREE.Color){
				 		if(!propertyValue.equals(object.userData.originalMaterial[materialPropertyName])){ object.userData.workingMaterialFlags |= FLAGCONSTANT; }
				 		//else clear flag &= ~
			 			else{object.userData.workingMaterialFlags &= ~FLAGCONSTANT;}
				 	}
				 	else{
				 		if(propertyValue != object.userData.originalMaterial[materialPropertyName]){ object.userData.workingMaterialFlags |= FLAGCONSTANT; }
				 		//else clear flag &= ~
			 			else{object.userData.workingMaterialFlags &= ~FLAGCONSTANT;}
				 	}
				 	
			 		
			 		
				 }
			 }
			
		},
		
		/* find out if original material was changed in a specific way*/
		isSetFlag : function(object, workingMaterialFlagConstant) {
			
			if("workingMaterialFlags" in object.userData){
				return !!(object.userData.workingMaterialFlags & workingMaterialFlagConstant); //Bit operation
			}
			else{
				return false;
			}
			
		},
		
		
		getValues : function(object) {
			
			//collect values
			var values = {};
			
			if( GIScene.Utils.WorkingMaterial.isSetFlag( object, GIScene.WORKINGMATERIALFLAGS.SELECT		) ) { values["setSelectColor"]  = object.material.emissive.clone(); };
			if( GIScene.Utils.WorkingMaterial.isSetFlag( object, GIScene.WORKINGMATERIALFLAGS.WIRE   		) ) { values["setWireframe"]    = object.material.wireframe; };
			if( GIScene.Utils.WorkingMaterial.isSetFlag( object, GIScene.WORKINGMATERIALFLAGS.SHADING		) ) { values["setShading"]      = object.material.shading; };
			if( GIScene.Utils.WorkingMaterial.isSetFlag( object, GIScene.WORKINGMATERIALFLAGS.SIDE   		) ) { values["setFaceCulling"]  = object.material.side; };
			if( GIScene.Utils.WorkingMaterial.isSetFlag( object, GIScene.WORKINGMATERIALFLAGS.MAP    		) ) { values["setTexturing"]    = false; }; //if there is a bit flag it can only be false. Otherwise everything stays as default
			if( GIScene.Utils.WorkingMaterial.isSetFlag( object, GIScene.WORKINGMATERIALFLAGS.OPACITY		) ) { values["setOpacity"] 	    = object.material.opacity; };
			if( GIScene.Utils.WorkingMaterial.isSetFlag( object, GIScene.WORKINGMATERIALFLAGS.VERTEXCOLORS	) ) { values["setVertexColors"] = object.material.vertexColors; };
			if( GIScene.Utils.WorkingMaterial.isSetFlag( object, GIScene.WORKINGMATERIALFLAGS.DIFFUSE		) ) { values["setDiffuseColor"]	= object.material.color.clone(); };
			if( GIScene.Utils.WorkingMaterial.isSetFlag( object, GIScene.WORKINGMATERIALFLAGS.AMBIENT		) ) { values["setAmbientColor"]	= object.material.ambient.clone(); };
						
			
			return values;
			
		},
		
		setValues : function(object, values) { //values object created by getValues
			
			//setValues
			for (value in values){
				GIScene.Utils.WorkingMaterial[value](object, values[value]); 
			}
			
		},
		
		setWireframe : function (object, wireframeMode){ // 'default'|true|false
			
			if (object.material && !((object instanceof THREE.Sprite)||(object instanceof THREE.ParticleSystem))) {
				
				if(!object.userData.originalMaterial){
					// if no working material exists create one 
					object.userData.originalMaterial = object.material;
					object.material = object.userData.originalMaterial.clone();
					//set flag
					object.userData.workingMaterialFlags = 0;//GIScene.WORKINGMATERIALFLAGS.WIRE;
				}
				
				//no wm --> create and set flag and mode
					
				//else wm exists --> check if new mode == original
				// /*else*/ if (isTrue != object.userData.originalMaterial.wireframe){
				// /*else*/ if (isTrue != object.material.wireframe){
					// //remove (toggle) flag
					// object.userData.workingMaterialFlags ^= GIScene.WORKINGMATERIALFLAGS.WIRE;	
				// }
				
				GIScene.Utils.WorkingMaterial.setFlag(object,'wireframe',wireframeMode,GIScene.WORKINGMATERIALFLAGS.WIRE);
				
				//set property
				
				//for multimaterial objects
						if("materials" in object.material){
							object.material.materials.forEach(
								function (e,i,a){
									if(wireframeMode == "default"){
										a[i].wireframe = object.userData.originalMaterial.materials[i].wireframe;
									}
									else {
										a[i].wireframe = wireframeMode;
									}
									
								}
							);
						}
						
						// for single material objects
						else {
							if(wireframeMode == "default"){
										object.material.wireframe = object.userData.originalMaterial.wireframe;
									}
									else {
										object.material.wireframe = wireframeMode;
									}
						}
				
				//check if wm still in use --> false remove wm and switch to orignal
				if(object.userData.workingMaterialFlags == 0){
						//change back to original material
						object.material = object.userData.originalMaterial;
						object.userData.originalMaterial = null;
						delete object.userData.originalMaterial;
				}
			}
			
		},
		setTexturing : function (object, texturingMode){ // 'default', true, false
			
			if (object.material && !((object instanceof THREE.Sprite)||(object instanceof THREE.ParticleSystem))) {
				
				if(!object.userData.originalMaterial){
					// if no working material exists create one 
					object.userData.originalMaterial = object.material;
					object.material = object.userData.originalMaterial.clone();
					//set flag
					object.userData.workingMaterialFlags = 0; //GIScene.WORKINGMATERIALFLAGS.MAP;
				}
				
				//no wm --> create and set flag and mode
					
				// //else wm exists --> check if new mode == original
				// /*else*/ if (isTrue == (!!object.userData.originalMaterial.map) ){ //!! converts object to true and null to false
					// //remove (toggle) flag
					// object.userData.workingMaterialFlags ^= GIScene.WORKINGMATERIALFLAGS.MAP;	
				// }
				
				var propertyValue;
				switch (texturingMode){
					case 'default'	: propertyValue = 'default';
										break;
					case true		: texturingMode = propertyValue = 'default'; //propertyValue = ('materials' in object.material)? object.userData.originalMaterial.materials[0].map : object.userData.originalMaterial.map; 
										break;
					case false		: propertyValue = null;
										break;
					default			: console.log("'setTexturing':  No such texturingMode: "+ texturingMode);
				}
				
				GIScene.Utils.WorkingMaterial.setFlag(object, 'map', propertyValue, GIScene.WORKINGMATERIALFLAGS.MAP);
				
				//set property
				
				//for multimaterial objects
						if("materials" in object.material){
							object.material.materials.forEach(
								function (e,i,a){
									if(texturingMode == 'default'){
										var isTrue = (!!object.userData.originalMaterial.materials[i].map);
									}
									else{
										var isTrue = texturingMode;
									}
									
									var mapValue = (isTrue)? ((!!object.userData.originalMaterial.materials[i].map)? object.userData.originalMaterial.materials[i].map.clone() : null) : null;
									a[i].map = mapValue;
									if(a[i].map != null)a[i].map.needsUpdate = true;
									a[i].needsUpdate = true;
									
								}
							);
						}
						
						// for single material objects
						else {
							if(texturingMode == 'default'){
								var isTrue = (!!object.userData.originalMaterial.map);
							}
							else{
								var isTrue = texturingMode;
							}
							var mapValue = (isTrue)? ((!!object.userData.originalMaterial.map)? object.userData.originalMaterial.map.clone() : null) : null;
							object.material.map = mapValue;
							if(object.material.map != null)object.material.map.needsUpdate = true;
							object.material.needsUpdate = true;
							
						}
				
				//check if wm still in use --> false remove wm and switch to orignal
				if(object.userData.workingMaterialFlags == 0){
						//change back to original material
						object.material = object.userData.originalMaterial;
						object.userData.originalMaterial = null;
						delete object.userData.originalMaterial;
				}
			}
			
		},
		
		/**
		 * Sets the face culling mode for an object
		 * 
		 * @method setFaceCulling
		 * @param {THREE.FrontSide || THREE.BackSide || THREE.DoubleSide || 'default'} faceCullingMode
		 */
		setFaceCulling : function (object, faceCullingMode){
			
			if (object.material && !((object instanceof THREE.Sprite)||(object instanceof THREE.ParticleSystem))) {
				if(!object.userData.originalMaterial){
					// if no working material exists create one 
					object.userData.originalMaterial = object.material;
					object.material = object.userData.originalMaterial.clone();
					//set flag
					object.userData.workingMaterialFlags = 0;//GIScene.WORKINGMATERIALFLAGS.SIDE;
				}
				
				// //no wm --> create and set flag and mode
// 					
				// //else wm exists --> check if new mode == original
				// /*else*/ if (faceCullingMode == object.userData.originalMaterial.side || faceCullingMode == 'default'){
					// //remove (toggle) flag
					// object.userData.workingMaterialFlags ^= GIScene.WORKINGMATERIALFLAGS.SIDE;	
				// }
				
				//set flag
				GIScene.Utils.WorkingMaterial.setFlag(object, 'side', faceCullingMode, GIScene.WORKINGMATERIALFLAGS.SIDE);
				
				//set property
				
				function setFC(material, faceCullingMode){
					material.side = faceCullingMode;
					material.needsUpdate = true;
				}
				
				//for multimaterial objects
						if("materials" in object.material){
							object.material.materials.forEach(
								function (e,i,a){
									if(faceCullingMode == 'default'){
										var FCValue = object.userData.originalMaterial.materials[i].side;
										// a[i].side = object.userData.originalMaterial.materials[i].side;
										// a[i].needsUpdate = true;
									}
									else{
										var FCValue = faceCullingMode;
										// a[i].side = faceCullingMode;
										// a[i].needsUpdate = true;
									}
									setFC(a[i],FCValue);
								}
							);
						}
						
						// for single material objects
						else {
							if(faceCullingMode == 'default'){
								var FCValue = object.userData.originalMaterial.side;
								// object.material.side = object.userData.originalMaterial.side;
								// object.material.needsUpdate = true;
							}
							else{
								var FCValue = faceCullingMode;
								// object.material.side = faceCullingMode;
								// object.material.needsUpdate = true;
							}
							setFC(object.material, FCValue);
						}
				
				//check if wm still in use --> false remove wm and switch to orignal
				if(object.userData.workingMaterialFlags == 0){
						//change back to original material
						object.material = object.userData.originalMaterial;
						object.userData.originalMaterial = null;
						delete object.userData.originalMaterial;
				}
				
			}
			
		},
		/**
		 * Sets the vertex color mode for an object
		 * 
		 * @method setVertexColors
		 * @param {THREE.NoColors || THREE.FaceColors || THREE.VertexColors || 'default'} vertexColorMode
		 */
		setVertexColors : function (object, vertexColorMode){
			
			
			if (object.material && !((object instanceof THREE.Sprite)||(object instanceof THREE.ParticleSystem))) {
				if(!object.userData.originalMaterial){
					// if no working material exists create one 
					object.userData.originalMaterial = object.material;
					object.material = object.userData.originalMaterial.clone();
					//set flag
					object.userData.workingMaterialFlags = 0;//GIScene.WORKINGMATERIALFLAGS.VERTEXCOLORS;
				}
				
				//no wm --> create and set flag and mode
					
				//else wm exists --> check if new mode == original
				// /*else*/ if (vertexColorMode == object.userData.originalMaterial.vertexColors || vertexColorMode == 'default'){
					
							 //set or clear the flag
							 GIScene.Utils.WorkingMaterial.setFlag(object,'vertexColors',vertexColorMode,GIScene.WORKINGMATERIALFLAGS.VERTEXCOLORS);
							 
							 // //if default clear flag: object.userData.workingMaterialFlags &= ~GIScene.WORKINGMATERIALFLAGS.VERTEXCOLORS;
							 // if (vertexColorMode == 'default'){ object.userData.workingMaterialFlags &= ~GIScene.WORKINGMATERIALFLAGS.VERTEXCOLORS; }
							 // //else
							 // else{
								 // //if multi
								 // if ("materials" in object.material){
								 	// //check isHomogenous
								 	// var isHomogenous = null;
								 	// for (var i=1; i < object.userData.originalMaterial.materials.length; i++){
								 		// isHomogenous = (object.userData.originalMaterial.materials[0].vertexColors == object.userData.originalMaterial.materials[i].vertexColors);
								 		// if(!isHomogenous){break;}
								 	// }
								 	// //if isHomogenous
								 	// if(isHomogenous){
								 		// //if newVC != object.userData.originalMaterial.materials[0].vertexColors : set flag |=
								 		// if(vertexColorMode != object.userData.originalMaterial.materials[0].vertexColors){ object.userData.workingMaterialFlags |= GIScene.WORKINGMATERIALFLAGS.VERTEXCOLORS; }
								 		// //else clear flag &= ~
								 		// else{object.userData.workingMaterialFlags &= ~GIScene.WORKINGMATERIALFLAGS.VERTEXCOLORS;}
								 	// }
								 	// //else (not homogenous)
								 	// else{	
								 		// //set flag: set flag |=
								 		// object.userData.workingMaterialFlags |= GIScene.WORKINGMATERIALFLAGS.VERTEXCOLORS;
								 	// }
								 // }
								 // //else (single)
								 // else{
								 	// //if newVC != object.userData.originalMaterial.vertexColors : set flag |=
								 	// if(vertexColorMode != object.userData.originalMaterial.vertexColors){ object.userData.workingMaterialFlags |= GIScene.WORKINGMATERIALFLAGS.VERTEXCOLORS; }
							 		// //else clear flag &= ~
							 		// else{object.userData.workingMaterialFlags &= ~GIScene.WORKINGMATERIALFLAGS.VERTEXCOLORS;}
								 // }
							 // }
							 
							 
							 //check multiIsHomogenous
							 //if multiIsHomogenous == false: setMask : object.userData.workingMaterialFlags |= GIScene.WORKINGMATERIALFLAGS.VERTEXCOLORS;
							 //else 
							 //if newVCMode != 
							 
							 // var newVCMode = (vertexColorMode == 'default')? object.userData.originalMaterial.vertexColors : vertexColorMode;
					// /*else*/ if (newVCMode != object.userData.originalMaterial.vertexColors || vertexColorMode == 'default'){
					//remove (toggle) flag
					// console.log("remove workingmaterial vertexColors");
					// object.userData.workingMaterialFlags ^= GIScene.WORKINGMATERIALFLAGS.VERTEXCOLORS;	
					// console.log(object.userData.workingMaterialFlags);
				// }
				//set property
				
				//for multimaterial objects
				if("materials" in object.material){
					object.material.materials.forEach(
								function (e,i,a){
									if(vertexColorMode == 'default'){
										a[i].vertexColors = object.userData.originalMaterial.materials[i].vertexColors;
										a[i].color = object.userData.originalMaterial.materials[i].color;
										a[i].ambient = object.userData.originalMaterial.materials[i].ambient;
										a[i].needsUpdate = true;
									}
									else{
										if (object.geometry.faces[0].vertexColors.length > 0) {
											
											a[i].vertexColors = vertexColorMode;
											
											if(vertexColorMode == THREE.NoColors){
												a[i].color = new THREE.Color(0xFFFFFF);
												a[i].ambient = new THREE.Color(0x999999);
											}else
											{
												a[i].color = new THREE.Color(0xFFFFFF);
												a[i].ambient = new THREE.Color(0xFFFFFF);
											}
											
											a[i].needsUpdate = true;
											
										}
									}
								}
					);
				}
				else {
					//for single material models
					if(vertexColorMode == 'default'){
						object.material.vertexColors = object.userData.originalMaterial.vertexColors;
						object.material.color = object.userData.originalMaterial.color;
						object.material.ambient = object.userData.originalMaterial.ambient;
						object.material.needsUpdate = true;
					}
					else{
						if (object.geometry.faces[0].vertexColors.length > 0) {
							
							object.material.vertexColors = vertexColorMode;
							
							if(vertexColorMode == THREE.NoColors){
								object.material.color = new THREE.Color(0xFFFFFF);
								object.material.ambient = new THREE.Color(0x999999);
							}else
							{
								object.material.color = new THREE.Color(0xFFFFFF);
								object.material.ambient = new THREE.Color(0xFFFFFF);
							}
							
							object.material.needsUpdate = true;
							
						}
					}
				}
				
				//check if wm still in use --> false remove wm and switch to orignal
				if(object.userData.workingMaterialFlags == 0){
						//change back to original material
						object.material = object.userData.originalMaterial;
						object.userData.originalMaterial = null;
						delete object.userData.originalMaterial;
				}
			}
			
		},
		setShading : function (object, shadingMode){
			
			if (object.material && !((object instanceof THREE.Sprite)||(object instanceof THREE.ParticleSystem))) {
				if(!object.userData.originalMaterial){
					// if no working material exists create one 
					object.userData.originalMaterial = object.material;
					object.material = object.userData.originalMaterial.clone();
					//set flag
					object.userData.workingMaterialFlags = 0; //GIScene.WORKINGMATERIALFLAGS.SHADING;
				}
				
				//no wm --> create and set flag and mode
					
				// //else wm exists --> check if new mode == original
				// /*else*/ if (shadingMode == object.userData.originalMaterial.shading || shadingMode == 'default'){
					// //remove (toggle) flag
					// object.userData.workingMaterialFlags ^= GIScene.WORKINGMATERIALFLAGS.SHADING;	
				// }
				
				GIScene.Utils.WorkingMaterial.setFlag(object,'shading',shadingMode,GIScene.WORKINGMATERIALFLAGS.SHADING);
				
				//store originalVertexNormals the first time we are changing this property
				if(!("originalVertexNormals" in object.userData) ) {
					// console.log('store originalVertexNormals');
					object.userData.originalVertexNormals = [];
					for (var i=0,l=object.geometry.faces.length; i<l ;i++){
						// object.userData.originalVertexNormals.push(object.geometry.faces[i].vertexNormals);
						if(object.geometry.faces[i].vertexNormals.length != 0){
							object.userData.originalVertexNormals[object.geometry.faces[i].a] = object.geometry.faces[i].vertexNormals[0].clone();
							object.userData.originalVertexNormals[object.geometry.faces[i].b] = object.geometry.faces[i].vertexNormals[1].clone();
							object.userData.originalVertexNormals[object.geometry.faces[i].c] = object.geometry.faces[i].vertexNormals[2].clone();	
						}
					}
				}
				
				//set property
				if(shadingMode == 'default'){
					//restore originalVertexNormals
					for (var i=0,l=object.geometry.faces.length; i<l ;i++){
						if(object.userData.originalVertexNormals[object.geometry.faces[i].a] == undefined){
							object.geometry.faces[i].vertexNormals = [];
						}
						else{
							object.geometry.faces[i].vertexNormals[0] = object.userData.originalVertexNormals[object.geometry.faces[i].a];
							object.geometry.faces[i].vertexNormals[1] = object.userData.originalVertexNormals[object.geometry.faces[i].b];
							object.geometry.faces[i].vertexNormals[2] = object.userData.originalVertexNormals[object.geometry.faces[i].c];	
						}	
					}
					// console.log('deleting originalVertexNormals');
					object.geometry.__tmpVertices = undefined; //has been set by Geometry.computeVertexNormals()
					delete object.userData.originalVertexNormals;
					
						//for multimaterial objects
						if("materials" in object.material){
							object.material.materials.forEach(
								function (e,i,a){
									a[i].shading = object.userData.originalMaterial.materials[i].shading;
									object.geometry.normalsNeedUpdate = true;
									a[i].needsUpdate = true;
								}
							);
						}
						
						//for single materials
						else{
							object.material.shading = object.userData.originalMaterial.shading;
							object.geometry.normalsNeedUpdate = true;
							object.material.needsUpdate = true;
						}
				}
				
				// other than 'default'
				else{
					if( object.geometry.faces[0].vertexNormals.length == 0 ){
						object.geometry.computeVertexNormals();
					}
					
					//for multimaterial objects
						if("materials" in object.material){
							object.material.materials.forEach(
								function (e,i,a){
									a[i].shading = shadingMode;
									object.geometry.normalsNeedUpdate = true;
									a[i].needsUpdate = true;
								}
							);
						}
						
						//for single materials
						else{
							object.material.shading = shadingMode;
							object.geometry.normalsNeedUpdate = true;
							object.material.needsUpdate = true;
						}
				}
					
				//check if wm still in use --> false remove wm and switch to orignal
				if(object.userData.workingMaterialFlags == 0){
						//change back to original material
						object.material = object.userData.originalMaterial;
						object.userData.originalMaterial = null;
						delete object.userData.originalMaterial;
				}
				
			}
			
		},
		
		setDiffuseColor : function(object, diffuseColor) { //{String} 'default' | {THREE.Color}
			
			if (object.material && !((object instanceof THREE.Sprite)||(object instanceof THREE.ParticleSystem))) {
				if(!object.userData.originalMaterial){
					// if no working material exists create one 
					object.userData.originalMaterial = object.material;
					object.material = object.userData.originalMaterial.clone();
					//set flag
					object.userData.workingMaterialFlags = 0;
				}
				
				
				//set flag
				GIScene.Utils.WorkingMaterial.setFlag(object, 'color', diffuseColor, GIScene.WORKINGMATERIALFLAGS.DIFFUSE);
				
				//set property
				
				//for multimaterial objects
						if("materials" in object.material){
							object.material.materials.forEach(
								function (e,i,a){
									if(diffuseColor == 'default'){
										
										a[i].color = object.userData.originalMaterial.materials[i].color;
										
									}
									else{
										
										a[i].color = diffuseColor;
										
									}
									
								}
							);
						}
						
						// for single material objects
						else {
							if(diffuseColor == 'default'){
								
								object.material.color = object.userData.originalMaterial.color;
								
							}
							else{
								
								object.material.color = diffuseColor;
								
							}
							
						}
				
				//check if wm still in use --> false remove wm and switch to orignal
				if(object.userData.workingMaterialFlags == 0){
						//change back to original material
						object.material = object.userData.originalMaterial;
						object.userData.originalMaterial = null;
						delete object.userData.originalMaterial;
				}
				
			}			
			
		},
		
		setAmbientColor : function(object, ambientColor) { //{String} 'default' | {THREE.Color}
			
			if (object.material && !((object instanceof THREE.Sprite)||(object instanceof THREE.ParticleSystem))) {
				if(!object.userData.originalMaterial){
					// if no working material exists create one 
					object.userData.originalMaterial = object.material;
					object.material = object.userData.originalMaterial.clone();
					//set flag
					object.userData.workingMaterialFlags = 0;
				}
				
				
				//set flag
				GIScene.Utils.WorkingMaterial.setFlag(object, 'ambient', ambientColor, GIScene.WORKINGMATERIALFLAGS.AMBIENT);
				
				//set property
				
				//for multimaterial objects
						if("materials" in object.material){
							object.material.materials.forEach(
								function (e,i,a){
									if(ambientColor == 'default'){
										
										a[i].ambient = object.userData.originalMaterial.materials[i].ambient;
										
									}
									else{
										
										a[i].ambient = ambientColor;
										
									}
									
								}
							);
						}
						
						// for single material objects
						else {
							if(ambientColor == 'default'){
								
								object.material.ambient = object.userData.originalMaterial.ambient;
								
							}
							else{
								
								object.material.ambient = ambientColor;
								
							}
							
						}
				
				//check if wm still in use --> false remove wm and switch to orignal
				if(object.userData.workingMaterialFlags == 0){
						//change back to original material
						object.material = object.userData.originalMaterial;
						object.userData.originalMaterial = null;
						delete object.userData.originalMaterial;
				}
				
			}			
			
		},
		
		setSelectColor : function(object, selectColor) { //{String} 'default' | {THREE.Color}
			
			
			if (object.material && !((object instanceof THREE.Sprite)||(object instanceof THREE.ParticleSystem))) {
				if(!object.userData.originalMaterial){
					// if no working material exists create one 
					object.userData.originalMaterial = object.material;
					object.material = object.userData.originalMaterial.clone();
					//set flag
					object.userData.workingMaterialFlags = 0;
				}
				
				
				//set flag
				GIScene.Utils.WorkingMaterial.setFlag(object, 'emissive', selectColor, GIScene.WORKINGMATERIALFLAGS.SELECT);
				
				//set property
				
				//for multimaterial objects
						if("materials" in object.material){
							object.material.materials.forEach(
								function (e,i,a){
									
									//fails silently when emissive is not a property of material
									if("emissive" in a[i]){
									
										if(selectColor == 'default'){
											
											a[i].emissive = object.userData.originalMaterial.materials[i].emissive;
											
										}
										else{
											
											a[i].emissive = selectColor;
											
										}
									}
									
								}
							);
						}
						
						// for single material objects
						else {
							
							//fails silently when emissive is not a property of material
							if("emissive" in object.material){
							
								if(selectColor == 'default'){
									
									object.material.emissive = object.userData.originalMaterial.emissive;
									
								}
								else{
									
									object.material.emissive = selectColor;
									
								}
							}
							
						}
				
				//check if wm still in use --> false remove wm and switch to orignal
				if(object.userData.workingMaterialFlags == 0){
						//change back to original material
						object.material = object.userData.originalMaterial;
						object.userData.originalMaterial = null;
						delete object.userData.originalMaterial;
				}
				
			}			
			
		},		
		
		setOpacity : function(object, opacity) { //{String} 'default' | {Number} 0..1
			
			if (object.material) {
				if(!object.userData.originalMaterial){
					// if no working material exists create one 
					object.userData.originalMaterial = object.material;
					object.material = object.userData.originalMaterial.clone();
					//set flag
					object.userData.workingMaterialFlags = 0;
				}
				
				
				//set flag
				GIScene.Utils.WorkingMaterial.setFlag(object, 'opacity', opacity, GIScene.WORKINGMATERIALFLAGS.OPACITY);
				
				//set property
				
				//for multimaterial objects
						if("materials" in object.material){
							object.material.materials.forEach(
								function (e,i,a){
									if(opacity == 'default'){
										
										a[i].opacity = object.userData.originalMaterial.materials[i].opacity;
										// a[i].transparent = (a[i].opacity < 1 ) ? true : false;
										// a[i].depthTest = (a[i].opacity < 1 ) ? false : true;
										a[i].transparent = object.userData.originalMaterial.materials[i].transparent;
										a[i].depthTest = object.userData.originalMaterial.materials[i].depthTest;
									}
									else{
										
										a[i].opacity = opacity * object.userData.originalMaterial.materials[i].opacity;
										a[i].transparent = (a[i].opacity < 1 ) ? true : false;
										a[i].depthTest = (a[i].opacity < 1 ) ? false : true;
									}
									
								}
							);
						}
						
						// for single material objects
						else {
							//set property
							if(opacity == 'default'){
								object.material.opacity = object.userData.originalMaterial.opacity;
								// object.material.transparent = (object.material.opacity < 1 ) ? true : false;
								// object.material.depthTest = (object.material.opacity < 1 ) ? false : true;
								object.material.transparent = object.userData.originalMaterial.transparent;
								object.material.depthTest = object.userData.originalMaterial.depthTest;
							}
							else{
								object.material.opacity = opacity * object.userData.originalMaterial.opacity;
								object.material.transparent = (object.material.opacity < 1 ) ? true : false;
								object.material.depthTest = (object.material.opacity < 1 ) ? false : true;
							}
						}
				
				//check if wm still in use --> false remove wm and switch to orignal
				if(object.userData.workingMaterialFlags == 0){
						//change back to original material
						object.material = object.userData.originalMaterial;
						object.userData.originalMaterial = null;
						delete object.userData.originalMaterial;
				}
				
			}			
			
		}
		//setColor, setDiffuseColor, setAmbientColor, setEmissiveColor ???
	},
	
	/** 
	 * Merges object properties from a abse object with properties of an extending object.
	 *
	 * @method mergeObjects
	 * @param {Object} base  
	 * @param {Object} extending
	 * @return {Object} merged object with base properties extended/overwritten by extending object.
	 **/	
	mergeObjects : function (base, extending){
		var mergedObject = {};
		
		for (var i in base){
			mergedObject[i] = base[i];
		};
		for (var i in extending){
			mergedObject[i] = extending[i];
		};
		return mergedObject;
	}
	,
	/**
	 * Transforms absolute screencoordinates from DOMEvents to relative screencoordinates inside a DOMElement
	 * 
	 * @method getRelativeScreenCoordsFromDOMEvent
	 * @param {DOMElement} domElement Usually the canvas Element
	 * @param {DOMEvent} event e.g. a mouse event
	 * @return {THREE.Vector2} A Vector which contains the event coordinates transformed into coordinates relative to the upper left corner of the DOMElement
	 */
	getRelativeScreenCoordsFromDOMEvent: function (domElement, event){
		var relativeScreenCoords = new THREE.Vector2();
		var currtopLeft = domElement.getBoundingClientRect();
		relativeScreenCoords.x = event.clientX - currtopLeft.left;
		relativeScreenCoords.y = event.clientY - currtopLeft.top;
		
		return relativeScreenCoords;
	}
	,
	/**
	 * Transforms screencoordinates from DOMEvents
	 * 
	 * @method getViewportCoordsFromDOMEvent
	 * @param {DOMElement} domElement Usually the canvas Element
	 * @param {DOMEvent} event e.g. a mouse event
	 * @return {THREE.Vector2} A Vector which contains the event coordinates transformed into viewport coordinates (x and y are between -1 and 1)
	 */
	getViewportCoordsFromDOMEvent: function (domElement, event){
		//calculate normalized viewport coords x[-1,1] y[-1,1]
		
		var relativeScreenCoords = GIScene.Utils.getRelativeScreenCoordsFromDOMEvent(domElement, event);
		var viewPortCoords = GIScene.Utils.transformRelativeScreenCoordsToViewportCoords(relativeScreenCoords, domElement.offsetWidth, domElement.offsetHeight);
		return viewPortCoords;
	},
	
	/**
	 * Transforms relative screen coordinates (e.g.from a canvas element) to normalized viewport coordinates
	 * 
	 * @method transformRelativeScreenCoordsToViewportCoords
	 * @param {THREE.Vector2} relativeScreenCoords
	 * @param {Number} width
	 * @param {Number} height
	 * @return {THREE.Vector2} A Vector which contains the relative screen coordinates transformed into viewport coordinates (x and y are between -1 and 1)
	 */
	transformRelativeScreenCoordsToViewportCoords: function (relativeScreenCoords, width, height){
		var viewPortCoords = new THREE.Vector2();
		viewPortCoords.x = (relativeScreenCoords.x / width ) * 2 - 1;
		viewPortCoords.y = -(relativeScreenCoords.y / height ) * 2 + 1;
		
		return viewPortCoords;
	},
	
	/**
	 * Transforms viewport coordinates to relative screen coordinates (e.g.from a canvas element) 
	 * 
	 * @method transformViewportCoordsToRelativeScreenCoords
	 * @param {THREE.Vector2} viewPortCoords
	 * @param {Number} width
	 * @param {Number} height
	 * @return {THREE.Vector2} A Vector which contains the viewport coordinates transformed into relative screen coordinates (x and y are between width and height)
	 */
	transformViewportCoordsToRelativeScreenCoords: function (viewPortCoords, width, height){
		var relativeScreenCoords = new THREE.Vector2();
		relativeScreenCoords.x = ((viewPortCoords.x + 1)/2)*width;
		relativeScreenCoords.y = ((viewPortCoords.y - 1)/-2)*height;
		
		return relativeScreenCoords;
	},
	
	/**
	 * Recursively computes the bounding box of a scenegraph
	 * 
	 * @method computeBoundingBoxRecursive
	 * @param {THREE.Object3D} node
	 * @return {THREE.Box3} The united bounding box of the node and all its descendants
	 */
	computeBoundingBoxRecursive: function (node){
		
		console.log("Deprecated: GIScene.Utils.computeBoundingBoxRecursive(). Use THREE.Box3().setFromObject(obj)");
		return new THREE.Box3().setFromObject(node);
		
		// var nodeBBOX;
		// if(node.geometry){
			// node.geometry.computeBoundingBox();
			// nodeBBOX = node.geometry.boundingBox.clone().translate(node.position);
		// } 
		// else{
			// nodeBBOX = new THREE.Box3();
		// }		
		// var descendants = node.getDescendants();
// 		
		// for (var i=0;i<descendants.length;i++){
			// if(descendants[i].geometry){
				// descendants[i].geometry.computeBoundingBox();
				// nodeBBOX.union(descendants[i].geometry.boundingBox.clone().translate(descendants[i].position));
			// }
		// }
// 		
		// return nodeBBOX;
		
	},
	
	/**
	 * @method computeVertexMeanRecursive 
	 * @param {THREE.Object3D} node node from which mean will be computed recursively including itself
	 * @return {THREE.Vector3} the point which represents the computed mean
	 * @TODO does NOT take care of MatrixRotations, e.g. if verticalAxis=Z
 	 */
	computeVertexMeanRecursive: function(node) {
			
		var allVertices = [];
		
		node.traverse(function(el) {
			if ("geometry" in el){ 
			allVertices.push.apply( allVertices, el.geometry.vertices);
			}
		});
		
		//alert(allVertices.length);
		
		var sum = new THREE.Vector3();
		for(var i = 0; i < allVertices.length; i++){
		    sum = sum.add(allVertices[0]);
		}

		var mean = sum.divideScalar(allVertices.length);
		
		
		return mean;
	},
	
	/**
	 * Performs a rotation of a point around a center
	 * 
	 * @method polarTransformationAddAngle
	 * @param {THREE.Vector3} center center of rotation
	 * @param {THREE.Vector3} point point to rotate around center
	 * @param {Number} deltaTheta horizontal angle in degrees to be rotated
	 * @param {Number} deltaPhi vertical angle in degrees to be rotated
	 * @return {THREE.Vector3} rotatedPoint
	 */
	polarTransformationAddAngle : function (center, point, deltaTheta, deltaPhi){
		var deltaTheta = THREE.Math.degToRad(deltaTheta);
		var deltaPhi = THREE.Math.degToRad(deltaPhi);
		var offset = point.clone().sub(center);
		// angle from z-axis around y-axis
		var theta = Math.atan2( offset.x, offset.z );
		// angle from y-axis
		var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );
		//add deltas
		theta += deltaTheta;
		phi += deltaPhi;
		//transformation
		var radius = offset.length();
		offset.x = radius * Math.sin( phi ) * Math.sin( theta );
		offset.y = radius * Math.cos( phi );
		offset.z = radius * Math.sin( phi ) * Math.cos( theta );
		
		point.copy( center ).add( offset );
		return point;
	},
	
	/**
	 * sets the position property of an object to its boundingBoxCenter
	 * and changes vertex coordinates accordingly
	 * 
	 * @method translatePositionToBBoxCenter
	 * @param {THREE.Object3D} object
	 */
	translatePositionToBBoxCenter : function(object) {
		if(object.geometry && object.geometry.boundingBox){
			
			var translationVector = object.geometry.boundingBox.center().sub(object.position);
			object.position.add(translationVector);
			object.geometry.vertices.forEach(function(vertex) {vertex.sub(translationVector);});
			object.geometry.verticesNeedUpdate = true;
		}
	},
	
	/**
 	 * function to sort objects by object.renderDepth property.
 	 * Calculates distance from camera to object.position and subtracts the boundingSphere.radius.
 	 * Helps to obtain a better sorting of small objects inside bigger ones.
 	 * 
 	 * @method calcRenderDepthMinusBSphereRadius
 	 * @param {THREE.Object3D} object
 	 * @param {THREE.Camera} camera
 	 * @return {Number} distance
 	 */
 	calcRenderDepthMinusBSphereRadius : function(object, camera) {
 		var _vector3 = new THREE.Vector3();
 		var _projScreenMatrix = new THREE.Matrix4();
 		
 		_vector3.getPositionFromMatrix( object.matrixWorld );
 		
 		_projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
 		
		_vector3.applyProjection( _projScreenMatrix );

		return _vector3.z - object.geometry.boundingSphere.radius;
 	},

	/**
	 * function to calculate parameter for orthographic cameras based on params from a perspective camera and a distance at which the visible size of an object should be maintained
	 * 
	 * @method getOrthoParamsFromPerspectiveCam
	 * @param {HTMLCanvasElement} canvas
	 * @param {THREE.PerspectiveCamera} perspectiveCam 
	 * @param {Number} focusDistance
	 * @return {Object} parameters for THREE.OrthographicCamera
	 */
	getOrthoParamsFromPerspectiveCam : function(canvas, perspectiveCam, focusDistance) {
		

		var fov = perspectiveCam.fov;
		var focusDistance = (focusDistance)? focusDistance :( perspectiveCam.near + perspectiveCam.far ) / 2;
		var aspect = perspectiveCam.aspect; //canvas.width / canvas.height;
		
		var orthoparams = this.getOrthoSizeFromFovDistanceAspect(fov, focusDistance, aspect);
		
		orthoparams.near 	= perspectiveCam.near;
		orthoparams.far		= perspectiveCam.far;
		
		return orthoparams;
	},
	
	/**
	 * function to calculate the size parameters for an orthographic camera
	 * 
	 * @method getOrthoSizeFromFovDistanceAspect
	 * @param {Number} fov in degrees
	 * @param {Number} distance at which size is to be computed according to fov
	 * @param {Number} aspect ratio of canvas with / height
	 * @return {Object} orthosize Object which contains (top, bottom, left, right)-values for orthographic Cameras
	 */
	getOrthoSizeFromFovDistanceAspect : function (fov, distance, aspect){
		var orthosize = {};
		
		var halfHeight = Math.tan( THREE.Math.degToRad(fov) / 2 ) * distance;
		var planeHeight = 2 * halfHeight;
		var planeWidth = planeHeight * aspect;
		var halfWidth = planeWidth / 2;
		
		orthosize.left	= -halfWidth;
		orthosize.right	=  halfWidth;
		orthosize.top		=  halfHeight;
		orthosize.bottom	= -halfHeight;
		
		return orthosize;
	},
	
	/**
	 * function to calculate the distance a perspective camera needs from a target to maintain the visual size of objects
	 * 
	 * @method getPerspectiveDistanceFromFovHalfHeight
	 * @param {Number} fov field of view in degrees
	 * @param {Number} halfHeight half of the orthographic camera height or height at distance to be visible in camera in scene units
	 * @return {Number} distance a perspective camera with the given field of view (fov) should be placed from a target to completly see the given (half-)height
	 */
	getPerspectiveDistanceFromFovHalfHeight : function(fov, halfHeight) {
		
		var distance = halfHeight / Math.tan(THREE.Math.degToRad(fov) / 2);
		
		return distance;
	},
	
	/**
	 * check for item in array 
	 * 
	 * @method arrayContains
	 * @param {Array} array
	 * @param {item} item item to check for in array
	 */
	
	arrayContains : function(array, item) {
		for (var i = 0, j = array.length; i < j; i++) {
			if (array[i] === item)
				return true;
		}
	},
	
	/**
	 * Removes duplicates from an array, even different objects with equal properties
	 * 
	 * @method removeDuplicatesFromArray
	 * @param {Array} array
	 * @return {Array} filteredArray new filtered array
	 */
	removeDuplicatesFromArray : function(array) {
	    var seen = {};
	    return array.filter(function(elem) {
	        var k = JSON.stringify(elem);
	        return (seen[k] === 1) ? 0 : seen[k] = 1;
	    });
	},
	
	/**
	 * Flatten 3D Vectors horizontally to 2D
	 * Removes y from vector3 and puts z as y of vector2.
	 *
	 * @method vector3ToVector2
	 * @param {THREE.Vector3} v3  
	 * @return {THREE.Vector2}
	 */
	vector3ToVector2 : function(v3) {
		var v2 = new THREE.Vector2(v3.x, v3.z);
		return v2;
	},
	
	
	/**
	 * Transform a Vector2 to Vector3 by adding a y component
	 * @method vector2ToVector3
	 * @param {THREE.Vector2} v2 represents horizontal points
	 * @param {Number} y height to add to horizontal point
	 * @return {THREE.Vector3}
	 */
	vector2ToVector3 : function(v2, y) {
		var v3 = new THREE.Vector3(v2.x, y , v2.y);
		return v3;
	},
	
	/**
	 * Delete an object properly 
	 * @method disposeObject
	 * @param {THREE.Object3D} object the object to be disposed
	 * @param {Boolean} deleteGeometry should the geometry of the object be disposed 
	 * @param {Boolean} deleteMaterial should the material of the object be disposed also? Set to false if material is shared by other objects
	 * @param {Boolean} deleteTextures should the textures of the object be disposed also? Set to false if textures are shared by other objects
	 * @param {Boolean} recursive should all descendants of the object be disposed by the same criteria aswell?
	 */
	disposeObject : function(object, deleteGeometry, deleteMaterial, deleteTextures, recursive) {
		var materials = [], textures = [];
		
		if(recursive){
			// var objects = object.getDescendants(); //-r76
			var objects = GIScene.Utils.getDescendants(object); //+r76
			objects.push(object);
			objects.forEach(function(object,i,a){
				GIScene.Utils.disposeObject(object, deleteGeometry, deleteMaterial, deleteTextures, false);
			}.bind(this));
		}
		
		if(deleteGeometry){
			if(object.geometry){
				object.geometry.dispose();
				delete object.geometry;
			}
		}
		
		
		if(deleteMaterial){	
			//get materials
			if (object.material) {
				if (object.material instanceof THREE.MeshFaceMaterial) {
					object.material.materials.forEach(function(material) {
						if (! GIScene.Utils.arrayContains(materials, material)) {
							materials.push(material);
						};
					});
				} else {
	
					if (! GIScene.Utils.arrayContains(materials, object.material)) {
						materials.push(object.material);
					};
				}
			}
			delete object.material;
			
			
			if(deleteTextures){
				// get textures
				materials.forEach(function(material) {
					var maps = ["map", "lightMap", "bumpMap", "normalMap", "specularMap", "envMap"];
					for (var i = 0, j = maps.length; i < j; i++) {
						if ( material[maps[i]] && material[maps[i]] != null && ! GIScene.Utils.arrayContains(textures, material[maps[i]])) {
							textures.push(material[maps[i]]);
							material[maps[i]] = null;
						};
					};
				}); 
			}
		}
		
		//dispose objects
		if(deleteGeometry){
			if(object.dispose)object.dispose();
			object = null;
		}
		
		//dispose textures, materials
		textures.forEach(function (texture) {
		  texture.dispose();
		});
		textures = null;
		
		materials.forEach(function (material) {
		  material.dispose();
		});
		materials = null;
	},
	
	/**
	 *isTypeOrClass 
	 * @method isTypeOrClass
	 * @param {String} typeOrClassName
	 */
	equalsTypeOrClass : function(valueOrObject, typeOrClassName) {
		
		var check;
		
		if ( typeof valueOrObject == "object") {
			console.log("object");
			try {
				check = valueOrObject instanceof  eval(typeOrClassName);
			} catch(e) {
				//primitive strings will fail
				check = (typeOrClassName.toLowerCase() == "object")? true : false;
			}
		} else {
			console.log("primitive");
			var check = typeof valueOrObject === typeOrClassName.toLowerCase();
		}

		return check;

		},
		
	/**
	 *get Objects by recursively calling a callback function which should return true or false to all children
	 * 
	 * @method getObjectsBy
	 * @param {THREE.Object3D} rootObject
	 * @param {Function} callback
	 */
	getObjectsBy: function(rootObject,callback) {
		var matches=[];
		var evalfunction = function(object) {
			if(callback(object)){
				matches.push(object);
			}
		};
		rootObject.traverse(evalfunction);
		
		return matches;
	},
	
	/**
	 * @method getDescendants
 	 * @param {THREE.Object3D} object3d
 	 * @param {Array} [array] array to be filled with descendands or a new one will be created
 	 * @return {Array} either the passed in array or a new one
	 */
	getDescendants: function ( object3d, array ) {

		if ( array === undefined ) array = [];

		Array.prototype.push.apply( array, object3d.children );

		for ( var i = 0, l = object3d.children.length; i < l; i ++ ) {

			object3d.children[ i ].getDescendants( array );

		}

		return array;

	}

}
;


	