if (typeof eu == "undefined") {
    var eu = {};
    
    if (typeof eu.iksproject == "undefined") {
        eu.iksproject = {};
    }
}

/**
 * register the plugin with unique name
 */
eu.iksproject.AnnotationPlugin = new GENTICS.Aloha.Plugin('iks_annotate');

/**
 * Configure the available languages
 */
eu.iksproject.AnnotationPlugin.languages = ['en'];

/**
 * Default configuration allows iks_annotates everywhere
 */
eu.iksproject.AnnotationPlugin.config = ['iks_annotate'];

/**
 * the defined object types to be used for this instance
 */
eu.iksproject.AnnotationPlugin.objectTypeFilter = ['foaf:Person'];


/**
 * Initialize the plugin
 */
eu.iksproject.AnnotationPlugin.init = function () {
    
    this.createButtons();
    this.subscribeEvents();
    this.bindInteractions();

};

/**
 * Initialize the buttons
 */
eu.iksproject.AnnotationPlugin.createButtons = function () {
    var that = this;

    // format IksAnnotate Button 
    // this button behaves like a formatting button like (bold, italics, etc)
    this.formatIksAnnotateButton = new GENTICS.Aloha.ui.Button({
        'iconClass' : 'GENTICS_button GENTICS_button_addPerson',
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
        'iconClass' : 'GENTICS_button GENTICS_button_addPerson',
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
    GENTICS.Aloha.FloatingMenu.createScope(this.getUID('iks_annotate'), 'GENTICS.Aloha.continuoustext');
    
    this.iks_annotateField = new GENTICS.Aloha.ui.AttributeField({
    	'width':320,
    	'valueField': 'url',
    	'displayField': 'name'
    });
    this.iks_annotateField.setTemplate('<span><b>{name}</b><br/>{url}</span>');
    this.iks_annotateField.setObjectTypeFilter(eu.iksproject.AnnotationPlugin.objectTypeFilter);

    // add the input field for iks_annotate
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('iks_annotate'),
        this.iks_annotateField,
        this.i18n('floatingmenu.tab.iks_annotate'),
        1
    );
};

/**
 * Parse a all editables for iks_annotateeviations 
 * Add the iks_annotate shortcut to all edtiables 
 */
eu.iksproject.AnnotationPlugin.bindInteractions = function () {
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
		            GENTICS.Aloha.FloatingMenu.userActivatedTab = that.i18n('floatingmenu.tab.iks_annotate');
		
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
eu.iksproject.AnnotationPlugin.subscribeEvents = function () {

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
        		GENTICS.Aloha.FloatingMenu.setScope(that.getUID('iks_annotate'));
        		that.iks_annotateField.setTargetObject(foundMarkup, 'about');
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
eu.iksproject.AnnotationPlugin.findIksAnnotateMarkup = function ( range ) {
    
	if ( typeof range == 'undefined' ) {
        var range = GENTICS.Aloha.Selection.getRangeObject();   
    }
    
    /*
    console.log('range:', range);
    if (GENTICS.Aloha.Selection.standardTextLevelSemanticsComparator(range, jQuery('<span typeof="foaf:Person"></span>'))) {
        console.log('found markup');
    } else {
        console.log('markup not found');
    }
    */
    
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
eu.iksproject.AnnotationPlugin.formatIksAnnotate = function () {
	
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
eu.iksproject.AnnotationPlugin.insertIksAnnotate = function ( extendToWord ) {
    
    // do not insert a abbr in a abbr
    if ( this.findIksAnnotateMarkup( range ) ) {
        return;
    }
    
    // activate floating menu tab
    GENTICS.Aloha.FloatingMenu.userActivatedTab = this.i18n('floatingmenu.tab.iks_annotate');

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
		    'typeof': 'foaf:Person',
		    'property': 'foaf:name',
		    'class': 'annotation_person',
		    'style': '',
		    'content': ''
		});
        GENTICS.Utils.Dom.addMarkup(range, newIksAnnotate, false);
    }
    range.select();
    this.iks_annotateField.focus();
    this.iks_annotateChange();
};

/**
 * Remove an a tag.
 */
eu.iksproject.AnnotationPlugin.removeIksAnnotate = function () {

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
eu.iksproject.AnnotationPlugin.iks_annotateChange = function () {
    
	var item = this.iks_annotateField.getItem();
    var r = new RegExp('http://', 'i');
    
    // @todo check for url value
	if (item && item.url && item.url.match(r) && item.name) {
	    this.iks_annotateField.setAttribute('about', item.url);
	    this.iks_annotateField.setAttribute('content', item.name);
	    this.iks_annotateField.setText(item.name);
	    
	    
	    // add to mentions
	    var eventId = jQuery('body').attr('about');
        var mentionCollection = VIE.EntityManager.getBySubject(eventId).get('rdfcal:hasMention');
        
        //var urlId = window.location.protocol + "//" + window.location.host + "/e/" + mentionCollection.length + location.pathname.replace(/\//g, '');
        var urlId = item.url;
        
        var date = new Date();
        console.log('urlid', urlId);
        console.log('in mentions', jQuery('[typeof="rdfcal\\:Mention"][about="'+urlId+'"]'));
        if (jQuery('[typeof="rdfcal\\:Mention"][about="'+urlId+'"]').length < 1) {
        mentionCollection.add({
            'rdfcal:hasAgent': item.url,
            'foaf:name': item.name,
            'dc:created': date.toISOString(),
            'id': urlId
        });
        
	        console.log('iks annotate OK: added mention of person ' + item.name + ' with ID ' + urlId);
        } else {
    	    console.log('iks annotate OK: person already exists ' + item.name + ' with ID ' + urlId);            
        }
	    
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
eu.iksproject.AnnotationPlugin.makeClean = function (obj) {
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
