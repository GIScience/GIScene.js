/**
 *Loads a geojson file. Provides Methods to load and parse GeoJSON Files/Objects
 *
 * Currently no reprojection is supported, geojson-coords have to be in sceneunits.
 * TODO offset support
 * 
 * @namespace GIScene
 * @class GeoJSONLoader
 * @constructor
 * 
 * @author m.auer
 **/

GIScene.GeoJSONLoader = function() {
	
	this.onLoadStart = function () {};
	this.onLoadProgress = function() {};
	this.onLoadComplete = function () {};
	
	this.loader = new THREE.XHRLoader( this.manager ); //?? manager??
	
	this.symbol = THREE.ImageUtils.loadTexture( GIScene.LIBRARYPATH + GIScene.RESOURCESPATH.replace(/([^\/])$/, "$1/") +"resources/images/particle_cross.png");
	
};

GIScene.GeoJSONLoader.prototype = {
	
	constructor : GIScene.GeoJSONLoader,
	
	load: function(url, onLoad, onProgress, onError, /*heightAttribute,*/ heightOptions, materialOptions) {
		/**
		 *heightOptions = {
		 * 	heightAttribute {String},    -- name of property with predefined height (extrusion) value
		 *  [heightOffsetAttribute]	{String},    -- name of property with predefined base height offset value.
 		 * 	[heightOffsetFunction] {Function},      -- function which has access to the features geometry and attributes and this heightOptions-Object. Should return a height offset value
		 *  [heightFunction] {Function}, -- function which has access to the features geometry and attributes and this heightOptions-Object. Should return a height value for extrusion
		 *  [extrusionOptions] {Object}  -- set extrusion options for THREE.ExtrusionGeometry. default is {bevelEnabled:false}
		 *  [heightScale] {Number} -- Default 1.
		 * }
		 * 
		 * materialOptions = {
		 * 	colorAttribute {String}
		 * 	colorFunction {Function}
		 * } 
		 */
		
		var heightOptions = heightOptions || {};
		var materialOptions = materialOptions || {};
		
		//for convenience if heightOptions is not an object but a String use this as heightAttribute
		if (typeof heightOptions == 'string'){
			heightOptions = {
				heightAttribute : heightOptions
			};
		}
		
		
		var loader = this.loader;
		//loader.setCrossOrigin( this.crossOrigin );
		loader.load( url, function ( text ) {
			try{
				this.parse( JSON.parse( text ), onLoad, heightOptions,materialOptions /*heightAttribute*/ );
			}
			catch(e){
				console.log("GeoJsonLoader");
				console.log(e);
				console.log("ResponseText", text);
				if(onError)onError(e,text);
				// onLoad({ //send empty result (fail silent)
						// scene: new THREE.Scene(),
						// geometries: {},
						// face_materials: {},
						// materials: {},
						// textures: {},
						// objects: {},
						// cameras: {},
						// lights: {},
						// fogs: {},
						// empties: {},
						// groups: {}
						// }
				// );
			}

		}.bind(this) );
	},
	
	setCrossOrigin : function(value) {
		this.crossOrigin = value;
	},
	
	parse: function(json, callback, heightOptions, materialOptions /*heightAttribute*/) {
		
		var result = new THREE.Group();
		var type = json.type;
		callback = callback || function(){};
		
//define parser functions
		
		var coord2ToVec3 = function(coord2, height) {
			height = height || 0;
			return new THREE.Vector3(coord2[0], height, -coord2[1]);
		};
		
		var coord3ToVec3 = function(coord3) {
			
			return new THREE.Vector3(coord3[0], coord3[2], -coord3[1]);
		};
		
		/**
		 * @method parsePolygonCoords
		 * @private
 		 * @param {Array>} polygonCoords Array of one outer and zero or more inner rings
 		 * [[outer],[inner],...,[inner]] with [outer/inner] := [[x,y],...,[x,y]]
		 */
		var parsePolygonCoords = function(polygonCoords) {

			var ringCoords;
			var ringCoordsV2 = [];
			var polygonShape;
			
			//polygon coords to shape
			for (var i = 0,
			    j = polygonCoords.length; i < j; i++) {

				ringCoords = polygonCoords[i];
				ringCoords.forEach(function(e) {
					ringCoordsV2.push(new THREE.Vector2(e[0], e[1]));
				});

				//outer
				if (i == 0) {
					polygonShape = new THREE.Shape(ringCoordsV2);
				}
				//inner
				else {
					polygonShape.holes.push(new THREE.Shape(ringCoordsV2));
				}
			};

			return polygonShape;

		}; 

	
		
		var parseGeometryPolygon = function(coords, height) {
		
			// get rings
			//var polygonRings = parsePolygonCoords(geometry.coordinates);
			//get outer ring

			//var polygonShape = new THREE.Shape(polygonRings.outer);
			var polygonShape = parsePolygonCoords(coords);
			var polygonGeometry = (height != null) ? new THREE.ExtrudeGeometry(polygonShape, {
				amount : 1, //parseFloat(height),
				bevelEnabled : false 
			}) : new THREE.ShapeGeometry(polygonShape);
			
			
			return polygonGeometry;
	
		};
		
		var parseGeometry = function(geometry, height, objectColor) {
			var type = geometry.type;
			var geom3;
			var material;
			var object;
			objectColor = (typeof objectColor != 'number')? 0x00AA00 : objectColor; 
			
			switch (type){
				
				case "Point" :
					geom3 = new THREE.Geometry();
					var vertex = (!height && geometry.coordinates.length > 2)? coord3ToVec3(geometry.coordinates) : coord2ToVec3( geometry.coordinates, height ); 
					geom3.vertices.push( coord2ToVec3( geometry.coordinates, height ) );
					// material = new THREE.ParticleBasicMaterial({ //-r76
					material = new THREE.PointsMaterial({ //+r76
												color:new THREE.Color( 0xff0000 ),
												sizeAttenuation:false,
												size:32,
												map:this.symbol,
												alphaTest:0.5	
											});
					// object = new THREE.ParticleSystem(geom3, material); //-r76
					object = new THREE.Points(geom3, material); //+r76
					break;
				case "Polygon" :
					
					var polygonGeometry = parseGeometryPolygon(geometry.coordinates,height);
					
					object = new THREE.Mesh( polygonGeometry, new THREE.MeshPhongMaterial( { color: objectColor, side: THREE.FrontSide } ) );
					
					
					
					//object.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI/2 ) );
					object.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI/2 ) );
					
					object.geometry.computeBoundingSphere();
					var center = object.geometry.boundingSphere.center.clone();
					object.geometry.translate(-center.x,0,-center.z);
					object.position.setX(center.x);
					object.position.setZ(center.z);
					
					
					
					//individual height scale for feature
					if (height != null){
				 		object.scale.setY(height);
					}
					break;
				case "MultiPolygon" :
					var multiPolygonGeometry = new THREE.Geometry();
					//getpolygons
					var polygons = geometry.coordinates;
					//merge multi geometries
					polygons.forEach( function(e,a,i) {
				    	multiPolygonGeometry.merge(parseGeometryPolygon(e,height));
				    } );
				    
				    object = new THREE.Mesh( multiPolygonGeometry, new THREE.MeshPhongMaterial( { color: objectColor, side: THREE.FrontSide } ) );
					
					object.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI/2 ) );
					
					object.geometry.computeBoundingSphere();
					var center = object.geometry.boundingSphere.center.clone();
					object.geometry.translate(-center.x,0,-center.z);
					object.position.setX(center.x);
					object.position.setZ(center.z);
					
					//individual height scale for feature
					if (height != null){
				 		object.scale.setY(height);
					}
				    
					
					
					break;
				default :
					console.error(type,"Not supported by GeoJSONLoader");
					
			};
			
			return object;
		}.bind(this);
		
		
		var parseFeature = function(feature, heightOptions, materialOptions/*heightAttribute*/) {
			var height;
			var objectColor;
			//if heightAttribute available, go with it
			if (heightOptions.heightAttribute){
				
				height = parseFloat(feature.properties[heightOptions.heightAttribute]);
				if (isNaN(height)) {console.log("Attribute " + heightOptions.heightAttribute + "does not contain a number or number string.");}
				if (height == 0) {height = 0.01;} //always extrude //use ShapeGeometry instead of ExtrudeGeometry
			}
			else if (heightOptions.heightFunction && typeof heightOptions.heightFunction == 'function' ){
				height = heightOptions.heightFunction(feature,heightOptions);
			}
			
			//compute color
			if (materialOptions.colorFunction && materialOptions.colorAttribute){
				objectColor = materialOptions.colorFunction(parseFloat(feature.properties[materialOptions.colorAttribute]));
			}
			
			
			var object = parseGeometry(feature.geometry, height, objectColor);
			object.userData.gisceneAttributes = feature.properties;
			
			return object;
		};
		
		var parseFeatureCollection = function(featureCollection) {
			
		};
		
		//DO THE PARSING
		switch (type) {
			
			case "Feature": 
					result.add( parseFeature( json, heightOptions,materialOptions ) );
					break;
					
			case "FeatureCollection":
					var features = json.features;
					for(var i=0,j=features.length; i<j; i++){
						result.add( parseFeature( features[i], heightOptions,materialOptions ) );
					};
					break;
					
			default: console.log(type, "GeoJson type not supported by GeoJSONLoader");
		}
		
		//global scale for result
		if (heightOptions.heightScale){
				result.scale.setY(heightOptions.heightScale);
			}
		callback(result);
		return result;
	},
	
	getType : function(geojson) { //FeatureCollection | Feature | Geometry
		return geojson.type;
	},
	
	getExampleValues : function(geojson) {
		
		var type = this.getType(geojson);
		
		switch (type) {
			
			case "Feature" : 
					
					var properties = geojson.properties;
					var exampleValues = [];
					
					
					for (property in properties){
					  exampleValues.push(properties[property]);
					}

					return exampleValues;
		
					break;
			case "FeatureCollection" : 
					var properties = geojson.features[0].properties;
					var exampleValues = [];
					
					
					for (property in properties){
					  exampleValues.push(properties[property]);
					}

					return exampleValues;
		
					break;
			default: 
				if(this.isGeometry(geojson)){ //type is Geometry
					return [];break;
				}
			else{
				alert("GeoJSON seems to be invalid");return [];	
			}
				
		}
	},
	
	getAttributeNames : function(geojson) {
		
		var type = this.getType(geojson);
		
		switch (type) {
			
			case "Feature" : return Object.keys(geojson.properties);break;
			case "FeatureCollection" : return Object.keys(geojson.features[0].properties);break;
			default: 
				if(this.isGeometry(geojson)){ //type is Geometry
					return [];break;
				}
			else{
				alert("GeoJSON seems to be invalid");return [];	
			}
				
		}
	},
	
	isGeometry: function(geojson) {
		return geojson.type == "Point" || "MultiPoint" || "LineString" || "MultiLineString" || "Polygon" || "MultiPolygon" || "GeometryCollection";
	},
	
	
	hasZCoordinates : function(geojson) {	
		
		var type = this.getType(geojson);
		
		var hasZFromCoordinates= function (coordinates){

			if ( typeof (coordinates[0]) == "object") {

				return findFirstCoordinate(coordinates[0]);

			} else {

				return coordinates.length > 2;
			}

		};

		var hasZFromGeometry = function(geojson) {
			if(geojson.type == "GeometryCollection"){
				return hasZFromCoordinates(geojson.geometries[0].coordinates);
			}
			else{
				return hasZFromCoordinates(geojson.coordinates);
			}
		};
		
		var hasZFromFeature = function(geojson) {
			return hasZFromGeometry(geojson.geometry);
		};
		
		switch (type) {
			case "Feature" : return hasZFromFeature(geojson);break;
			
			case "FeatureCollection" : return hasZFromFeature(geojson.features[0]);break;
			default: 
					return hasZFromGeometry(geojson);
			
		}
		
		}
	
};
