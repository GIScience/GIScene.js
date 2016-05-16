/**
 * Control to enable the interactive selection and or highlighting of 3D Objects in the scene
 * 
 * @namespace GIScene
 * @class Control.Select
 * @constructor
 * @extends GIScene.Control
 * @param {Array | THREE.Object3D} selectables An Array or single THREE.Object3D. Contains the potentially selectable Elements of type THREE.Object3D 
 * @param {THREE.Camera} camera The active camera  
 * @param {Object} [config] Configuration properties to influence the behaviour of this Control
 * 	
 * 
 *  You can use multiple options to customize the behaviour of the Select Control:
 * 	
 * 	Main options: 
 * 
 * 	1. Choose between hover or click behaviour by setting hover:true || hover:false
 *  2. Choose whether objects should be really selected or just highlighted by setting highlightOnly:true || highlightOnly:false
 *  3. Choose a highlighting color by setting e.g: selectColor:0xff0000
 * 
 *  The following options are only available if hover:false:
 * 
 *  multi    - whether it is possible to select only one object or multiple (hold down CTRL-Key)
 * 
 *  toggle   - whether click on a selected/highlighted object unselects/unhighlights it again
 * 
 *  clickout - whether a click somewhere not on a selectable object unselects all others 
 * 	
 *  You can even combine 2 Select controls to enable highlighting on mouseover ('hover') and selection on click:
 * @example
 * 		var selectControl = new GIScene.Control.Select(scene.root.children, scene.camera, {highlightOnly:false, hover:false, multi:false, toggle:true, clickout:true});
		scene.addControl(selectControl);
		selectControl.activate();

		var highlightControl = new GIScene.Control.Select(scene.root.children, scene.camera, {highlightOnly:true, hover:true});
		scene.addControl(highlightControl);
		highlightControl.activate(); 
 */

GIScene.Control.Select = function (selectables, camera, config) {
		
	//make this a control
	GIScene.Control.call(this);
	
	var defaults = {
		highlightOnly: false,
		hover:false,
		clickout:true,
		multi:false,
		toggle:true,
		selectColor: 0xffff00
	};
	
	/**
	 * The config which is used to initialize the Control. Merged from defaults and passed config Object.
	 * 
	 * @property config
	 * @type Object
	 */
	this.config = GIScene.Utils.mergeObjects(defaults, config || {}); 
	
	this.selectables = (selectables instanceof Array)?selectables : (selectables instanceof THREE.Object3D)? [selectables] : [];
	this.camera = camera;
	this.domElement = null;
	this.hitObject = null;
	
	// var projector = new THREE.Projector(); -r76
	var raycaster = new THREE.Raycaster(); // +r76
	/**
	 * Used for Raycaster when selecting on a THREE.Points object
	 * @property clickPointThreshold
	 * @type Number 
	 */
	Object.defineProperty(this,'clickPointThreshold',{
		get: function() {return raycaster.params.Points.threshold;},
		set: function(value) {raycaster.params.Points.threshold = value;}
	});
	//default 
	this.clickPointThreshold = 50;
	
	var mouse = new THREE.Vector3(0,0,1); //warum z =1 und nicht 0?
	var isDblClick = false;
	
	this.selectedObjects = [];
	this.highlightedOnlyObjects = [];
	

	this.getHitObject = function(vector){
		// var ray = projector.pickingRay(vector, this.camera); -r76
		raycaster.setFromCamera(vector, this.camera.activeCam); // +r76
		var hitObjects = raycaster.intersectObjects(this.selectables);
		// var hitObject = (hitObjects.length > 0) ? hitObjects[0].object : undefined;
		var hitObject;
		for(var i=0; i < hitObjects.length; i++){
			//@TODO MeshFaceMaterial is not supported
			if(hitObjects[i].object.geometry && hitObjects[i].object.visible && ((hitObjects[i].object.material.opacity)?hitObjects[i].object.material.opacity>0 : true)/* for multimaterial opacity not checked(always true)*/ ){
				hitObject = hitObjects[i].object;
				break;
			};
		};
		
		return hitObject;
	};
	
	/**
	 * Highlight an object. This will also be called by the select() function. Sets object.userData.isHighlighted = true.
	 * 
	 * @method highlight
	 * @param {THREE.Object3D} object
	 * @param {Boolean} interaction this flag is used to differentiate between user interaction triggered selection or programmatical selection resulting in a special event for user-triggerd selections.
	 */
	this.highlight = function (object, interaction) {
		
		if(!object.userData.isHighlighted){
			object.userData.isHighlighted = true;
			GIScene.Utils.WorkingMaterial.setSelectColor(object,new THREE.Color(this.config.selectColor));
		//-------
		// if(!object.userData.originalMaterial){
			// // if no working material exists create one 
			// object.userData.originalMaterial = object.material;
			// object.material = object.userData.originalMaterial.clone();
		// }
// 		
		// if(!object.userData.isHighlighted){
			// object.userData.isHighlighted = true;
// 			
			// // object.userData.originalMaterial = object.material;
			// // object.material = object.userData.originalMaterial.clone();
// 			
			// //for multimaterial
			// if("materials" in object.material){
				// object.material.materials.forEach(
					// function (e,i,a){
						// a[i].emissive.setHex(this.config.selectColor);
					// }.bind(this)
				// );
			// }
			// //for single material
			// else {
				// object.material.emissive.setHex(this.config.selectColor);
			// }
// 			
			// //set selected flag
			// object.userData.workingMaterialFlags = ("workingMaterialFlags" in object.userData)? object.userData.workingMaterialFlags ^ GIScene.WORKINGMATERIALFLAGS.SELECT : GIScene.WORKINGMATERIALFLAGS.SELECT ;
			
			if(this.config.highlightOnly){this.highlightedOnlyObjects.push(object);};
			/**
			 * The highlighted event will be triggered after the feature is highlighted.
			 * The event contains a content property with a reference to the highlighted object.
			 * 
			 * @event highlighted
			 */
			this.dispatchEvent({type:'highlighted', content:object});
			/**
			 * The highlightedbyuser event will be triggered after the feature is highlighted by a user interaction.
			 * The event contains a content property with a reference to the highlighted object.
			 * 
			 * @event highlightedbyuser
			 */
			if(interaction)this.dispatchEvent({type:'highlightedbyuser', content:object});
		}
		else {
			if(this.config.toggle){
				//console.log('toggle highlight');
				this.unhighlight(object,interaction);
			}
		}		
	};
	
	/**
	 * Unhighlight an object. This will also be called by the unselect() function. Sets object.userData.isHighlighted = false.
	 * 
	 * @method unhighlight
	 * @param {THREE.Object3D} object
	 * @param {Boolean} interaction this flag is used to differentiate between user interaction triggered selection or programmatical selection resulting in a special event for user-triggerd selections.
	 */
	this.unhighlight = function (object,interaction) {
		if(!object.userData.isSelected){
		
			GIScene.Utils.WorkingMaterial.setSelectColor(object,'default');
			// //remove select flag
			// object.userData.workingMaterialFlags ^= GIScene.WORKINGMATERIALFLAGS.SELECT;
// 			
			// if(object.userData.workingMaterialFlags != 0){
				// //working material is still in use, so just set property
// 				
				// //for multimaterial
				// if("materials" in object.material){
					// object.material.materials.forEach(
						// function (e,i,a){
							// a[i].emissive.setHex(object.userData.originalMaterial.materials[i].emissive.getHex());
						// }
					// );
				// }
				// //for single material
				// else {
					// object.material.emissive.setHex(object.userData.originalMaterial.emissive.getHex());
				// }
			// } else{
				// //working material not in use anymore, remove it and set back to original material
				// object.material = object.userData.originalMaterial;
				// object.userData.originalMaterial = null;
				// delete object.userData.originalMaterial;
			// }
		
		object.userData.isHighlighted = false;
		}
		
		for(var i = 0; i < this.highlightedOnlyObjects.length; i++){	
			if(object === this.highlightedOnlyObjects[i]){
				this.highlightedOnlyObjects.splice(i,1);
				break;
			}			
		};
		/**
		 * The unhighlighted event will be triggered after the feature is unhighlighted.
		 * The event contains a content property with a reference to the unhighlighted object.
		 * 
		 * @event unhighlighted
		 */
		this.dispatchEvent({type:'unhighlighted', content:object});
		/**
		 * The unhighlightedbyuser event will be triggered after the feature is unhighlighted through user interaction.
		 * The event contains a content property with a reference to the unhighlighted object.
		 * 
		 * @event unhighlightedbyuser
		 */
		if(interaction)this.dispatchEvent({type:'unhighlightedbyuser', content:object});
	};
	
	/**
	 * Select an object. This will also call the highlight() function. Sets object.userData.isSelected = true.
	 * 
	 * @method select
	 * @param {THREE.Object3D} object
	 * @param {Boolean} interaction this flag is used to differentiate between user interaction triggered selection or programmatical selection resulting in a special event for user-triggerd selections.
	 */
	this.select = function (object,interaction) {
		//console.log("select: object.userData.isSelected: " + object.userData.isSelected)
		if(!object.userData.isSelected){
			//console.log('select if unselected');
			object.userData.isSelected = true;
			this.selectedObjects.push(object);
			/**
			 * The selected event will be triggered before the feature is highlighted.
			 * The event contains a content property with a reference to the selected object.
			 * 
			 * @event selected
			 */
			this.dispatchEvent({type:'selected', content:object});
			/**
			 * The selectedbyuser event will be triggered before the feature is highlighted.
			 * The event contains a content property with a reference to the selected object.
			 * 
			 * @event selectedbyuser
			 */
			if(interaction)this.dispatchEvent({type:'selectedbyuser', content:object});
			
			this.highlight(object); //?? forward interaction
		}
		else {
			if (this.config.toggle) {
				//console.log('toggle select');
				this.unselect(object,interaction);
			}
		}
	};
	
	/**
	 * Unselect an object. This will also call the unhighlight() function. Sets object.userData.isSelected = false.
	 * 
	 * @method unselect
	 * @param {THREE.Object3D} object
	 * @param {Boolean} interaction this flag is used to differentiate between user interaction triggered selection or programmatical selection resulting in a special event for user-triggerd selections.
	 */
	this.unselect = function (object,interaction) {
		//console.log("unselect");
		object.userData.isSelected = false;
		this.unhighlight(object); //??forward interaction
		
		for(var i = 0; i < this.selectedObjects.length; i++){	
			if(object === this.selectedObjects[i]){
				this.selectedObjects.splice(i,1);
				break;
			}			
		};
		/**
		 * The unselected event will be triggered after the feature is unhighlighted.
		 * The event contains a content property with a reference to the unselected object.
		 * 
		 * @event unselected
		 */
		this.dispatchEvent({type:'unselected', content:object});
		/**
		 * The unselectedbyuser event will be triggered after the feature is unhighlighted.
		 * The event contains a content property with a reference to the unselected object.
		 * 
		 * @event unselectedbyuser
		 */
		if(interaction)this.dispatchEvent({type:'unselectedbyuser', content:object});
	};
	
	/**
	 * Removes an object from the selectables Array
	 * @method removeSelectable
	 * @param {THREE.Object3D} object
	 */
	this.removeSelectable = function (object) {
		//remove from selectedObjects and highlightedOnlyObjects Array
		if(object.userData.isHighlighted)this.unselect(object);
		//remove from selectables Array
		var newSelectables =[];
		for(var i=0,j=this.selectables.length; i<j; i++){
		  if(this.selectables[i] !== object){
		  	newSelectables.push(this.selectables[i]);
		  }  
		};
		this.selectables = newSelectables;
	};
	
	var onDisposeObject = function(event) {
		this.removeSelectable(event.content);
	}.bind(this);
	
	var onMouseEvent = function(event){
		
		event.preventDefault();
		
		// //get mouse ScreenCoords
		var viewPortCoords = GIScene.Utils.getViewportCoordsFromDOMEvent(this.domElement,event);
		mouse.set(viewPortCoords.x, viewPortCoords.y, 1);


		// Did the mouse hit an object? When yes which?
		var hitObject = this.getHitObject(mouse);

		//prevent misconfiguration of hover mode
		if(this.config.hover){this.config.toggle = false; this.config.clickout = true;this.config.multi = false;};
		
		//logic of hightlighting and selection
		if (hitObject) {
			//console.log('clickin');
			if (this.config.multi && event.ctrlKey) {
				if (this.config.highlightOnly) {
					if(!hitObject.userData.isHighlighted || this.config.toggle)this.highlight(hitObject, true);
				} else {
					if(!hitObject.userData.isSelected || this.config.toggle)this.select(hitObject, true);
				}
			}
			else //multi false
			{
				//console.log('multi false');
				if (this.config.highlightOnly) {
					
					//if(this.highlightedOnlyObjects[0] && this.highlightedOnlyObjects[0] !== hitObject)this.unhighlight(this.highlightedOnlyObjects[0]);
					if(this.highlightedOnlyObjects.length > 0){
						this.unhighlightAll(true);
						// var temp_highlightedOnlyObjects = this.highlightedOnlyObjects.slice(0);
						// temp_highlightedOnlyObjects.forEach(function(e,i,a){this.unhighlight(temp_highlightedOnlyObjects[i]);}.bind(this));
						// temp_highlightedOnlyObjects = null;
					}
					
					
					if(!hitObject.userData.isHighlighted || this.config.toggle)this.highlight(hitObject,true);
				
				
				} else {
					//if(this.selectedObjects[0] && this.selectedObjects[0] !== hitObject)this.unselect(this.selectedObjects[0]);
					if(!this.config.hover && this.selectedObjects.length > 0 /*&& !hitObject.userData.isSelected*/){
						//this.unselect(this.selectedObjects[0])
						//unselect all 
						this.unselectAll(true);
						 // var temp_selectedObjects = this.selectedObjects.slice(0);
						 // temp_selectedObjects.forEach(function(e,i,a){this.unselect(temp_selectedObjects[i]);}.bind(this));
						 // temp_selectedObjects = null;
						}
					else{
						//hover
						if(this.selectedObjects[0] && this.selectedObjects[0] !== hitObject)this.unselect(this.selectedObjects[0], true);
					}
					
					if(!hitObject.userData.isSelected || this.config.toggle)this.select(hitObject,true);
				}
			}
		} else {//clickout
			if (this.config.clickout) {
				//console.log("clickout");
				//unselect or unhighlight all
				if (this.config.highlightOnly) {
					// while (this.highlightedOnlyObjects.length > 0) {
						// this.unhighlight(this.highlightedOnlyObjects[0],true);
					// }
					this.unhighlightAll(true);
				} else {
					// while (this.selectedObjects.length > 0) {
						// this.unselect(this.selectedObjects[0],true);
					//}
					this.unselectAll(true);
				}
			}
		}

	}.bind(this);
	
	var onMouseDown = function(event) {
		if(this.config.hover){
			this.domElement.removeEventListener( 'mousemove', onMouseEvent, false );
		}
		else{
			//get mouse ScreenCoords
		var viewPortCoords = GIScene.Utils.getViewportCoordsFromDOMEvent(this.domElement,event);
		mouse.set(viewPortCoords.x, viewPortCoords.y, 1);
		}
	}.bind(this);
	
	var onMouseUp = function(event) {
		if(this.config.hover){
			this.domElement.addEventListener( 'mousemove', onMouseEvent, false );
		}else{
			//get mouse ScreenCoords
		var mouseOld = mouse.clone();
		var viewPortCoords = GIScene.Utils.getViewportCoordsFromDOMEvent(this.domElement,event);
		mouse.set(viewPortCoords.x, viewPortCoords.y, 1);
		
		//avoid mouseup event if dblcklicked
		setTimeout(function(){
			console.log(isDblClick);
			if(isDblClick){
				dblClickCount++;
			}
			
			if(mouse.equals(mouseOld) && !isDblClick){onMouseEvent(event);};
			
			if(dblClickCount > 1){isDblClick = false; dblClickCount = 0;}
		}.bind(this),250);
		
		//if(mouse.equals(mouseOld) && !isDblClick){onMouseEvent(event);};
		
		}
	}.bind(this);
	
	var dblClickCount = 0;
	var onDblClick = function(event) {
		isDblClick = true;
	}.bind(this);
	
	/**
	 * Activates this Control
	 * 
	 * @method activate
	 *  
	 */
	this.activate = function(){
		if(this.isActive) return;
		
		this.domElement = this.scene.canvas;
		
		this.domElement.addEventListener( 'mousedown', onMouseDown, false );
		this.domElement.addEventListener( 'mouseup', onMouseUp, false ); //on document??
		this.domElement.addEventListener( 'dblclick', onDblClick, false );
		if(this.config.hover){
			this.domElement.addEventListener( 'mousemove', onMouseEvent, false );
		}
		// else{
			// this.domElement.addEventListener( 'click', onMouseEvent, false );
		// }
		this.scene.addEventListener( 'beforeDisposeObject', onDisposeObject );
		
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
		
		this.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		this.domElement.removeEventListener( 'mouseup', onMouseUp, false );
		
		if(this.config.hover){
			this.domElement.removeEventListener( 'mousemove', onMouseEvent, false );
		}
		// else{
			// this.domElement.removeEventListener( 'click', onMouseEvent, false );
		// }
		this.scene.removeEventListener( 'beforeDisposeObject', onDisposeObject );
		
		GIScene.Control.prototype.deactivate.call(this);
	};
};

//Inherit from GIScene.Control
GIScene.Control.Select.prototype = Object.create( GIScene.Control.prototype );

GIScene.Control.Select.prototype.unhighlightAll = function(interaction){
	var temp_highlightedOnlyObjects = this.highlightedOnlyObjects.slice(0);
	temp_highlightedOnlyObjects.forEach(function(e,i,a){this.unhighlight(temp_highlightedOnlyObjects[i],interaction);}.bind(this));
	temp_highlightedOnlyObjects = null;
	/**
	 *@event unhighlightall 
	 */
	this.dispatchEvent({type:'unhighlightall'});
	/**
	 *@event unhighlightallbyuser 
	 */
	if(interaction)this.dispatchEvent({type:'unhighlightallbyuser'});
};

GIScene.Control.Select.prototype.unselectAll = function(interaction){
	var temp_selectedObjects = this.selectedObjects.slice(0);
	temp_selectedObjects.forEach(function(e,i,a){this.unselect(temp_selectedObjects[i], interaction);}.bind(this));
	temp_selectedObjects = null;
	/**
	 *@event unselectall 
	 */
	this.dispatchEvent({type:'unselectall'});
	/**
	 *@event unselectallbyuser 
	 */
	if(interaction)this.dispatchEvent({type:'unselectallbyuser'});
};
