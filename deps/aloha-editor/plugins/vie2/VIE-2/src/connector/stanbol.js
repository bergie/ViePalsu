/**
 * @fileOverview VIE^2
 * @author <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
 */

// Ontology structure:
//type == http://fise.iks-project.eu/ontology/TextAnnotation
// => fise:start
// => fise:end
// => fise:selected-text
// => fise:selection-context
//type == http://fise.iks-project.eu/ontology/EntityAnnotation
// => fise:entity-reference
// => entity-label
// => fise:entity-type
//type == http://fise.iks-project.eu/ontology/Enhancement	
// => fise:confidence <float>
// => dc:type


// The stanbol connector needs to be initialized like this:
//$.VIE2.getConnector('stanbol').options({
//    "proxy_url" : "../utils/proxy/proxy.php",
//    "enhancer_url" : "http://stanbol.iksfordrupal.net:9000/engines/",
//    "entityhub_url" : "http://stanbol.iksfordrupal.net:9000/entityhub/"
//});
new Connector('stanbol', {
	namespaces: {
	    semdesk : "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#",
	    owl : "http://www.w3.org/2002/07/owl#",
	    gml : "http://www.opengis.net/gml/_",
	    geonames : "http://www.geonames.org/ontology#"
	}
});

jQuery.VIE2.connectors['stanbol'].analyze = function (object, namespaces, callback) {
	var rdf = jQuery.rdf();
	
	//rules to add backwards-relations to the triples
	//this makes querying for entities aaaa lot easier!
	var rules = jQuery.rdf.ruleset()
    .prefix('fise', 'http://fise.iks-project.eu/ontology/')
    .prefix('dc', 'http://purl.org/dc/terms/')
    .add(['?subject a <http://fise.iks-project.eu/ontology/EntityAnnotation>',
          '?subject fise:entity-type ?type',
          '?subject fise:confidence ?confidence',
	      '?subject fise:entity-reference ?entity',
	      '?subject dc:relation ?relation',
	      '?relation a <http://fise.iks-project.eu/ontology/TextAnnotation>',
	      '?relation fise:selected-text ?selected-text',
	      '?relation fise:selection-context ?selection-context',
	      '?relation fise:start ?start',
	      '?relation fise:end ?end'],
	      ['?entity a ?type',
	       '?entity fise:hasTextAnnotation ?relation',
	       '?entity fise:hasEntityAnnotation ?subject']);
	
	if (object === undefined) {
		jQuery.VIE2.log ("warn", "VIE2.Connector('" + this.id + "')", "Given object is undefined!");
		callback(rdf);
	} else if (typeof object === 'object') {
		//stanbol cannot deal with embedded HTML, so we remove that.
		//--> hack!
		var text = "";
		if (object.get(0) && 
				object.get(0).tagName && 
				object.get(0).tagName == 'TEXTAREA') {
			text = object.get(0).val();
		} else if (object.get(0) &&
		            object.get(0).innerHTML &&
		            object.get(0).innerHTML.length > 0) {
		                
            //text = object.get(0).innerHTML;
            text = object.get(0).innerHTML.replace(/\0\b\n\r\f\t/g, '').replace(/\s+/g, ' ').trim();
		    
		} else {
			text = object
		        .clone()    //clone the element
		        .children() //select all the children
		        .remove()   //remove all the children
		        .end()      //again go back to selected element
		        .text()     //get the text of element
		        .replace(/\s+/g, ' ') //collapse multiple whitespaces
		        .replace(/\0\b\n\r\f\t/g, '').trim(); // remove non-letter symbols
		}
		
		var c = function (rdfc) {
			rdfc.databank.triples().each(function () {
				rdf.add(this);
			});
			
			var children = object.find('*');
			if (children.length) {
				children.each(function (index) {
					var obj = jQuery(this);
					var textc = "";
					if (obj.get(0) && 
							obj.get(0).tagName && 
							obj.get(0).tagName == 'TEXTAREA') {
						textc = obj.get(0).val();
					}
					else {
						textc = obj
					        .clone()    //clone the element
					        .children() //select all the children
					        .remove()   //remove all the children
					        .end()  //again go back to selected element
					        .text()    //get the text of element
					        .replace(/\s+/g, ' ') //collapse multiple whitespaces
					        .replace(/\0\b\n\r\f\t/g, '').trim(); // remove non-letter symbols
					}
					
					var c2 = function (rdfx) {
						rdfx.databank.triples().each(function () {
							rdf.add(this);
						});
					};
					
					var cFinal = function (rdfx) {
						rdfx.databank.triples().each(function () {
							rdf.add(this);
						});
		                jQuery.VIE2.log("info", "VIE2.Connector(" + this.id + ")", "Start reasoning '" + (rdf.databank.triples().length) + "'");
						rdf.reason(rules);
		                jQuery.VIE2.log("info", "VIE2.Connector(" + this.id + ")", "End   reasoning '" + (rdf.databank.triples().length) + "'");
						callback(rdf);
					};
					
					if (index < (children.length - 1)) {
						jQuery.VIE2.connectors['stanbol'].enhance(textc, c2);
					} else {
						//TODO: this does not really work, use queue instead!
						jQuery.VIE2.connectors['stanbol'].enhance(textc, cFinal);
					}
				});
			} else {
				rdf.reason(rules);	
				callback(rdf);
			}
		};
		
		this.enhance(text, c);
	} else {
		jQuery.VIE2.log("error", "VIE2.Connector(" + this.id + ")", "Expected object, found: '" + (typeof object) + "'");
		callback(rdf);
	}
	
};

jQuery.VIE2.connectors['stanbol'].enhance = function (text, callback) {
	if (text.length === 0) {
		jQuery.VIE2.log("warn", "VIE2.Connector(" + this.id + ")", "Empty text.");
		callback(jQuery.rdf());
		return;
	}
	
	var c = function (data) {
		if (data) {
			try {
				var rdf = jQuery.rdf().load(data, {});
				callback(rdf);
			} catch (e) {
				jQuery.VIE2.log("error", "VIE2.Connector(" + this.id + ")", "Could not connect to stanbol enhancer.");
				jQuery.VIE2.log("error", "VIE2.Connector(" + this.id + ")", data);
				callback(jQuery.rdf());
			}
		}
	};
	
	this.queryEnhancer(text, c);
};

jQuery.VIE2.connectors['stanbol'].queryEnhancer = function (text, callback) {

    console.log('text', text);

	var proxy = this.options().proxy_url;
	var enhancer_url = this.options().enhancer_url;

	if (proxy) {
	    /*jQuery.post(proxy, {
			"proxy_url": enhancer_url, 
			"content": text,
			"verb": "POST",
			"format": "application/rdf+json"
		}, callback, "json"
	        );*/
	        /*console.log(JSON.stringify({
    			proxy_url: enhancer_url, 
    			content: text,
    			verb: "POST",
    			format: "application/rdf+json"
			}));*/
		jQuery.ajax({
			async: true,
			success: callback,
			error: callback,
			type: "POST",
			url: proxy,
			dataType: "json",
			contentType: "application/json; charset=utf-8",
			data: JSON.stringify({
    			proxy_url: enhancer_url, 
    			content: text,
    			verb: "POST",
    			format: "application/rdf+json"
			})
		});
	} else {
		jQuery.ajax({
			async: true,
			success: callback,
			error: callback,
			type: "POST",
			url: enhancer_url,
			data: text,
			dataType: "application/rdf+json"
		});
	}
};

jQuery.VIE2.connectors['stanbol'].query = function (uri, props, namespaces, callback) {
	if (uri instanceof jQuery.rdf.resource &&
			uri.type === 'uri') {
		this.query(uri.toString().replace(/^</, '').replace(/>$/, ''), props, namespaces, callback);
		return;
	}
	if (!jQuery.isArray(props)) {
		this.query(uri, [props], namespaces, callback);
		return;
	}
	if ((typeof uri != 'string') || uri.match("^urn:.*")) {
		jQuery.VIE2.log ("warn", "VIE2.Connector('" + this.id + "')", "Query does not support the given URI!");
		callback({});
		return;
	}
	var uri = uri.replace(/^</, '').replace(/>$/, '');
	
	//initialize the returning object
	var ret = {};
	
	var c = function (data) {
		if (data && data.status === 200) {
			try {
				var json = jQuery.parseJSON(data.responseText);
				var rdfc = jQuery.rdf().load(json);

				jQuery.each(namespaces, function(k, v) {
					rdfc.prefix(k, v);
				});
				
				for (var i=0; i < props.length; i++) {
					var prop = props[i].toString();
					ret[prop] = [];
					
					rdfc
					.where(jQuery.rdf.pattern('<' + uri + '>', prop, '?object', { namespaces: namespaces}))
					.each(function () {
						ret[prop].push(this.object);
					});
				}
			} catch (e) {
				jQuery.VIE2.log ("warn", "VIE2.Connector('stanbol')", "Could not query for uri '" + uri + "' because of the following parsing error: '" + e.message + "'!");
			}
		}
		callback(ret);
	};
	
	this.queryEntityHub(uri, c);
};

jQuery.VIE2.connectors['stanbol'].queryEntityHub = function (uri, callback) {
	var proxy = this.options().proxy_url;
	var entityhub_url = this.options().entityhub_url.replace(/\/$/, '');
	
	if (proxy) {
		jQuery.ajax({
			async: true,
			type: "POST",
			complete: callback,
			url: proxy,
			data: {
    			proxy_url: entityhub_url + "/sites/entity?id=" + uri, 
    			content: '',
    			verb: "GET",
    			format: "application/rdf+json"
			}
		});
	} else {
		jQuery.ajax({
			async: true,
			complete: callback,
			type: "GET",
			url: entityhub_url + "/sites/entity?id=" + uri,
			data: text,
			dataType: "application/rdf+json"
		});
	}
};