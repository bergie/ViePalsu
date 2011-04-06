express = require 'express'
io = require 'socket.io'
jQuery = require 'jquery'
Backbone = require 'backbone'
connect = require 'connect'
VIE = require '../js/vie.js'
auth = require 'connect-auth'
sys = require 'sys'
require './vie-redis.coffee'
RedisStore = require 'connect-redis'
require 'socket.io-connect'
fs = require 'fs'
jsdom = require 'jsdom'
browserify = require 'browserify'
ProxyRequest = require 'request'

configFile = "configuration.json"
if process.argv.length > 2
    configFile = process.argv[2]

cfg = JSON.parse fs.readFileSync "#{process.cwd()}/#{configFile}", "utf-8"

#user.username = 'guest'

session_store = new RedisStore({ maxAge: 24 * 60 * 60 * 1000})

writeUser = (user, jQuery) ->
    # Write user data
    jQuery('#account [property="foaf\\:nick"]').text(user.username)
    jQuery('#account').attr('about', 'http://twitter.com/' + user.username)
    jQuery('#account [property="foaf\\:name"]').text(user.name)
    jQuery('#account [rel="foaf\\:img"] img').attr({
        src: user.image,
        title: "Picture of " + user.name,
        alt: "Picture of " + user.name
    })

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

    server.use connect.session
        secret: 'vie palsu app'
        store: session_store
    server.use auth [auth.Twitter
            consumerKey: cfg.twitter.key
            consumerSecret: cfg.twitter.secret]
     
     server.set 'view options', { layout: false }

jsdom.defaultDocumentFeatures =
    FetchExternalResources: false, 
    ProcessExternalResources: false

# Serve the home page
server.get '/', (request, response) ->
    if request.isAuthenticated() then return response.redirect '/dashboard' else return response.redirect '/signin'

server.get '/about', (request, response) ->
    response.sendfile "#{process.cwd()}/templates/about.html"

server.get '/signin', (request,response) ->
    if request.isAuthenticated() then return response.redirect '/dashboard'
    
    request.authenticate ['twitter'], (error, authenticated) ->
        if request.isAuthenticated()
            jsonUrl = "https://api.twitter.com/1/users/show.json?screen_name="+request.session.auth.user.username
            
            ProxyRequest {uri:jsonUrl}, (error, ProxyResponse, body) ->
                if !error and ProxyResponse.statusCode == 200
                    userData = JSON.parse(body)
                    request.session.auth.user.image = userData.profile_image_url
                    request.session.auth.user.homepage = userData.url
                    request.session.auth.user.name = userData.name
                    return response.redirect '/dashboard'
                else
                    # write info message about error
                    return response.redirect '/about'
        else
            #console.log 'Error on signin'
    return

server.get '/signout', (request, response) ->
    request.session.auth.user.username = 'guest'
    request.session.destroy();
    response.redirect '/about'

# todo implement other proxy server
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
        
        # Get the Meeting object
        calendar = VIE.EntityManager.getBySubject request.params.uuid
        calendar.fetch
            success: (event) ->
                # Query for posts for this event
                posts = event.get 'sioc:container_of'
                posts.predicate = "sioc:has_container"
                posts.object = event.id
                posts.comparator = (item) ->
                    return dateComparator item, posts

                return posts.fetch
                    success: (postCollection) ->
                        console.log "Got #{postCollection.length} posts"
                        VIE.cleanup()
                        return response.send window.document.innerHTML
                    error: (postCollection, error) ->
                        # No posts found, send the page anyway
                        console.log "No posts"
                        VIE.cleanup()
                        return response.send window.document.innerHTML
                        
            error: (event, error) ->
                VIE.cleanup()
                return response.send error

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
