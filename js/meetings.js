jQuery(document).ready(function() {
    
    var eventCollection = VIE.EntityManager.getBySubject('urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66').get('rdfcal:has_component');
    eventCollection.bind('add', function(event, calendar, options) {
        if (!options.fromServer) {
            event.save();
        }
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
        jQuery('[about="' + event.id + '"] a').attr('href', '/meeting/' + event.id);
    });
    
    jQuery('#eventadd').click(function() {
        var eventTitle = jQuery('#newevent').attr('value');
        if (!eventTitle) {
            return;
        }
        var date = new Date();
        eventCollection.add({
            'rdfcal:summary': eventTitle,
            'dc:created': date.toISOString(),
        });
        jQuery('#newevent').attr('value', '');
    });

});
