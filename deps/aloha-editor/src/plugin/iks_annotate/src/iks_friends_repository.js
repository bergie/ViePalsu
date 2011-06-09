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

GENTICS.Aloha.Repositories.iks_friends.user_ids = [];
GENTICS.Aloha.Repositories.iks_friends.items_lookup = false;
GENTICS.Aloha.Repositories.iks_friends.items = [];

GENTICS.Aloha.Repositories.iks_friends.init = function() {
};

/**
 * Searches a repository for items matching query if objectTypeFilter.
 * If none found it returns null.
 */
GENTICS.Aloha.Repositories.iks_friends.query = function(p, callback) {
	var that = this;
	// jQuery('#username').text()
	
	var r = new RegExp(p.queryString, 'i');
	
	console.log('query string', p.queryString);
	
	//if (!GENTICS.Aloha.Repositories.iks_friends.items_lookup) {
	    var user_ids = _getTwitterFriendIds();
	    console.log('my friend ids', GENTICS.Aloha.Repositories.iks_friends.user_ids);
	    var items = _getTwitterUserDataBatch(GENTICS.Aloha.Repositories.iks_friends.user_ids, r);
	//}
	
	
	console.log('friend list items', GENTICS.Aloha.Repositories.iks_friends.items_lookup);

    if (!GENTICS.Aloha.Repositories.iks_friends.items_lookup)
	{
	    console.log('no items_lookup');
	    
	    callback.call(that, []);
	    return;
	}

	//callback.call(GENTICS.Aloha.Repositories.iks_friends.query, GENTICS.Aloha.Repositories.iks_friends.items_lookup);


	callback.call(that, _.map(GENTICS.Aloha.Repositories.iks_friends.items_lookup, function(item) {
	    console.log(item);
	    
	    //if (item.name.match(r)) {
	        console.log('match', item.name);
            return {
                id: item.id,
                name: item.name,
                url: item.url,
                info: item.info,
                type: item.type
            };
        //} else {
            //return {};
        //}
    }));

};

_getTwitterFriendIds = function () {
    
    jsonUrl = "https://api.twitter.com/1/friends/ids.json?screen_name="+jQuery('#username').text();
	
	console.log('friends_url', jsonUrl);
	
	var user_ids = [];
	
	jQuery.ajax({
		async: false,
		success : function(data) {
		    //console.log('ajax data:', data);
            
            var user_ids = JSON.parse(data).slice(0,11);
            console.log('friend user_ids to lookup', user_ids);
            
            GENTICS.Aloha.Repositories.iks_friends.user_ids = user_ids
            //return user_ids;
            
            //var items = _getTwitterUserDataBatch(user_ids);
            //var items = [];
            
            /*jQuery.each(user_ids, function(value, user_id) {
                jsonUrl = "https://api.twitter.com/1/users/show.json?user_id="+user_id;
                console.log('user_url', jsonUrl);
                that.getTwitterUserData(jsonUrl);
            
            });*/
            
            //console.log('friend list items', items);
			//callback.call( GENTICS.Aloha.Repositories.iks_friends.query, items);
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
	
    //return user_ids;
}

_getTwitterUserDataBatch = function(user_ids, r) {
    var that = this;
	
    var user_ids = user_ids.join(',');
    
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
		    
		    var items = [];
		    
		    console.log('items', items);
		    
		    $.each(userData, function(index, value) {
		        console.log('each item', value);
		        
		        if (value.name.match(r)) {
		        items.push({
    				id: 'http://twitter.com/'+value.screen_name,
    				name: value.name,
    				repositoryId: 'iks_friends',
    				type: GENTICS.Aloha.Repositories.iks_friends.settings.type,
    				url: 'http://twitter.com/'+value.screen_name,
    				weight: (15-1)/100
    			});
		        }
		    });
		    /*items.push(new GENTICS.Aloha.Repository.Document ({
				id: 'http://twitter.com/'+userData.screen_name,
				name: userData.name,
				repositoryId: that.repositoryId,
				type: that.settings.type,
				url: 'http://twitter.com/'+userData.screen_name,
				weight: that.settings.weight + (15-1)/100
			}));*/
		    
		    console.log('items', items);
		    
		    GENTICS.Aloha.Repositories.iks_friends.items_lookup = items;
		    return items;
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



GENTICS.Aloha.Repositories.iks_friends.getTwitterUserData = function(user_ids) {
    var that = this;
    
    // needs authentication
    //jsonUrl = "https://api.twitter.com/1/users/lookup.json?user_id="+user_ids;
    
        jQuery.ajax({
    		async: false,
    		success : function(data) {
    		    //console.log('ajax data:', data);
		    
    		    var userData = JSON.parse(data);
    		    console.log('user data', userData);

    			that.items.push(new GENTICS.Aloha.Repository.Document ({
    				id: 'http://twitter.com/'+userData.screen_name,
    				name: userData.name,
    				repositoryId: that.repositoryId,
    				type: that.settings.type,
    				url: 'http://twitter.com/'+userData.screen_name
    			}));
                
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
