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
 * Annotation Service Manager
 * @namespace GENTICS.Aloha.Annotations
 * @class AnnotationServiceManager
 * @singleton
 */
GENTICS.Aloha.Annotations.AnnotationServiceManager = function() {
	this.services = new Array();
};

/**
 * Initialize all registered services
 * @return void
 * @hide
 */
GENTICS.Aloha.Annotations.AnnotationServiceManager.prototype.init = function() {
	
	// get the service settings
	if (GENTICS.Aloha.Annotations.settings.services == undefined) {
		GENTICS.Aloha.Annotations.settings.services = {};
	}

	// iterate through all registered services
	for ( var i = 0; i < this.services.length; i++) {
		var service = this.services[i];
		
		if (service.settings == undefined) {
			service.settings = {};
		}
		
		// merge the specific settings with the service default settings
		if ( GENTICS.Aloha.Annotations.settings.services[service.serviceId] ) {
			jQuery.extend(service.settings, GENTICS.Aloha.Annotations.settings.services[service.serviceId]);
		}
		
		service.init();
	}
};

/**
 * Register an AnnotationService service
 * @param {GENTICS.Aloha.Annotations.AnnotationService} Annotation Service service to register
 */

GENTICS.Aloha.Annotations.AnnotationServiceManager.prototype.register = function(service) {
	
	if (service instanceof GENTICS.Aloha.Annotations.Service) {
		if ( !this.getService(service.serviceId) ) {
			this.services.push(service); 
		} else {
			GENTICS.Aloha.Log.warn(this, "A service with name { " + service.serviceId+ " } already registerd. Ignoring this.");
		}
	} else {
		GENTICS.Aloha.Log.error(this, "Trying to register a service which is not an instance of Annotations.AnnotationService.");
	}
	
};

/**
 * Returns a Annotation Service service object identified by serviceId.
 * @param {String} serviceId the name of the Annotation Service service
 * @return {GENTICS.Aloha.Annotations.AnnotationService} a service or null if name not found
 */
GENTICS.Aloha.Annotations.AnnotationServiceManager.prototype.getService = function(serviceId) {
	
	for ( var i = 0; i < this.services.length; i++) {
		if ( this.services[i].serviceId == serviceId ) {
			return this.services[i];
		}
	}
	return null;
};

/**
 * Create the Annotation Service Manager object
 * @hide
 */
GENTICS.Aloha.Annotations.AnnotationServiceManager = new GENTICS.Aloha.Annotations.AnnotationServiceManager();

/**
 * Expose a nice name for the Annotation Service Manager
 * @hide
 */
GENTICS.Aloha.Annotations.AnnotationServiceManager.toString = function() {
	return "com.gentics.aloha.plugins.Annotations.AnnotationServiceManager";
};