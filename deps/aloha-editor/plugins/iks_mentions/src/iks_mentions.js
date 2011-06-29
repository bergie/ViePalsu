if (typeof eu == "undefined") {
    var eu = {};
    
    if (typeof eu.iksproject == "undefined") {
        eu.iksproject = {};
    }
}

/**
 * register the plugin with unique name
 */
eu.iksproject.MentionsPlugin = new GENTICS.Aloha.Plugin('iks_mentions');

/**
 * Configure the available languages
 */
eu.iksproject.MentionsPlugin.languages = ['en'];

/**
 * Default configuration allows iks_mentions everywhere
 */
eu.iksproject.MentionsPlugin.config = ['iks_mentions'];

/**
 * Initialize the plugin
 */
eu.iksproject.MentionsPlugin.init = function () {
    this.subscribeEvents();
    this.bindInteractions();
};

/**
 * Parse a all editables for iks_annotateeviations 
 * Add the iks_annotate shortcut to all edtiables 
 */
eu.iksproject.MentionsPlugin.bindInteractions = function () {
    var that = this;
};

/**
 * Subscribe for events
 */
eu.iksproject.MentionsPlugin.subscribeEvents = function () {

	var that = this;
	
    // add the event handler for selection change
    GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject) {

        if (GENTICS.Aloha.activeEditable) {
        	var foundMarkup = that.findIksMentionsMarkup( rangeObject );
        	console.log(foundMarkup);
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
eu.iksproject.MentionsPlugin.findIksMentionsMarkup = function (range) {
    
	if ( typeof range == 'undefined' ) {
        //var range = GENTICS.Aloha.Selection.getRangeObject();
        return false
    }
    
	if ( GENTICS.Aloha.activeEditable ) {
        //GENTICS.Aloha.activeEditable.obj;
        var re = / @([a-zA-Z_-]{1,250})&nbsp;/g;
        var match = re.exec(range.limitObject.innerHTML);
        console.log(match);
        if (match && match[1]) {
            
            /*var newIksAnnotate = jQuery('<span />').attr({
    		    'about': '',
    		    'typeof': 'foaf:Person',
    		    'property': 'foaf:name',
    		    'class': 'annotation_person',
    		    'content': '',
    		    'title': ''
    		});
            GENTICS.Utils.Dom.addMarkup(range, newIksAnnotate, false);*/
            
            return true;
        }
        
        return false;
	} else {
	    return null;
	}
};
