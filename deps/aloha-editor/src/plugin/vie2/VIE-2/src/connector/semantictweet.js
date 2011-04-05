/**
 * @fileOverview VIE^2
 * @author <a href="mailto:rene@evo42.net">Rene Kapusta</a>
 */

//The semantictweet connector needs to be initialized like this:
//$.VIE2.getConnector('semantictweet').options({
//    "proxy_url" : "../utils/proxy/proxy.php"
//});
new Connector('semantictweet');

jQuery.VIE2.connectors['semantictweet'].query = function (uri, props, namespaces, callback) {
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
	if (!uri.match(/^http\:\/\/semantictweet.com\/.*/)) {
		jQuery.VIE2.log ("warn", "VIE2.Connector('" + this.id + "')", "Query does not support the given URI!");
		callback({});
		return;
	}
	
	//var url = uri.replace('resource', 'data') + ".jrdf";
	var url = uri;
	var c = function (u, ps, ns) {
		return function (data) {
			//initialize the returning object
			var ret = {};
			
			if (data && data.status === 200) {
				try {
					//var json = jQuery.parseJSON(data.responseText);
					var rdf_xml = data.responseText;
					if (rdf_xml) {
						var rdfc = jQuery.rdf().load(rdf_xml);
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
					jQuery.VIE2.log ("warn", "VIE2.Connector('semantictweet')", "Could not query for uri '" + uri + "' because of the following parsing error: '" + e.message + "'!");
				}
			}
			callback(ret);
		};
	}(uri, props, namespaces);
	
	this.querySemantictweet(url, c);
};

jQuery.VIE2.connectors['semantictweet'].querySemantictweet = function (url, callback) {
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