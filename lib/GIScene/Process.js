/**
 * Base class for processes
 * 
 * @namespace GIScene
 * @class Process
 * @constructor 
 * @param {Object} config
 * 
 * @author mcauer https://github.com/mcauer
 */

GIScene.Process = function(config){
	
	var defaults = {
		identifier		: null,
		title			: null,
		abstract		: null,
		metadata		: null,
		processVersion 	: null,
		description		: 	{
								inputs:[],
								outputs:[]
							}
	};
	
	this.config = GIScene.Utils.mergeObjects(defaults, config || {}); 
	
	this.identifier = this.config.identifier;
	this.title		= this.config.title;
	this.abstract	= this.config.abstract;
	this.metadata	= this.config.metadata;
	this.processVersion = this.config.processVersion;
	this.description	= this.config.description;
	
	this.data = {
		inputs:{},
		outputs:{}
	};



};

GIScene.Process.prototype = {
	
	constructor : GIScene.Process,
	
	/**
	 * Method to set a specific input parameter
	 * 
	 * @method setInput 
 	 * @param {String} inputIdentifier the inputIdentifier defined in the process description
 	 * @param {Mixed} value the value of the input to be set
	 */
	setInput : function(inputIdentifier, value) {
		this.data.inputs[inputIdentifier] = value;
	},	
	
	/**
	 * Method to set several inputs at a time
	 *
	 * @method setInputs 
 	 * @param {Object} inputParams An object with key:value pairs of input parameters, where key corresponds to the inputIdentifiers defined in the process description
	 */
	setInputs : function(inputParams) {
		for(param in inputParams){
			this.setInput(param, inputParams[param]);
		}
	},
	
	/**
	 * Method to get a specific output result after process execution
	 *  
 	 * @method getOutput
 	 * @param {Object} outputIdentifier
 	 * @return {Mixed} an output value of the process
	 */
	getOutput : function(outputIdentifier){
		return this.data.outputs[outputIdentifier];
	},
	
	/**
	 * Method to get all process outputs after process execution 
	 * 
	 * @method getOutputs
	 * @return {Object} An object containing all process outputs
	 */
	getOutputs : function(){
		return this.data.outputs;
	},
	
	/**
	 * Get a param desription (input or ouput) by its identifier
	 * 
	 * @method  getParamDescriptionById
	 * @param {String} identifier
	 * @return {Object} parameterDescription
	 */
	getParamDescriptionById : function(identifier) {
		
		var inputs 	= this.description.inputs;
		var outputs = this.description.outputs;
		
		var params = inputs.concat(outputs);
		
		var parameterDescription = params.filter(function(e,i,a){return e.identifier == identifier;});
		
		parameterDescription = (parameterDescription.length == 0)? undefined : parameterDescription[0];
		
		return parameterDescription;
	},
	
	//Provide EventDispatcher Functions
	addEventListener : THREE.EventDispatcher.prototype.addEventListener,
	hasEventListener : THREE.EventDispatcher.prototype.hasEventListener,
	removeEventListener : THREE.EventDispatcher.prototype.removeEventListener,
	dispatchEvent : THREE.EventDispatcher.prototype.dispatchEvent
	
};