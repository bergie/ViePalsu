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
 * Default configuration allows iks_annotate_tasks everywhere
 */
eu.iksproject.AnnotationTaskPlugin.config = ['iks_annotate_task'];

/**
 * the defined object types to be used for this instance
 */
eu.iksproject.AnnotationTaskPlugin.objectTypeFilter = ['foaf:Person'];

eu.iksproject.AnnotationTaskPlugin.onHrefChange = null;


/**
 * Initialize the plugin
 */
eu.iksproject.AnnotationTaskPlugin.init = function () {
    
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
    this.formatIksAnnotateButton = new GENTICS.Aloha.ui.Button({
        'iconClass' : 'GENTICS_button GENTICS_button_addEvent',
        'size' : 'small',
        'onclick' : function () { that.formatIksAnnotate(); },
        'tooltip' : this.i18n('button.person.tooltip'),
        'toggle' : true
    });
    GENTICS.Aloha.FloatingMenu.addButton(
        'GENTICS.Aloha.continuoustext',
        this.formatIksAnnotateButton,
        GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.format'),
        1
    );

    // insert IksAnnotate
    // always inserts a new abbr
    this.insertIksAnnotateButton = new GENTICS.Aloha.ui.Button({
        'iconClass' : 'GENTICS_button GENTICS_button_addEvent',
        'size' : 'small',
        'onclick' : function () { that.insertIksAnnotate( false ); },
        'tooltip' : this.i18n('button.person.tooltip'),
        //'toggle' : false
    });
    GENTICS.Aloha.FloatingMenu.addButton(
        'GENTICS.Aloha.continuoustext',
        this.insertIksAnnotateButton,
        GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.insert'),
        1
    );

    // add the new scope for abbr
    GENTICS.Aloha.FloatingMenu.createScope(this.getUID('iks_annotate_task'), 'GENTICS.Aloha.continuoustext');
    
    this.iks_annotate_taskField = new GENTICS.Aloha.ui.AttributeField({
    	'width':320,
    	'valueField': 'url',
    	'displayField': 'name'
    });
    this.iks_annotate_taskField.setTemplate('<span><b>{name}</b><br/>{url}</span>');
    this.iks_annotate_taskField.setObjectTypeFilter(eu.iksproject.AnnotationTaskPlugin.objectTypeFilter);

    // add the input field for iks_annotate_task
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('iks_annotate_task'),
        this.iks_annotate_taskField,
        this.i18n('floatingmenu.tab.iks_annotate_task'),
        1
    );
/*
    this.iks_annotate_task_personField = new GENTICS.Aloha.ui.AttributeField({
    	'width':320,
    	'valueField': 'url',
    	'displayField': 'name'
    });
    this.iks_annotate_taskField.setTemplate('<span><b>{name}</b><br/>{url}</span>');
    this.iks_annotate_task_personField.setObjectTypeFilter(eu.iksproject.AnnotationTaskPlugin.objectTypeFilter);

    // add the input field for iks_annotate_task
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('iks_annotate_task'),
        this.iks_annotate_task_personField,
        this.i18n('floatingmenu.tab.iks_annotate_task_person'),
        1
    );
*/
};

/**
 * Parse a all editables for iks_annotate_taskeviations 
 * Add the iks_annotate_task shortcut to all edtiables 
 */
eu.iksproject.AnnotationTaskPlugin.bindInteractions = function () {
    var that = this;

        // update link object when src changes
        this.iks_annotate_taskField.addListener('keyup', function(obj, event) {
        	// TODO this event is never fired. Why?
        	// if the user presses ESC we do a rough check if he has entered a link or searched for something
    	    if (event.keyCode == 27) {
    	    	var curval = that.iks_annotate_taskField.getQueryValue();
    	    	if (
    	    		curval[0] == '/' || // local link
    	    		curval.match(/^.*\.([a-z]){2,4}$/i) || // local file with extension
    	    		curval[0] == '#' || // inner document link
    	    		curval.match(/^htt.*/i)  // external link
    	    	) {
    	    		// could be a link better leave it as it is
    	    	} else {
    	    		// the user searched for something and aborted restore original value
    //	    		that.iks_annotate_taskField.setValue(that.iks_annotate_taskField.getValue());
    	    	}
    	    }
        	that.iks_annotate_taskChange();
        });


    // on blur check if iks_annotate_task title is empty. If so remove the a tag
    this.iks_annotate_taskField.addListener('blur', function(obj, event) {
        if ( this.getValue() == '' ) {
            that.removeIksAnnotate();
        }
    });
    
    // add to all editables the iks_annotate_task shortcut
    for (var i = 0; i < GENTICS.Aloha.editables.length; i++) {

        // CTRL+G
        GENTICS.Aloha.editables[i].obj.keydown(function (e) {
    		if ( e.metaKey && e.which == 71 ) {
		        if ( that.findIksAnnotateMarkup() ) {
		            GENTICS.Aloha.FloatingMenu.userActivatedTab = that.i18n('floatingmenu.tab.iks_annotate_task');
		
		            // TODO this should not be necessary here!
		            GENTICS.Aloha.FloatingMenu.doLayout();
		
		            that.iks_annotate_taskField.focus();
		
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
        	
        	//if ( jQuery.inArray('abbr', config) != -1) {
        		that.formatIksAnnotateButton.show();
        		that.insertIksAnnotateButton.show();
        	//} else {
        	//	that.formatIksAnnotateButton.hide();
        	//	that.insertIksAnnotateButton.hide();
        		// leave if a is not allowed
        	//	return;
        	//}
        	
//        if ( !GENTICS.Aloha.Selection.mayInsertTag('abbr') ) {
//        	that.insertIksAnnotateButton.hide();
//        }
        	
        	var foundMarkup = that.findIksAnnotateMarkup( rangeObject );
        	if ( foundMarkup ) {
        		// abbr found
        		that.insertIksAnnotateButton.hide();
        		that.formatIksAnnotateButton.setPressed(true);
        		GENTICS.Aloha.FloatingMenu.setScope(that.getUID('iks_annotate_task'));
        		that.iks_annotate_taskField.setTargetObject(foundMarkup, 'content');
        		//that.iks_annotate_taskField.setTargetObject(that.iks_annotate_taskField.getQueryValue(), 'content');
                
                /*var rdfcal_name = jQuery('#rdfcal_name').attr('value');
                    var rdfcal_hasAgent = jQuery('#rdfcal_hasAgent option:selected').attr('value');
                    var rdfcal_hasAgentName = jQuery('#rdfcal_hasAgent option:selected').text();
                    var rdfcal_startDate = jQuery('#rdfcal_startDate').attr('value');
                    var rdfcal_targetDate = jQuery('#rdfcal_targetDate').attr('value');*/

                    var eventId = jQuery('body').attr('about');
                    var taskCollection = VIE.EntityManager.getBySubject(eventId).get('rdfcal:hasTask');

                    var rdfcal_name = jQuery(foundMarkup).text();
                    //var rdfcal_name = 'found markup';
                    var rdfcal_hasAgent = 'http://twitter.com/rene_kapusta';
                    var rdfcal_hasAgentName = 'Rene Kapusta';
                    var rdfcal_startDate = '2011-05-13';
                    var rdfcal_targetDate = '2011-05-19';
                    var rdfcal_completed = 0;

                    if (!rdfcal_name && !rdfcal_hasAgent) {
                        console.log('Error: no rdfcal:name or rdfcal:hasAgent value');
                        return;
                    }

                    var date = new Date();
                    taskCollection.add({
                        'rdfcal:name': rdfcal_name,
                        'rdfcal:hasAgent': rdfcal_hasAgent,
                        'foaf:name': rdfcal_hasAgentName,
                        'rdfcal:startDate': rdfcal_startDate,
                        'rdfcal:targetDate': rdfcal_targetDate,
                        'rdfcal:completed': rdfcal_completed,
                        'dc:created': date.toISOString()
                    });

                    console.log('OK: added task ' + rdfcal_name + ' for user ' + rdfcal_hasAgent + '.');

           	    
                
        	} else {
        		// no iks_annotate_task found
        		that.formatIksAnnotateButton.setPressed(false);
        		that.iks_annotate_taskField.setTargetObject(null);
        	}
        	
        	// TODO this should not be necessary here!
        	GENTICS.Aloha.FloatingMenu.doLayout();
        }

    });
    
};

/**
 * Check whether inside a iks_annotate_task tag 
 * @param {GENTICS.Utils.RangeObject} range range where to insert the object (at start or end)
 * @return markup
 * @hide
 */
eu.iksproject.AnnotationTaskPlugin.findIksAnnotateMarkup = function ( range ) {
    
	if ( typeof range == 'undefined' ) {
        var range = GENTICS.Aloha.Selection.getRangeObject();   
    }
	if ( GENTICS.Aloha.activeEditable ) {
	    return range.findMarkup(function() {
	        return this.nodeName.toLowerCase() == 'span';
	    }, GENTICS.Aloha.activeEditable.obj);
	} else {
		return null;
	}
};

/**
 * Format the current selection or if collapsed the current word as abbr.
 * If inside a abbr tag the abbr is removed.
 */
eu.iksproject.AnnotationTaskPlugin.formatIksAnnotate = function () {
	
	var range = GENTICS.Aloha.Selection.getRangeObject();
    
    if (GENTICS.Aloha.activeEditable) {
        if (this.findIksAnnotateMarkup( range ) ) {
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
    //if ( this.findIksAnnotateMarkup( range ) ) {
    //    return;
    //}
    //var that = this;
    
    // activate floating menu tab
    GENTICS.Aloha.FloatingMenu.userActivatedTab = this.i18n('floatingmenu.tab.iks_annotate_task');

    // current selection or cursor position
    var range = GENTICS.Aloha.Selection.getRangeObject();

    // if selection is collapsed then extend to the word.
    if (range.isCollapsed() && extendToWord != false) {
        GENTICS.Utils.Dom.extendToWord(range);
    }
    if ( range.isCollapsed() ) {
        // insert a abbr with text here
        var iks_annotate_taskText = this.i18n('newiks_annotate_task.defaulttext');
        var newIksAnnotate = jQuery('<span>' + iks_annotate_taskText + '</span>');
        GENTICS.Utils.Dom.insertIntoDOM(newIksAnnotate, range, jQuery(GENTICS.Aloha.activeEditable.obj));
        range.startContainer = range.endContainer = newIksAnnotate.contents().get(0);
        range.startOffset = 0;
        range.endOffset = iks_annotate_taskText.length;
    } else {
        //var newIksAnnotate = jQuery('<span title="b"></span>');
        var about_hash = PseudoGuid.GetNew();
        var newIksAnnotate = jQuery('<span />').attr({
            'id': 'rdfa_' + about_hash + '',
		    'content': '',
		    'typeof': 'rdfcal:Task',
		    'property': 'rdfcal:name',
		    'class': 'annotation_task'
		});
		/* .append(
		    '<span property="foaf:name">' + + '</span>'
		)*/
        GENTICS.Utils.Dom.addMarkup(range, newIksAnnotate, false);
        
        /*var foundMarkup = that.findIksAnnotateMarkup( range );
    	if ( foundMarkup ) {
 	    }*/
    }
    range.select();
    this.iks_annotate_taskField.focus();
    this.iks_annotate_taskChange();
};

/**
 * Remove an a tag.
 */
eu.iksproject.AnnotationTaskPlugin.removeIksAnnotate = function () {

    var range = GENTICS.Aloha.Selection.getRangeObject();
    var foundMarkup = this.findIksAnnotateMarkup(); 
    if ( foundMarkup ) {
        
        
   	
    	
        // remove the abbr
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
eu.iksproject.AnnotationTaskPlugin.iks_annotate_taskChange = function () {
	// For now hard coded attribute handling with regex.
	// Avoid creating the target attribute, if it's unnecessary, so
	// that XSS scanners (AntiSamy) don't complain.
	if (this.target !== '') {
		this.iks_annotate_taskField.setAttribute('content', this.target, this.targetregex, this.iks_annotate_taskField.getQueryValue());
	}
	//this.iks_annotate_taskField.setAttribute('class', this.cssclass, this.cssclassregex, this.iks_annotate_taskField.getQueryValue());
	if ( typeof this.onHrefChange == 'function' ) {
		this.onHrefChange.call(this, this.iks_annotate_taskField.getTargetObject(),  this.iks_annotate_taskField.getQueryValue(), this.iks_annotate_taskField.getItem() )
	}
	GENTICS.Aloha.EventRegistry.trigger(
			new GENTICS.Aloha.Event('iks_annotate_taskChange', GENTICS.Aloha, {
				'obj' : this.iks_annotate_taskField.getTargetObject(),
				'content': this.iks_annotate_taskField.getQueryValue(), // href
				'item': this.iks_annotate_taskField.getItem()
			})
	);
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




// tmp pseudo guid from vie-2
var PseudoGuid = new (function() {
    this.empty = "VIE2-00000000-0000-0000-0000-000000000000";
    this.GetNew = function() {
        var fC = function() {
                return (((1 + Math.random()) * 0x10000)|0).toString(16).substring(1).toUpperCase();
        }
        return ("VIE2-" + fC() + fC() + "-" + fC() + "-" + fC() + "-" + fC() + "-" + fC() + fC() + fC());
    };
})();