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
require 'socket.io-connect'
require '../js/auth/auth.strategies/linkedin.js'
fs = require 'fs'
jsdom = require 'jsdom'
browserify = require 'browserify'
ProxyRequest = require 'request'

configFile = "configuration.json"
if process.argv.length > 2
    configFile = process.argv[2]

cfg = JSON.parse fs.readFileSync "#{process.cwd()}/#{configFile}", "utf-8"

session_store = new RedisStore({ maxAge: 24 * 60 * 60 * 1000})

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

server = express.createServer()
server.configure ->
    #console.server
    # Our CSS files need the LessCSS compiler
    server.use express.compiler
        src: process.cwd()
        enable: ['less']
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
    unless cfg.linkedin.key
        console.error "Error: No LinkedIn ConsumerKey, check your configuration.json"

    server.use connect.session
        secret: 'vie palsu app'
        store: session_store
    
    server.set 'view options', { layout: false }

    server.use auth [auth.Twitter
            consumerKey: cfg.twitter.key
            consumerSecret: cfg.twitter.secret]

###
    server.use auth [auth.Twitter
            consumerKey: cfg.twitter.key
            consumerSecret: cfg.twitter.secret]
    server.use auth [auth.Facebook
            appId: cfg.facebook.key
            appSecret: cfg.facebook.secret
            scope: "email"
            callback: "http://palsu.me/oauth-signin"]
    server.use auth [auth.Linkedin
            consumerKey: cfg.linkedin.key
            consumerSecret: cfg.linkedin.secret]
###

jsdom.defaultDocumentFeatures =
    FetchExternalResources: false, 
    ProcessExternalResources: false

# Serve the home page
server.get '/', (request, response) ->
    if request.isAuthenticated() then return response.redirect '/dashboard' else return response.redirect '/signin'

server.get '/about', (request, response) ->
    response.sendfile "#{process.cwd()}/templates/about.html"

server.get '/signin', (request, response) ->
    response.sendfile "#{process.cwd()}/templates/signin.html"

server.get '/oauth-signin', (request,response) ->

    provider = request.param('p')
    if !provider then provider = null
    console.log 'provider: ' + provider
    
    if request.isAuthenticated() then return response.redirect '/dashboard'    
    
    request.authenticate [provider], (error, authenticated) ->
        # move to switch...
        console.log 'auth: ' + authenticated
        
        if request.isAuthenticated() and provider == 'twitter'
            console.log 'is twitter'
            jsonUrl = "https://api.twitter.com/1/users/show.json?screen_name="+request.session.auth.user.username
            
            ProxyRequest {uri:jsonUrl}, (error, ProxyResponse, body) ->
                if !error and ProxyResponse.statusCode == 200
                    userData = JSON.parse(body)
                    userData.image = userData.profile_image_url
                    userData.homepage = userData.url
                    console.log userData
                    updateUserSession request, userData
                    return response.redirect '/dashboard'
                else
                    # write info message about error (fetch twitter user data)
                    console.log 'redirect to dashboard'
                    return response.redirect '/dashboard'
        
        if request.isAuthenticated() and provider == 'facebook'
            console.log 'is facebook'
            return response.redirect '/dashboard'
            
        if request.isAuthenticated() and provider == 'linkedin'
            console.log 'is linkedin'
            return response.redirect '/dashboard'
        
        #console.log 'Error on signin'
        #return response.redirect '/signin?error'

    return

server.get '/signout', (request, response) ->
    userData = {}
    userData.username = 'guest'
    userData.image = null
    userData.homepage = null
    userData.name = null
    updateUserSession request, userData
    
    request.session.destroy();
    response.redirect '/about'

server.get '/tasks', (request, response) ->
    if !request.isAuthenticated() then return response.redirect '/signin'
    return fs.readFile "#{process.cwd()}/templates/tasks.html", "utf-8", (err, data) ->
        document = jsdom.jsdom data
        window = document.createWindow()
        jQ = jQuery.create window

        writeUser request.session.auth.user, jQ

        VIE.RDFaEntities.getInstances jQ "*"
        
        # meeting 1
        task_list = VIE.EntityManager.getBySubject 'urn:uuid:c296520b-4447-1f67-f7c3-60b1c45c8047'
        #task_list = VIE.EntityManager.getByType 'rdfcal:Task'
        #console.log task_list
        events = task_list.get 'rdfcal:has_component'
        events.predicate = "rdfcal:component"
        events.object = task_list.id
        events.comparator = (item) ->
            return dateComparator item, events
        return events.fetch
            success: (taskCollection) ->
                VIE.cleanup()
                console.log 'success taskcollection'
                return response.send window.document.innerHTML
        
        #return response.send window.document.innerHTML
        
        ### meeting 2
        task_list = VIE.EntityManager.getBySubject 'urn:uuid:5c3f81cc-30b5-1375-e677-81c83d0961e7'
        events = task_list.get 'rdfcal:has_component'
        events.predicate = "rdfcal:component"
        events.object = task_list.id
        events.comparator = (item) ->
            return dateComparator item, events
        return events.fetch
            success: (taskCollection) ->
                VIE.cleanup()
        ###
        
        ###
        # Find RDFa entities and load them
        VIE.RDFaEntities.getInstances jQ "*"
        # Get the Calendar object
        # get all meetings
        # get all tasks per meeting
        # calendar: urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66
        #task_list = VIE.EntityManager.getBySubject 'urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66'
        #task_list = VIE.EntityManager.getBySubject 'urn:uuid:c296520b-4447-1f67-f7c3-60b1c45c8047'
        #task_list = VIE.EntityManager.getBySubject 'urn:uuid:5c3f81cc-30b5-1375-e677-81c83d0961e7'

        task_events = VIE.EntityManager.getBySubject 'urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66'
        console.log 'task events list: '
        console.log task_events
        task_list = task_events
        
        # ##
        #task_list = VIE.EntityManager.getBySubject 'urn:uuid:5c3f81cc-30b5-1375-e677-81c83d0961e7'
        console.log 'task list: ' + task_list
        
        if !task_list
            VIE.cleanup()
            # todo return error message
            console.error "Error loading tasks."
            return response.send window.document.innerHTML

        # Query for events that have the calendar as component
        events = task_list.get 'rdfcal:has_component'
        events.predicate = "rdfcal:component"
        events.object = task_list.id
        events.comparator = (item) ->
            return dateComparator item, events
        return events.fetch
            success: (taskCollection) ->
                VIE.cleanup()
                return response.send window.document.innerHTML
            error: (collection, error) ->
                VIE.cleanup()
                return response.send window.document.innerHTML
        # ##
        
        VIE.cleanup()
        ###
        
        return response.send window.document.innerHTML


# Serve the list of meetings for /
server.get '/dashboard', (request, response) ->
    if !request.isAuthenticated() then return response.redirect '/signin'
    return fs.readFile "#{process.cwd()}/templates/index.html", "utf-8", (err, data) ->
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
            console.error "Error loading calendar."
            return response.send window.document.innerHTML

        # Query for events that have the calendar as component
        events = calendar.get 'rdfcal:has_component'
        events.predicate = "rdfcal:component"
        events.object = calendar.id
        events.comparator = (item) ->
            return dateComparator item, events
        return events.fetch
            success: (eventCollection) ->
                VIE.cleanup()
                return response.send window.document.innerHTML
            error: (collection, error) ->
                VIE.cleanup()
                return response.send window.document.innerHTML
    return

server.get '/meeting/:uuid', (request, response) ->
    if !request.isAuthenticated() then return response.redirect '/signin'
    console.log('open meeting: ' + request.params.uuid + ' - '+ request.session.auth.user.username );
    return fs.readFile "#{process.cwd()}/templates/meeting.html", "utf-8", (err, data) ->
        document = jsdom.jsdom data
        window = document.createWindow()
        jQ = jQuery.create window

        writeUser request.session.auth.user, jQ

        # Write the Meeting identifier into the DOM
        jQ('[typeof="rdfcal\\:Vevent"]').attr('about', request.params.uuid);
        
        # Find RDFa entities and load them
        VIE.RDFaEntities.getInstances jQ "*"
        
        # Clean up VIE internal state and send content out
        sendContent = (collection, error) ->
            VIE.cleanup()
            return response.send window.document.innerHTML
            # Clean up VIE internal state and send content out
        
        sendContent2 = (collection, error) ->
            VIE.cleanup()
            return true
            
        # Query for posts for this event
        # @todo callbacks as array
        getPosts = (event, callback, callback2) ->
            posts = event.get "sioc:container_of"
            posts.predicate = "sioc:has_container"
            posts.object = event.id
            posts.comparator = (item) ->
                return dateComparator item, posts
            return posts.fetch
                success: (collection) ->
                    callback event
                    callback2 event
                error:  (collection, error) ->
                    callback event
                    callback2 event
        
        getParticipants = (event) ->
            participants = event.get "rdfcal:attendee"
            console.log '### participants list: '
            #console.log participants
            participants.predicate = "rdfcal:attendeeOf"
            participants.object = event.id
            return participants.fetch
                success: sendContent
                error: sendContent

        getTasks = (event) ->
            task_list = event.get "rdfcal:has_component"
            task_list.predicate = "rdfcal:component"
            task_list.object = event.id
            return task_list.fetch
                success: sendContent2
                error: sendContent2

        # Get the Meeting object
        calendar = VIE.EntityManager.getBySubject request.params.uuid
        calendar.fetch
            success: (event) ->
                getPosts event, getTasks, getParticipants
                #getPosts event, getParticipants, getTasks
            error: (event, error) ->
                VIE.cleanup()
                return response.send error

# Proxy VIE-2 cross-site requests
#server.post '^\\/proxy.*', (request, response) ->
server.post '/proxy', (request, response) ->
    console.log 'PROXY'
    #requestData = request.body

    proxiedRequest =
        method: requestData.verb or "GET"
        uri: requestData.proxy_url
        data: requestData.content
        headers:
            "Accept": requestData.format or "text/plain"

    return req = ProxyRequest
        method: requestData.verb or "GET"
        uri: requestData.proxy_url
        data: requestData.content
        headers:
            "Accept": requestData.format or "text/plain"
    , (error, resp, body) ->
        console.log 'PROXY 4'
        console.log proxiedRequest
        console.log body
        return response.send body

###
server.all '/proxy', (request, response) ->
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
###

# start server
server.listen(cfg.port)

# ## Handling sockets
socket = io.listen server

# Handle a new connected client
socket.on 'connection', (client) ->
    client.on 'message', (data) ->
        if typeof data isnt 'object'
            # If we get a regular string from the user there is no need to pass it on
            return

        # Generate a RDF Entity instance for the JSON-LD we got from the client
        modelInstance = VIE.EntityManager.getByJSONLD(data)
        modelInstance.save()

        # Send the item back to everybody else
        for clientId, clientObject of socket.clients
            if clientObject isnt client
                console.log "Forwarding data to #{clientId}"
                clientObject.send data
