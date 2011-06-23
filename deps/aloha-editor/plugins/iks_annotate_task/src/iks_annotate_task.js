if (typeof eu == "undefined") {
    var eu = {};
    
    if (typeof eu.iksproject == "undefined") {
        eu.iksproject = {};
    }
}

/**
 * register the plugin with unique name
 */
eu.iksproject.AnnotationTaskPlugin = new GENTICS.Aloha.Plugin('iks_annotate_task');

/**
 * Configure the available languages
 */
eu.iksproject.AnnotationTaskPlugin.languages = ['en'];

/**
 * Default configuration allows iks_annotates everywhere
 */
eu.iksproject.AnnotationTaskPlugin.config = ['iks_annotate_task'];

/**
 * the defined object types to be used for this instance
 */
eu.iksproject.AnnotationTaskPlugin.objectTypeFilter = ['foaf:Person'];

/**
 * Initialize the plugin
 */
eu.iksproject.AnnotationTaskPlugin.init = function () {
    
    // add reference to the create layer object
	this.createLayer = new eu.iksproject.AnnotationTaskPlugin.CreateLayer();
		
    this.createButtons();
    this.subscribeEvents();
    this.bindInteractions();

};

/**
 * Initialize the buttons
 */
eu.iksproject.AnnotationTaskPlugin.createButtons = function () {
    var that = this;

    // format IksAnnotate Button 
    // this button behaves like a formatting button like (bold, italics, etc)
    this.formatIksAnnotateButtonTask = new GENTICS.Aloha.ui.Button({
        'iconClass' : 'GENTICS_button GENTICS_button_addEvent',
        'size' : 'small',
        'onclick' : function () { that.formatIksAnnotateTask(); },
        'tooltip' : this.i18n('button.task.tooltip'),
        'toggle' : true
    });
    GENTICS.Aloha.FloatingMenu.addButton(
        'GENTICS.Aloha.continuoustext',
        this.formatIksAnnotateButtonTask,
        GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.format'),
        1
    );

    // insert IksAnnotate
    this.insertIksAnnotateButton = new GENTICS.Aloha.ui.Button({
        'iconClass' : 'GENTICS_button GENTICS_button_addEvent',
        'size' : 'small',
        'onclick' : function () { that.insertIksAnnotate( false ); },
        'tooltip' : this.i18n('button.task.tooltip'),
        'toggle' : false
    });
    GENTICS.Aloha.FloatingMenu.addButton(
        'GENTICS.Aloha.continuoustext',
        this.insertIksAnnotateButton,
        GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.insert'),
        1
    );

    // add the new scope for task annotation
    GENTICS.Aloha.FloatingMenu.createScope(this.getUID('iks_annotate_task'), 'GENTICS.Aloha.continuoustext');
    
    this.iks_annotateFieldTask = new GENTICS.Aloha.ui.AttributeField({
    	'width':320,
    	'valueField': 'url',
    	'displayField': 'name'
    });
    this.iks_annotateFieldTask.setTemplate('<span><b>{name}</b><br/>{url}</span>');
    this.iks_annotateFieldTask.setObjectTypeFilter(eu.iksproject.AnnotationTaskPlugin.objectTypeFilter);

    // add the input field for iks_annotate
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('iks_annotate_task'),
        this.iks_annotateFieldTask,
        this.i18n('floatingmenu.tab.iks_annotate_task'),
        1
    );
  
    this.datePickerButton = new GENTICS.Aloha.ui.Button({
        // TODO use another icon here
        'iconClass' : 'GENTICS_button GENTICS_button_datepicker',
        'size' : 'small',
        'onclick' : function (element, event) {
            eu.iksproject.AnnotationTaskPlugin.createDialog(element.btnEl.dom);
        },
        'tooltip' : this.i18n('button.datePicker.tooltip'),
    });
    // add a button for removing the currently set link
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('iks_annotate_task'),
        this.datePickerButton,
        this.i18n('floatingmenu.tab.iks_annotate_task'),
        1
    );
};

/**
 * Parse a all editables for iks_annotateeviations 
 * Add the iks_annotate shortcut to all edtiables 
 */
eu.iksproject.AnnotationTaskPlugin.bindInteractions = function () {
    var that = this;

        // update link object when src changes
        this.iks_annotateFieldTask.addListener('keyup', function(obj, event) {
        	// TODO this event is never fired. Why?
        	// if the user presses ESC we do a rough check if he has entered a link or searched for something
    	    if (event.keyCode == 27) {
    	    	var curval = that.iks_annotateFieldTask.getQueryValue();
    	    	if (
    	    		curval[0] == '/' || // local link
    	    		curval.match(/^.*\.([a-z]){2,4}$/i) || // local file with extension
    	    		curval[0] == '#' || // inner document link
    	    		curval.match(/^htt.*/i)  // external link
    	    	) {
    	    		// could be a link better leave it as it is
    	    	} else {
    	    		// the user searched for something and aborted restore original value
    	    		//that.iks_annotateFieldTask.setValue(that.iks_annotateFieldTask.getValue());
    	    	}
    	    }
        	that.iks_annotateChange();
        });


    // on blur check if iks_annotate title is empty. If so remove the a tag
    // don't remove -- maybe date is selected first...
    /*this.iks_annotateFieldTask.addListener('blur', function(obj, event) {
        if ( this.getValue() == '' ) {
            that.removeIksAnnotate();
        }
    });*/
    
    // add to all editables the iks_annotate shortcut
    for (var i = 0; i < GENTICS.Aloha.editables.length; i++) {

        // CTRL+G
        GENTICS.Aloha.editables[i].obj.keydown(function (e) {
    		if ( e.metaKey && e.which == 71 ) {
		        if ( that.findIksAnnotateMarkupTask() ) {
		            GENTICS.Aloha.FloatingMenu.userActivatedTab = that.i18n('floatingmenu.tab.iks_annotate_task');
		
		            // TODO this should not be necessary here!
		            GENTICS.Aloha.FloatingMenu.doLayout();
		
		            that.iks_annotateFieldTask.focus();
		
		        } else {
		            that.insertIksAnnotate();
		        }
	            // prevent from further handling
	            // on a MAC Safari cursor would jump to location bar. Use ESC then META+L
	            return false; 
    		}
        });
    }
};

/**
 * Subscribe for events
 */
eu.iksproject.AnnotationTaskPlugin.subscribeEvents = function () {

	var that = this;
	
    // add the event handler for selection change
    GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject) {

        if (GENTICS.Aloha.activeEditable) {
        	// show/hide the button according to the configuration
        	var config = that.getEditableConfig(GENTICS.Aloha.activeEditable.obj);
        	
        	that.formatIksAnnotateButtonTask.show();
        	that.insertIksAnnotateButton.show();
        	
        	var foundMarkup = that.findIksAnnotateMarkupTask( rangeObject );
        	if ( foundMarkup ) {
        		// abbr found
        		that.insertIksAnnotateButton.hide();
        		that.formatIksAnnotateButtonTask.setPressed(true);
        		GENTICS.Aloha.FloatingMenu.setScope(that.getUID('iks_annotate_task'));
        		// foundMarkup --> foaf:Person name --> should be the selected text in that case
        		that.iks_annotateFieldTask.setTargetObject(foundMarkup, 'data-tmp');
        	} else {
        		// no iks_annotate found
        		that.formatIksAnnotateButtonTask.setPressed(false);
        		that.iks_annotateFieldTask.setTargetObject(null);
        	}
        	
        	// TODO this should not be necessary here!
        	GENTICS.Aloha.FloatingMenu.doLayout();
        }

    });
    
};

/**
 * Check whether inside a iks_annotate tag 
 * @param {GENTICS.Utils.RangeObject} range range where to insert the object (at start or end)
 * @return markup
 * @hide
 */
eu.iksproject.AnnotationTaskPlugin.findIksAnnotateMarkupTask = function ( range ) {
    
	if ( typeof range == 'undefined' ) {
        var range = GENTICS.Aloha.Selection.getRangeObject();   
    }
	if ( GENTICS.Aloha.activeEditable ) {
	    return range.findMarkup(function() {
	        return this.nodeName.toLowerCase() == 'mark';
	    }, GENTICS.Aloha.activeEditable.obj);
	} else {
		return null;
	}
};

/**
 * Format the current selection or if collapsed the current word as abbr.
 * If inside a abbr tag the abbr is removed.
 */
eu.iksproject.AnnotationTaskPlugin.formatIksAnnotateTask = function () {
	
	var range = GENTICS.Aloha.Selection.getRangeObject();
    
    if (GENTICS.Aloha.activeEditable) {
        if (this.findIksAnnotateMarkupTask( range ) ) {
            this.removeIksAnnotate();
        } else {
            this.insertIksAnnotate();
        }
    }
};

/**
 * Insert a new abbr at the current selection. When the selection is collapsed,
 * the abbr will have a default abbr text, otherwise the selected text will be
 * the abbr text.
 */
eu.iksproject.AnnotationTaskPlugin.insertIksAnnotate = function ( extendToWord ) {
    
    // do not insert a abbr in a abbr
    if ( this.findIksAnnotateMarkupTask( range ) ) {
        return;
    }
    
    // activate floating menu tab
    GENTICS.Aloha.FloatingMenu.userActivatedTab = this.i18n('floatingmenu.tab.iks_annotate_task');

    // current selection or cursor position
    var range = GENTICS.Aloha.Selection.getRangeObject();

    // if selection is collapsed then extend to the word.
    if (range.isCollapsed() && extendToWord != false) {
        GENTICS.Utils.Dom.extendToWord(range);
    }
    if ( range.isCollapsed() ) {
        // insert pseudo text here... or remove
        /*var iks_annotateText = this.i18n('newiks_annotate.defaulttext');
        var newIksAnnotate = jQuery('<span>' + iks_annotateText + '</span>');
        GENTICS.Utils.Dom.insertIntoDOM(newIksAnnotate, range, jQuery(GENTICS.Aloha.activeEditable.obj));
        range.startContainer = range.endContainer = newIksAnnotate.contents().get(0);
        range.startOffset = 0;
        range.endOffset = iks_annotateText.length;*/
    } else {
        var about_hash = PseudoGuid.GetNew();
        var newIksAnnotate = jQuery('<mark />').attr({
            'id': about_hash,
		    'about': '',
		    'typeof': 'rdfcal:Task',
		    'property': 'rdfcal:name',
		    'class': 'annotation_task',
		    'title': ''
		});
		
        GENTICS.Utils.Dom.addMarkup(range, newIksAnnotate, false);
    }
    range.select();
    this.iks_annotateFieldTask.focus();
    this.iks_annotateChange();
};

/**
 * Remove an a tag.
 */
eu.iksproject.AnnotationTaskPlugin.removeIksAnnotate = function () {

    var range = GENTICS.Aloha.Selection.getRangeObject();
    var foundMarkup = this.findIksAnnotateMarkupTask(); 
    if ( foundMarkup ) {
        // remove the markup
        GENTICS.Utils.Dom.removeFromDOM(foundMarkup, range, true);
        // set focus back to editable
        GENTICS.Aloha.activeEditable.obj[0].focus();
        // select the (possibly modified) range
        range.select();
    }
};


/**
 * Updates the link object depending on the src field
 */
eu.iksproject.AnnotationTaskPlugin.iks_annotateChange = function () {
    
	var item = this.iks_annotateFieldTask.getItem();
    
    var rdfcal_targetDate = jQuery('#rdfcal_targetDate').val();
    var r = new RegExp('http://', 'i');
    
	if (item && item.url && item.url.match(r) && item.name && rdfcal_targetDate) {
        var range = GENTICS.Aloha.Selection.getRangeObject();
        
        var date = new Date();
        var date_str = date.getDate()+'/'+(date.getMonth()+1)+'/'+date.getFullYear();
        
         var eventId = jQuery('body').attr('about');
         var taskCollection = VIE.EntityManager.getBySubject(eventId).get('rdfcal:hasTask');
         
         var rdfcal_name = range.startContainer.nodeValue;
         var rdfcal_hasAgent = item.url;
         var rdfcal_hasAgentName = item.name;
         var rdfcal_startDate = date_str;
         var rdfcal_completed = 0;

         if (!rdfcal_name && !rdfcal_hasAgent) {
             console.log('Error: no rdfcal:name or rdfcal:hasAgent value');
             return;
         }
         
         var urlId = window.location.protocol + "//" + window.location.host + "/t/" + taskCollection.length + location.pathname.replace(/\//g, '');
         
  	    // write task data
  	    this.iks_annotateFieldTask.setAttribute('about', urlId);
  	    this.iks_annotateFieldTask.setAttribute('title', 'Task for '+rdfcal_hasAgentName);
         
         taskCollection.add({
             'rdfcal:name': rdfcal_name,
             'rdfcal:hasAgent': rdfcal_hasAgent,
             'foaf:name': rdfcal_hasAgentName,
             'rdfcal:startDate': rdfcal_startDate,
             'rdfcal:targetDate': rdfcal_targetDate,
             'rdfcal:completed': rdfcal_completed,
             'dc:created': date.toISOString(),
             'id': urlId
         });
	    // cleanup old resourceItem
	    this.iks_annotateFieldTask.cleanItem();
	    jQuery('#rdfcal_targetDate').val('');
	} else {
	    
	}
	
	/*GENTICS.Aloha.EventRegistry.trigger(
			new GENTICS.Aloha.Event('iks_annotateChange', GENTICS.Aloha, {
				'obj' : this.iks_annotateFieldTask.getTargetObject(),
				'about': this.iks_annotateFieldTask.getQueryValue(),
				'item': this.iks_annotateFieldTask.getItem()
			})
	);*/
	
};

/**
 * Make the given jQuery object (representing an editable) clean for saving
 * Find all abbrs and remove editing objects
 * @param obj jQuery object to make clean
 * @return void
 */
eu.iksproject.AnnotationTaskPlugin.makeClean = function (obj) {
// nothing to do...
};


var PseudoGuid = new (function() {
    this.empty = "RDFa-00000000-0000-0000-0000-000000000000";
    this.GetNew = function() {
        var fC = function() {
                return (((1 + Math.random()) * 0x10000)|0).toString(16).substring(1).toUpperCase();
        }
        return ("RDFa-" + fC() + fC() + "-" + fC() + "-" + fC() + "-" + fC() + "-" + fC() + fC() + fC());
    };
})();


// borrowed code from table plugin...

/**
 * This function adds the createDialog to the calling element
 *
 * @param callingElement
 *            The element, which was clicked. It's needed to set the right
 *            position to the create-table-dialog.
 */
eu.iksproject.AnnotationTaskPlugin.createDialog = function(callingElement) {
	// set the calling element to the layer the calling element mostly will be
	// the element which was clicked on it is used to position the createLayer
	this.createLayer.set('target', callingElement);

	// show the createLayer
	this.createLayer.show();

};

/**
 * Dummy initialize of the CreateLayer object
 */
eu.iksproject.AnnotationTaskPlugin.CreateLayer = function(){};

/* -- ATTRIBUTES -- */
/**
 * Internal configuration of the create-table panel
 */
eu.iksproject.AnnotationTaskPlugin.CreateLayer.prototype.parameters = {
	elemId: 'GENTICS_Aloha_Datepicker_createLayer', // id of the create-table panel
	className: 'GENTICS_Datepicker_Createdialog',   // class-name of the create-table panel
	numX: 10,	         // Number of cols in the create-layer
	numY: 10,            // Number of rows in the create-layer vertically
	layer: undefined,    // Attribute holding the create-layer
	target: undefined    // the clicktarget which was clicked on (mostly the button of the floatingmenu)
};

/**
 * The configuration-object for the implementer of the plugin. All keys of
 * the "parameters" object could be overwritten within this object and will
 * simply be used instead.
 */
eu.iksproject.AnnotationTaskPlugin.CreateLayer.prototype.config = new Object();

/**
 * Flag wether the CreateLayer is currently visble or not
 */
eu.iksproject.AnnotationTaskPlugin.CreateLayer.prototype.visible = false;
/* -- END ATTRIBUTES -- */


eu.iksproject.AnnotationTaskPlugin.CreateLayer.prototype.create = function () {
	var that = this;
	var layer = jQuery('<div>Target date: </div>');
	layer.id = this.get('elemId');
	layer.addClass(this.get('className'));
    
    var $dp = $("<input id='rdfcal_targetDate' type='text' />").datepicker({ dateFormat: 'dd/mm/yy' });

	layer.append($dp);

	// set attributes
	this.set('layer', layer);
	this.setPosition();

	// stop bubbling the click on the create-dialog up to the body event
	layer.bind('click', function(e) {
		e.stopPropagation();
	}).mousedown(function(e) {
		e.stopPropagation();
	});
	
	layer.bind('click', function(e) {
        if ($dp.datepicker('widget').is(':hidden')) {
            $dp.datepicker("show").datepicker("widget").show().position({
                my: "left top",
                at: "right top",
                of: this
            });
        }
        e.preventDefault();
    });

	// append layer to body and
	// hide the create layer if user clicks anywhere in the body
    jQuery('body').append(layer).bind('click', function(e) {
		if (e.target != that.get('target') && that.visible) {
			that.hide();
			eu.iksproject.AnnotationTaskPlugin.iks_annotateChange();
		}
	});
};

/**
 * Sets the "left" and "top" style-attributes according to the clicked target-button
 *
 *  @return void
 */
eu.iksproject.AnnotationTaskPlugin.CreateLayer.prototype.setPosition = function() {
	var targetObj = jQuery(this.get('target'));
	var pos = targetObj.offset();
	this.get('layer').css('left', pos.left + 'px');
	this.get('layer').css('top', (pos.top + targetObj.height()) + 'px');
};


/**
 * This function checks if there is an create-table-layer. If no layer exists, it creates one and puts it into the configuration.
 * If the layer was already created it sets the position of the panel and shows it.
 *
 * @return void
 */
eu.iksproject.AnnotationTaskPlugin.CreateLayer.prototype.show = function(){
	var layer = this.get('layer');

	// create the panel if the layer doesn't exist
	if (layer == null) {
		this.create();
	}else {
		// or reposition, cleanup and show the layer
		this.setPosition(layer);
		layer.show();
	}
	this.visible = true;
};

/**
 * Hides the create-table panel width the jQuery-method hide()
 *
 * @see jQuery().hide()
 * @return void
 */
eu.iksproject.AnnotationTaskPlugin.CreateLayer.prototype.hide = function() {
	this.get('layer').hide();
	this.visible = false;
};

/**
 * The "get"-method returns the value of the given key. First it searches in the
 * config for the property. If there is no property with the given name in the
 * "config"-object it returns the entry associated with in the parameters-object
 *
 * @param property
 * @return void
 */
eu.iksproject.AnnotationTaskPlugin.CreateLayer.prototype.get = function(property) {
	// return param from the config
	if (this.config[property]) {
		return this.config[property];
	}
	// if config-param was not found return param from the parameters-object
	if (this.parameters[property]) {
		return this.parameters[property];
	}
	return undefined;
};

/**
 * The "set"-method takes a key and a value. It checks if there is a key-value
 * pair in the config-object. If so it saves the data in the config-object. If
 * not it saves the data in the parameters-object.
 *
 * @param key
 *            the key which should be set
 * @param value
 *            the value which should be set for the associated key
 */
eu.iksproject.AnnotationTaskPlugin.CreateLayer.prototype.set = function (key, value) {
	// if the key already exists in the config-object, set it to the config-object
	if (this.config[key]) {
		this.config[key] = value;

	// otherwise "add" it to the parameters-object
	}else{
		this.parameters[key] = value;
	}
};
