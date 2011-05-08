jQuery(document).ready(function() {
    $("#rdfcal_startDate").datepicker({ dateFormat: 'yy-mm-dd' });
    $("#rdfcal_targetDate").datepicker({ dateFormat: 'yy-mm-dd' });
    
    var participants = jQuery(".persons li");
    var values = [];
    var options = $("#rdfcal_hasAgent");

    participants.each(function() {
        values.push([{'v': this.attributes[2].nodeValue, 'n': this.textContent}]);
    });
    
    jQuery.each(values, function(index, item) {
        options.append($("<option />").val(item[0].v).text(item[0].n));
    });
    
    var eventId = jQuery('body').attr('about');
    console.log('### eventId: ' + eventId);
    var taskCollection = VIE.EntityManager.getBySubject(eventId).get('rdfcal:hasTask');
    console.log(taskCollection);

    taskCollection.bind('add', function(event, task_list, options) {
        if (!options.fromServer) {
            event.save();
        }
    });

    taskCollection.comparator = function(item) {
        return dateComparator(item, taskCollection);
    }

    // Go through the tasks
    taskCollection.forEach(function(task) {
        //if (typeof task.id !== 'string') {
        if (task.id.length < 1) {
            taskCollection.remove(task);
            jQuery('[typeof="rdfcal\\:Vevent][about=""]').remove();
            return;
        }
        
        task.bind('change', function(event, calendar, options) {
            // move to function
            if (task.get('rdfcal:completed') == 1 && task.id) {
                jQuery('[about="' + task.id + '"]').addClass('task_status_completed').removeClass('task_status_active');
            } else {
                jQuery('[about="' + task.id + '"]').addClass('task_status_active').removeClass('task_status_completed');
            }
        });
        
        console.log(jQuery('[about="' + task.id + '"]'));
        console.log('task', task);
        console.log('t id', task.id);
        console.log('completed', task.get('rdfcal:completed'));
        console.log('rdfcal:hasAgent', task.get('rdfcal:hasAgent'));
        console.log('rdfcal:name', task.get('rdfcal:name'));
        console.log('rdfcal:targetDate', task.get('rdfcal:targetDate'));
        
        // move to function
        if (task.get('rdfcal:completed') == 1 && task.id) {
            jQuery('[about="' + task.id + '"]').addClass('task_status_completed').removeClass('task_status_active');
        } else {
            jQuery('[about="' + task.id + '"]').addClass('task_status_active').removeClass('task_status_completed');
        }
    });

    jQuery('#taskadd').click(function() {
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
        taskCollection.add({
            'rdfcal:name': rdfcal_name,
            'rdfcal:hasAgent': rdfcal_hasAgent,
            'foaf:name': rdfcal_hasAgentName,
            'rdfcal:startDate': date.toISOString(),
            'rdfcal:targetDate': rdfcal_targetDate,
            'rdfcal:completed': rdfcal_completed,
            'dc:created': date.toISOString()
        });

        console.log('OK: added task ' + rdfcal_name + ' for user ' + rdfcal_hasAgent + '.');

        jQuery('#rdfcal_name').attr('value', '');
        jQuery('#rdfcal_startDate').attr('value', '');
        jQuery('#rdfcal_targetDate').attr('value', '');
    });

    jQuery('.task_complete_action').click(function() {
        
        var uuid = false;
        
        if (jQuery(this).attr('about')) {
            uuid = jQuery(this).attr('about');
        }
        
        console.log('### task complete: ' + uuid);
        
        var data = VIE.EntityManager.getBySubject(uuid);
        console.log('task data', data);
        
        if (!data) {
            console.log('### ERROR task complete');
        }
        
        var complete_status = data.get('rdfcal:completed');
        console.log('complete_status', complete_status);
        if (complete_status == 1) {
            jQuery(this).addClass('task_status_active').removeClass('task_status_completed');
            data.set({'rdfcal:completed':'0'});
            console.log('set completed satus to 1');
        } else {
            jQuery(this).addClass('task_status_completed').removeClass('task_status_active');
            data.set({'rdfcal:completed':'1'});
            console.log('set completed satus to 1');
        }
        data.save();
    });
});
