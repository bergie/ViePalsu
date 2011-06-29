/**
 * @fileOverview VIE^2
 * @author <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
 */

//VIE^2 is the semantic enrichment layer on top of VIE.
//Its acronym stands for <b>V</b>ienna <b>I</b>KS <b>E</b>ditable <b>E</b>ntities.

//With the help of VIE^2, you can bring entites in your
//content (aka. semantic lifting) and furthermore interact
//with this knowledge in a MVC manner - using Backbone JS models
//and collections. It is important to say that VIE^2 helps you to
//automatically annotate data but also let's you enable users
//to change/add/remove entities and their properties at the users
//wish.
//VIE^2 has two main principles: 

//*  Connectors:
//   Connecting VIE^2 with **backend** services, that
//   can either analyse and enrich the content sent to them (e.g., using
//   Apache Stanbol or Zemanta), can act as knowledge databases (e.g., DBPedia)
//   or as serializer (e.g., RDFa).
//*  Mappings:
//   In a mapping, a web developer can specify a mapping from ontological entities
//   to backbone JS models. The developer can easily add types of entities and
//   also default attributes that are automatically filled with the help of the 
//   available connectors.

(function($, undefined) {

//VIE^2 is implmented as a [jQuery UI widget](http://semantic-interaction.org/blog/2011/03/01/jquery-ui-widget-factory/). 
    $.widget('VIE2.vie2', {
    	
    	// default options
    	options: {
    		localEntities : []
    	},
    	
    	//<strong>_create()</strong>: The private method **_create():** is called implicitly when
    	//calling .vie2(); on any jQuery object.
    	_create: function () {
    		var that = this;
    		
    		//automatically scans for xmlns attributes in the html element
    		//and adds them to the global jQuery.VIE2.namespaces object
    		jQuery.each(jQuery('html').xmlns(), function (k, v) {
    			jQuery.VIE2.namespaces[k] = v.toString();
    		});
                		
    		//scan for connector-specific namespaces
    		jQuery.each(jQuery.VIE2.connectors, function () {
    			if (this.options()['namespaces']) {
    				jQuery.each(this.options()['namespaces'], function(k, v) {
    					jQuery.VIE2.namespaces[k] = v;
    				});
    			}
    		});
    		
    		//add all namespaces to the triple store cache in jQuery.VIE2.globalContext
    		jQuery.each(jQuery.VIE2.namespaces, function(k, v) {
    			jQuery.VIE2.globalContext.prefix(k, v);
    		});
    		
    		//generates a unique id for VIE^2
    		if (!that.element.data('vie2-id')) {
    			var tempId = PseudoGuid.GetNew();
    			jQuery.VIE2.log("info", "VIE2.core#create()", "Generated id: '" + tempId + "'!");
    			that.element.data('vie2-id', tempId);
    		}
    	},
    	
    	//<strong>analyze(callback)</strong>: The analyze() method sends the element to all connectors and lets
    	//them analyze the content. The connectors' methods are asynchronous calls and once all connectors
    	//returned the found enrichments in the form of *jQuery.rdf* objects, the *callback* method is
    	//executed (in the scope of the callback function, *this* refers to the element).<br />
    	//The returned enrichments are written into the global context (jQuery.VIE2.globalContext).<br />
    	//Furthermore, each found subject in the returned knowledge is checked if there is a mapping to 
    	//backbone JS available and if so, the entity is added to the corresponding backbone collection(s).
        //TODO: use options!
    	analyze: function (callback) {
    		var that = this;
    		//analyze() does not actually need a callback method, but it is usually good to use it 
    		if (callback === undefined) {
    			jQuery.VIE2.log("warn", "VIE2.core#analyze()", "No callback method specified!");
    		}
    		
    		jQuery.VIE2.log("info", "VIE2.core#analyze()", "Start.");
    		    		
    		//as the connectors work asynchronously, we need a queue to listen if all connectors are finished.
    		var connectorQueue = [];
    		jQuery.each(jQuery.VIE2.connectors, function () {
    			//fill queue of connectors with 'id's to have an overview of running connectors.
    			//this supports the asynchronous calls.
    			connectorQueue.push(this.id);
    		});
    		
    		//iterate over all connectors
    		jQuery.each(jQuery.VIE2.connectors, function () {
    			//the connector's callback method
    			var connectorCallback = function (conn, elem) {
    				return function (rdf) {
    					jQuery.VIE2.log("info", "VIE2.core#analyze()", "Received RDF annotation from connector '" + conn.id + "'!");
    					
    					//we add all namespaces to the rdfQuery object. 
    					//Attention: this might override namespaces that were added by the connector!
    					//but needed to keep consistency through VIE^2.
    				    jQuery.each(jQuery.VIE2.namespaces, function(k, v) {
    			            rdf.prefix(k, v);
    		            });  
                                    
    					rdf.databank.triples().each(function () {
    						//add all triples to the global cache!
    						jQuery.VIE2.globalContext.add(this);
    					});
    					
    					//add all subjects to the corresponding backbone collection(s)
    					jQuery.each(rdf.databank.subjectIndex, function (subject, v) {
    						var types = [];
    						
    						//an entity of id 'subject' can only be added once to a backbone JS collection
    						//hence, we need to collect all types of that entity first in an array.
    						//TODO: is this the right place to first ask all connectors for types?
    						rdf
    						.where(subject + ' a ?type')
    						.each(function () {
    							var curie = jQuery.createCurie(this.type.value, {namespaces : jQuery.VIE2.namespaces});
    							types.push(curie);
    						});
                            
                            var subjStr = subject.toString();
                            if (that.options.localEntities.indexOf(subjStr) === -1) {
                                that.options.localEntities.push(subjStr);
                            }
    						jQuery.VIE2.registerBackboneModel({id : subject, a : types});
    					});
    					
    					removeElement(connectorQueue, conn.id);
    					//everytime we receive annotations from each connector, we remove the connector's id from the
    					//queue and check whether the queue is empty.
    					if (connectorQueue.length === 0) {
    						//if the queue is empty, all connectors have successfully returned and we can execute the
    						//callback function.
    						jQuery.VIE2.log("info", "VIE2.core#analyze()", "Finished! Global context holds now " + jQuery.VIE2.globalContext.databank.triples().length + " triples!");
    						jQuery.VIE2.log("info", "VIE2.core#analyze()", "Finished! Local context holds now "  + that.options.localEntities.length + " entities!");
    						//provide a status field in the callback object: status = {'ok', 'error'};
    						if (callback) {
    							callback.call(elem, 'ok');
    						}
    					}
    					//TODO: in a future release, we might want to add a timeout to be called if a connector takes too long
    				};
    			}(this, that.element);
    			
    			//start analysis with the connector.
 				jQuery.VIE2.log("info", "VIE2.core#analyze()", "Starting analysis with connector: '" + this.id + "'!");
    			this.analyze(that.element, that.options.namespaces, connectorCallback);
    		});
    	},
                
        //<strong>uris()</strong>: Returns a list of all uris, that are within the scope of
        //the current element!
        uris: function () {
            return this.options.localEntities;
        },
    	    	
    	//<strong>copy(tar)</strong>: Copies all local knowledge to the target element(s).
    	//Basically calls: <pre>
		//$(tar).vie2().vie2('option', 'localEntities', this.options.localEntities);
    	//</pre>
    	copy: function (tar) {
    		//copy all knowledge from src to target
    		var that = this;
    		if (!tar) {
    			jQuery.VIE2.log("warn", "VIE2.core#copy()", "Invoked 'copy()' without target element!");
    			return;
    		}
			jQuery.VIE2.log("info", "VIE2.core#copy()", "Start.");
			jQuery.VIE2.log("info", "VIE2.core#copy()", "Found " + this.options.localEntities.length + " entities for source (" + this.element.data('vie2-id') + ").");
			
			$(tar).vie2().vie2('option', 'localEntities', this.options.localEntities);
			jQuery.VIE2.log("info", "VIE2.core#copy()", "Finished.");
			jQuery.VIE2.log("info", "VIE2.core#copy()", "Target element has now " + $(tar).vie2('option', 'localEntities') + " entities.");
			return this;
    	},
    	
    	//<strong>clear()</strong>: Clears the local context.
    	clear: function () {
    		this.options.localConext = {};
    		return this;
    	}
    	
    });
}(jQuery));

//<strong>$.VIE2.namespaces</strong>: This map contains all namespaces known to VIE2.
//There are currently *no* default namespaces, though
//we might want to change this in a future release.
//Namespaces can be overridden directly using jQuery.VIE2.namespaces[x] = y but
//are parsed from the &lt;html> tag's xmlns: attribute anyway during initialization.
jQuery.VIE2.namespaces = {};

//<strong>$.VIE2.globalContext</strong>: The variable **globalContext** stores all knowledge in
//triples that were retrieved and annotated so far in one *rdfQuery object*. Though it is
//available via $.VIE2.globalContext, it is highly discouraged to access it directly.
jQuery.VIE2.globalContext = jQuery.rdf({namespaces: jQuery.VIE2.namespaces});

//<strong>$.VIE2.getFromGlobalContext(uri, prop)</strong>: Retrive properties from the given *uri* directly from the
//element's context. Does *not* retrieve information from the global context. 
jQuery.VIE2.getFromGlobalContext = function (uri, prop) {
	//get data from local storage!
	var ret = [];
	
	jQuery.VIE2.globalContext
	.where(jQuery.rdf.pattern(uri, prop, '?object', {namespaces: jQuery.VIE2.namespaces}))
	.each(function () {
        if (this.object.type) {
            if (this.object.type === 'literal') {
		        ret.push(this.object.value.toString());
            } else if (this.object.type === 'uri' || this.object.type === 'bnode') {
		        if (VIE.EntityManager.getBySubject(this.object.toString()) !== undefined) {
                    ret.push(VIE.EntityManager.getBySubject(this.object.toString()));
                }
                else {
                    ret.push(this.object.toString());
                }
            }
        }
	});
	
	return ret;
};

//<strong>$.VIE2.removeFromGlobalContext(uri, prop)</strong>: Removes
//all properties of the given uri from the global context.
jQuery.VIE2.removeFromGlobalContext = function (uri, prop) {
    
    if (uri === undefined) {
    	jQuery.VIE2.log("warn", "$.VIE2.core#removeFromGlobalContext()", "No URI specified, returning without action!");
    	return;
    }
    
    if (prop === undefined) {
    	jQuery.VIE2.log("warn", "$.VIE2.core#removeFromGlobalContext()", "No property specified, returning without action!");
    	return;
    }
    
    jQuery.VIE2.log("info", "$.VIE2.core#removeFromGlobalContext()", "Global context holds now " + jQuery.VIE2.globalContext.databank.triples().length + " triples!");
    var pattern = jQuery.rdf.pattern(uri + " " + prop + " ?x", {namespaces: jQuery.VIE2.namespaces});
    jQuery.VIE2.log("info", "$.VIE2.core#removeFromGlobalContext()", "Removing all triples that match: '" + pattern + "'");
    jQuery.VIE2.globalContext
    .where(pattern).remove(pattern);
    jQuery.VIE2.log("info", "$.VIE2.core#removeFromGlobalContext()", "Global context holds now " + jQuery.VIE2.globalContext.databank.triples().length + " triples!");
};

//<strong>$.VIE2.addToGlobalContext(uri, prop, values)</strong>:
jQuery.VIE2.addToGlobalContext = function (uri, prop, values) {
    
    if (uri === undefined) {
    	jQuery.VIE2.log("warn", "$.VIE2.core#addToGlobalContext()", "No URI specified, returning without action!");
    	return;
    }
    if (prop === undefined) {
    	jQuery.VIE2.log("warn", "$.VIE2.core#addToGlobalContext()", "No property specified, returning without action!");
    	return;
    }
    if (values === undefined) {
    	jQuery.VIE2.log("warn", "$.VIE2.core#addToGlobalContext()", "No values specified, returning without action!");
    	return;
    }
    if (jQuery.isArray(values)) {
        for (var i = 0; i < values.length; i++) {
            var triple = jQuery.rdf.triple(uri, prop, values[i], {namespaces: jQuery.VIE2.namespaces});
            jQuery.VIE2.log("info", "$.VIE2.core#addToGlobalContext()", "Adding new triple: '" + triple + "'.");
            jQuery.VIE2.globalContext.add(triple);
        }
    } else {
            var triple = jQuery.rdf.triple(uri, prop, values, {namespaces: jQuery.VIE2.namespaces});
            jQuery.VIE2.log("info", "$.VIE2.core#addToGlobalContext()", "Adding new triple: '" + triple + "'.");
            jQuery.VIE2.globalContext.add(triple);
    }
    jQuery.VIE2.log("info", "$.VIE2.core#addToGlobalContext()", "Global context holds now " + jQuery.VIE2.globalContext.databank.triples().length + " triples!");
};

//<strong>$.VIE2.query(uri, props, callback, otions)</strong>: The query function supports querying for properties. The uri needs
//to be of type <code>jQuery.rdf</code> object or a simple string and the property is either an array of strings
//or a simple string. The function iterates over all connectors that have <code>query()</code>
//implemented and collects data in an object.
//The callback retrieves an object with the properties as keys and an array of results as their corresponding values.
//TODO: update usage of options!
jQuery.VIE2.query = function (uri, props, callback, options) {
	var ret = {};
	jQuery.VIE2.log("info", "$.VIE2.query()", "Start!");

	if (uri === undefined || props === undefined) {
		jQuery.VIE2.log("warn", "$.VIE2.query()", "Invoked 'query()' with undefined argument(s)!");
		callback(ret);
		return;
	} else if (!jQuery.isArray(props)) {
		jQuery.VIE2.query(uri, [props], callback, options);
		return;
	}

	if (typeof uri === 'string' && jQuery.isArray(props)) {
		//initialize the returning object
		for (var i=0; i < props.length; i++) {
			ret[props[i]] = [];
		}
		//look up for properties in options.globalContext
		//first check if we should ignore the cache!
		if (!options || (options && !options.cache === 'nocache')) {
			for (var i=0; i < props.length; i++) {
                //_:b01
                //<http://dbpedia.org/Eiffel>
                //dbpedia:Eiffel
                //[dbpedia:Eiffel]
				jQuery.VIE2.globalContext
				.where(jQuery.rdf.pattern(uri, props[i], '?object', {namespaces: jQuery.VIE2.namespaces}))
				.each(function () {
					ret[props[i]].push(this.object);
				});
			}
		}
		
		//finish here if said so!
		if (options && options.cache === 'cacheonly') {
			callback(ret);
			return;
		}
		
		var connectorQueue = [];
		jQuery.each(jQuery.VIE2.connectors, function () {
			//fill queue of connectors with 'id's to have an overview of running connectors.
			//this supports the asynchronous calls.
			connectorQueue.push(this.id);
		});
		
		//look up for properties in the connectors that
		//implement/overwrite the query() method
		jQuery.each(jQuery.VIE2.connectors, function () {
			jQuery.VIE2.log("info", "$.VIE2.query()", "Start with connector '" + this.id + "' for uri '" + uri + "'!");
			var c = function (conn, uri, ret, callback) {
				return function (data) {
					jQuery.VIE2.log("info", "$.VIE2.query()", "Received query information from connector '" + conn.id + "' for uri '" + uri + "'!");
					jQuery.extend(true, ret, data);
					
					removeElement(connectorQueue, conn.id);
					if (connectorQueue.length === 0) {
						//if the queue is empty, all connectors have successfully returned and we can call the
						//callback function.
						
						//adding new information to cache!
						jQuery.each(ret, function (k, v) {
							for (var i = 0; i < v.length; i++) {
								jQuery.VIE2.globalContext.add(jQuery.rdf.triple(uri, k, v[i], {namespaces: jQuery.VIE2.namespaces}));
							}
						});
						jQuery.VIE2.log("info", "$.VIE2.query()", "Finished task: 'query()' for uri '" + uri + "'!");
						jQuery.VIE2.log("info", "$.VIE2.query()", "Global context now holds " + jQuery.VIE2.globalContext.databank.triples().length + " triples!");
					    callback(ret);
                    }
				};
			}(this, uri, ret, callback);
			this.query(uri, props, jQuery.VIE2.namespaces, c);
		});
	} else {
		callback(ret);
	}
};

//<strong>$.VIE2.clearContext()</strong>: Static method to clear the global context.
jQuery.VIE2.clearContext = function () {
	jQuery.VIE2.globalContext = jQuery.rdf({namespaces: jQuery.VIE2.namespaces});
};

//just for convenience, will be removed in a later revision
VIE.EntityManager.initializeCollection();

//<strong>$.VIE2.Backbone</strong>: Contains for all registered mappings (mapping.id is the key), the
//following items:<br/>
//* jQuery.VIE2.Backbone[id].a -> an array of strings (curies) of the corresponding type.
//* jQuery.VIE2.Backbone[id].mapping -> the mapping itself
//* jQuery.VIE2.Backbone[id].collection -> the backbone JS collection, that has the Model registered. 
jQuery.VIE2.Backbone = {};

//<strong>$.VIE2.Collection</strong>: TODO: document me
jQuery.VIE2.Collection = VIE.RDFEntityCollection.extend({
	
	add: function (models, opts) {
		//TODO: overwrite me??
		VIE.RDFEntityCollection.prototype.add.call(this, models, opts);
	},
	
	remove: function (models, opts) {
		//TODO: overwrite me??
		VIE.RDFEntityCollection.prototype.remove.call(this, models, opts);
	}
});

//<strong>$.VIE2.Entity</strong>: The parent backbone entity class for all other entites.
//Inherits from VIE.RDFEntity.
jQuery.VIE2.Entity = VIE.RDFEntity.extend({
    
    lookup: function (attrs) {
    	if (!jQuery.isArray(attrs)) {
    		this.lookup([attrs]);
    	} else {
    		//query connectors for properties
    		jQuery.VIE2.query(this.id, attrs, function (entity) {
    			return function () {
    				jQuery.each(attrs, function (i) {
    					entity.trigger('change:' + attrs[i]);
    					entity.change();
    				});
    			};
    		}(this));
    	}
    },
    
    //overwritten to directly access the global context
    get: function (attr) {
        if (attr === 'id') {
    		return VIE.RDFEntity.prototype.get.call(this, attr);
        }
        return jQuery.VIE2.getFromGlobalContext(this.getSubject(), attr);
    },
    
    //extending 'set()' to allow updating the context through backbone model.
    set: function (attrs, opts) {
        if ('id' in attrs) this.id = attrs.id;
        //remove all triples and add new ones
        var that = this;
        jQuery.each(attrs, function(k, v) {
            if (k !== 'id' && k !== 'a') {
                jQuery.VIE2.removeFromGlobalContext(that.getSubject(), k);
                if (!jQuery.isArray(v)) {
                    v = [v];
                }
                jQuery.VIE2.addToGlobalContext(that.getSubject(), k, v);
                that.trigger('change:' + k);
            }
            else {
                var obj = {};
                obj[k] = v;
                VIE.RDFEntity.prototype.set.call(that, obj, opts);
            }
        });
        this.change();
    },
    
    unset: function (attribute, opts) {
        jQuery.VIE2.removeFromGlobalContext(this.getSubject(), attribute);
        if (!opts.silent) {
            this.trigger('change:' + attribute);
            this.change();
        }
    },
        
    destroy: function (opts) {
    	//TODO: overwrite me??
        //remove entity from context!
    	VIE.RDFEntity.prototype.destroy.call(this, opts);
    },
    
    clear: function (opts) {
        var that = this;
    	jQuery.each(this.attributes, function (k) {
            if (k !== 'a' && k !== 'id') {
                that.unset(k);
            }
        });
    },
    
    fetch: function (options) {
        //TODO: overwrite me??
        VIE.RDFEntity.prototype.fetch.call(options);
    },
    
    save: function (attrs, opts) {
        //TODO overwrite me??
        VIE.RDFEntity.prototype.save.call(attrs, opts);
    },
    
    validate: function (attrs) {
        //TODO overwrite me??
        VIE.RDFEntity.prototype.validate.call(attrs);
    }

});

//<strong>$.VIE2.registerBackboneModel(entity)</strong>: Add a backbone model to the corresponding collection(s).
jQuery.VIE2.registerBackboneModel = function (entity) {
    $.VIE2.log("info", "$.VIE2.registerBackboneModel()", "Start (" + entity.id + ")!");
    //check whether we already have this entity registered
    if (VIE.EntityManager.getBySubject(entity["id"]) !== undefined) {
        $.VIE2.log("info", "$.VIE2.registerBackboneModel()", "Entity " + entity["id"] + " already registered, no need to add it.");
        jQuery.each(jQuery.VIE2.Backbone, function (i, e) {
           	var belongsHere = false;
           	jQuery.each(e['a'], function () {
           		if (jQuery.inArray(this.toString(), entity["a"]) !== -1) {
           			belongsHere = true;
           			return false;
           		}
           	});
           		if (belongsHere && e['collection'].indexOf(VIE.EntityManager.getBySubject(entity["id"])) === -1) {
           		    
            		e['collection'].add(VIE.EntityManager.getBySubject(entity["id"]));
           		    
       		    }
           	
        });
           	
        return;
    }
    
    jQuery.each(jQuery.VIE2.Backbone, function (i, e) {
    	var belongsHere = false;
    	jQuery.each(e['a'], function () {
    		if (jQuery.inArray(this.toString(), entity["a"]) !== -1) {
    			belongsHere = true;
    			return false;
    		}
    	});
    	if (belongsHere) {
    		//check if there exists already a model with the same id
    		var Model = e['collection'].model;
    		//instantiating model
    		var modelInstance = new Model(entity, {
                collection: e['collection']
            });
            //add entity and possible attributes to global context
            var uri = modelInstance.getSubject();
            $.VIE2.log("info", "$.VIE2.registerBackboneModel()", "Registering a backbone model for '" + uri + "'.");
            
            jQuery.each(entity, function (k, v) {
                if (k !== "id") {
                    jQuery.VIE2.addToGlobalContext(uri, k, v);
                }
            });
            //registering the model within VIE
            VIE.EntityManager.registerModel(modelInstance);
    		//adding model instance to collection
    		e['collection'].add(modelInstance);
    		jQuery.VIE2.log("info", "VIE2.core#registerBackboneModel()", "Added entity '" + uri + "' to collection of type '" + i + "'!");
    		var mapping = e['mapping'];
            
    		//query for default properties to make them available in the offline storage
    		jQuery.VIE2.log("info", "VIE2.core#registerBackboneModel()", "Querying for default properties for entity '" + entity["id"] + "': [" + mapping.defaultProps.join(", ") + "]!");
            jQuery.VIE2.query(modelInstance.getSubject(), mapping.defaultProps, function (id, defProps, modelInstance) {
    			return function () {
    	    		jQuery.VIE2.log("info", "VIE2.core#registerBackboneModel()", "Finished querying for default properties for entity '" + id + "': [" + defProps.join(", ") + "]!");
    				//trigger change when finished
    				modelInstance.change();
    			};
    		}(modelInstance.getSubject(), mapping.defaultProps, modelInstance));
    	} else {
            jQuery.VIE2.log("info", "VIE2.core#registerBackboneModel()", "Entity '" + entity.id + "' does not belong to collection of type " + i + "!");
        }
    });
};

//<strong>$.VIE2.registerMapping(mapping)</strong>: Static method to register a mapping (is automatically called 
//during construction of mapping class. This allocates an object in *jQuery.VIE2.Backbone[mapping.id]*.
jQuery.VIE2.registerMapping = function (mapping) {
    //first check if there is already 
    //a mapping with 'mapping.id' registered	
    if (!jQuery.VIE2.Backbone[mapping.id]) {
    	jQuery.VIE2.log("info", "VIE2.core#registerMapping()", "Registered mapping '" + mapping.id + "'");
    	
    	//backboneJS mapping		
    	var props = {};
    	jQuery.each(mapping.defaultProps, function (i) {
    		props[mapping.defaultProps[i]] = [];
    	});
    	
    	var Model = jQuery.VIE2.Entity.extend({defaults: props});
    	var Collection = jQuery.VIE2.Collection.extend({model: Model});
    	
    	jQuery.VIE2.Backbone[mapping.id] = {
    			"a" : (jQuery.isArray(mapping.types))? mapping.types : [mapping.types],
    			"collection" : new Collection(),
    			"mapping" : mapping
    	};
    	
    	jQuery.VIE2.log("info", "VIE2.core#registerMapping()", "Registered mapping '" + mapping.id + "' finished!");
    } else {
    	jQuery.VIE2.log("warn", "VIE2.core#registerMapping()", "Did not register mapping, as there is" +
    			"already a mapping with the same id registered.");
    }
};

//<strong>$.VIE2.unregisterMapping(mappingId)</strong>: Unregistering of mappings. There is currently
//no usecase for that, but it wasn't that hard to implement ;)
jQuery.VIE2.unregisterMapping = function (mappingId) {
	jQuery.VIE2.Backbone[mappingId] = undefined;
};

//<strong>$.VIE2.connectors</strong>: Static object of all registered connectors.
jQuery.VIE2.connectors = {};

//<strong>$.VIE2.registerConnector(connector)</strong>: Static method to register a connector (is automatically called 
//during construction of connector class. If set, inserts connector-specific namespaces to the known contexts.
jQuery.VIE2.registerConnector = function (connector) {
    //first check if there is already 
    //a connector with 'connector.id' registered
    if (!jQuery.VIE2.connectors[connector.id]) {
    	jQuery.VIE2.connectors[connector.id] = connector;
    	if (connector._options["namespaces"]) {
    		jQuery.each(connector._options["namespaces"], function(k, v) {
    			jQuery.VIE2.globalContext.prefix(k, v);
    			//also add to all known VIE^2 elements' context!
    		});
			$('.VIE2-vie2').vie2('option', 'namespaces', connector._options["namespaces"]);
    	}
    	jQuery.VIE2.log("info", "VIE2.core#registerConnector()", "Registered connector '" + connector.id + "'");
    	
    } else {
    	jQuery.VIE2.log("warn", "VIE2.core#registerConnector()", "Did not register connector, as there is" +
    			"already a connector with the same id registered.");
    }
};

//<strong>$.VIE2.unregisterConnector(connectorId)</strong>: Unregistering of connectors. There is currently
//no usecase for that, but it wasn't that hard to implement ;)
jQuery.VIE2.unregisterConnector = function (connectorId) {
    jQuery.VIE2.connectors[connector.id] = undefined;
};

jQuery.VIE2.logLevels = ["info", "warn", "error"];

//<strong>$.VIE2.log(level, component, message)</strong>: Static convenience method for logging.
jQuery.VIE2.log = function (level, component, message) {
    if (jQuery.VIE2.logLevels.indexOf(level) > -1) {
        switch (level) {
            case "info":
                console.info(component + ' ' + message);
                break;
            case "warn":
                console.warn(component + ' ' + message);
                break;
            case "error":
                console.error(component + ' ' + message);
                break;
        }
    }
};

//calling this once for convenience
jQuery(document).vie2();