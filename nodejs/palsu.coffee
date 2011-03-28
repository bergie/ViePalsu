express = require 'express'
io = require 'socket.io'
Backbone = require 'backbone'
VIE = require '../js/vie.js'
require './vie-redis.coffee'
fs = require 'fs'
jQuery = require 'jquery'

server = express.createServer()
server.configure -> 
    # Our CSS files need the LessCSS compiler
    server.use express.compiler
        src: process.cwd()
        enable: ['less']
    # Serve static files from /styles and /js
    server.use '/styles', express.static "#{process.cwd()}/styles"
    server.use '/js', express.static "#{process.cwd()}//js"

# Serve the index file for /
server.get '/', (request, response) ->
    response.sendfile "#{process.cwd()}/index.html"

# Serve the index file for /
server.get '/meetings', (request, response) ->
    return fs.readFile "#{process.cwd()}/meetings.html", "utf-8", (err, data) ->
        html = jQuery data
        # Find RDFa entities and load them
        VIE.RDFaEntities.getInstances html
        # Get the Calendar object
        calendar = VIE.EntityManager.getBySubject '/meetings'
        
        # Query for events that have the calendar as component
        events = calendar.get 'cal:has_component'
        events.predicate = "cal:component"
        events.object = calendar.id
        return events.fetch
            success: (eventCollection) ->
                VIE.cleanup()
                data = data.replace(data.substring(data.indexOf('<body'),data.lastIndexOf('</body')).replace(/^[^>]+>/,''), jQuery('body', html).html())
                return response.send data

server.get '/foo', (req, resp) ->
    html = jQuery('html')
    jQuery("<h1>test passes</h1>").appendTo("body", html)
    resp.send jQuery(html).html()

server.listen(8002)

# ## Handling sockets
socket = io.listen server

# Handle a new connected client
socket.on 'connection', (client) ->
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
