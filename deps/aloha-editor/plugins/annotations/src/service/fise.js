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
 * Create the Services object. Namespace for Services
 * @hide
 */
if ( !GENTICS.Aloha.Annotations.Services ) GENTICS.Aloha.Annotations.Services = {};

/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Annotations.Services.fise = new GENTICS.Aloha.Annotations.Service('com.gentics.aloha.plugins.Annotations.service.fise');

/**
 * init IKS Fise Service
 */
GENTICS.Aloha.Annotations.Services.fise.init = function() {
	var that = this;
	
	this.subscribeEvents();
	
	// REST API Endpoint URL.
	this.ApiEndpoint = false;
	if (GENTICS.Aloha.Annotations.settings.Services && GENTICS.Aloha.Annotations.settings.Services.fise && GENTICS.Aloha.Annotations.settings.Services.fise.ApiEndpoint) {
	   this.ApiEndpoint = GENTICS.Aloha.Annotations.settings.Services.fise.ApiEndpoint;
    }
    
    if (!this.ApiEndpoint) {
    	console.log('ERROR: GENTICS.Aloha.Annotations.settings.Services.fise.ApiEndpoint not defined. Configure your FISE ApiEndpoint first.');
        return false;
    }

	// @todo (due to bug in fise: text/plain == json-ld output); application/json, application/rdf+xml, application/rdf+json, text/turtle or text/rdf+nt
	this.ResponseFormat = "text/plain";
	
	if ( this.settings.ApiKey ) {
		// set the service name
		this.repositoryName = 'fise/' + this.settings.ApiKey;
	} else {
		// set the service name
		this.repositoryName = 'fise/public';
	}
};

/**
 * Subscribe for events
 */
GENTICS.Aloha.Annotations.Services.fise.subscribeEvents = function () {

	var that = this;	
	
    // add the event handler for smartContentChanged / editableDeactivated
    GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'editableDeactivated', function(event, rangeObject) {
    
		// @palsu.me hack -- fise annotations are not working fine with other rdfa editables like agenda ...
    	//if (GENTICS.Aloha.activeEditable) {
		if (GENTICS.Aloha.activeEditable && GENTICS.Aloha.activeEditable.obj && GENTICS.Aloha.activeEditable.obj.selector == '#chat-input div') {
    		var url = false;
    		
    		// @todo use new proxy plugin settings
			if (GENTICS.Aloha.settings.proxyUrl) {
               // the service url is passed as Query parameter, so it needs to be URLEncoded!
               url = GENTICS.Aloha.settings.proxyUrl + that.ApiEndpoint;
            } else {
                console.log('ERROR: GENTICS.Aloha.settings.proxyUrl not defined. Configure your AJAXproxy Plugin.');
                return false;
            }

            var content_txt = stripHtml(GENTICS.Aloha.activeEditable.getContents());
			var data = {
				content: content_txt, // send all content
				ajax: true,
				format: that.ResponseFormat
			};
			
			// submit the data to our proxy
			jQuery.ajax({
				type: "POST",
				url: url,
				data: data,
				//dataType: "html",
				contentType: 'text/plain',
				cache: false,
				beforeSend : function (xhr) {
					xhr.setRequestHeader('Accept', that.ResponseFormat);
					xhr.setRequestHeader('X-Service-Info', 'Aloha Editor Annotation Service');
				},
				success: function(result) {
					var obj = false;
					
					try {
						obj = jQuery.parseJSON(result);
					} catch (e) {
						var re = new RegExp('<title>(.*)<\/title>');
						var match = re.exec(result);
						if (match && match[1]) {
							GENTICS.Aloha.Annotations.log('error', 'FISE ERROR: ' + match[1]);
						}
						return false;
					}
					
					var suggestionsContainer = jQuery("input.as-input");
					var suggestions = [];
					var annotations = [];
					var entities = [];
				    var final_annotations = [];

					try {
						if (obj["@"] == undefined) {
							obj["@"] = [];
							obj["@"][0] = false;
						}
					
					var annotation = {};
					for (i = 0; i < obj["@"].length; i++) {
						annotation = {
                        	data: obj["@"][i],
                        	urn : obj["@"][i]["@"],
                        	relation : obj["@"][i]["http://purl.org/dc/terms/relation"],
                        	type : obj["@"][i]["http://purl.org/dc/terms/type"],
                        	label : obj["@"][i]["http://fise.iks-project.eu/ontology/entity-label"],
                        	text : obj["@"][i]["http://fise.iks-project.eu/ontology/selected-text"],
                        	reference : obj["@"][i]["http://fise.iks-project.eu/ontology/entity-reference"],
                        	confidence : obj["@"][i]["http://fise.iks-project.eu/ontology/confidence"]
                        }
                        
                        annotations.push(annotation);

					};
				    
				    var annotations_entities = annotations;
				    for (i = 0; i < annotations.length; i++) {
                        if (annotations[i].reference == undefined && annotations[i].type != undefined) {
                            var tmp_entities = [];
                            for(j = 0; j < annotations_entities.length; j++) {
                                if (annotations[i].urn === annotations_entities[j]['relation'] && annotations_entities[j]['label'] != undefined) {
                                    var re = new RegExp('\"([0-9]+\.[0-9]+)\"');
            						var match_confidence = re.exec(annotations_entities[j]['confidence']);
            						if (match_confidence != null) {
            						    //console.log('annotation entity', annotations_entities[j]);
            						    
            						    tmp_entities.push({confidence : match_confidence[1],
            						                        data : annotations_entities[j]});
            						}
                                }
                            }
                            
                            if (tmp_entities.length < 1) {
                                tmp_entities.push({confidence : 0,
    						                        data : annotations[i]});
                            }
                            tmp_entities.sort();
                            var final_annotation = tmp_entities.shift();
                            final_annotations.push(final_annotation);
                        }
				    }
				    
				    var named_entity = false;
				    for(i = 0; i < final_annotations.length; i++) {
				        named_entity = final_annotations[i];
				        named_entity = final_annotations[i];
				        if (named_entity != undefined && named_entity.data != undefined) {
				        named_entity = named_entity.data;
				        if (named_entity.confidence != undefined) {
				        if (named_entity.text) {
    						var tag = named_entity.text;
						    tag = tag.replace(/ \+ /g, " ");
						    named_entity.text = tag;
						} else if (named_entity.label) {
    						var tag = named_entity.label;
						    tag = tag.replace(/ \+ /g, " ");
						    named_entity.label = tag;
						}
                                                    
						var re = new RegExp('\"(.*)\"');
						var match = re.exec(tag);

						var re = new RegExp('\"([0-9]+\.*)\"');
						var match_confidence = re.exec(named_entity.confidence);
						if (match != null && match_confidence != null) {
						    //console.log('entity', named_entity);
						    entities.push(named_entity);
							if (jQuery.inArray(match[1], suggestions) < 0) { // see also autoSuggest plugin
								suggestions.push(match[1]);
							}
						}
						}
						}
				    }
				    
				    var eventId = jQuery('body').attr('about');
				    var mentionCollection = VIE.EntityManager.getBySubject(eventId).get('rdfcal:hasMention');
                    
    					for (i=0; i < suggestions.length; i++) {
                            //if (entities[i].type == '<http://dbpedia.org/ontology/Person>') {
                                var urlId = window.location.protocol + "//" + window.location.host + "/p/"+encodeURIComponent(suggestions[i])
                            
                                //console.log('check', jQuery('[about="'+urlId+'"]'));
                            
                                var date = new Date();
                            
                                if (jQuery('[typeof="rdfcal\\:Mention"][about="'+urlId+'"]').length < 1) {
                                mentionCollection.add({
                                    'rdfcal:hasAgent': 'http://agent.info/'+encodeURIComponent(suggestions[i]),
                                    'foaf:name': suggestions[i],
                                    'dc:created': date.toISOString(),
                                    'id': urlId
                                });
                        	    }
                            //}
    					}

					} catch(m) {
						GENTICS.Aloha.Annotations.log('error', 'FISE engine offline');
					}
				},
				error: function(result) {
					GENTICS.Aloha.Annotations.log('error', 'There was an error fetching the contents of the FISE annotation service. Service not available.');
				}
			});
		}
	});
};


function stripHtml(html)
{
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent||tmp.innerText;
}