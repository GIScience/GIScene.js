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
	
	load: function(url, onLoad, onProgress, onError, heightAttribute) {
		
		var loader = this.loader;
		loader.setCrossOrigin( this.crossOrigin );
		loader.load( url, function ( text ) {
			try{
				this.parse( JSON.parse( text ), onLoad, heightAttribute );
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
	
	parse: function(json, callback, heightAttribute) {
		
		var result = new THREE.Scene();
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
		
		var parseGeometry = function(geometry, height) {
			var type = geometry.type;
			var geom3;
			var material;
			var object;
			
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
					
				default :
					console.error(type,"Not supported by GeoJSONLoader");
					
			};
			
			return object;
		}.bind(this);
		
		// var parseProperties = function(properties) {
// 			
		// };
		
		var parseFeature = function(feature, heightAttribute) {
			
			var height = parseFloat(feature.properties[heightAttribute]) || null;
			
			var object = parseGeometry(feature.geometry, height);
			object.userData.gisceneAttributes = feature.properties;
			return object;
		};
		
		var parseFeatureCollection = function(featureCollection) {
			
		};
		
		//DO THE PARSING
		switch (type) {
			
			case "Feature": 
					result.add( parseFeature( json, heightAttribute ) );
					break;
					
			case "FeatureCollection":
					var features = json.features;
					for(var i=0,j=features.length; i<j; i++){
						result.add( parseFeature( features[i], heightAttribute ) );
					};
					break;
					
			default: console.log(type, "GeoJson type not supported by GeoJSONLoader");
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
