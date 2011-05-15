jQuery(document).ready(function() {
    
    // remove empty todos
    jQuery('[typeof="rdfcal\\:Task][about=""]').remove();
    
    var eventCollection = VIE.EntityManager.getBySubject('urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66').get('rdfcal:has_component');
    console.log('event collection', eventCollection);
    
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
        console.log('foreach item ' + event.id);
        
        event.get('rdfcal:hasTask').forEach(function(task) {
            console.log('status task ' + task.get('rdfcal:completed'));
            console.log('status id ' + task.id);
            
            task.bind('change', function(event, calendar, options) {
                // move to function
                if (task.get('rdfcal:completed') == 1 && task.id) {
                    jQuery('[about="' + task.id + '"]').addClass('task_status_completed').removeClass('task_status_active');
                } else {
                    jQuery('[about="' + task.id + '"]').addClass('task_status_active').removeClass('task_status_completed');
                }
            });
            
            // move to function
            if (task.get('rdfcal:completed') == 1 && task.id) {
                jQuery('[about="' + task.id + '"]').addClass('task_status_completed').removeClass('task_status_active');
            } else {
                jQuery('[about="' + task.id + '"]').addClass('task_status_active').removeClass('task_status_completed');
            }

            /*if (typeof task.id !== 'string') {
                eventCollection.remove(event);
                jQuery('[typeof="rdfcal\\:Task][about=""]').remove()
                return;
            }

            task.url = task.id;
            if (task.id.substr(0, 4) === 'urn:') {
                task.url = '/t/' + encodeURIComponent(task.id);
            }
            console.log('task url', task.url);
            jQuery('[about="' + task.id + '"] a').attr('href', task.url);*/
        });
        
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
        
    });
    

    jQuery('.task_complete_action').click(function() {
        var uuid = false;
        
        if (jQuery(this).attr('about')) {
            uuid = jQuery(this).attr('about');
        }
        console.log('### task complete: ' + uuid);
        
        var data = VIE.EntityManager.getBySubject(uuid);
        var complete_status = data.get('rdfcal:completed');
        console.log(complete_status);
        if (complete_status == 1) {
            jQuery(this).addClass('task_status_active').removeClass('task_status_completed');
            data.set({'rdfcal:completed':'0'});
        } else {
            jQuery(this).addClass('task_status_completed').removeClass('task_status_active');
            data.set({'rdfcal:completed':'1'});
        }
        data.save();
    });
});
