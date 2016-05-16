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
		<script src="js/THREE/r76/three.min.js"></script>
		<script src="js/GIScene/GIScene_min_2.0.0.js"></script>
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
			var nav_ctrl = new GIScene.Control.PanOrbitZoomCenter(scene.camera, scene.containerDiv);
			
			scene.addControl(nav_ctrl);
			
			nav_ctrl.activate();
			
		</script>
	</body>
</html>
```
#New in Version 2.0.0
 - upgraded to be used with Three.js r76
 - added pointcloud support: new loaders, adapted Controls (Pick, Measure, Select, PanOrbitZoomCenter, Walk)

#Acknowledgements
GIScene has been developed by M.Auer during the research project [MayaArch3D](http://www.mayaarch3d.org). The [MayaArch3D-SingleObjectViewer](http://www.mayaarch3d.org/language/en/research/tools-in-development/3d-object-viewer/temple-18-2/) was developed using the GIScene.js library.
Between 2012 and 2015 the development of GIScene.js and the MayaArch3D project has been funded by the German Ministry of Education and Research (BMBF). 
