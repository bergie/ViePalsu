if (typeof eu == "undefined") {
    var eu = {};
    
    if (typeof eu.iksproject == "undefined") {
        eu.iksproject = {};
    }
}

eu.iksproject.PersonPlugin = new GENTICS.Aloha.Plugin('iks_annotate');
//eu.iksproject.LoaderPlugin.loadAsset('iks_annotate', 'person', 'css');

eu.iksproject.PersonPlugin.languages = ['en', 'fi', 'fr'];

/**
 * Initialize the plugin, register the buttons
 */
eu.iksproject.PersonPlugin.init = function() {
	var that = this;
	
	this.initButtons();
};

eu.iksproject.PersonPlugin.initButtons = function() {
	// the 'create person' button
	this.createPersonButton = new GENTICS.Aloha.ui.Button({
		'iconClass' : 'GENTICS_button GENTICS_button_addPerson',
		'size' : 'small',
		'tooltip' : this.i18n('button.person.tooltip'),
		'onclick' : function (element, event) {
			if (GENTICS.Aloha.activeEditable) {
				GENTICS.Aloha.activeEditable.obj[0].focus();
			}			
			var rangeObject = GENTICS.Aloha.Selection.rangeObject;


			//var about_hash = $.md5(rangeObject.limitObject.innerText);
			var about_hash = rangeObject.limitObject.innerText.replace(/(?![+-])[\W_]/g, "_");
			var markup = jQuery('<span />').attr({
                'id': 'rdfa_' + about_hash + '',
			/*    'about': '[demo:' + about_hash + ']',
			    'typeof': 'foaf:Person',
			    'property': 'foaf:name'*/
			});
			
			// jQuery.rdf.annotate
			
            var selection = rangeObject.getSelectionTree();
			// add the markup
			GENTICS.Utils.Dom.addMarkup(rangeObject, markup);
            // select the modified range
			rangeObject.select();
/*
			var about_hash = rangeObject.limitObject.innerText.replace(/(?![+-])[\W_]/g, "_");
			var markup = jQuery('<span />').attr({
			    'id': 'rdfa_' + about_hash + ''});
            var selection = rangeObject.getSelectionTree();
			// add the markup
			GENTICS.Utils.Dom.addMarkup(rangeObject, markup);
*/

			// select the modified range
			var elem = $("#rdfa_" + about_hash);
            var agent = "<http://demo.palsuapp.info/Thomas_Unknown>";
            var todo = "\"implement something cool\"";
            var targetDate = "\"2011-04-01\"^^xsd:date";
            var startDate = "\"2011-02-01\"^^xsd:date";
            
// onclick='annotateAsTask($("#task"), "<http://this.demo.eu/Thomas_Unknown>", "\"implement something cool\"", "\"2011-04-01\"^^xsd:date");$(this).attr("disabled", "disabled");'
//function annotateAsTask (elem, agent, todo, targetDate, startDate) {
                var x = $.rdf.blank('[]');
                elem.vie2().vie2('annotate',
                    [agent + ' a foaf:Person',
                    agent + ' foaf:name "hans wurst"']);
                elem.vie2().vie2('annotate',
                  [
                  x + ' a rdfcal:Task',
                  x + ' rdfcal:hasAgent ' + ((agent === '' || agent === undefined)? '[]' : agent),
                  x + ' rdfcal:name ' + ((todo === '' || todo === undefined)? '' : todo),
                  x + ' rdfcal:startDate ' + ((startDate === '' || startDate === undefined)? '\"now\"' : startDate), //TODO: figure out how to write proper date
                  x + ' rdfcal:targetDate ' + ((targetDate === '' || targetDate === undefined)? '\"tonight\"' : targetDate) //TODO: figure out how to write proper date
                  ]);

			return false;
		}
	});

	// add to floating menu
	GENTICS.Aloha.FloatingMenu.addButton(
		'GENTICS.Aloha.continuoustext',
		this.createPersonButton,
		this.i18n('tab.annotations'),
		1
	);	
};
