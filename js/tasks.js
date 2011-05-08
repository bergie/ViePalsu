jQuery(document).ready(function() {
    
    // remove empty todos
    jQuery('[typeof="rdfcal\\:Task][about=""]').remove();
    
    var eventCollection = VIE.EntityManager.getBySubject('m').get('rdfcal:has_component');
    console.log(eventCollection);
    
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
        if (this.attributes[2].nodeValue) {
            uuid = this.attributes[2].nodeValue;
        } else {
            uuid = null;
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
