if (typeof eu == "undefined") {
    var eu = {};
    
    if (typeof eu.iksproject == "undefined") {
        eu.iksproject = {};
    }
}

eu.iksproject.AnnotationPlugin = new GENTICS.Aloha.Plugin('iks_annotate');
//eu.iksproject.LoaderPlugin.loadAsset('iks_annotate', 'person', 'css');

eu.iksproject.AnnotationPlugin.languages = ['en', 'fi', 'fr'];

/**
 * Initialize the plugin, register the buttons
 */
eu.iksproject.AnnotationPlugin.init = function() {
	var that = this;
	
	this.initButtons();
};

eu.iksproject.AnnotationPlugin.initButtons = function() {
    var that = this;
	// the 'create person' button
	this.createPersonButton = new GENTICS.Aloha.ui.Button({
		'iconClass' : 'GENTICS_button GENTICS_button_addPerson',
		'size' : 'small',
		'tooltip' : this.i18n('button.person.tooltip'),
		'onclick' : function (element, event) {
		    
		    GENTICS.Aloha.FloatingMenu.userActivatedTab = that.i18n('floatingmenu.tab.iks_annotate_label');
            
			if (GENTICS.Aloha.activeEditable) {
				GENTICS.Aloha.activeEditable.obj[0].focus();
			}			
			var rangeObject = GENTICS.Aloha.Selection.rangeObject;

            /*
            // if selection is collapsed then extend to the word.
            if (range.isCollapsed() && extendToWord != false) {
                GENTICS.Utils.Dom.extendToWord(range);
            }
            if ( range.isCollapsed() ) {
                // insert a abbr with text here
                var abbrText = this.i18n('newabbr.defaulttext');
                var newAbbr = jQuery('<abbr title="">' + abbrText + '</abbr>');
                GENTICS.Utils.Dom.insertIntoDOM(newAbbr, range, jQuery(GENTICS.Aloha.activeEditable.obj));
                range.startContainer = range.endContainer = newAbbr.contents().get(0);
                range.startOffset = 0;
                range.endOffset = abbrText.length;
            } else {
                var newAbbr = jQuery('<abbr title=""></abbr>');
                GENTICS.Utils.Dom.addMarkup(range, newAbbr, false);
            }
            range.select();
            */
            that.labelField.focus();


			//var about_hash = $.md5(rangeObject.limitObject.innerText);
			//var about_hash = rangeObject.limitObject.innerText.replace(/(?![+-])[\W_]/g, "_");
			var about_hash = PseudoGuid.GetNew();
			var markup = jQuery('<span />').attr({
                'id': 'rdfa_' + about_hash + '',
			    'about': '[demo:' + about_hash + ']',
			    'typeof': 'foaf:Person',
			    'property': 'foaf:name'
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
            //var agent = "<http://demo.palsuapp.info/" + about_hash + ">";
            var agent = "<http://semantictweet.com/rene_kapusta/show>";
            var todo = "\"implement something cool\"";
            var targetDate = "\"2011-04-01\"^^xsd:date";
            var startDate = "\"2011-02-01\"^^xsd:date";
            
            var foaf_name = about_hash;
            
// onclick='annotateAsTask($("#task"), "<http://this.demo.eu/Thomas_Unknown>", "\"implement something cool\"", "\"2011-04-01\"^^xsd:date");$(this).attr("disabled", "disabled");'
//function annotateAsTask (elem, agent, todo, targetDate, startDate) {
                var x = $.rdf.blank('[]');
                elem.vie2().vie2('annotate',
                    [agent + ' a foaf:Person',
                    agent + ' foaf:name "' + foaf_name + '"']);
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
	
	// add the new scope for abbr
    GENTICS.Aloha.FloatingMenu.createScope(this.getUID('iks_annotate'), 'GENTICS.Aloha.continuoustext');
    
    this.labelField = new GENTICS.Aloha.ui.AttributeField({
    	'width':320
    });
    
    this.resourceField = new GENTICS.Aloha.ui.AttributeField({
    	'width':320
    });

    // add the input field 
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('iks_annotate'),
        this.labelField,
        this.i18n('floatingmenu.tab.iks_annotate_label'),
        1
    );
    
    /*
    // add the input field 
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('iks_annotate'),
        this.resourceField,
        this.i18n('floatingmenu.tab.iks_annotate_resource'),
        1
    );
    */
    
};

/*
http://semantictweet.com/rene_kapusta/show

var rdf = $.rdf().load(data, {});

var triple = $.rdf.triple(
  $.rdf.blank('_:book1'), 
  $.rdf.resource('ns:price', { namespaces: { ns: 'http://www.example.org/ns/' }}),
  $.rdf.literal(42))
  
span.rdfa(triple);
*/