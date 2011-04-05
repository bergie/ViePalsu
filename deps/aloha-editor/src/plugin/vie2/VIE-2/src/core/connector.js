/**
 * @fileOverview VIE^2
 * @author <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
 */

// A connector has two main functionalities:

// 1. analyze: Analysis of the given object
// 2. query: Querying for properties
Connector = function(id, options) {
	
	if (id === undefined) {
		throw "The connector constructor needs an 'id'!";
	}
	
	if (typeof id !== 'string') {
		throw "The connector constructor needs an 'id' of type 'string'!";
	}
	
	this.id = id;
	this._options = (options)? options : {};
	
	jQuery.VIE2.registerConnector(this);
};

//setter and getter for options
Connector.prototype.options = function(values) {
	if (values) {
		//extend options
		jQuery.extend(true, this._options, values);
	} else {
		//get options
		return this._options;
	}
};

Connector.prototype.analyze = function (object, namespaces, callback) {
	jQuery.VIE2.log("info", "VIE2.Connector(" + this.id + ")#analyze()", "Not overwritten!");
	callback(jQuery.rdf());
};

Connector.prototype.query = function (uri, properties, namespaces, callback) {
	jQuery.VIE2.log("info", "VIE2.Connector(" + this.id + ")#query()", "Not overwritten!");
	callback({});
};

Connector.prototype.annotate = function (elem, triple, namespaces, callback) {
	jQuery.VIE2.log("info", "VIE2.Connector(" + this.id + ")#annotate()", "Not overwritten!");
	callback({});
};

Connector.prototype.remove = function (elem, triple, namespaces, callback) {
	jQuery.VIE2.log("info", "VIE2.Connector(" + this.id + ")#remove()", "Not overwritten!");
	callback({});
};
