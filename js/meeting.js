jQuery(document).ready(function() {
    
    var eventId = jQuery('body').attr('about');
    var taskCollection = VIE.EntityManager.getBySubject(eventId).get('rdfcal:hasTask');
    var mentionCollection = VIE.EntityManager.getBySubject(eventId).get('rdfcal:hasMention');

    // Remove participant placeholder
    jQuery('[typeof="foaf:Person"][about=""]').remove();

    // task added via aloha
    taskCollection.bind('add', function(task, task_list, options) {
        if (options.fromServer) {
            return;
        }

        if (task.id) {
            // Make the link work
            jQuery('[about="' + task.id + '"] a').attr('href', task.id);
            
            // move to function
            console.log('### complete status', task.get('rdfcal:completed'));
            if (task.get('rdfcal:completed') == 1 && task.id) {
                jQuery('[about="' + task.id + '"]').addClass('task_status_completed').removeClass('task_status_active');
            } else {
                jQuery('[about="' + task.id + '"]').addClass('task_status_active').removeClass('task_status_completed');
            }
            
            // move to function
            jQuery('[about="' + task.id + '"]').click(function() {
                var uuid = false;

                if (jQuery(this).attr('about')) {
                    uuid = jQuery(this).attr('about');
                }

                var data = VIE.EntityManager.getBySubject(uuid);
                var complete_status = data.get('rdfcal:completed');
                console.log(complete_status);
                if (complete_status == 1) {
                    jQuery('[about="' + uuid + '"]').addClass('task_status_active').removeClass('task_status_completed');
                    data.set({'rdfcal:completed':'0'});
                } else {
                    jQuery('[about="' + uuid + '"]').addClass('task_status_completed').removeClass('task_status_active');
                    data.set({'rdfcal:completed':'1'});
                }
                
                data.save();
            });
        }

        task.save();
    });

    // task added via aloha
    mentionCollection.bind('add', function(mention, mention_list, options) {
        if (options.fromServer) {
            return;
        }
        mention.save();
    });

    taskCollection.comparator = function(item) {
        return dateComparator(item, taskCollection);
    }

    // Go through the tasks
    taskCollection.forEach(function(task) {
        if (typeof task.id !== 'string') {
            taskCollection.remove(task);
            jQuery('[typeof="rdfcal\\:Task][about=""]').remove();
        }
        
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
        
        if (task.id) {
            // Make the link work
            jQuery('[about="' + task.id + '"] a').attr('href', task.id);
        }
    });

    // Go through the tasks and remove empty template
    mentionCollection.forEach(function(mention) {
        if (typeof mention.id !== 'string') {
            mentionCollection.remove(mention);
            jQuery('[typeof="rdfcal\\:Mention][about=""]').remove();
        }
    });

    // move to function -- see bind add for taskcollection
    jQuery('.task_complete_action').click(function() {
        var uuid = false;
        
        if (jQuery(this).parent().attr('about')) {
            uuid = jQuery(this).parent().attr('about');
        }
        
        var data = VIE.EntityManager.getBySubject(uuid);
        var complete_status = data.get('rdfcal:completed');

        if (complete_status == 1) {
            jQuery('[about="' + uuid + '"]').addClass('task_status_active').removeClass('task_status_completed');
            data.set({'rdfcal:completed':'0'});
        } else {
            jQuery('[about="' + uuid + '"]').addClass('task_status_completed').removeClass('task_status_active');
            data.set({'rdfcal:completed':'1'});
        }
        data.save();
    });
});
