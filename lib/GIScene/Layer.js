/**
 * Base class used for Layer classes
 * 
 * @namespace GIScene
 * @class Layer
 * @constructor
 * @param {String} name the layer name for display purposes
 * @param {Object} [config] the layer configuration object
 *  
 * @author mcauer https://github.com/mcauer
 */

GIScene.Layer = function (name, config) {
	
	//Layer properties
	var defaults = {
		
		id:null, //@TODO create unique Ids that can be overridden by a user config
		
		//appearance
		visibility : true, 
		
		opacity : 1,		
		overrideMaterial:null, 
		//
		projection : null,
		
		offset: new GIScene.Coordinate3(0,0,0),
		
		listeners	:[],
		
		styles		:[], //container for optional styles (overrideMaterials)
		
		//remoteAttributes vs. localAttributes
		//attributeService:{
			// baseURL,
			// singleObjectSchema: ?layer=abc&q={id} || /{id} etc  (id has to be a field) 
			// pagingSchema: ?layer=abc&pageFrom={pageFrom}&pageTo={pageTo}
		// }
		attributeReader : null, //object with function to fill data into the object attributes
		// {
			// 'geom_id':  function(object){return (object.name.split('_')[1]) || null;},
			// 'attr_id':  function(object){return (object.name.split('_')[2]) || null;},
			// 'nodetype': function(object){return (object.name.split('_')[0]) || null;},
// 		
		// },
		
		properties:{
			fields:[
			//{name:'geom_id', alias:'Geometry ID', type:'int', comment:''}
			//{name:'attr_id', alias:'Attribute ID', type:'int', comment:''}
			//{name:'nodetype', alias:'Node Type', type:'text', comment:''}
			],
			//primaryKey:'geom_id' //is unique and not null
		},
		attributeTable:[
			//{geom_id:13}
		]
		
	};
	
	this.config = GIScene.Utils.mergeObjects(defaults, config || {});
	
	this.id	= this.config.id || GIScene.idCounter++; //  null; //@TODO create unique Ids
	
	this.name = null;
	
	this.offset = null; //GIScene.Coordinate3()
	
	var translateLayer = null; //THREE.Vector3()  will be computed automatically onSetScene
	
	this.root = null; //should be a THREE.Scene() Object
	
	this.scene = null;
	
	this.loader = null;
	
	this.visibility = null;
	
	this.selectControl = null; //set on setScene
	
	this.attributeReader = null;
	
	this.selectionQueryStack = null; //will hold an array of queryObjects to be processed sequentially
	
	var defaultStyle = new GIScene.Style({title: 'default style', material: this.config.overrideMaterial});
	
	this.styles = [defaultStyle];
	Array.prototype.push.apply(this.styles, this.config.styles);
	
	this.init = function(){
		//@TODO create unique Id
		
		this.name = name;
		this.root = new THREE.Scene();
		this.root.name = 'layer' + ((this.name)? "_"+this.name : "");
		this.offset = this.config.offset;
		this.loader = new GIScene.ModelLoader();
		this.attributeReader = this.config.attributeReader;
		
		//@TODO check visibility onload
		this.visibility = this.config.visibility;
		
	};
	
	this.add = function(node, parent){
		parent.add(node);
	};
	
	this.remove = function(node){
		node.parent.remove(node);
	};
	
	this.setScene = function(scene){
		this.scene = scene;
		/**
		 *@event setScene
		 */
		this.dispatchEvent({
			type : 'setScene', content:scene
		});
	};
	

	
	/**
	 * Sets the opacity value for the whole layer
	 * 
	 * @method setOpacity
	 * @param {Number} opacity
	 */
	this.setOpacity = function(opacity) { 
		
		this.root.traverse(function(object) {

			GIScene.Utils.WorkingMaterial.setOpacity(object,opacity);

			// if (object.material && !(object instanceof THREE.Sprite)) {
				// if(!object.userData.originalMaterial){
					// // if no working material exists create one 
					// object.userData.originalMaterial = object.material;
					// object.material = object.userData.originalMaterial.clone();
					// //set flag
					// object.userData.workingMaterialFlags = GIScene.WORKINGMATERIALFLAGS.OPACITY;
				// }
// 				
				// //no wm --> create and set flag and mode
// 					
				// //else wm exists --> check if new mode == original
				// /*else*/ if (opacity == object.userData.originalMaterial.opacity || opacity == 'default'){
					// //remove (toggle) flag
					// object.userData.workingMaterialFlags ^= GIScene.WORKINGMATERIALFLAGS.OPACITY;	
				// }
// 								
				// //set property
				// if(opacity == 'default'){
					// object.material.opacity = object.userData.originalMaterial.opacity;
					// object.material.transparent = (object.material.opacity < 1 ) ? true : false;
					// object.material.depthTest = (object.material.opacity < 1 ) ? false : true;
				// }
				// else{
					// object.material.opacity = opacity * object.userData.originalMaterial.opacity;
					// object.material.transparent = (object.material.opacity < 1 ) ? true : false;
					// object.material.depthTest = (object.material.opacity < 1 ) ? false : true;
				// }
// 					
				// //check if wm still in use --> false remove wm and switch to orignal
				// if(object.userData.workingMaterialFlags == 0){
						// //change back to original material
						// object.material = object.userData.originalMaterial;
						// object.userData.originalMaterial = null;
						// delete object.userData.originalMaterial;
				// }
// 				
			// }
		}
		);
	};
	
		/**
	 * add a style to the layers styles list
	 * @method addStyle 
 	 * @param {GIScene.Style} style
	 */
	this.addStyle = function(style) {
		this.styles.push(style);
		/**
		 *@event addStyle 
		 */
		this.dispatchEvent({type:'addStyle' , content:{layer:this, style: style}});
	};
	
	/**
	 * remove an existing style from the layers style list 
 	 * @method removeStyle
 	 * @param {GIScene.Style} style
	 */
	this.removeStyle = function(style){
		for (var i = 0, l = this.styles.length; i<l; i++){
			if (this.styles[i] === style){ 
			
				this.styles.splice(i,1); 
				/**
				 *@event removeStyle 
				 */
				this.dispatchEvent({type:'removeStyle' , content:{layer:this, style: style}});
			}
		}
	};
	
	/**
	 * remove style, its material and textures from memory 
	 * @method disposeStyle
	 * @param {GIScene.Style} style
	 */
	this.disposeStyle = function(style){
		
		this.removeStyle(style);
		
		var materials = [], textures=[];
		//get materials
		if (style.material) {
				if (style.material instanceof THREE.MeshFaceMaterial) {
					style.material.materials.forEach(function(material) {
						if (! GIScene.Utils.arrayContains(materials, material)) {
							materials.push(material);
						};
					});
				} else {

					if (! GIScene.Utils.arrayContains(materials, style.material)) {
						materials.push(style.material);
					};
				}
			}
		
		//get textures
		materials.forEach(function(material) {
			var maps = ["map", "lightMap", "bumpMap", "normalMap", "specularMap", "envMap", "texture"]; //texture exists in RasterOverlayMaterial
			for (var i = 0, j = maps.length; i < j; i++) {
				if (material[maps[i]] && material[maps[i]] != null && ! GIScene.Utils.arrayContains(textures, material[maps[i]])) {
					textures.push(material[maps[i]]);
				};
			};
		}); 
	
		//dispose textures, materials
		textures.forEach(function (texture) {
		  texture.dispose();
		});
		textures = null;
		
		materials.forEach(function (material) {
		  material.dispose();
		});
		materials = null;
		
		delete style.material;
		style = null;	
		
	};
	
	//@TODO destroy function to remove everything from memory --> now implemented Scene.disposeLayer()
	
	//start auto initialization 
	this.init();
	
	// when added to a scene 
	var onSetScene = function(event) {
		var scene = event.content;
		this.offset = this.config.offset;
		translateLayer = (scene) ? this.offset.toVector3().sub(scene.config.offset.toVector3())
								 : new THREE.Vector3();
								 ;
		this.root.position = translateLayer;
		this.root.updateMatrix();
		this.root.updateMatrixWorld();
		console.log("translateLayer: "+translateLayer.toArray());
		
		//configure select control
		if(scene){
			this.selectControl = new GIScene.Control.Select([],scene.camera,{multi:true, selectColor: 0xff8000});
			this.selectControl.selectables = this.root.getDescendants();	
			scene.addControl(this.selectControl);
			
			var onBeforeRemove = function(event) {
				if(event.content === this){
					scene.removeControl(this.selectControl);
					this.selectControl.selectables = [];
					this.selectControl = null;
					scene.removeEventListener('beforeremovelayer', onBeforeRemove);
				}
			}.bind(this);
			scene.addEventListener('beforeremovelayer', onBeforeRemove);
		}
		
		//@TODO implement selectables update according to LayerType (Fixed, Grid)
	}.bind(this);
	this.addEventListener('setScene', onSetScene);
};

//Provide EventDispatcher Functions
GIScene.Layer.prototype = {
	
	constructor : GIScene.Layer,
	
	/**
	 * get Objects by a evaluation function which recursively tries to match the objects of the layer
	 * 
	 * @method getObjectsBy
	 * @param {Function} callback
	 * @return {Array} matches
	 */
	getObjectsBy : function(callback) {
		return GIScene.Utils.getObjectsBy(this.root,callback);
	},
	
	/**
	 * set or modify the current layer selection by attribute query
	 * 
	 * @method selectByAttributes
	 * @param {String} attributeName must be available in object.userData.gisceneAttributes
	 * @param {String} operator defines how to compare the given values with the object attributes
	 * @param {Mixed} value the values for the selection criteria
	 * @param {String} selectMode can be new,add,sub,intersect
	 * 
	 * @example
	 * 	{
	 * 		"attributeName" : "attr_id",
	 * 		"operator"		: "IN", //"==","!=" .... TODO
	 * 		"value"			: [2393,1234],
	 * 		"selectMode"	: "new"
	 * 	}
	 * 
	 */
	
	selectByAttributes : function(queryObjectStack, root, interaction) {
		
		var root = (!root)? this.root : root;
		
		this.selectionQueryStack = (queryObjectStack instanceof Array)? queryObjectStack : [queryObjectStack];
		
		for(var i=0,j=this.selectionQueryStack.length; i<j; i++){
		  	
		  	var queryObject = this.selectionQueryStack[i];
		
			var attr 		= queryObject.attributeName;
			var operator 	= queryObject.operator;
			var value		= queryObject.value;
			var selectMode	= queryObject.selectMode || "new"; //defaults to "new"
			
			var queryResults=[];
			
			//operator functions
			var equals_to = function(object,attr,value) {
				return object.userData.gisceneAttributes[attr] == value;
			}; 
			var contains = function(object,attr,value) { //contains
				var regExp = new RegExp(String(value), "gi");
				return regExp.test(String(object.userData.gisceneAttributes[attr]));
			}; 
	
			
			switch (operator){
				case "EQUALS_TO" || "==":
							queryResults = GIScene.Utils.getObjectsBy(root,function(object){
								return equals_to(object,attr,value);
							});
							break;
				case "IN":
							for(var i=0,j=value.length; i<j; i++){
							    var tempResults = GIScene.Utils.getObjectsBy(root,function(object){
							  	return equals_to(object,attr,value[i]);
							  }); 
							  Array.prototype.push.apply(queryResults, tempResults);
							};
							break;
				case "CONTAINS" || "~":
							queryResults = GIScene.Utils.getObjectsBy(root,function(object){
								return contains(object,attr,value);
							});
							break; 
			}
		   
		   //select
		   switch (selectMode){
		   	case "new": 
		   				root.traverse(function(object){
		   					if(object.userData.isSelected){
		   						this.selectControl.unselect(object,interaction);
		   					}
		   				}.bind(this));
		   				//this.selectControl.unselectAll();
		   				
		   				for(var i=0,j=queryResults.length; i<j; i++){
							 this.selectControl.select( queryResults[i],interaction );
						   };
		   				break;
		   	case "add":
		   				var temp_toggleValue = this.selectControl.config.toggle;
		   				this.selectControl.config.toggle = false;
		   				for(var i=0,j=queryResults.length; i<j; i++){
							this.selectControl.select( queryResults[i],interaction );
						   };
						this.selectControl.config.toggle = temp_toggleValue;
		   				break;
		   }
		};
	},
	
	//@TODO add parameter {Array} ids to apply override Material only to the matched ids for coloring by Attributes
	//@TODO removeOverrideMaterial
	setOverrideMaterial : function(node, overrideMaterial, keepWorkingMaterialProperties) {
		
		var keepWorkingMaterialProperties = keepWorkingMaterialProperties || true;
				
		if(overrideMaterial instanceof THREE.Material || !overrideMaterial){
			//update properties
			this.config.overrideMaterial = overrideMaterial;
			//rescursively apply overrideMaterial
			node.traverse(
				function(obj) {
					if(obj.material){
						/**
						 *@event beforeSetOverrideMaterial
						 */
						this.dispatchEvent({
							type : 'beforeSetOverrideMaterial', content:{object: obj, overrideMaterial: overrideMaterial, layer: this}
						});
						
						//set overrideMaterial
						
						if(overrideMaterial){
							//store original material the first time
							if(!obj.userData.overriddenMaterial){
								obj.userData.overriddenMaterial = obj.material; //@TODO maybe better check for original material, in case material has already been changed by workingMaterial properties
							}
							else
							{
								//dispose overridden material
								if(obj.material.isShared === false){ // === important for not evaluating undefined
									GIScene.Utils.disposeObject(obj, false, true, true);
								 }
							}
							
							//if keep WM props
							//collect props
							if(keepWorkingMaterialProperties) {var workingMaterialProperties = GIScene.Utils.WorkingMaterial.getValues(obj);}
							
							//cleanup
							delete obj.userData.originalMaterial;
							obj.userData.workingMaterialFlags = 0;
							
							//assign new override material
							obj.material = this.config.overrideMaterial;
							
							//if keep WM props
							//reassign WM props
							if(keepWorkingMaterialProperties) {GIScene.Utils.WorkingMaterial.setValues(obj, workingMaterialProperties);}
							
						}
						//remove overrideMaterial
						else{
							if(obj.userData.overriddenMaterial && obj.userData.overriddenMaterial instanceof THREE.Material){
								obj.material = obj.userData.overriddenMaterial;
								delete obj.userData.overriddenMaterial;
							}
							
						}
						
						
						
						/**
						 *@event afterSetOverrideMaterial
						 */
						this.dispatchEvent({
							type : 'afterSetOverrideMaterial', content:{object: obj, overrideMaterial: overrideMaterial, layer: this}
						});
					}
					
					if(this.config.overrideMaterial && this.config.overrideMaterial.shading == THREE.SmoothShading && obj.geometry && (!obj.geometry.normals || obj.geometry.normals.length == 0)){
						obj.geometry.computeVertexNormals();
					}
					
				}.bind(this)
			);
		}
	},
	
	setVisibility : function(visibility){
		this.root.traverse(
			function(obj){
				obj.visible = visibility;
			}
		);
		this.visibility = visibility;
		/**
		 *@event changedvisibility
		 *listener function will get the following event object as argument 
		 *@example
		 * 	eventObject = {
		 * 		content:{
		 * 			layer:{GIScene.Layer}, 
		 * 			visibility:{Boolean}
		 * 		}
		 * 	}			
		 */
		this.dispatchEvent({type:'changedvisibility', content:{layer:this, visibility:this.visibility}});
	},
	
	showAttributeTable : function() {
		//@TODO showAttributeTable
	},
	
	/**
	 * @method getAttributeNames
	 * @return {Array(String)} attributeNames
	 */
	getAttributeNames : function() {
		var attributeNames = [];
		this.root.traverse(function(object){
			if(object.userData.gisceneAttributes && Object.keys(object.userData.gisceneAttributes).length > 0 ){
				return attributeNames = Object.keys(object.userData.gisceneAttributes);
			}
		});
		return attributeNames;
	},
	
	getExampleValues : function() {
		var exampleValues = [];
		this.root.traverse(function(object){
			if(object.userData.gisceneAttributes && Object.keys(object.userData.gisceneAttributes).length > 0 ){
				exampleValues = [];
				for (attr in object.userData.gisceneAttributes){
					exampleValues.push(object.userData.gisceneAttributes[attr]);
				}
				return exampleValues;
			}
		}.bind(this));
		return exampleValues;
	},
	
	/**
	 * apply a style to the layer 
	 * @method setActiveStyle
 	 * @param {GIScene.Style} style
	 */
	setActiveStyle : function(style) {
		
		if( !style ||  (typeof style == 'string' && style.toLowerCase() == "default") ){
			style = this.styles[0];
		}
		
		var recursive = style.recursive; //TODO implement recursive as parameter of setOverrideMaterial
		
		var material = style.material;
		
		var selectionType = (style.rootObjects)? "byObjects" : (style.rootObjectKeyAttribute)? "byAttributes" : "selectAll";
		
		if(selectionType == "selectAll"){
			
			this.setOverrideMaterial(this.root, material);
			
		}
		
		if(selectionType == "byObjects"){
			
			var objects = style.rootObjects;
			
			//first reset all objects to default material
			
			//second style selected objects with other material
			for(var i=0,j=objects.length; i<j; i++){
				
				this.setOverrideMaterial(objects[i], material);
			  
			};
			
		}
		
		if(selectionType == "byAttributes"){
			//@TODO
			console.log("Layer.setActiveStyle(): style objects by attributes not yet implemented");
		
		}
		
		/**
		 *@event setActiveStyle 
		 */
		this.dispatchEvent( { type : 'setActiveStyle', content : { layer:this, style: style } } );
	
	},
	
	addEventListener: THREE.EventDispatcher.prototype.addEventListener,
	hasEventListener: THREE.EventDispatcher.prototype.hasEventListener,
	removeEventListener: THREE.EventDispatcher.prototype.removeEventListener,
	dispatchEvent: THREE.EventDispatcher.prototype.dispatchEvent
	
};