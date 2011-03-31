express = require 'express'
io = require 'socket.io'
jQuery = require 'jquery'
Backbone = require 'backbone'
connect = require 'connect'
VIE = require '../js/vie.js'
auth = require 'connect-auth'
sys = require 'sys'
require './vie-redis.coffee'
#require './vie-config.coffee'
RedisStore = require 'connect-redis'
require 'socket.io-connect'
fs = require 'fs'
jQuery = require 'jquery'
jsdom = require 'jsdom'

# ##
cfg = {}
cfg.twitterConsumerKey = 'ytB7V6C1C8NCpCAZqKwh1Q'
cfg.twitterConsumerSecret = 'S5Jg1pov6zLCKfKNMOO6kpdNK5lpEbsrepWCZSOcY'
cfg.port = 8002
# ##

user = null
session_store = new RedisStore({ maxAge: 24 * 60 * 60 * 1000})

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
    
    # oAuth with twitter
    server.use connect.cookieParser()

    if !cfg.twitterConsumerKey then sys.puts 'no twitterConsumerKey'

    server.use connect.session
        secret: 'vie palsu app'
        store: session_store
    server.use auth [auth.Twitter
            consumerKey: cfg.twitterConsumerKey
            consumerSecret: cfg.twitterConsumerSecret]
     
     server.set 'view options', { layout: false }

#server.dynamicHelpers
#    messages: require 'express-messages'

# Serve the index file for /
server.get '/', (request, response) ->
    sys.puts sys.inspect request.getAuthDetails()
    
    if request.session?.auth?.user? then user = request.session.auth.user
    
    if user?.username? then response.render('index.ejs', { username: user.username }, false) else response.sendfile "#{process.cwd()}/signin.html"
    true

server.get '/about', (request, response) ->
    response.sendfile "#{process.cwd()}/about.html"
    true

server.get '/signout', (request, response) ->
    user = null
    response.session = null
    #request.logout()
    response.redirect '/about'
    true

# Serve the index file for /
server.get '/meetings', (request, response) ->
    return fs.readFile "#{process.cwd()}/meetings.html", "utf-8", (err, data) ->
        document = jsdom.jsdom data
        window = document.createWindow()
        jQ = jQuery.create window
        
        # test adding events
        #VIE.EntityManager.getBySubject '/meetings' get('cal:has_component') bind('add', model { model.save() })
        #VIE.EntityManager.getBySubject '/meetings' get('cal:has_component') add({'cal:summary':'New event'})
        
        # Find RDFa entities and load them
        VIE.RDFaEntities.getInstances jQ "*"
        # Get the Calendar object
        calendar = VIE.EntityManager.getBySubject '/meetings'
        
        
        # Query for events that have the calendar as component
        events = calendar.get 'cal:has_component'
        events.predicate = "cal:component"
        events.object = calendar.id
        return events.fetch
            success: (eventCollection) ->
                VIE.cleanup()
                return response.send window.document.innerHTML

server.get '/signin', (request,response) ->
    request.authenticate ['twitter'], (error, authenticated) ->
        if request.isAuthenticated() then response.redirect '/'
        true
    true

server.get '/foo', (req, resp) ->
    html = jQuery('html')
    jQuery("<h1>test passes</h1>").appendTo("body", html)
    resp.send jQuery(html).html()

server.listen(cfg.port)

# ## Handling sockets
socket = io.listen server

# Handle a new connected client
#socket.on 'connection', (client) ->
socket.on 'connection', socket.prefixWithMiddleware (client, request, response) ->
    # session usage
    cookie_string = client.request.headers.cookie
    parsed_cookies = connect.utils.parseCookie cookie_string
    connect_sid = parsed_cookies['connect.sid']
    #sys.puts sys.inspect connect_sid

    #if connect_sid then session_store.get connect_sid, (error, session) ->
    #    true

    # TODO: Send new data
    meeting = VIE.EntityManager.getByJSONLD
        "@": "<#meeting>"
        a: "<mgd:event>"
    meeting.fetch
        success: (item) ->
            client.send item.toJSONLD()
            
    meetingComments = new VIE.RDFEntityCollection
    meetingComments.predicate = "sioc:has_container"
    meetingComments.object = "#meeting-comments"
    meetingComments.comparator = (item) ->
        itemDate = new Date item.get "dc:created"
        itemIndex = 0
        meetingComments.pluck("dc:created").forEach (date, index) ->
            if itemDate.getTime() > new Date(date).getTime()
                itemIndex = index + 1
        return itemIndex
    meetingComments.bind "add", (item) ->
        client.send item.toJSONLD()
    meetingComments.fetch()

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
