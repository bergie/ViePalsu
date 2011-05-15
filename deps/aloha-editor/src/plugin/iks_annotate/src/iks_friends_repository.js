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
GENTICS.Aloha.Repositories.iks_friends = new GENTICS.Aloha.Repository('iks_friends');

GENTICS.Aloha.Repositories.iks_friends.settings.type = 'foaf:Person';
GENTICS.Aloha.Repositories.iks_friends.settings.labelpredicate = 'foaf:name';

GENTICS.Aloha.Repositories.iks_friends.init = function() {
};

/**
 * Searches a repository for items matching query if objectTypeFilter.
 * If none found it returns null.
 */
GENTICS.Aloha.Repositories.iks_friends.query = function(p, callback) {
	var that = this;
	// jQuery('#username').text()
	jsonUrl = "https://api.twitter.com/1/friends/ids.json?screen_name="+jQuery('#username').text();
	
	console.log('friends_url', jsonUrl);
	
	jQuery.ajax({
		async: true,
		success : function(data) {
		    console.log('ajax data:', data);
            
            var user_ids = JSON.parse(data).join(',');
            console.log('friend user_ids', user_ids);
            
            //var items = _getTwitterUserDataBatch(user_ids);
            
            console.log('friend list items', items);
			callback.call( that, items);
		},
		error: function(error) {
		    console.log('ajax error', error);
		},
		type: "GET",
		url: '/proxy',
		data: {
			proxy_url: jsonUrl, 
			content: ""}
	});

};

_getTwitterUserDataBatch = function(user_ids) {
    // needs authentication
    jsonUrl = "https://api.twitter.com/1/users/lookup.json?user_id="+user_ids;
    console.log('user_url', jsonUrl);
    
    jQuery.ajax({
		async: false,
		success : function(data) {
		    //console.log('ajax data:', data);
		    
		    var userData = JSON.parse(data);
		    console.log('user data', userData);
		    
		    //userData.each()
		    
		    /*var items = [];
		    
		    items.push(new GENTICS.Aloha.Repository.Document ({
				id: 'http://twitter.com/'+userData.screen_name,
				name: userData.name,
				repositoryId: that.repositoryId,
				type: that.settings.type,
				url: 'http://twitter.com/'+userData.screen_name,
				weight: that.settings.weight + (15-1)/100
			}));*/
		    
		    return userData;
		},
		error: function(error) {
		    console.log('ajax error', error);
		    return false;
		},
		type: "GET",
		url: '/proxy',
		data: {
			proxy_url: jsonUrl, 
			content: ""}
	});
	
}