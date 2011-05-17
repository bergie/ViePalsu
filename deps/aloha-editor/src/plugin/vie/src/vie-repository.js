/**
 * Create the Repositories object. Namespace for Repositories
 * @hide
 */
if (!GENTICS.Aloha.Repositories)
{
    GENTICS.Aloha.Repositories = {};
}

/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Repositories.vie = new GENTICS.Aloha.Repository('vie');

GENTICS.Aloha.Repositories.vie.settings.type = 'foaf:Person';
GENTICS.Aloha.Repositories.vie.settings.labelpredicate = 'foaf:name';

GENTICS.Aloha.Repositories.vie.init = function() {
};

/**
 * Searches a repository for items matching query if objectTypeFilter.
 * If none found it returns null.
 */
GENTICS.Aloha.Repositories.vie.query = function(p, callback) {
	var that = this;
	
	var entities = VIE.EntityManager.getByType(that.settings.type);
	if (!entities)
	{
	    callback.call(that, []);
	    return;
	}
	
	callback.call(that, _.map(entities, function(item) {
        return {
            name: item.get(that.settings.labelpredicate),
            url: item.id,
            info: item.get(that.settings.labelpredicate),
            type: that.settings.type
        };
    }));
};