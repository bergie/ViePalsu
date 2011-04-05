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
querystring = require 'querystring'
eyes = require 'eyes'
#xml2js = require 'xml2js'
xml = require "node-xml/lib/node-xml";

#require "../deps/aloha-editor/src/plugin/vie2/VIE-2/lib/jquery/1.4/jquery-1.4.4.min.js"
#require "../deps/aloha-editor/src/plugin/vie2/VIE-2/lib/jquery-ui/1.8/js/jquery-ui-1.8.11.custom.min.js"
#require "../deps/aloha-editor/src/plugin/vie2/VIE-2/lib/rdfquery/latest/jquery.rdfquery.rules.js"
#require "../deps/aloha-editor/src/plugin/vie2/VIE-2/src/core/core.js"
#require "../deps/aloha-editor/src/plugin/vie2/VIE-2/src/core/util.js"
#require "/deps/aloha-editor/src/plugin/vie2/VIE-2/src/core/connector.js"
#require "/deps/aloha-editor/src/plugin/vie2/VIE-2/src/core/mapping.js"


# ##
cfg = {}
cfg.twitterConsumerKey = '2GXBcCyhecaX1hstqcxsg'
cfg.twitterConsumerSecret = 'KPHeWQYZxiIEcM9eYrt3iHfmoessX2Ld5cpGx07goQ'
cfg.port = 8002
# ##

user = {}
user.username = 'guest'
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
    server.use browserify
        require: [ 'jquery-browserify' ]
    
    server.use connect.cookieParser()
    server.use connect.bodyParser()

    # oAuth with twitter
    if !cfg.twitterConsumerKey then sys.puts 'Error: No twitterConsumerKey'

    server.use connect.session
        secret: 'vie palsu app'
        store: session_store
    server.use auth [auth.Twitter
            consumerKey: cfg.twitterConsumerKey
            consumerSecret: cfg.twitterConsumerSecret]
     
     server.set 'view options', { layout: false }

jsdom.defaultDocumentFeatures =
    FetchExternalResources: false, 
    ProcessExternalResources: false


# Serve the home page
server.get '/', (request, response) ->
    sys.puts sys.inspect request.getAuthDetails()
    if request.session?.auth?.user? then user = request.session.auth.user
    if request.isAuthenticated() then return response.redirect '/dashboard' else return response.redirect '/signin'
    true

server.get '/about', (request, response) ->
    response.sendfile "#{process.cwd()}/templates/about.html"
    true

server.get '/signin', (request,response) ->
    if request.session?.auth?.user? then user = request.session.auth.user
    if request.isAuthenticated() then return response.redirect '/dashboard'
    #doc = new Document()
    #currentElement = doc
    totalElements = 0
    
    request.authenticate ['twitter'], (error, authenticated) ->
        if request.isAuthenticated()
            if request.session?.auth?.user? then user = request.session.auth.user
            rdfXmlUrl = "http://semantictweet.com/" + user.username + "/show"

            ProxyRequest {uri:rdfXmlUrl}, (error, ProxyResponse, body) ->
                if !error and ProxyResponse.statusCode == 200
                    parser = new xml.SaxParser (cb) ->
                        cb.onStartDocument () ->
                            sys.puts 'start xml parsing'
                        cb.onEndDocument () ->
                            sys.puts 'end xml parsing'
                            #sys.puts doc.getElementsByTagName("*").length === totalElements ? "success" : "fail");
                        cb.onError (msg) ->
                            sys.puts('<ERROR>'+JSON.stringify(msg)+"</ERROR>")

                        cb.onStartElementNS (elem, attrs, prefix, uri, namespaces) ->
                            totalElements++
                            #jAttrs = JSON.parse(attrs)
                            #element = doc.createElement(elem)
                            #currentElement.appendChild(element)
                            #currentElement = element
                            #console.log(attrs)
                            #predicate = attrs[0]
                            #eyes.inspect(jAttrs)
                            #console.log("Predicate", predicate)
                            #console.log("Object", predicate[0])
                            #console.log("Object", predicate[0])
                            #console.log(attrs['rdf:resource'])
                            #console.log(attrs[]['rdf:resource'])
                            #sys.puts "=> Started: " + elem + " (Attributes: " + JSON.stringify(attrs) + " )"
                            #if elem == "img" then user.image = jAttrs[["rdf:resource"]]
                            #if elem == "homepage" then user.homepage = jAttrs[["rdf:resource"]]
                            
                            #test = (x) -> x
                            #cubes = (test num for num in attrs)
                            #eyes.inspect(cubes)
                            #eyes.inspect(test)
                            #eyes.inspect(test)
                            #eyes.inspect(test)

                        cb.onEndElementNS (elem, prefix, uri) ->
                            #currentElement = currentElement.parentNode
                            sys.puts "<= End: " + elem + " uri="+uri + "\n"

                        cb.onCharacters (chars) ->
                            if chars.length > 0 then sys.puts '<CHARS>'+chars+"</CHARS>"

                        cb.onCdata (cdata) ->
                            sys.puts '<CDATA>'+cdata+"</CDATA>"

                        cb.onComment (msg) ->
                            sys.puts '<COMMENT>'+msg+"</COMMENT>"

                        cb.onWarning (msg) ->
                            sys.puts '<WARNING>'+msg+"</WARNING>"
                            
                    parser.parseString(body)
                    eyes.inspect(body)
                    eyes.inspect(user)
                    #eyes.inspect(result)
                    return response.redirect '/dashboard'
                else
                    rdfXml = null
                    # write info message about error
                    return response.redirect '/about'
            
            #return response.redirect '/dashboard'
    true

server.get '/signout', (request, response) ->
    user.username = 'guest'
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

# Serve the list of meetings for /
server.get '/dashboard', (request, response) ->
    eyes.inspect(user)
    if user.username == 'guest' then return response.redirect '/signin'
    return fs.readFile "#{process.cwd()}/templates/index.html", "utf-8", (err, data) ->
        document = jsdom.jsdom data
        window = document.createWindow()
        jQ = jQuery.create window

        # Write user data
        jQ('#account [property="foaf\\:nick"]').text(user.username)
                
        # Find RDFa entities and load them
        VIE.RDFaEntities.getInstances jQ "*"
        # Get the Calendar object
        calendar = VIE.EntityManager.getBySubject 'urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66'
        
        if !calendar
            VIE.cleanup()
            # todo return error message
            console.log "Error loading calendar."
            return response.send window.document.innerHTML

        # Query for events that have the calendar as component
        events = calendar.get 'rdfcal:has_component'
        events.predicate = "rdfcal:component"
        events.object = calendar.id
        return events.fetch
            success: (eventCollection) ->
                VIE.cleanup()
                return response.send window.document.innerHTML
            error: (collection, error) ->
                VIE.cleanup()
                return response.send window.document.innerHTML

server.get '/meeting/:uuid', (request, response) ->
    if user.username == 'guest' then return response.redirect '/signin'
    return fs.readFile "#{process.cwd()}/templates/meeting.html", "utf-8", (err, data) ->
        document = jsdom.jsdom data
        window = document.createWindow()
        jQ = jQuery.create window

        # Write user data
        jQ('#account [property="foaf\\:nick"]').text(user.username)

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
                    itemDate = new Date item.get "dc:created"
                    itemIndex = 0
                    posts.pluck("dc:created").forEach (date, index) ->
                        if itemDate.getTime() > new Date(date).getTime()
                            itemIndex = index + 1
                    return itemIndex

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
                #clientObject.header('Access-Control-Allow-Origin', '*')
                clientObject.send data

###
404 handler -- http://42blue.de/webstandards/kleiner-formhandler-in-nodejs
function startServer() {
  http.createServer(function (req, res) {
    var uri = url.parse(req.url).pathname; //Dateiname
    var filename = path.join(process.cwd(), uri); //Pfad und Filename
    if (uri = '/formhandler') {
      readFormSubmit(req, res);         
    } else {
      path.exists(filename, function (exists) {	
      if(!exists) {  
	    res.writeHead(404, { "Content-Type": "text/plain"});
	    res.end("Not Found");
      } else {
        readFile(req, res, uri);
      }
    });
    }    
  }).listen(PORT, HOST);
  console.log('Server running');
} 
startServer();
###
