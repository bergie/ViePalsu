/**
 * @fileOverview VIE^2
 * @author <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
 */

// A <code>Mapping</code> provides functionality to map context knowledge
// to Backbone models

Mapping = function(id, types, defaultProps) {
	if (id === undefined) {
		throw "The mapping constructor needs an 'id'!";
	}
	if (typeof id !== 'string') {
		throw "The mapping constructor needs an 'id' of type 'string'!";
	}
	if (types === undefined) {
		throw "The mapping constructor needs 'types'!";
	}
	
	this.id = id;
	this.types = types;
	this.defaultProps = (defaultProps)? defaultProps : [];
	
	//automatically registers the mapping in VIE^2.
	jQuery.VIE2.registerMapping(this);
};