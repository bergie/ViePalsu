jQuery(document).ready(function() {
    // Load all RDFa entities from the page
    VIE.RDFaEntities.getInstances();
    
    // Go through the meetings
    jQuery.each(VIE.EntityManager.getByType('cal:Vevent'), function() {
        var event = this;
        jQuery('[about="' + event.id + '"] a').attr('href', '/meeting/' + event.id);
    });
});
