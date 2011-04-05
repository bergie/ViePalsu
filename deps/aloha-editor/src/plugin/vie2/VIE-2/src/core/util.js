/**
 * @fileOverview VIE^2
 * @author <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
 */

// <code>removeElement(haystack, needle)</code><br />
// <i>returns</i> <strong>void</strong>
function removeElement (haystack, needle) {
	//First we check if haystack is indeed an array.
	if (jQuery.isArray(haystack)) {
		//iterate over the array and check for equality.
		jQuery.each(haystack, function (index) {
			if (haystack[index] === needle) {
				//remove the one element and
				haystack.splice(index, 1);
				//break the iteration.
				return false;
			}
		});
	}
};

var PseudoGuid = new (function() {
    this.empty = "VIE2-00000000-0000-0000-0000-000000000000";
    this.GetNew = function() {
        var fC = function() {
                return (((1 + Math.random()) * 0x10000)|0).toString(16).substring(1).toUpperCase();
        }
        return ("VIE2-" + fC() + fC() + "-" + fC() + "-" + fC() + "-" + fC() + "-" + fC() + fC() + fC());
    };
})();