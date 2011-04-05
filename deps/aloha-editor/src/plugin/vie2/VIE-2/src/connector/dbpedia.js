/**
 * @fileOverview VIE^2
 * @author <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
 */

//The dbpedia connector needs to be initialized like this:
//$.VIE2.getConnector('dbpedia').options({
//    "proxy_url" : "../utils/proxy/proxy.php"
//});
new Connector('dbpedia');

jQuery.VIE2.connectors['dbpedia'].query = function (uri, props, namespaces, callback) {
	if (uri instanceof jQuery.rdf.resource &&
			uri.type === 'uri') {
		this.query(uri.toString(), props, namespaces, callback);
		return;
	}
	if (!jQuery.isArray(props)) {
		return this.query(uri, [props], namespaces, callback);
		return;
	}
	if ((typeof uri != 'string')) {
		jQuery.VIE2.log ("warn", "VIE2.Connector('" + this.id + "')", "Query does not support the given URI!");
		callback({});
		return;
	}
	var uri = uri.replace(/^</, '').replace(/>$/, '');
	if (!uri.match(/^http\:\/\/dbpedia.org\/.*/)) {
		jQuery.VIE2.log ("warn", "VIE2.Connector('" + this.id + "')", "Query does not support the given URI!");
		callback({});
		return;
	}
	
	var url = uri.replace('resource', 'data') + ".jrdf";
	var c = function (u, ps, ns) {
		return function (data) {
			//initialize the returning object
			var ret = {};
			
			if (data && data.status === 200) {
				try {
					var json = jQuery.parseJSON(data.responseText);
					if (json) {
						var rdfc = jQuery.rdf().load(json);
						jQuery.each(ns, function(k, v) {
							rdfc.prefix(k, v);
						});
						
						for (var i=0; i < ps.length; i++) {
							var prop = props[i].toString();
							ret[prop] = [];
							
							rdfc
							.where(jQuery.rdf.pattern('<' + u + '>', prop, '?object', { namespaces: ns}))
							.each(function () {
								ret[prop].push(this.object);
							});
						}
					}
				} catch (e) {
					jQuery.VIE2.log ("warn", "VIE2.Connector('dbpedia')", "Could not query for uri '" + uri + "' because of the following parsing error: '" + e.message + "'!");
				}
			}
			callback(ret);
		};
	}(uri, props, namespaces);
	
	this.queryDBPedia(url, c);
};

jQuery.VIE2.connectors['dbpedia'].queryDBPedia = function (url, callback) {
	var proxy = this.options().proxy_url;
	
	if (proxy) {
		jQuery.ajax({
			async: true,
			complete : callback,
			type: "POST",
			url: proxy,
			data: {
    			proxy_url: url, 
    			content: "",
    			verb: "GET"
			}
		});
	} else {
		data = jQuery.ajax({
			async: true,
			complete : callback,
			type: "GET",
			'url': url
		});
	}
};