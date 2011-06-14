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
GENTICS.Aloha.Repositories.iks_friends.lookup = false;

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
	GENTICS.Aloha.Repositories.iks_friends.lookup = p;
	//console.log('query string', p.queryString);
	
	//Cookie.erase('iks_friend_lookup');
	//localStorage.removeItem('iks_friend_lookup');
    var iks_friends = false;
	//console.log('iks cookie', iks_friends);
	
	//$.storage = new $.store();
	//iks_friends = $.storage.get('iks_friend_lookup');
	//console.log('iks cookie', iks_friends);
	
	iks_friends = localStorage.getItem('iks_friend_lookup');
	iks_friends_datetime = localStorage.getItem('iks_friend_time');
	//console.log('iks cookie', JSON.parse(iks_friends));
	//console.log('iks cookie2', document.cookie);
	//console.log('iks cookie3', document.cookie.indexOf('iks_friend_lookup='));
	
	// if (document.cookie.indexOf('mycookie=')>0) {
	
	// check cache time
	var date = new Date;
	
	 
	
	//if (!iks_friends || (iks_friends_datetime < date.getTime()-60*60*6)) {
    if (!iks_friends) {
	    var user_ids = GENTICS.Aloha.Repositories.iks_friends._getTwitterFriendIds();
	    console.log('look up my friends live');
	    var items = GENTICS.Aloha.Repositories.iks_friends._getTwitterUserDataBatch(GENTICS.Aloha.Repositories.iks_friends.user_ids, r);
	} else {
	    console.log('got my friends from localstorage');
	    GENTICS.Aloha.Repositories.iks_friends.items_lookup = JSON.parse(iks_friends);
	    //GENTICS.Aloha.Repositories.iks_friends.items_lookup = iks_friends;
	}
	
	
	//console.log('friend list items', GENTICS.Aloha.Repositories.iks_friends.items_lookup);

    if (!GENTICS.Aloha.Repositories.iks_friends.items_lookup)
	{
	    console.log('no items_lookup');
	    
	    callback.call(that, []);
	    return;
	}

	//callback.call(GENTICS.Aloha.Repositories.iks_friends.query, GENTICS.Aloha.Repositories.iks_friends.items_lookup);

    // just use selected for lookup
    var lookup = [];
    $.each(GENTICS.Aloha.Repositories.iks_friends.items_lookup, function(index, item) {
	    if (item.name.match(r) || item.url.match(r)) {
            lookup.push(item);
        }
    });

	callback.call(that, _.map(lookup, function(item) {
            return {
                id: item.id,
                name: item.name,
                url: item.url,
                info: item.info,
                type: item.type
            };
    }));

};

GENTICS.Aloha.Repositories.iks_friends._getTwitterFriendIds = function () {
    
    jsonUrl = "https://api.twitter.com/1/friends/ids.json?screen_name="+jQuery('#username').text();
	
	console.log('friends_url', jsonUrl);
	
	var user_ids = [];
	
	jQuery.ajax({
		async: false,
		success : function(data) {
		    //console.log('ajax data:', data);
            
            var user_ids = JSON.parse(data).slice(0,99);
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

GENTICS.Aloha.Repositories.iks_friends._getTwitterUserDataBatch = function(user_ids, r) {
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
		    
		    // for lookup field
		    $.each(userData, function(index, value) {
		        //console.log('each item', value);
		        
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
			
			
			// for iks_friends / cache
			var items_cookie = [];
			$.each(userData, function(index, value) {
		        //console.log('each item2 ', value);
		        
		        items_cookie.push({
    				id: 'http://twitter.com/'+value.screen_name,
    				name: value.name,
    				repositoryId: 'iks_friends',
    				type: GENTICS.Aloha.Repositories.iks_friends.settings.type,
    				url: 'http://twitter.com/'+value.screen_name,
    				weight: (15-1)/100
    			});
		    });
		    
		    
		    console.log('items', items);
		    console.log('items_cookie', items_cookie);
		    
		    GENTICS.Aloha.Repositories.iks_friends.items_lookup = items;
		    
		    var date = new Date();
		    
		    //Cookie.erase('iks_friend_lookup');
            localStorage.setItem('iks_friend_lookup', JSON.stringify(items_cookie));
            localStorage.SetItem('iks_friend_time', date.getTime());
            
            //$.storage = new $.store();
            //$.storage.set('iks_friend_lookup', items_cookie);
            //$.storage.set('iks_friend_time', items_cookie);
        	
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

