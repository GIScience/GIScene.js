/**
 * The local file loader will load files from the local file system 
 * 
 * @namespace GIScene
 * @class LocalFileLoader
 * @constructor
 * @param {HTMLInputElement} fileInputElement an input element of type="file" used to choose the file to load
 * @param {String} readAs defines the nature of the result. Can be "text", "dataURL", "binaryString" or "arrayBuffer"
 * @param {Function} onSuccess will have an argument containing the fileReader.result, which depends on the readAs property
 * @param {Function} onProgress will have an argument containing the ProgressEvent
 * @param {Fucntion} onError will have an argument containing the DOMError object of fileReader.error
 */

GIScene.LocalFileLoader = function(fileInputElement, readAs, onSuccess, onProgress, onError) {
	
	this.fileReader = new FileReader();
	
	var loadFile = function(event) {
		
		var fileList = event.target.files;
		var file = fileList[0];
		var filename = file.name;
		
		this.fileReader.onload 		= function(event) { if(onSuccess)  onSuccess(this.fileReader.result, filename); }.bind(this);
		this.fileReader.onprogress 	= function(event) { if(onProgress) onProgress(event, filename); };
		this.fileReader.onerror 	= function(event) { if(onError)    onError(this.fileReader.error, filename); }.bind(this);
		
		
		//start loading
		switch (readAs.toUpperCase()){
			case "TEXT": 
					this.fileReader.readAsText(file);
					break;
			case "DATAURL":
					this.fileReader.readAsDataURL(file);
					break;
			case "BINARYSTRING":
					this.fileReader.readAsBinaryString(file);
					break;
			case "ARRAYBUFFER":
					this.fileReader.readAsArrayBuffer(file);
		}
		
	}.bind(this);
	
	fileInputElement.addEventListener('change', loadFile, false);
	
};