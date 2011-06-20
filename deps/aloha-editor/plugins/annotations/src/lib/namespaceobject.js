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
 * Namespace object to use with annotations
 * Example:
 * <pre>
 * var foaf = new GENTICS.Aloha.Annotations.Namespace({ prefix: 'foaf', uri: 'http://xmlns.com/foaf/0.1/'})
 * </pre>
 *
 * @property {string} prefix a string used as shortcut for the namespace URI;
 * @property {string} uri a URI of the namespace;
 *
 * @param {object} attrs all attributes for the namespace.
 *
 */
GENTICS.Aloha.Annotations.Namespace = function(attrs) {	
	if (attrs) {
		try {
			this.prefix = this.getAttr('prefix');
			this.uri = this.getAttr('uri');
		} catch ( e ) {
			throw e;
		}
		
		// @todo check if the namespace is available; if not, add it the the parent dom object
	}
};

GENTICS.Aloha.Annotations.Namespace.prototype.getAttr = function(name) {

	var v = this.attrs[name];

	return v;
};

GENTICS.Aloha.Annotations.Namespace.prototype.checkNamespace = function(prefix) {
	// check with jQuery if Namespace is available in the html header or the parent dom container
};
