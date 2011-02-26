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

            var newMessage = ViePalsu.DiscussionManager.chatInputEditable.getContents();
            if (!newMessage) {
                return true;
            }

            ViePalsu.DiscussionManager.collection.add({
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
