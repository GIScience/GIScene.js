/**
 * File Format Constants to be used with loaders
 * 
 * @namespace GIScene
 * @class Format
 * @static
 *  
 */

GIScene.Format = {
	/**
	 * @property JSON
	 * @type Number
	 * @static
	 * @final 
	 */
	JSON:0,
	/**
	 * @property JSONBinary
	 * @type Number
	 * @static
	 * @final 
	 */
	JSONBinary:1,
	/**
	 * @property OBJ
	 * @type Number
	 * @static
	 * @final 
	 */
	OBJ:2,
	/**
	 * @property Collada
	 * @type Number
	 * @static
	 * @final 
	 */
	Collada:3,
	/**
	 * @property CTM
	 * @type Number
	 * @static
	 * @final 
	 */
	CTM:4,
	/**
	 * @property Scene
	 * @type Number
	 * @static
	 * @final 
	 */
	Scene:5,
	/**
	 * @property GeoJSON
	 * @type Number
	 * @static
	 * @final 
	 */
	GeoJSON:6,
	/**
	 * Specifies a text based format with 'x y z' values as lines to load simple point clouds. 
	 * You can create .xyz files e.g. with MeshLab 
	 * @property XYZ
	 * @type Number
	 * @static
	 * @final 
	 */
	XYZ:6,
	/**
	 * PointCloudFormat of the PoincCloudLibrary PCL see: http://pointclouds.org/ . 
	 * You can create .xyz files e.g. with CloudCompare 
	 * @property XYZ
	 * @type Number
	 * @static
	 * @final 
	 */
	PCD:7
	
};
