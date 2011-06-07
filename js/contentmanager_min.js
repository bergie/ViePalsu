// We need Aloha Editor
GENTICS_Aloha_base = '/deps/aloha-editor/src';

document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base + '/dep/jquery-1.5.1.js"></script>');

document.write('<script type="text/javascript" src="' + GENTICS_Aloha_base + '/aloha.js" id="aloha-script-include" data-plugins="format,abbr,link,list,link"></script>');
document.write('<link href="' + GENTICS_Aloha_base + '/aloha.css" id="aloha-style-include" rel="stylesheet">');

// We need VIE
document.write('<script type="text/javascript" src="/js/underscore-min.js"></script>');
document.write('<script type="text/javascript" src="/js/backbone-min.js"></script>');
document.write('<script type="text/javascript" src="/js/vie.js"></script>');
document.write('<script type="text/javascript" src="/js/vie-aloha.js"></script>');

// And we need Socket.IO
document.write('<script type="text/javascript" src="/socket.io/socket.io.js"></script>');

/*
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
*/

jQuery(document).ready(function() {

    var socket = new io.Socket();
    socket.on('connect', function() {
        // Connected, send our username so server knows who is online
        socket.send(jQuery('#account').attr('about'));
    });
    socket.connect();
    
    /*socket.on('message', function(data){
        if (typeof data !== 'object') {
            // Textual data
            console.log("Got", data);
            return;
        }
        
        var inverseProperties = {
            'sioc:has_container': 'sioc:container_of',
            'rdfcal:attendeeOf': 'rdfcal:attendee',
            'rdfcal:taskOf': 'rdfcal:hasTask',
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
    });*/

    
    // Implement our own Backbone.sync method
    Backbone.sync = function(method, model, options) {
		var json = model.toJSONLD();
		// @todo seems to be executed 2 times?!
		console.log(method, json);
		socket.send(json);
    };

    //VIE.RDFaEntities.getInstances();
});
