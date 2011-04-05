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
                'mgd:photo': [jQuery('#account [rel="foaf\\:img"] img').attr('src')],
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
            }
        });
    },

    getCollection: function() {
        jQuery.each(VIE.EntityManager.getByType('rdfcal:Vevent'), function() {
            if (this.id) {
                ViePalsu.DiscussionManager.collection = this.get('sioc:container_of');
            }
        });
        
        jQuery('[about="#post1"]').remove();

        ViePalsu.DiscussionManager.collection.bind('add', function(postInstance, collectionInstance, options) {
            if (!options.fromServer) {
                postInstance.save();
            }
        });
        
        ViePalsu.DiscussionManager.collection.comparator = function(item) {
            var itemIndex = 0;
            var itemDate = item.get('dc:created');
            if (typeof itemDate === 'undefined') {
                return -1;
            }
            var itemDate = new Date(itemDate);

            ViePalsu.DiscussionManager.collection.pluck('dc:created').forEach(function(date, index) {
                if (typeof date === 'undefined') {
                    return true;
                }
                if (itemDate.getTime() > new Date(date).getTime()) {
                    itemIndex = index + 1;
                }
            });
            return itemIndex;
        }
    }
};

jQuery(document).ready(function() {
    // Make all RDFa entities editable
    jQuery('[typeof]').each(function() {
        jQuery(this).vieSemanticAloha();
    });

    // Subscribe to the editable deactivated signal to update Backbone model
    VIE.EntityManager.entities.forEach(function(modelInstance) {
        if (typeof modelInstance.editables === 'undefined') {
            return true;
        }
        jQuery.each(modelInstance.editables, function() {
            var editableInstance = this;
            GENTICS.Aloha.EventRegistry.subscribe(editableInstance, 'editableDeactivated', function() {
                if (VIE.AlohaEditable.refreshFromEditables(modelInstance)) {
                    // There were changes, save
                    modelInstance.save();
                }
            });
        });
    });

    ViePalsu.DiscussionManager.initInput();
    ViePalsu.DiscussionManager.getCollection();
});
