jQuery(document).ready(function() {
    var eventCollection = VIE.EntityManager.getBySubject('urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66').get('rdfcal:has_component');
    eventCollection.bind('add', function(event, calendar, options) {
        if (options.fromServer) {
            return;
        }

        if (event.id) {
            // Make the link work
            jQuery('[about="' + event.id + '"] a').attr('href', event.id);
        }
        event.save();
    });
    
    eventCollection.comparator = function(item) {
        return dateComparator(item, eventCollection);
    }
    
    // Go through the meetings
    eventCollection.forEach(function(event) {
        if (typeof event.id !== 'string') {
            eventCollection.remove(event);
            jQuery('[typeof="rdfcal\\:Vevent][about=""]').remove()
            return;
        }
                
        event.url = event.id;
        if (event.id.substr(0, 4) === 'urn:') {
            event.url = '/m/' + encodeURIComponent(event.id);
        }
        jQuery('[about="' + event.id + '"] a').attr('href', event.url);

        if (event.attributes['mgd:agenda'] == 'mgd:agenda') {
            jQuery('[about="' + event.id + '"] div[property="mgd\\:agenda"]').remove();
            return;
        }
    });

    jQuery('#eventadd').click(function() {
        var eventTitle = jQuery('#newevent').attr('value');
        if (!eventTitle) {
            return;
        }
        var date = new Date();
        eventCollection.add({
            'mgd:agenda': 'Write your agenda here.',
            'rdfcal:summary': eventTitle,
            'dc:created': date.toISOString(),
            'id': window.location.href + '/' + eventCollection.length
        });
        console.log('add new event: ' + window.location.href + '/' + eventCollection.length);
        jQuery('#newevent').attr('value', '');
    });
});