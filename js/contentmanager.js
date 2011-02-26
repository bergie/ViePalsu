// We need Aloha Editor
GENTICS_Aloha_base = 'http://aloha-editor.org/aloha-0.9.3/aloha/';
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base + 'aloha.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base + 'plugins/com.gentics.aloha.plugins.Format/plugin.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base + 'plugins/com.gentics.aloha.plugins.HighlightEditables/plugin.js"></script>');

// We need VIE
document.write('<script type="text/javascript" src="/js/underscore-min.js"></script>');
document.write('<script type="text/javascript" src="/js/backbone-min.js"></script>');
document.write('<script type="text/javascript" src="/js/vie-containermanager.js"></script>');
document.write('<script type="text/javascript" src="/js/vie-collectionmanager.js"></script>');
document.write('<script type="text/javascript" src="/js/vie-aloha.js"></script>');

// And we need Socket.IO
document.write('<script type="text/javascript" src="/socket.io/socket.io.js"></script>');

jQuery(document).ready(function() {

    var socket = new io.Socket(); 
    socket.connect();
    socket.on('connect', function(){ 
        socket.send('Ping'); 
    }) 
    socket.on('message', function(data){
        if (typeof data !== 'object') {
            // Textual data
            console.log("Got", data);
            return;
        }

        if (data['@'] !== '<undefined>') {
            // Update to existing instance
            var documentId = data['@'].substring(1, data['@'].length - 1);
            var messageObject = VIE.ContainerManager.instanceSingletons[documentId];
            messageObject.set(data);
            return;
        }

        if (data['a'] == 'sioc:Post') {
            ViePalsu.DiscussionManager.collection.add(data, {fromServer: true});
        }
    });

    // Implement our own Backbone.sync method
    Backbone.sync = function(method, model, options) {
        var json = model.toJSONLD();
        socket.send(json);
    };

    // Make all RDFa entities editable
    jQuery('[typeof][about]').each(function() {
        jQuery(this).vieSemanticAloha();
    });

    // Subscribe to the editable deactivated signal to update Backbone model
    jQuery.each(VIE.ContainerManager.instances, function() {
        var modelInstance = this;
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
});
