/**
 * @fileOverview VIE^2
 * @author <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
 */

new Connector('rdfa');

jQuery.VIE2.connectors['rdfa'].analyze = function (object, namespaces, callback) {
	var rdf = jQuery.rdf({namespaces: namespaces});
	
	if (object === undefined) {
		jQuery.VIE2.log ("warn", "VIE2.Connector('" + this.id + "')#analyze()", "Given object is undefined!");
		callback(rdf);
	} else if (typeof object === 'object') {
		//does only work on objects that have the 'typeof' attribute set!
		if (object.attr('typeof')) {
			//use rdfQuery to analyze the object
			//RDF.add() is broken -> workaround!
			jQuery(object).rdf().databank.triples().each(function () {
				rdf.add(this);
			});
			
			callback(rdf);
		} else {
			jQuery.VIE2.log("info", "VIE2.Connector(" + this.id + ")#analyze()", "Object has no 'typeof' attribute! Trying to find children.");
			
			object.find('[typeof]').each(function(i, e) {
				var rdfa = jQuery(e).rdf();
				
				//RDF.add() is broken -> workaround!
				jQuery.each(rdfa.databank.triples(), function () {
					rdf.add(this);
				});
			});
			callback(rdf);
		}
	} else {
		jQuery.VIE2.log("error", "VIE2.Connector(" + this.id + ")#analyze()", "Expected object, found: '" + (typeof object) + "'");
		callback(rdf);
	}
};

jQuery.VIE2.connectors['rdfa'].annotate = function (elem, triple, namespaces, callback) {
	jQuery.VIE2.log("info", "VIE2.Connector(" + this.id + ")#annotate()", "Start annotation of object with triple.");
	jQuery(elem).rdfa(triple);
	
};

jQuery.VIE2.connectors['rdfa'].remove = function (elem, triple, namespaces, callback) {
	
	jQuery(elem).removeRdfa(triple);
	
};