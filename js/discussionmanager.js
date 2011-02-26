if (typeof ViePalsu === 'undefined') {
    ViePalsu = {};
}

ViePalsu.DiscussionManager = {
    defaultMessage: '<p>Write your message here</p>',

    initInput: function() {
        ViePalsu.DiscussionManager.chatInput = jQuery('#chat-input');
        ViePalsu.DiscussionManager.chatInput.html(ViePalsu.DiscussionManager.defaultMessage);
        ViePalsu.DiscussionManager.chatInputEditable = new GENTICS.Aloha.Editable(ViePalsu.DiscussionManager.chatInput);

        GENTICS.Aloha.EventRegistry.subscribe(ViePalsu.DiscussionManager.chatInputEditable, 'editableDeactivated', function() {
            if (!ViePalsu.DiscussionManager.chatInputEditable.isModified()){
                return true;
            }

            ViePalsu.DiscussionManager.collection.add({
                'sioc:content': ViePalsu.DiscussionManager.chatInputEditable.getContents()
            });

            ViePalsu.DiscussionManager.chatInput.html(ViePalsu.DiscussionManager.defaultMessage);
        });
    },

    getCollection: function() {
        var discussionContainer = jQuery('[typeof="sioc:Forum"]');
        ViePalsu.DiscussionManager.collection = VIE.CollectionManager.getCollectionForContainer(discussionContainer);
        ViePalsu.DiscussionManager.collection.bind('add', function(postInstance, collectionInstance, options) {
            if (!options.fromServer) {
                postInstance.save();
            }
        });
        // TODO: Hide the example
    }
};

jQuery(document).ready(function() {
    ViePalsu.DiscussionManager.initInput();
    ViePalsu.DiscussionManager.getCollection();
});
