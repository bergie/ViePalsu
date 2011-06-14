/* placeholder */
jQuery(document).ready(function() {
    
    // Make RDFa entities editable on double click
    jQuery('[about]').each(function() {
        var subject = VIE.RDFa.getSubject(jQuery(this));
        jQuery('[property]', this).click(function() {
            if (subject !== VIE.RDFa.getSubject(jQuery(this))) {
                return true;
            }
            jQuery(this).vieSemanticAloha();
            var modelInstance = VIE.EntityManager.getBySubject(subject);
            //console.log(modelInstance);
            
            // Subscribe to the editable deactivated signal to update Backbone model
            jQuery.each(modelInstance.editables, function() {
                var editableInstance = this;
                GENTICS.Aloha.EventRegistry.subscribe(editableInstance, 'editableDeactivated', function() {
                    if (VIE.AlohaEditable.refreshFromEditables(modelInstance)) {
                        // There were changes, save
                        modelInstance.save();
                        //use VIE^2 to analyze the text
                        /*$('.message').vie2().vie2('analyze', function (status) {
                            if (status === 'ok') {
                                console.log("Success 2!");
                            }
                        });*/
                    }
                });
            });
        });
    });
                    
    var taskId = jQuery('body').attr('about');
    console.log('### taskId: ' + taskId);
    //var taskCollection = VIE.EntityManager.getBySubject(taskId);
    //console.log(taskCollection);
    
    //var taskCollection = VIE.EntityManager.getBySubject('http://evo42.local:8001/m/1').get('rdfcal:hasTask');
    //console.log('task collection', taskCollection);
});