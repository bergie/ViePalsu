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
        'tooltip' : this.i18n('button.task.tooltip'),
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
        'tooltip' : this.i18n('button.task.tooltip'),
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
    
    this.iks_annotateField = new GENTICS.Aloha.ui.AttributeField({
    	'width':320,
    	'valueField': 'url',
    	'displayField': 'name'
    });
    this.iks_annotateField.setTemplate('<span><b>{name}</b><br/>{url}</span>');
    this.iks_annotateField.setObjectTypeFilter(eu.iksproject.AnnotationTaskPlugin.objectTypeFilter);

    // add the input field for iks_annotate
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('iks_annotate_task'),
        this.iks_annotateField,
        this.i18n('floatingmenu.tab.iks_annotate_task'),
        1
    );

    /*    
    this.removeLinkButton = new GENTICS.Aloha.ui.Button({
        // TODO use another icon here
        'iconClass' : 'GENTICS_button GENTICS_button_a_remove',
        'size' : 'small',
        'onclick' : function () { this.datepicker({ dateFormat: 'yy-mm-dd' }) },
        'tooltip' : this.i18n('button.removelink.tooltip')
    });
    // add a button for removing the currently set link
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('iks_annotate_task'),
        this.removeLinkButton,
        this.i18n('floatingmenu.tab.iks_annotate_task'),
        1
    );
    */

    /*this.iks_annotateFieldDate = new GENTICS.Aloha.ui.AttributeField({
    	'width':320,
    	'valueField': 'url',
    	'displayField': 'name'
    });
    this.iks_annotateFieldDate.setTemplate('<span><b>{name}</b><br/>{url}</span>');
    this.iks_annotateFieldDate.setObjectTypeFilter(eu.iksproject.AnnotationTaskPlugin.objectTypeFilter);

    // add the input field for iks_annotate
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('iks_annotate_task'),
        this.iks_annotateFieldDate,
        this.i18n('floatingmenu.tab.iks_annotate_task'),
        1
    );*/
};

/**
 * Parse a all editables for iks_annotateeviations 
 * Add the iks_annotate shortcut to all edtiables 
 */
eu.iksproject.AnnotationTaskPlugin.bindInteractions = function () {
    var that = this;

        // update link object when src changes
        this.iks_annotateField.addListener('keyup', function(obj, event) {
        	// TODO this event is never fired. Why?
        	// if the user presses ESC we do a rough check if he has entered a link or searched for something
    	    if (event.keyCode == 27) {
    	    	var curval = that.iks_annotateField.getQueryValue();
    	    	if (
    	    		curval[0] == '/' || // local link
    	    		curval.match(/^.*\.([a-z]){2,4}$/i) || // local file with extension
    	    		curval[0] == '#' || // inner document link
    	    		curval.match(/^htt.*/i)  // external link
    	    	) {
    	    		// could be a link better leave it as it is
    	    	} else {
    	    		// the user searched for something and aborted restore original value
    	    		//that.iks_annotateField.setValue(that.iks_annotateField.getValue());
    	    	}
    	    }
        	that.iks_annotateChange();
        });


    // on blur check if iks_annotate title is empty. If so remove the a tag
    this.iks_annotateField.addListener('blur', function(obj, event) {
        if ( this.getValue() == '' ) {
            that.removeIksAnnotate();
        }
    });
    
    // add to all editables the iks_annotate shortcut
    for (var i = 0; i < GENTICS.Aloha.editables.length; i++) {

        // CTRL+G
        GENTICS.Aloha.editables[i].obj.keydown(function (e) {
    		if ( e.metaKey && e.which == 71 ) {
		        if ( that.findIksAnnotateMarkup() ) {
		            GENTICS.Aloha.FloatingMenu.userActivatedTab = that.i18n('floatingmenu.tab.iks_annotate_task');
		
		            // TODO this should not be necessary here!
		            GENTICS.Aloha.FloatingMenu.doLayout();
		
		            that.iks_annotateField.focus();
		
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
        		// foundMarkup --> foaf:Person uuid
        		//that.iks_annotateField.setTargetObject(foundMarkup, 'content');
        	} else {
        		// no iks_annotate found
        		that.formatIksAnnotateButton.setPressed(false);
        		that.iks_annotateField.setTargetObject(null);
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
    if ( this.findIksAnnotateMarkup( range ) ) {
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
        //var newIksAnnotate = jQuery('<span title="b"></span>');
        var about_hash = PseudoGuid.GetNew();
        var newIksAnnotate = jQuery('<span />').attr({
            'id': about_hash,
		    'about': '',
		    'typeof': 'rdfcal:Task',
		    'property': 'rdfcal:name',
		    'class': 'annotation_task',
		    'style': '',
		    'content': ''
		});
		
		/*.append('<span typeof="foaf:Person" about="" property="foaf:name" content=""></span>
    		    <span property="rdfcal:targetDate" content=""></span>
    		    <span property="rdfcal:completed" content=""></span>'
    		);*/
		
		
        GENTICS.Utils.Dom.addMarkup(range, newIksAnnotate, false);
    }
    range.select();
    this.iks_annotateField.focus();
    this.iks_annotateChange();
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
eu.iksproject.AnnotationTaskPlugin.iks_annotateChange = function () {
    
	var item = this.iks_annotateField.getItem();

	if (item && item.url && item.name) {
	    // write task data
	    this.iks_annotateField.setAttribute('about', 'task-guid');
	    
	    /*var rdfcal_name = jQuery('#rdfcal_name').attr('value');
             var rdfcal_hasAgent = jQuery('#rdfcal_hasAgent option:selected').attr('value');
             var rdfcal_hasAgentName = jQuery('#rdfcal_hasAgent option:selected').text();
             var rdfcal_startDate = jQuery('#rdfcal_startDate').attr('value');
             var rdfcal_targetDate = jQuery('#rdfcal_targetDate').attr('value');
            //* /

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
        */
	    
	    // cleanup old resourceItem
	    this.iks_annotateField.cleanItem();
	} else {
	    
	}
	
	/*GENTICS.Aloha.EventRegistry.trigger(
			new GENTICS.Aloha.Event('iks_annotateChange', GENTICS.Aloha, {
				'obj' : this.iks_annotateField.getTargetObject(),
				'about': this.iks_annotateField.getQueryValue(),
				'item': this.iks_annotateField.getItem()
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
