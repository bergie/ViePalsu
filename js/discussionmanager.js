if (typeof ViePalsu === 'undefined') {
    ViePalsu = {};
}

ViePalsu.DiscussionManager = {
    defaultMessage: '<p>Write your message here</p>',

    initInput: function() {
        ViePalsu.DiscussionManager.chatInput = jQuery('#chat-input div');

        ViePalsu.DiscussionManager.chatInput.html(ViePalsu.DiscussionManager.defaultMessage);
        ViePalsu.DiscussionManager.chatInputEditable = new GENTICS.Aloha.Editable(ViePalsu.DiscussionManager.chatInput);
		
		// editableDeactivated or smartContentChanged
        jQuery('#chat-input button').button().click(function() {
            if (!ViePalsu.DiscussionManager.chatInputEditable.isModified()){
                return true;
            }

            var newMessage = ViePalsu.DiscussionManager.chatInputEditable.getContents();
            if (!newMessage) {
                return true;
            }

            var date = new Date();
            ViePalsu.DiscussionManager.collection.add({
                'dc:creator': jQuery('#username').text(),
                'foaf:depiction': ["<"+jQuery('#account [rel="foaf\\:img"] img').attr('src')+">"],
                'dc:created': date.toISOString(),
                'sioc:content': newMessage
            });
            
            ViePalsu.DiscussionManager.chatInput.html(ViePalsu.DiscussionManager.defaultMessage);
        });

        GENTICS.Aloha.EventRegistry.subscribe(ViePalsu.DiscussionManager.chatInputEditable, 'editableActivated', function() {
            if (ViePalsu.DiscussionManager.chatInput.html() === ViePalsu.DiscussionManager.defaultMessage) {
                ViePalsu.DiscussionManager.chatInput.html('');
            }
        });

        GENTICS.Aloha.EventRegistry.subscribe(ViePalsu.DiscussionManager.chatInputEditable, 'editableDeactivated', function() {
            if (ViePalsu.DiscussionManager.chatInput.html() === '') {
                ViePalsu.DiscussionManager.chatInput.html(ViePalsu.DiscussionManager.defaultMessage);
            } else {
                /*$('.message').vie2().vie2('analyze', function (status) {
                    if (status === 'ok') {
                        console.log("Success!");
                    }
                });*/
            }
        });
    },
    
    autoScroll: function(force) {
        var log = jQuery('#chat-history');
        if (log.length > 0) {
            // auto scroll if we're within 100 pixels of the bottom
            if (log.scrollTop() + 100 >= log[0].scrollHeight - log.height() ||
                force) {
	            window.setTimeout(function() {
		            log.scrollTop(log[0].scrollHeight);
	            }, 10);
            }
        }
    },

    getCollection: function() {
        jQuery.each(VIE.EntityManager.getByType('rdfcal:Vevent'), function() {
            if (this.id) {
                ViePalsu.DiscussionManager.collection = this.get('sioc:container_of');
            }
        });
        
        // Remove placeholder
        jQuery('[about="#post1"]').remove();

        ViePalsu.DiscussionManager.collection.bind('add', function(postInstance, collectionInstance, options) {
            ViePalsu.DiscussionManager.autoScroll();
            
            window.setTimeout(function() {
                jQuery('[typeof="sioc:Post"]').each(function() {
                    ViePalsu.DiscussionManager.updateDate(this);
                });	  
            }, 20);
            
            if (!options.fromServer) {
                postInstance.save();
            }
        });
        
        ViePalsu.DiscussionManager.collection.comparator = function(item) {
            return dateComparator(item, ViePalsu.DiscussionManager.collection);
        };
    },
    
    participate: function() {
        var attendees;
        jQuery.each(VIE.EntityManager.getByType('rdfcal:Vevent'), function() {
            if (this.id) {
                attendees = this.get('rdfcal:attendee');
            }
        });
        
        // Remove placeholder
        jQuery('[rel="rdfcal:attendee"] [about="#"]').remove();

        attendees.bind('add', function(person, attendees, options) {
            if (!options.fromServer) {
                person.save();
            }
        });
        
        // Add myself if I'm not already there
        var me = VIE.RDFaEntities.getInstance(jQuery('#account'));
        if (attendees.indexOf(me) === -1) {
            attendees.add(me);
        }
    },
    
    updateDate: function(element) {
        jQuery('.easydate', element).attr('title', jQuery('div[property="dc:created"]', element).hide().text());
        
        jQuery('.easydate', element).easydate();
    }
};

jQuery(document).ready(function() {
    // Make RDFa entities editable on double click
    jQuery('[about]').each(function() {
        var subject = VIE.RDFa.getSubject(jQuery(this));
        jQuery('[property]', this).dblclick(function() {
            if (subject !== VIE.RDFa.getSubject(jQuery(this))) {
                return true;
            }
            jQuery(this).vieSemanticAloha();
            var modelInstance = VIE.EntityManager.getBySubject(subject);

            // Subscribe to the editable deactivated signal to update Backbone model
            jQuery.each(modelInstance.editables, function() {
                var editableInstance = this;
                GENTICS.Aloha.EventRegistry.subscribe(editableInstance, 'editableDeactivated', function() {
                    if (VIE.AlohaEditable.refreshFromEditables(modelInstance)) {
                        // There were changes, save
                        modelInstance.save();
                        //use VIE^2 to analyze the text
                        /*$('.message').vie2().vie2('analyze', function (status) {
                            if (status === 'ok') {
                                console.log("Success 2!");
                            }
                        });*/
                    }
                });
            });
        });
    });

    jQuery('[typeof="sioc:Post"]').each(function() {
        ViePalsu.DiscussionManager.updateDate(this);
    });	    

    ViePalsu.DiscussionManager.initInput();
    ViePalsu.DiscussionManager.getCollection();
    ViePalsu.DiscussionManager.autoScroll(true);
    ViePalsu.DiscussionManager.participate();
});
