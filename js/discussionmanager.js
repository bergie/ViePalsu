if (typeof ViePalsu === 'undefined') {
    ViePalsu = {};
}

ViePalsu.DiscussionManager = {
    defaultMessage: '<p>Write your message here</p>',

    initInput: function() {
        ViePalsu.DiscussionManager.chatInput = jQuery('#chat-input');

        ViePalsu.DiscussionManager.chatInput.html(ViePalsu.DiscussionManager.defaultMessage);
        ViePalsu.DiscussionManager.chatInputEditable = new GENTICS.Aloha.Editable(ViePalsu.DiscussionManager.chatInput);
		
		// editableDeactivated or smartContentChanged
        GENTICS.Aloha.EventRegistry.subscribe(ViePalsu.DiscussionManager.chatInputEditable, 'editableDeactivated', function() {
            if (!ViePalsu.DiscussionManager.chatInputEditable.isModified()){
                return true;
            }

            var newMessage = ViePalsu.DiscussionManager.chatInputEditable.getContents();
            if (!newMessage) {
                return true;
            }

            var date = new Date();
            ViePalsu.DiscussionManager.collection.add({
                // @todo dc:creator or foaf:nick and use session data...
                'dc:creator': jQuery('#username').text(),
                'dc:created': date.toISOString(),
                'sioc:content': newMessage
            });

            ViePalsu.DiscussionManager.chatInput.html(ViePalsu.DiscussionManager.defaultMessage);
        });

        GENTICS.Aloha.EventRegistry.subscribe(ViePalsu.DiscussionManager.chatInputEditable, 'editableActivated', function() {
            ViePalsu.DiscussionManager.chatInput.html('');
        });
    },

    getCollection: function() {
        var discussionContainer = jQuery('[typeof="sioc:Forum"]');

        discussionContainer.children('[about="#post1"]:first-child').hide();

        ViePalsu.DiscussionManager.collection = VIE.EntityManager.getBySubject('#meeting-comments').get('sioc:container_of');

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
    ViePalsu.DiscussionManager.initInput();
    ViePalsu.DiscussionManager.getCollection();
});
