// We need Aloha Editor
GENTICS_Aloha_base = '/deps/aloha-editor/src/';
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base + 'deps/jquery-1.4.2.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base + 'aloha.js" id="aloha-script-include"></script>');

// Aloha Editor plugins
GENTICS_Aloha_base_plugin_aloha = '/deps/aloha-editor/src/plugins/com.gentics.aloha.plugins.';
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin_aloha + 'Format/plugin.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin_aloha + 'Table/plugin.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin_aloha + 'List/plugin.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin_aloha + 'Link/plugin.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin_aloha + 'Link/LinkList.js"></script>');
//document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin_aloha + 'HighlightEditables/plugin.js"></script>');
//document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin_aloha + 'TOC/plugin.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin_aloha + 'Paste/plugin.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin_aloha + 'Paste/wordpastehandler.js"></script>');

// Custom plugins
GENTICS_Aloha_base_plugin = '/deps/aloha-editor/plugins/';
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin + 'paste/oembedpastehandler.js"></script>');


document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin + 'annotations/src/annotations.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin + 'annotations/src/lib/annotationservicemanager.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin + 'annotations/src/lib/annotationservice.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin + 'annotations/src/service/fise.js"></script>');


document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin + 'iks_annotate/src/iks_annotate.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin + 'iks_annotate/src/iks_friends_repository.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin + 'vie/src/vie-repository.js"></script>');
document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base_plugin + 'iks_annotate_task/src/iks_annotate_task.js"></script>');

// We need VIE
document.write('<script type="text/javascript" src="/js/underscore-min.js"></script>');
document.write('<script type="text/javascript" src="/js/backbone-min.js"></script>');
document.write('<script type="text/javascript" src="/js/vie.js"></script>');
document.write('<script type="text/javascript" src="/js/vie-aloha.js"></script>');

// And we need Socket.IO
document.write('<script type="text/javascript" src="/socket.io/socket.io.js"></script>');

// And other helper
document.write('<script type="text/javascript" src="/js/jquery.easydate-0.2.4.min.js"></script>');

var dateComparator = function(item, collection) {
    var itemIndex = 0;
    var itemDate = item.get('dc:created');
    if (typeof itemDate === 'undefined') {
        return -1;
    }
    itemDate = new Date(itemDate);

    collection.pluck('dc:created').forEach(function(date, index) {
        if (typeof date === 'undefined') {
            return true;
        }
        if (itemDate.getTime() > new Date(date).getTime()) {
            itemIndex = index + 1;
        }
    });
    return itemIndex;
};

jQuery(document).ready(function() {

    var socket = new io.Socket();
    socket.on('connect', function() {
        // Connected, send our username so server knows who is online
        socket.send(jQuery('#account').attr('about'));
    });
    socket.connect();
    socket.on('message', function(data){
        if (typeof data !== 'object') {
            // Textual data
            console.log("Got", data);
            return;
        }
        
        var inverseProperties = {
            'sioc:has_container': 'sioc:container_of',
            'rdfcal:attendeeOf': 'rdfcal:attendee',
            'rdfcal:taskOf': 'rdfcal:hasTask',
            'rdfcal:mentionOf': 'rdfcal:hasMention',
            'rdfcal:component': 'rdfcal:has_component'
        };
        
        var entity = VIE.EntityManager.getByJSONLD(data);
        _.each(inverseProperties, function(to, from) {
            var container = entity.get(from);
            if (!container) {
                return true;
            }
            container.each(function(containerEntity) {
                var containerInstance = containerEntity.get(to);
                if (!containerInstance) {
                    return true;
                }
                if (containerInstance.indexOf(entity) === -1) {
                    containerInstance.add(entity, {fromServer: true});
                }
            });
        });
    });

    // Implement our own Backbone.sync method
    Backbone.sync = function(method, model, options) {
		var json = model.toJSONLD();
		// @todo seems to be executed 2 times?!
		console.log(method, json);
		socket.send(json);
    };

    VIE.RDFaEntities.getInstances();
    
    //localStorage.removeItem('iks_friend_lookup');    
    var iks_friends = false;
    var r = new RegExp('', 'i');
	iks_friends = localStorage.getItem('iks_friend_lookup');
	iks_friends_datetime = localStorage.getItem('iks_friend_time');

    if (!iks_friends) {
	    var user_ids = GENTICS.Aloha.Repositories.iks_friends._getTwitterFriendIds();
	    console.log('look up my friends live');
	    var items = GENTICS.Aloha.Repositories.iks_friends._getTwitterUserDataBatch(GENTICS.Aloha.Repositories.iks_friends.user_ids, r);
	}
});
