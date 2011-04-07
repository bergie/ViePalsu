= VIE^2 =

== Building ==

Use 'ant clean && ant' in the main directory.

== Usage ==

Please have a look at ./demos/test.html for an examplified usage.

We need basically 4 parts to be imported into a web-application:

(1) 3rd party libs:

<!-- 3rd-party libs -->
<script type="text/javascript" src="../lib/jquery/1.4/jquery-1.4.4.min.js"></script>
<script type="text/javascript" src="../lib/jquery-ui/1.8/js/jquery.ui.widget.js"></script>
<script type="text/javascript" src="../lib/rdfquery/latest/jquery.rdfquery.rules.js"></script>
<script type="text/javascript" src="../lib/underscoreJS/underscore.js"></script>
<script type="text/javascript" src="../lib/backboneJS/backbone.js"></script>
<!-- VIE -->
<script type="text/javascript" src="../lib/vie/vie.js"></script>
		
(2) VIE^2:

(2.1) Either the full source code (developer):

<script type="text/javascript" src="../src/core/util.js"></script>
<script type="text/javascript" src="../src/core/core.js"></script>
<script type="text/javascript" src="../src/core/connector.js"></script>
<script type="text/javascript" src="../src/core/entity.js"></script>
<script type="text/javascript" src="../src/core/mapping.js"></script>

(2.2) Or the minimized version (production):

<script type="text/javascript" src="../dist/min/vie2-0.4.min.js"></script>

(3) The connectors to be used:

<script type="text/javascript" src="../src/connector/stanbol.js"></script>
<script type="text/javascript" src="../src/connector/rdfa.js"></script>

(4) The mappings to be used:

<script type="text/javascript" src="../src/mapping/entity.js"></script>
<script type="text/javascript" src="../src/mapping/person.js"></script>

Now we can enhance a certain DOM element via:

<script type="text/javascript">
	$(function () {
		var ns = {
			'google' : 'http://dbpedia.org/resource/',
			'dbpedia' : 'http://dbpedia.org/resource/',
			'dbprop' : 'http://dbpedia.org/property/',
			'dbonto' : 'http://dbpedia.org/ontology/',
			'rdf' : 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
			'rdfs' : 'http://www.w3.org/2000/01/rdf-schema#',
			'iks' : 'http://www.iks-project.eu/#',
			'fise' : 'http://fise.iks-project.eu/ontology/',
			'foaf' : 'http://xmlns.com/foaf/0.1/',
			'dc' : 'http://purl.org/dc/terms/',
			'geo' : 'http://www.w3.org/2003/01/geo/wgs84_pos#'
		};
	});

	//init VIE^2
	var span = $('#test').vie2({namespaces: ns});

	//bind to contextchanged event
	span
	.bind('vie2contextchanged', function () {
		var persons = $(this).vie2('filter', 'person');
		console.info(persons);
	});

	//start analysis and use callback function (same as using the event)
	.vie2('analyze', function () {
		var entities = $(this).vie2('filter', 'entity');
		console.info(entities);
	});
</script>