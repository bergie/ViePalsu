express = require 'express'
io = require 'socket.io'
jQuery = require 'jquery'
_ = require("underscore")._
Backbone = require 'backbone'
connect = require 'connect'
VIE = require '../js/vie.js'
auth = require 'connect-auth'
sys = require 'sys'
require './vie-redis.coffee'
RedisStore = require 'connect-redis'
querystring = require 'querystring'
#require '../js/auth/auth.strategies/linkedin.js'
fs = require 'fs'
jsdom = require 'jsdom'
browserify = require 'browserify'
ProxyRequest = require 'request'

configFile = "configuration.json"
if process.argv.length > 2
    configFile = process.argv[2]

cfg = JSON.parse fs.readFileSync "#{process.cwd()}/#{configFile}", "utf-8"

session_store = new RedisStore
    maxAge: 24 * 60 * 60 * 1000

writeUser = (user, jQuery) ->
    # Write user data
    #console.log user
    jQuery('#account [property="foaf\\:nick"]').text(user.username)
    jQuery('#account').attr('about', 'http://twitter.com/' + user.username)
    jQuery('#account [property="foaf\\:name"]').text(user.name)
    jQuery('#account [rel="foaf\\:img"] img').attr({
        src: user.image,
        title: "Picture of " + user.name,
        alt: "Picture of " + user.name
    })

fetchTasksForEvent = (event, callback) ->
    # add tasks
    if not event.id then return

    events = event.get "rdfcal:hasTask"

    if not events
        console.log "Problem getting task collection for event " + event.id
        return callback()

    events.predicate = 'rdfcal:taskOf'
    events.object = event.id
    events.comparator = (item) ->
        return dateComparator item, events
    return events.fetch
        success: (taskCollection) ->
            console.log "Got task collection " + taskCollection.length
            callback()
        error: ->
            console.log "Failed to get task collection"
            callback()

updateUserSession = (request, userData) ->
    if !request.session.auth.user then return false
    request.session.auth.user.image = userData.profile_image_url
    request.session.auth.user.homepage = userData.url
    request.session.auth.user.name = userData.name

dateComparator = (item, collection) ->
    itemDate = new Date item.get "dc:created"
    itemIndex = 0
    collection.pluck("dc:created").forEach (date, index) ->
        if itemDate.getTime() > new Date(date).getTime()
            itemIndex = index + 1
    return itemIndex

dateComparatorChronological = (item, collection) ->
    itemDate = new Date item.get "dc:created"
    itemIndex = 0
    collection.pluck("dc:created").forEach (date, index) ->
        if itemDate.getTime() < new Date(date).getTime()
            itemIndex = index + 1
    return itemIndex


server = express.createServer()
server.configure ->
    # Serve static files from /styles and /js
    server.use '/styles', express.static "#{process.cwd()}/styles"
    server.use '/js', express.static "#{process.cwd()}/js"
    server.use '/static', express.static "#{process.cwd()}/static"
    server.use '/deps', express.static "#{process.cwd()}/deps"
    server.use browserify
        require: [ 'jquery-browserify' ]

    server.use connect.cookieParser()
    server.use connect.bodyParser()

    # oAuth with twitter
    unless cfg.twitter.key
        console.error "Error: No Twitter ConsumerKey, check your configuration.json"
#    unless cfg.linkedin.key
#        console.error "Error: No LinkedIn ConsumerKey, check your configuration.json"

    server.use connect.session
        secret: 'vie palsu app'
        store: session_store

    server.set 'view options', { layout: false }

    server.use auth [auth.Twitter
            consumerKey: cfg.twitter.key
            consumerSecret: cfg.twitter.secret]

###
    server.use auth [auth.Linkedin
            consumerKey: cfg.linkedin.key
            consumerSecret: cfg.linkedin.secret]
###

jsdom.defaultDocumentFeatures =
    FetchExternalResources: false,
    ProcessExternalResources: false

# Serve the home page
server.get '/', (request, response) ->
    if request.isAuthenticated()
        return response.redirect '/m'
    response.sendfile "#{process.cwd()}/templates/welcome.html"

server.get '/oauth-signin', (request,response) ->

    provider = request.param('p')
    if !provider then provider = null
    console.log 'provider: ' + provider

    if request.isAuthenticated() then return response.redirect '/m'

    request.authenticate [provider], (error, authenticated) ->
        # move to switch...
        console.log 'auth: ' + authenticated
        console.log request.session.auth

        if request.isAuthenticated() and provider == 'twitter'
            console.log 'is twitter'
            # get user data
            jsonUrl = "https://api.twitter.com/1/users/show.json?screen_name="+request.session.auth.user.username
            
            ProxyRequest {uri:jsonUrl}, (error, ProxyResponse, body) ->
                if !error and ProxyResponse.statusCode == 200
                    userData = JSON.parse(body)
                    userData.image = userData.profile_image_url
                    userData.homepage = userData.url
                    console.log userData
                    updateUserSession request, userData
                    return response.redirect '/m'
                else
                    console.log 'redirect to dashboard'
                    return response.redirect '/m'

        if request.isAuthenticated() and provider == 'facebook'
            console.log 'is facebook'
            return response.redirect '/m'

        if request.isAuthenticated() and provider == 'linkedin'
            console.log 'is linkedin'
            return response.redirect '/m'

    return

server.get '/signout', (request, response) ->
    userData = {}
    userData.username = 'guest'
    userData.image = null
    userData.homepage = null
    userData.name = null
    updateUserSession request, userData

    request.session.destroy();
    response.redirect '/'

server.get '/t', (request, response) ->
    if !request.isAuthenticated() then return response.redirect '/'
    return fs.readFile "#{process.cwd()}/templates/tasks.html", "utf-8", (err, data) ->
        document = jsdom.jsdom data
        window = document.createWindow()
        jQ = jQuery.create window

        writeUser request.session.auth.user, jQ

        # Find RDFa entities and load them
        VIE.RDFaEntities.getInstances jQ "*"

        # meeting list
        # Get the Calendar object
        calendar = VIE.EntityManager.getBySubject 'urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66'

        if !calendar
            VIE.cleanup()
            # todo return error message
            return response.send window.document.innerHTML

        # Query for events that have the calendar as component
        events = calendar.get 'rdfcal:has_component'
        events.predicate = 'rdfcal:component'
        events.object = calendar.id
        events.comparator = (item) ->
            return dateComparatorChronological item, events
        return events.fetch
            success: (eventCollection) ->
                fetched = 0

                eventCollection.each (event) ->
                    console.log 'loop eventCollection', eventCollection.length
                    fetchTasksForEvent event, ->
                        fetched++
                        if fetched is eventCollection.length
                            # Send stuff
                            VIE.cleanup()
                            return response.send window.document.innerHTML

            error: (collection, error) ->
                VIE.cleanup()
                return response.send window.document.innerHTML

        return response.send window.document.innerHTML

# Serve the list of meetings for /
server.get '/m', (request, response) ->
    if !request.isAuthenticated() then return response.redirect '/'
    return fs.readFile "#{process.cwd()}/templates/meetings.html", "utf-8", (err, data) ->
        document = jsdom.jsdom data
        window = document.createWindow()
        jQ = jQuery.create window

        writeUser request.session.auth.user, jQ

        # Find RDFa entities and load them
        VIE.RDFaEntities.getInstances jQ "*"
        # Get the Calendar object
        calendar = VIE.EntityManager.getBySubject 'urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66'

        if !calendar
            VIE.cleanup()
            # todo return error message
            console.error "Error: loading calendar for dashboard"
            return response.send window.document.innerHTML

        # Query for events that have the calendar as component
        events = calendar.get "rdfcal:has_component"
        events.predicate = "rdfcal:component"
        events.object = calendar.id
        events.comparator = (item) ->
            return dateComparatorChronological item, events
        return events.fetch
            success: (eventCollection) ->
                VIE.cleanup()
                return response.send window.document.innerHTML
            error: (collection, error) ->
                VIE.cleanup()
                return response.send window.document.innerHTML
    return


server.get "/t/:id", (request, response) ->
    if !request.isAuthenticated() then return response.redirect '/'
    console.log "open task: #{request.params.id} - #{request.session.auth.user.username}"
    return fs.readFile "#{process.cwd()}/templates/task.html", "utf-8", (err, data) ->
        document = jsdom.jsdom data
        window = document.createWindow()
        jQ = jQuery.create window

        writeUser request.session.auth.user, jQ

        if request.params.id.substr(0, 4) != "urn:" and cfg.port == 80
            # Local identifier, convert to full URI
            request.params.id = "http://#{cfg.hostname}/t/#{request.params.id}"
        else if request.params.id.substr(0, 4) != "urn:"
            request.params.id = "http://#{cfg.hostname}:#{cfg.port}/t/#{request.params.id}"

        # Write the Task identifier into the DOM
        jQ('[typeof="rdfcal\\:Task"]').attr('about', request.params.id);

        # Find RDFa entities and load them
        VIE.RDFaEntities.getInstances jQ "*"

        # Clean up VIE internal state and send content out
        sendContent = (collection, error) ->
            VIE.cleanup()
            console.log 'send content'
            return response.send window.document.innerHTML

        # Get the Meeting object
        console.log 'fetch task with id', request.params.id

        calendar = VIE.EntityManager.getBySubject request.params.id
        calendar.fetch
            success: (event) ->
                sendContent event
                console.log 'success fetch task'
            error: (event, error) ->
                VIE.cleanup()
                return response.send error


server.get "/m/:id", (request, response) ->
    if !request.isAuthenticated() then return response.redirect '/'
    console.log "open meeting: #{request.params.id} - #{request.session.auth.user.username}"
    return fs.readFile "#{process.cwd()}/templates/meeting.html", "utf-8", (err, data) ->
        document = jsdom.jsdom data
        window = document.createWindow()
        jQ = jQuery.create window

        writeUser request.session.auth.user, jQ

        if request.params.id.substr(0, 4) != "urn:" and cfg.port == 80
            # Local identifier, convert to full URI
            request.params.id = "http://#{cfg.hostname}/m/#{request.params.id}"
        else if request.params.id.substr(0, 4) != "urn:"
            request.params.id = "http://#{cfg.hostname}:#{cfg.port}/m/#{request.params.id}"

        # Write the Meeting identifier into the DOM
        jQ('[typeof="rdfcal\\:Vevent"]').attr('about', request.params.id);

        # Find RDFa entities and load them
        VIE.RDFaEntities.getInstances jQ "*"

        # Clean up VIE internal state and send content out
        sendContent = (collection, error) ->
            VIE.cleanup()
            console.log 'send content'
            return response.send window.document.innerHTML

        sendContent2 = (collection, error) ->
            return true

        # Query for posts for this event
        # @todo callbacks as array or something like that...
        getPosts = (event, callback, callback2, callback3) ->
            posts = event.get "sioc:container_of"
            posts.predicate = "sioc:has_container"
            posts.object = event.id
            posts.comparator = (item) ->
                return dateComparator item, posts
            return posts.fetch
                success: (collection) ->
                    callback event
                    callback2 event
                    callback3 event
                error:  (collection, error) ->
                    callback event
                    callback2 event
                    callback3 event

        getParticipants = (event) ->
            participants = event.get "rdfcal:attendee"
            console.log '### participants list: '
            participants.predicate = "rdfcal:attendeeOf"
            participants.object = event.id
            return participants.fetch
                success: sendContent
                error: sendContent

        getTasks = (event) ->
            task_list = event.get "rdfcal:hasTask"
            task_list.predicate = "rdfcal:taskOf"
            task_list.object = event.id
            return task_list.fetch
                success: sendContent2
                error: sendContent2

        getMentions = (event) ->
            mention_list = event.get "rdfcal:hasMention"

            mention_list.predicate = "rdfcal:mentionOf"
            mention_list.object = event.id
            return mention_list.fetch
                success: sendContent2
                error: sendContent2


        # Get the Meeting object
        calendar = VIE.EntityManager.getBySubject request.params.id
        calendar.fetch
            success: (event) ->
                getPosts event, getTasks, getMentions, getParticipants
            error: (event, error) ->
                VIE.cleanup()
                return response.send error


# Proxy VIE-2 cross-site requests
server.post '/proxy', (request, response) ->
    
    fullBody = ''
    
    request.on 'data', (chunk) ->
        fullBody += chunk.toString()
    
    request.on 'end', () ->
        decodedBody = querystring.parse(fullBody)
        requestData = request
        
        if !requestData.proxy_url
            requestData.proxy_url = 'http://dev.iks-project.eu:8080/engines';
            #requestData.proxy_url = 'http://stanbol.iksfordrupal.net/engines';
        
        if !requestData.content
            requestData.content = decodedBody.content
        
        if !requestData.verb
            requestData.verb = "POST"
        
        if !requestData.format
            requestData.format = "text/plain"
        
        proxiedRequest =
            #method: requestData.verb or "GET"
            method: "POST"
            uri: requestData.proxy_url
            body: requestData.content
            headers:
                "Accept": requestData.format or "text/plain"
        
        return req = ProxyRequest
            #method: requestData.verb or "GET"
            method: "POST"
            uri: requestData.proxy_url
            body: requestData.content
            headers:
                "Accept": requestData.format or "text/plain"
        , (error, resp, body) ->
            #console.log 'proxy body', body
            #console.log 'error', error
            return response.send body


# simple get proxy
server.get '/proxy', (request, response) ->
    if request.param("proxy_url")
        url = unescape request.param("proxy_url")
        ProxyRequest {uri:url}, (error, ProxyResponse, body) ->
            if !error and ProxyResponse.statusCode == 200
                return response.send(body)
            else
                return response.send('Proxy Error: No response data.')
    else
        return response.send('Proxy Error: No "proxy_url" param set.')

    return

# start server
server.listen(cfg.port)

# ## Handling sockets
socket = io.listen server

# Handle a new connected client
socket.on 'connection', (client) ->
    client.on 'message', (data) ->
        if typeof data isnt 'object'
            # We got a user identifier, mark as online
            user = VIE.EntityManager.getByJSONLD
                '@': data
            client.userInstance = user
            user.fetch
                success: (user) ->
                    user.set
                        'iks:online': 1
                    for clientId, clientObject of socket.clients
                        clientObject.send user.toJSONLD()
                    user.save()
            return

        # Generate a RDF Entity instance for the JSON-LD we got from the client
        modelInstance = VIE.EntityManager.getByJSONLD(data)
        modelInstance.save()

        # Send the item back to everybody else
        for clientId, clientObject of socket.clients
            if clientObject isnt client
                console.log "Forwarding data to #{clientId}"
                clientObject.send data

    client.on 'disconnect', ->
        if not client.userInstance then return

        # Mark user as offline and notify other users
        client.userInstance.set
            'iks:online': 0
        for clientId, clientObject of socket.clients
            clientObject.send client.userInstance.toJSONLD()
            client.userInstance.save()
