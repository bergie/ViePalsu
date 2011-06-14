jQuery(document).ready(function() {
    //$("#rdfcal_startDate").datepicker({ dateFormat: 'yy-mm-dd' });
    //$("#rdfcal_targetDate").datepicker({ dateFormat: 'yy-mm-dd' });
    
    //var participants = jQuery(".persons li");
    //var values = [];
    //var options = $("#rdfcal_hasAgent");
    
    /*participants.each(function() {
        // @todo use jquery here 
        values.push([{'v': this.attributes[2].nodeValue, 'n': this.textContent}]);
    });
    
    jQuery.each(values, function(index, item) {
        options.append($("<option />").val(item[0].v).text(item[0].n));
    });*/
    
    var eventId = jQuery('body').attr('about');
    console.log('### eventId: ' + eventId);
    var taskCollection = VIE.EntityManager.getBySubject(eventId).get('rdfcal:hasTask');
    console.log('taskCollection', taskCollection);
    var mentionCollection = VIE.EntityManager.getBySubject(eventId).get('rdfcal:hasMention');
    console.log('mentionCollection', mentionCollection);

    // Remove participant placeholder
    //console.log(jQuery('[rel="rdfcal:attendee"] li[about=""]'));
    //jQuery('[rel="rdfcal:attendee"] li [about=""]').remove();
    //console.log(jQuery('[typeof="foaf:Person"][about=""]'));
    jQuery('[typeof="foaf:Person"][about=""]').remove();

    // task added via aloha
    taskCollection.bind('add', function(task, task_list, options) {
        if (options.fromServer) {
            return;
        }
        console.log('task id after add', task.id);
        console.log('task data', task);
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

                console.log('### task complete 2: ' + uuid);

                var data = VIE.EntityManager.getBySubject(uuid);
                var complete_status = data.get('rdfcal:completed');
                console.log(complete_status);
                if (complete_status == 1) {
                    //jQuery(this).addClass('task_status_active').removeClass('task_status_completed');
                    jQuery('[about="' + uuid + '"]').addClass('task_status_active').removeClass('task_status_completed');
                    data.set({'rdfcal:completed':'0'});
                } else {
                    //jQuery(this).addClass('task_status_completed').removeClass('task_status_active');
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
        console.log('mention id after add', mention.id);
        console.log('mention data', mention);
        if (mention.id) {
            // Make the link work
            jQuery('[about="' + mention.id + '"] a').attr('href', mention.id);
            
            /*// move to function
            console.log('### complete status', mention.get('rdfcal:completed'));
            if (mention.get('rdfcal:completed') == 1 && mention.id) {
                jQuery('[about="' + mention.id + '"]').addClass('mention_status_completed').removeClass('mention_status_active');
            } else {
                jQuery('[about="' + mention.id + '"]').addClass('mention_status_active').removeClass('mention_status_completed');
            }
            
            // move to function
            jQuery('[about="' + mention.id + '"]').click(function() {
                var uuid = false;

                if (jQuery(this).attr('about')) {
                    uuid = jQuery(this).attr('about');
                }

                console.log('### mention complete 2: ' + uuid);

                var data = VIE.EntityManager.getBySubject(uuid);
                var complete_status = data.get('rdfcal:completed');
                console.log(complete_status);
                if (complete_status == 1) {
                    //jQuery(this).addClass('mention_status_active').removeClass('mention_status_completed');
                    jQuery('[about="' + uuid + '"]').addClass('mention_status_active').removeClass('mention_status_completed');
                    data.set({'rdfcal:completed':'0'});
                } else {
                    //jQuery(this).addClass('mention_status_completed').removeClass('mention_status_active');
                    jQuery('[about="' + uuid + '"]').addClass('mention_status_completed').removeClass('mention_status_active');
                    data.set({'rdfcal:completed':'1'});
                }
                
                data.save();
            });*/
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
            //jQuery('[typeof="rdfcal\\:Vevent][about=""]').remove();
            //return;
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
            //return;
        }
        
    });
    
    /*jQuery('#taskadd').click(function() {
        var rdfcal_name = jQuery('#rdfcal_name').attr('value');
        var rdfcal_hasAgent = jQuery('#rdfcal_hasAgent option:selected').attr('value');
        var rdfcal_hasAgentName = jQuery('#rdfcal_hasAgent option:selected').text();
        var rdfcal_startDate = jQuery('#rdfcal_startDate').attr('value');
        var rdfcal_targetDate = jQuery('#rdfcal_targetDate').attr('value');
        if (jQuery('#rdfcal_completed').attr('checked')) {
            var rdfcal_completed = 1
        } else {
            var rdfcal_completed = 0;
        }
        
        if (!rdfcal_name && !rdfcal_hasAgent) {
            console.log('Error: no rdfcal:name or rdfcal:hasAgent value');
            return;
        }

        var date = new Date();
        // not working with /t/N -- taskCollection.length is per meeting
        var urlId = window.location.protocol + "//" + window.location.host + "/t/" + taskCollection.length + location.pathname.replace(/\//g, '');
        taskCollection.add({
            'rdfcal:name': rdfcal_name,
            'rdfcal:hasAgent': rdfcal_hasAgent,
            'foaf:name': rdfcal_hasAgentName,
            'rdfcal:startDate': rdfcal_startDate,
            'rdfcal:targetDate': rdfcal_targetDate,
            'rdfcal:completed': rdfcal_completed,
            'dc:created': date.toISOString(),
            'id': urlId
        });

        console.log('meeting.js OK: added task ' + rdfcal_name + ' for user ' + rdfcal_hasAgent + ' with id ' + urlId + '.');

        jQuery('#rdfcal_name').attr('value', '');
        jQuery('#rdfcal_startDate').attr('value', '');
        jQuery('#rdfcal_targetDate').attr('value', '');
    });
    */
    
    // move to function -- see bind add for taskcollection
    jQuery('.task_complete_action').click(function() {
        var uuid = false;
        
        if (jQuery(this).parent().attr('about')) {
            uuid = jQuery(this).parent().attr('about');
        }

        console.log('### task complete 1: ' + uuid);
        
        var data = VIE.EntityManager.getBySubject(uuid);
        var complete_status = data.get('rdfcal:completed');
        console.log(complete_status);
        console.log(jQuery('[about="' + uuid + '"]'));

        if (complete_status == 1) {
            //jQuery(this).addClass('task_status_active').removeClass('task_status_completed');
            jQuery('[about="' + uuid + '"]').addClass('task_status_active').removeClass('task_status_completed');
            data.set({'rdfcal:completed':'0'});
        } else {
            //jQuery(this).addClass('task_status_completed').removeClass('task_status_active');
            jQuery('[about="' + uuid + '"]').addClass('task_status_completed').removeClass('task_status_active');
            data.set({'rdfcal:completed':'1'});
        }
        data.save();
    });
});
