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
 * The Annotation object is a valid RDFa compatible object. The implementation
 * follows strongly the RDFa specifiaction. http://www.w3.org/TR/rdfa-syntax/#sec_9.1.
 * Do not set properties directly after initialization. Use the constructor to set all properties.
 * 
 * Example:
 * <pre>
 * var annotations = [
 * new GENTICS.Aloha.Annotations.Annotation ({
 * 		about:'dbp:Albert_Einstein',
 * 		rel:'dbp:birthPlace',
 * 		resource: 'http://dbpedia.org/resource/Germany',
 * 		content: 'Federal Republic of Germany'
 * }, [ 
 * 		new GENTICS.Aloha.Annotations.Namespace({ prefix: 'dbp', uri: 'http://dbpedia.org/resource'}),
 * 		new GENTICS.Aloha.Annotations.Namespace({ prefix: 'foaf', uri: 'http://xmlns.com/foaf/0.1/'}),
 * ]),
 * var rdfa = new GENTICS.Aloha.Annotations.Annotation ({
 * 		about:'dbp:Albert_Einstein',
 * 		property:'foaf:name',
 * 		content: 'Albert Einstein'
 * }, [ 
 * 		new GENTICS.Aloha.Annotations.Namespace({ prefix: 'dbp', uri: 'http://dbpedia.org/resource'}),
 * 		new GENTICS.Aloha.Annotations.Namespace({ prefix: 'foaf', uri: 'http://xmlns.com/foaf/0.1/'}),
 * ]);
 * </pre>
 * 
 * @property {string} rel a whitespace separated list of CURIEs, used for expressing relationships between two resources ('predicates' in RDF terminology);
 * @property {string} rev a whitespace separated list of CURIEs, used for expressing reverse relationships between two resources (also 'predicates’);
 * @property {string} content a string, for supplying machine-readable content for a literal (a 'plain literal object', in RDF terminology);
 * @property {string} href a URI for expressing the partner resource of a relationship (a 'resource object', in RDF terminology);
 * @property {string} src a URI for expressing the partner resource of a relationship when the resource is embedded (also a 'resource object’).
 * @property {string} about a URIorSafeCURIE, used for stating what the data is about (a 'subject' in RDF terminology);
 * @property {string} property a whitespace separated list of CURIEs, used for expressing relationships between a subject and some literal text (also a 'predicate’);
 * @property {string} resource a URIorSafeCURIE for expressing the partner resource of a relationship that is not intended to be 'clickable' (also an 'object’);
 * @property {string} datatype a CURIE representing a datatype, to express the datatype of a literal;
 * @property {string} type (due to name collition with JS we ues type instead typeof) a whitespace separated list of CURIEs that indicate the RDF type(s) to associate with a subject.
 * 
 * @param {object} attrs all attributes for RDFa Annotations.
 * @param {array} namespaces an array of @GENTICS.Aloha.Annotations.Namespace objects
 * 
*/
GENTICS.Aloha.Annotations.Annotation = function(attrs, namespaces) {	
	
	this.namespaces = namespaces;
	this.attrs = attrs;

	// check attributes
	if (attrs) {
		try {
			this.rel = this.getAttr('rel');
			this.rev = this.getAttr('rev');
			this.content = this.getAttr('content');
			this.href = this.getAttr('href');
			this.src = this.getAttr('src');
			this.about = this.getAttr('about');
			this.property = this.getAttr('property');
			this.resource = this.getAttr('resource');
			this.datatype = this.getAttr('datatype');
			this.type = this.getAttr('type');
		} catch ( e ) {
			throw e;
		}
	}
};

// check a single attribute if it is a valid RDFa.
GENTICS.Aloha.Annotations.Annotation.prototype.getAttr = function(name) {
	
	var v = this.attrs[name];
	
	// http://www.w3.org/TR/rdfa-syntax/#sec_9.1.
	// TODO rel + rev is also a valid value of: 
	//      http://www.w3.org/TR/rdfa-syntax/#relValues
	// TODO rel + rev are unclearly specified: 
	//      http://www.w3.org/TR/rdfa-syntax/#col_Metainformation 
	//      and http://www.w3.org/TR/rdfa-syntax/#sec_5.4.4.
	
	// check CURIEs attributes
	if ( jQuery.inArray(name, ['rel','rev','property','type']) ) {

		var curies = v.split(' ');
		var curie = true;
		var namespace = true;
		for (var i = 0; i < curies.length; i++) {
			if ( isCURIE(curies[i].trim()) ) {
				if ( !checkNamespace(curies[i].trim()) ) {
					namespace = false;
				}
			} else {
				curie = false;
			}
			this.isCURIE( curies[i].trim() );
		}
		if ( curie ) {
			if ( !namespace ) {
				throw 'Invalid namespace: ' + v;
			}
		} else {
			throw 'No CURIE: ' + v;
		}

	// check CURIE attribute
	} else if ( name == 'datatype' ) {

		if ( isCURIE(v) ) {
			if ( !checkNamespace(v) ) {
				throw 'Invalid namespace: ' + v;
			}
		} else {
			throw 'No CURIE: ' + v;
		}

	// check URIorSafeCURIE attributes
	} else if ( jQuery.inArray(name, ['about','resource']) ) {
		
		if ( !isURI(v) ) {
			if ( isSafeCURIE(v) ) {
				if (!checkNamespace(v) ) {
					throw 'Invalid namespace: ' + v;
				}
			} else {
				throw 'No URIorSafeCURIE: ' + v;
			}
		}
		
	// check URI attributes
	} else if ( jQuery.inArray(name, ['href','src']) ) {
		
		if ( !isURI(v) ) {
			throw 'No URI: ' + v;
		}		
	}	
	
	// when you come here the value is fine.
	return value;
};

// http://www.w3.org/TR/rdfa-syntax/#s_datatypes
GENTICS.Aloha.Annotations.Annotation.prototype.isCURIE = function(value) {
	var regex = new RegExp('(([\i-[:]][\c-[:]]*)?:)?.+');
	return value.match(regex);
};

// http://www.w3.org/TR/rdfa-syntax/#s_datatypes
GENTICS.Aloha.Annotations.Annotation.prototype.isSafeCURIE = function(value) {
	var safeCURIEregex = new RegExp('\[(([\i-[:]][\c-[:]]*)?:)?.+\]');
	return value.match(safeCURIEregex);
};

// check URI based on a regex
GENTICS.Aloha.Annotations.Annotation.prototype.isURI = function(value) {
	var URIregex = new RegExp('^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)');
	return value.match(URIregex);
};

// RDFa CURIE namespace check
GENTICS.Aloha.Annotations.Annotation.prototype.checkNamespace = function(value) {
	var v = value.split(':');
	if ( v.length == 2 ) {
		for (var i = 0; i < this.namespaces; i++) {
			if (this.namespaces[i].prefix == v[0]) {
				return true;
			} 
		}
	}
	return false;
};
