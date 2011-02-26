if (typeof ViePalsu === 'undefined') {
    ViePalsu = {};
}

ViePalsu.DiscussionManager = {
    initInput: function() {
        ViePalsu.DiscussionManager.chatInput = jQuery('#chat-input');
        ViePalsu.DiscussionManager.chatInput.html('<p>Write your message here</p>');
        ViePalsu.DiscussionManager.chatInputEditable = new GENTICS.Aloha.Editable(ViePalsu.DiscussionManager.chatInput);
    }
};

jQuery(document).ready(function() {
    ViePalsu.DiscussionManager.initInput();
});
