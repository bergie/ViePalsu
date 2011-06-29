jQuery(document).ready(function() {
    // remove empty todos
    jQuery('[typeof="rdfcal\\:Task][about=""]').remove();
    
    var eventCollection = VIE.EntityManager.getBySubject('urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66').get('rdfcal:has_component');    
    eventCollection.bind('add', function(event, calendar, options) {
        
        if (options.fromServer) {
            return;
        }

        if (event.id) {
            // Make the link work
            jQuery('[about="' + event.id + '"] a').attr('href', event.id);
            jQuery('[about="' + event.id + '"] table').show();
            
            jQuery('.task_complete_action').click(function() {
                var uuid = false;

                if (jQuery(this).attr('about')) {
                    uuid = jQuery(this).attr('about');
                }
                console.log('### task complete: ' + uuid);

                var data = VIE.EntityManager.getBySubject(uuid);
                var complete_status = data.get('rdfcal:completed');
                console.log('status', complete_status);
                if (complete_status == 1) {
                    jQuery(this).addClass('task_status_active').removeClass('task_status_completed');
                    data.set({'rdfcal:completed':'0'});
                } else {
                    jQuery(this).addClass('task_status_completed').removeClass('task_status_active');
                    data.set({'rdfcal:completed':'1'});
                }
                data.save();
            });
            
        }

        event.save();
    });
    
    eventCollection.comparator = function(item) {
        return dateComparator(item, eventCollection);
    }
    
    // Go through the meetings
    eventCollection.forEach(function(event) {
        
        event.get('rdfcal:hasTask').forEach(function(task) {
            
            task.bind('change', function(event, calendar, options) {
                // move to function
                if (task.get('rdfcal:completed') == 1 && task.id) {
                    jQuery('[about="' + task.id + '"]').addClass('task_status_completed').removeClass('task_status_active');
                } else {
                    jQuery('[about="' + task.id + '"]').addClass('task_status_active').removeClass('task_status_completed');
                }
                
            });
            
            // hide empty tables
            //console.log(jQuery('[about="' + event.id + '"] tbody tr').length);
            if (jQuery('[about="' + event.id + '"] tbody tr').length < 1) {
                jQuery('[about="' + event.id + '"] table').hide();
                jQuery('[about="' + event.id + '"]').append('<div class="no_tasks_info"><p class="info">No Tasks available.</p></div>');
            }

            if (jQuery('[about="' + event.id + '"] [property="foaf:name"]').text() == 'foaf:name') {
                jQuery('[about="' + event.id + '"] table').hide();
                jQuery('[about="' + event.id + '"]').append('<div class="no_tasks_info"><p class="info">No Tasks available.</p></div>');
            }            
            
            // add edit link target
            jQuery('[about="' + task.id + '"] a.edit_action').attr('href', task.id);
                        
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

        jQuery('[about="' + event.id + '"] a.event').attr('href', event.url);
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
    
    jQuery('.edit_action').click(function(e) {
        e.stopPropagation();
    });
    
    // filtering via jquery    
    jQuery('.task_filter_my_tasks_action').click(function() {
        jQuery('.task_filter_all_tasks_action').show();
        jQuery('.task_filter_my_tasks_action').hide();
        jQuery('.task_filter_all_status_action').addClass('selected');
        jQuery('.task_filter_open_status_action').removeClass('selected');
        jQuery('.task_filter_completed_status_action').removeClass('selected');
        
        var agent = jQuery('#account').attr('about');
        jQuery('[property="rdfcal:hasAgent"]').each(function(index, value) {
            if (jQuery(this).attr('content') != agent) {
                jQuery(this).parents('tr').fadeOut();
            }
        });
    });
    
    jQuery('.task_filter_all_tasks_action').click(function() {
        jQuery('.task_filter_my_tasks_action').show();
        jQuery('.task_filter_all_tasks_action').hide();
        jQuery('.task_filter_all_status_action').addClass('selected');
        jQuery('.task_filter_open_status_action').removeClass('selected');
        jQuery('.task_filter_completed_status_action').removeClass('selected');
        
        jQuery('[property="rdfcal:hasAgent"]').each(function(index, value) {
            if (jQuery(this).attr('content') != '' || jQuery(this).attr('content') != 'rdfcal:hasAgent') {
                jQuery(this).parents('tr').fadeIn();
            }
        });
    });
    
    jQuery('.task_filter_all_status_action').click(function() {
        jQuery('.task_filter_all_status_action').addClass('selected');
        jQuery('.task_filter_open_status_action').removeClass('selected');
        jQuery('.task_filter_completed_status_action').removeClass('selected');
        
        jQuery('[property="rdfcal:completed"]').each(function(index, value) {
            if (jQuery(this).attr('content') != '' || jQuery(this).attr('content') != 'rdfcal:completed') {
                jQuery(this).parents('tr').fadeIn();
            }
        });

        _cleanUpTaskTable();

    });
    
    jQuery('.task_filter_completed_status_action').click(function() {
        jQuery('.task_filter_completed_status_action').addClass('selected');
        jQuery('.task_filter_all_status_action').removeClass('selected');
        jQuery('.task_filter_open_status_action').removeClass('selected');
        
        jQuery('[property="rdfcal:completed"]').each(function(index, value) {
            if (jQuery(this).attr('content') == '1') {
                jQuery(this).parents('tr').fadeIn();
            }
            if (jQuery(this).attr('content') == '0') {
                jQuery(this).parents('tr').hide();
            }
        });
        
        _cleanUpTaskTable();
    });
    
    jQuery('.task_filter_open_status_action').click(function() {
        jQuery('.task_filter_open_status_action').addClass('selected');
        jQuery('.task_filter_all_status_action').removeClass('selected');
        jQuery('.task_filter_completed_status_action').removeClass('selected');
        
        jQuery('[property="rdfcal:completed"]').each(function(index, value) {
            if (jQuery(this).attr('content') == '0') {
                jQuery(this).parents('tr').fadeIn();
            }
            if (jQuery(this).attr('content') == '1') {
                jQuery(this).parents('tr').hide();
            }
        });
        
        _cleanUpTaskTable();
    });
    
    // default
    jQuery('.task_filter_all_tasks_action').hide();
    jQuery('.task_filter_all_status_action').addClass('selected');
});

function _cleanUpTaskTable() {
    
    var r = new RegExp('http://', 'i');
    
    jQuery('table.datagrid').each(function(index, value) {
        if (jQuery(this)) {
            //if (!jQuery(this).find('tbody > tr').attr('about') || jQuery(this).find('tbody > tr:visible').length < 1 || !jQuery(this).find('tbody > tr').attr('about').match(r)) {
            if (!jQuery(this).find('tbody > tr').attr('about') || !jQuery(this).find('tbody > tr').attr('about').match(r)) {
                jQuery(this).hide();
                //jQuery(this).after('<div class="no_tasks_info"><p class="info">No Tasks available.</p></div>');
            }
        }
    });
}
