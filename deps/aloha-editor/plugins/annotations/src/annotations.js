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
 * register the plugin with unique name
 */
GENTICS.Aloha.Annotations = new GENTICS.Aloha.Plugin('annotations');

/**
 * Configure the available languages
 */
GENTICS.Aloha.Annotations.languages = ['en', 'de'];

/**
 * Initialize the plugin
 */
GENTICS.Aloha.Annotations.init = function () {
	var that = this;
	
	GENTICS.Aloha.Annotations.AnnotationServiceManager.init();
	//GENTICS.Aloha.Annotations.AnnotationWriterManager.init();
};

/**
 * Register Annotation Services
 */
GENTICS.Aloha.Annotations.registerAnnotationService = function () {
	
};

/**
 * Register Annotation Writer
 */
GENTICS.Aloha.Annotations.registerAnnotationWriter = function () {
	
};