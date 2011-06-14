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
	//this.ApiEndpoint = "http://fise.demo.nuxeo.com/engines/"; // @todo
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
    
		//alert('smartContentChanged: ' + rangeObject.triggerType);
		/*
		$('#aloha_status_value').text('smartContentChanged: ' + rangeObject.triggerType);
		$('#aloha_status_value2').text('snapshotContent: ' + rangeObject.snapshotContent);
		$('#aloha_status_value3').text('editable content: ' + rangeObject.editable.getContents());
		*/
		//return false;
		
		
    	if (GENTICS.Aloha.activeEditable) {
    	    
    		var url = false;
    		
    		// @todo use new proxy plugin settings
			if (GENTICS.Aloha.settings.proxyUrl) {
               // the service url is passed as Query parameter, so it needs to be URLEncoded!
               url = GENTICS.Aloha.settings.proxyUrl + that.ApiEndpoint;
            } else {
                console.log('ERROR: GENTICS.Aloha.settings.proxyUrl not defined. Configure your AJAXproxy Plugin.');
                return false;
            }

			var data = {
				// @todo all or only parts of the content
				content: GENTICS.Aloha.activeEditable.getContents(), // send all content
				//content: rangeObject.changedDom.outerHTML, // outerText or outerHTML? send currently changed dom
				ajax: true,
				format: that.ResponseFormat
			};
			
			console.log('send fise data', data);
			console.log('from active editable', GENTICS.Aloha.activeEditable);
			
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
						// @todo error from fise - it should provide a error message in the same format as expected... json not html
						var re = new RegExp('<title>(.*)<\/title>');
						var match = re.exec(result);
						if (match && match[1]) {
							GENTICS.Aloha.Annotations.log('error', 'FISE ERROR: ' + match[1]);
						}
						return false;
					}
					
					console.log('fise return obj', obj);
					
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
    				    
        				/*
        				if (annotation.confidence != undefined && annotation.type != undefined && annotation.relation == undefined) {
    						if (annotation.text) {
        						var tag = annotation.text;
    						    tag = tag.replace(/ \+ /g, " ");
    						    annotation.text = tag;
    						} else if (annotation.label) {
        						var tag = annotation.label;
    						    tag = tag.replace(/ \+ /g, " ");
    						    annotation.label = tag;
    						}
                                                        
    						var re = new RegExp('\"(.*)\"');
    						var match = re.exec(tag);

    						// Confidence -- ""0.01657282257080078"^^<http://www.w3.org/2001/XMLSchema#double>"
    						// @todo -- move to config with min max confidence
    						var re = new RegExp('\"([0-9]+\.*)\"');
    						var match_confidence = re.exec(annotation.confidence);
    						if (match != null && match_confidence != null) {
    							if (jQuery.inArray(match[1], suggestions) < 0) { // see also autoSuggest plugin
    								suggestions.push(match[1]);
    							}
    						}
    					}*/


					};
				    
				    var annotations_entities = annotations;
				    for (i = 0; i < annotations.length; i++) {
				        
				        
                        if (annotations[i].reference == undefined && annotations[i].type != undefined) {
                            var tmp_entities = [];
                            //alert(annotations[i].type);
                            for(j = 0; j < annotations_entities.length; j++) {
                                //alert(annotation.urn + ' -- ' + annotations_entities[j]['relation']);
                                if (annotations[i].urn === annotations_entities[j]['relation'] && annotations_entities[j]['label'] != undefined) {
                                    //alert('relation found');
                                    //alert(annotations_entities[j]['confidence'] + ' -- ' + annotations_entities[j]['label']);
                                    var re = new RegExp('\"([0-9]+\.[0-9]+)\"');
            						var match_confidence = re.exec(annotations_entities[j]['confidence']);
            						if (match_confidence != null) {
            						    console.log('annotation entity', annotations_entities[j]);
            						    
            						    tmp_entities.push({confidence : match_confidence[1],
            						                        data : annotations_entities[j]});
            						    
            						}
                                }
                                //alert('end');
                            }
                            
                            if (tmp_entities.length < 1) {
                                tmp_entities.push({confidence : 0,
    						                        data : annotations[i]});
                            }
                            
                            // @todo 
                            //tmp_entities.sort(compareConfidence);
                            
                            console.log('tmp_entities', tmp_entities);
                            tmp_entities.sort();
                            var final_annotation = tmp_entities.shift();
                            console.log('final_annotation', final_annotation);
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
                        
						// Confidence -- ""0.01657282257080078"^^<http://www.w3.org/2001/XMLSchema#double>"
						// @todo -- move to config with min max confidence
						var re = new RegExp('\"([0-9]+\.*)\"');
						var match_confidence = re.exec(named_entity.confidence);
						if (match != null && match_confidence != null) {
						    console.log('entity', named_entity);
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
                    console.log('mentionCollection', mentionCollection);
                    
					for (i=0; i < suggestions.length; i++) {
						//suggestionsContainer[0].add_selected_item({name:suggestions[i]+' (f)', value:suggestions[i]+' (f)'});

                        console.log('fise suggestion', suggestions[i]);
                        console.log('fise entity', entities[i]);
                        
                        console.log('fise type', entities[i].type);
                        
                        if (entities[i].type == '<http://dbpedia.org/ontology/Person>') {
                        //if (entities[i].type == '<http://dbpedia.org/ontology/Person>' && entities[i].reference) {
                    	    // add to mentions
                            //var urlId = window.location.protocol + "//" + window.location.host + "/e/" + mentionCollection.length + location.pathname.replace(/\//g, '');
                            //var urlId = window.location.protocol + "//" + window.location.host + "/p/" + entities[i].urn + location.pathname.replace(/\//g, '');
                            //var urlId = window.location.protocol + "//" + window.location.host + "/p/"+entities[i].reference
                            var urlId = window.location.protocol + "//" + window.location.host + "/p/"+encodeURIComponent(suggestions[i])
                            
                            //console.log('check', jQuery('[about="http://agent.info/'+encodeURIComponent(suggestions[i])+'"]'));
                            console.log('check', jQuery('[about="'+urlId+'"]'));
                            
                            
                            var date = new Date();
                            
                            if (jQuery('[typeof="rdfcal\\:Mention"][about="'+urlId+'"]').length < 1) {
                            mentionCollection.add({
                                'rdfcal:hasAgent': 'http://agent.info/'+encodeURIComponent(suggestions[i]),
                                'foaf:name': suggestions[i],
                                'dc:created': date.toISOString(),
                                'id': urlId
                            });

                    	        console.log('iks fise annotate OK: added mention of person ' + suggestions[i] + ' with ID ' + urlId + ' and agent -- http://agent.info/'+encodeURIComponent(suggestions[i]));
                    	    } else {
                    	        console.log('iks fise annotate OK: person exists ' + suggestions[i] + ' with ID ' + urlId + ' and agent -- http://agent.info/'+encodeURIComponent(suggestions[i]));
                    	    }
                        }
                        

/* // drupal hack
	var term = suggestions[i];
     var context = '#edit-field-tags';
    var termDiv = jQuery(context);
    var termList = termDiv.parent().find('.at-term-list');
    var excludedTermList = [];
    
    //excludedTermList = 
       //alert(term);

  // Removing all HTML tags. Need to wrap in tags for text() to work correctly.
  //term = $('<div>' + term + '</div>').text();
  term = Drupal.checkPlain(term);
  term = jQuery.trim(term);

  var tags = '';
  var tags_array = [];
  termList.find('.at-term-text').each(function (i) {
    // Get tag and revome quotes to prevent doubling
    var tag = jQuery(this).text().replace(/["]/g, '');
    // Wrap in quotes if tag contains a comma.
    if (tag.search(',') != -1) {
      tag = '"' + tag + '"';
    }
    // Collect tags as a comma seperated list.
    tags = (i == 0) ? tag : tags + ', ' + tag;
    tags_array.push(tag);
  });

  //if (term != '') {
  if (term != '' && jQuery.inArray(term, tags_array) < 0 && jQuery.inArray(term, excludedTermList) < 0) {
    termList.append(Drupal.theme('activeTagsTermRemove', term));
    // Wrap in quotes if tag contains a comma.
    if (term.search(',') != -1) {
      term = '"' + term + '"';
    }    
    tags = tags + ', ' + term;
    //tags_array.push(term);
    // Attach behaviors to new DOM content.
    Drupal.attachBehaviors(termList);
  
  // Set comma seperated tags as value of form field.
  termList.parent().find('input.at-terms').val(tags);
    termList.parent().find('.at-term-entry').val('');
  }
*/
					}

					} catch(m) {
						// debug: offline info...
						var time = new Date();
						time = time.getTime();
						// jquery
						//suggestionsContainer[0].add_selected_item({name:'fise offline', value:'fise-debug-value-'+time});
						console.log('error: fise offline', m);
					}
					
				},
				error: function(result) {
					GENTICS.Aloha.Annotations.log('error', 'There was an error fetching the contents of the FISE annotation service. Service not available.');
				}
			});
		}
	});
};
