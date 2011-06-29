jQuery(document).ready(function() {
    
    var eventCollection = VIE.EntityManager.getBySubject('urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66').get('rdfcal:has_component');
    eventCollection.bind('add', function(event, calendar, options) {
        if (options.fromServer) {
            return;
        }
        
        jQuery('div[property="mgd:agenda"]').slideUp();
        
        if (event.id) {
            // Make the link work
            jQuery('[about="' + event.id + '"] a').attr('href', event.id);
            jQuery('[about="' + event.id + '"] span[property="dc:created"]').remove()
            jQuery('[about="' + event.id + '"] abbr.easydate').attr('title', event.attributes['dc:created']);
            jQuery('[about="' + event.id + '"] .easydate').easydate();
            jQuery('[about="' + event.id + '"] div[property="mgd:agenda"]').slideDown();
            if(jQuery('[about="' + event.id + '"] div[property="mgd:agenda"]').text() == 'mgd:agenda') {
                jQuery('[about="' + event.id + '"] div[property="mgd:agenda"]').html('<p>No agenda defined.</p>');
            }
            
        }

        event.save();
    });
    
    eventCollection.comparator = function(item) {
        return dateComparator(item, eventCollection);
    }
    
    // Go through the meetings
    var mcounter = 0;
    eventCollection.forEach(function(event) {
        if (typeof event.id !== 'string') {
            eventCollection.remove(event);
            jQuery('[typeof="rdfcal\\:Vevent][about=""]').remove()
            mcounter = 0;
            return;
        }

        event.url = event.id;
        if (event.id.substr(0, 4) === 'urn:') {
            event.url = '/m/' + encodeURIComponent(event.id);
        }

        jQuery('[about="' + event.id + '"] a').attr('href', event.url);
        jQuery('[about="' + event.id + '"] span[property="dc:created"]').remove();
        
        jQuery('[about="' + event.id + '"] abbr.easydate').attr('title', event.attributes['dc:created']).click(function() {
            jQuery('[about="' + event.id + '"] div[property="mgd:agenda"]').slideToggle();
        });
        
        if(jQuery('[about="' + event.id + '"] div[property="mgd:agenda"]').text() == 'mgd:agenda') {
            jQuery('[about="' + event.id + '"] div[property="mgd:agenda"]').html('<p>No agenda defined.</p>');
        }
        
        // add details for latest meeting
        if (mcounter == 0) {            
            var latestEventCollection = VIE.EntityManager.getBySubject(event.id).get('mgd\\:agenda');
        } else {
            jQuery('[about="' + event.id + '"] div[property="mgd:agenda"]').hide();
        }
        mcounter++;
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
            'id': window.location.href + '/' + eventCollection.length
        });
        jQuery('#newevent').attr('value', '');
    });
    
    jQuery(".easydate").easydate();

});
