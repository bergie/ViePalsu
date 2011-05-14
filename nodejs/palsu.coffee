# required 3rd party libs
express = require 'express'
io = require 'socket.io'
jQuery = require 'jquery'
_ = require('underscore')._
Backbone = require 'backbone'
sys = require 'sys'
fs = require 'fs'
jsdom = require 'jsdom'
ProxyRequest = require 'request'
browserify = require 'browserify'

# Authentication with LinkedIn oAuth
connect = require 'connect'
auth = require 'connect-auth'
RedisStore = require 'connect-redis'
require '../js/auth/auth.strategies/linkedin.js'

# VIE and VIE Redis Store
VIE = require '../js/vie.js'
require './vie-redis.coffee'

# default configuration
configFile = 'configuration.json'

# copy default configuration to myapp.local.json and run:
# $ coffee nodejs/palsu.coffee myapp.local.json
if process.argv.length > 2
    configFile = process.argv[2]
cfg = JSON.parse fs.readFileSync "#{process.cwd()}/#{configFile}", "utf-8"

# data store configuration
session_store = new RedisStore
    maxAge: 24 * 60 * 60 * 1000


# helper functions

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
    console.log 'fetchTasksForEvent: ' + event.id
    #console.log event
    if not event.id then return

    events = event.get "rdfcal:hasTask"

    if not events
        console.log "Issue getting task collection for event " + event.id
        return callback()

    events.predicate = 'rdfcal:taskOf'
    events.object = event.id
    events.comparator = (item) ->
        return dateComparator item, events
    return events.fetch
        success: (taskCollection) ->
            console.log "Got task collection " + taskCollection.length
            #console.log 'success taskcollection', taskCollection
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

server = express.createServer()
server.configure ->

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
    if request.isAuthenticated()
        return response.redirect '/m'
    response.sendfile "#{process.cwd()}/templates/welcome.html"

server.get '/oauth-signin', (request,response) ->
    provider = request.param('p')
    # @set default config? cfg.oauth.default_provider
    if !provider then provider = 'twitter'
    console.log 'provider: ' + provider

    if request.isAuthenticated() then return response.redirect '/m'

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
            console.error "Error: loading calendar for task list"
            return response.send window.document.innerHTML

        # Query for events that have the calendar as component
        events = calendar.get 'rdfcal:has_component'
        events.predicate = 'rdfcal:component'
        events.object = calendar.id
        events.comparator = (item) ->
            return dateComparator item, events
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
            return dateComparator item, events
        return events.fetch
            success: (eventCollection) ->
                VIE.cleanup()
                return response.send window.document.innerHTML
            error: (collection, error) ->
                VIE.cleanup()
                return response.send window.document.innerHTML
    return


server.get "/m/:id", (request, response) ->
    if !request.isAuthenticated() then return response.redirect '/'
    console.log "open meeting: #{request.params.id} - #{request.session.auth.user.username}"
    return fs.readFile "#{process.cwd()}/templates/meeting.html", "utf-8", (err, data) ->
        document = jsdom.jsdom data
        window = document.createWindow()
        jQ = jQuery.create window

        writeUser request.session.auth.user, jQ

        if request.params.id.substr(0, 4) != "urn:"
            # Local identifier, convert to full URI
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
            #VIE.cleanup()
            return true

        # Query for posts for this event
        # @todo callbacks as array or something like that...
        getPosts = (event, callback, callback2) ->
            #console.log event
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
                    #console.log collection
                    #console.log error
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
            task_list = event.get "rdfcal:hasTask"
            task_list.predicate = "rdfcal:taskOf"
            task_list.object = event.id
            return task_list.fetch
                success: sendContent2
                error: sendContent2
                #error: console.log task_list

        # Get the Meeting object
        calendar = VIE.EntityManager.getBySubject request.params.id
        calendar.fetch
            success: (event) ->
                getPosts event, getTasks, getParticipants
            error: (event, error) ->
                VIE.cleanup()
                return response.send error


# Proxy VIE-2 cross-site requests
#server.post '^\\/proxy.*', (request, response) ->
server.post '/proxy', (request, response) ->

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
