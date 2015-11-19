# GIScene.js
A 3D WebGIS framework. Based on Three.js. Easy to learn and customize.

This project extends the fantastic capabilities of the 3D JavaScript library [three.js](https://github.com/mrdoob/three.js/) by adding GIS concepts like Layers, Controls, Coordinates, Projections and more.
If you are familiar with the web mapping library [OpenLayers](http://openlayers.org/) you will find this library easy to use.
You can use it for georeferenced 3D data, but it takes a lot of work from you no matter if your models are georeferenced or not.

##Basic Usage
```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title>GIScene.js example - Basic Usage</title>
		<script src="js/THREE/r63/three.min.js"></script>
		<script src="js/GIScene/GIScene_min_1.0.1.js"></script>
	</head>
	<body>
		<h1>GIScene.js example - Basic Usage</h1>
		<div id="scene"></div>
		<script>
			//create a new scene
			var scene = new GIScene.Scene('scene');
			
			//add a layer
			var layer_options = {
				url : "models/stanford_bunny/bunny_brown.ctm",
				format : GIScene.Format.CTM,
				//optional: automatic zoom depending on object size after layer has been loaded
				listeners: [ { 'load' : function( event ){ var layer = event.content; scene.setCenter(event.content.boundingBox.center(), new THREE.Vector3(0, 0, event.content.boundingBox.getBoundingSphere().radius*2)); } } ]
			};
			
			var layer = new GIScene.Layer.Fixed("Layername", layer_options);
			
			scene.addLayer(layer);
			
			//create, add and activate a navigation control
			var nav_ctrl = new GIScene.Control.PanOrbitZoomCenter(scene.camera);
			
			scene.addControl(nav_ctrl);
			
			nav_ctrl.activate();
			
		</script>
	</body>
</html>
```
