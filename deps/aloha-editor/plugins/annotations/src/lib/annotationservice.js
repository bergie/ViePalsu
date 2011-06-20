/*!
 * Licensed under the MIT (MIT-LICENSE.txt) http://creativecommons.org/licenses/MIT/
 * 
 * Copyright (c) 2010 Gentics Software GmbH, Vienna (http://gentics.com)
 * Author Rene Kapusta (http://twitter.com/rene_kapusta)
 * Author Haymo Meran (http://twitter.com/draftkraft)
 */
/**
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Abstract Annotation Service
 * @namespace GENTICS.Aloha
 * @class Service
 * @constructor
 * @param {String} serviceId unique repository identifier
 * @param {String} basePath (optional) basepath of the repository (relative to 'repositories' folder). If not given, the basePath is taken
 */
GENTICS.Aloha.Annotations.Service = function(serviceId, serviceName) {
	/**
	 * @cfg {String} serviceId is the unique Id for this Service repository instance 
	 */
	this.serviceId = serviceId;
	
	/**
	 * contains the service settings object
	 * @cfg {Object} settings the service settings stored in an object
	 */
	this.settings = {};

	/**
	 * @cfg {String} serviceName is the name for this Service instance 
	 */
	// annotationServiceName
	this.serviceName = (serviceName) ? serviceName : serviceId;
	
	GENTICS.Aloha.Annotations.AnnotationServiceManager.register(this);
};

/**
 * Init method of the repository. Called from Aloha Annotations Plugin to initialize this Service
 * @return void
 * @hide
 */
GENTICS.Aloha.Annotations.Service.prototype.init = function() {
	
};