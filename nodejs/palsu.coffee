express = require 'express'
io = require 'socket.io'
Backbone = require 'backbone'
VIE = require '../js/vie.js'
redis = require 'redis'

toUUID = () ->
    S4 = () -> ((1 + Math.random()) * 0x10000|0).toString(16).substring 1
    "#{S4()}#{S4()}-#{S4()}-#{S4()}-#{S4()}-#{S4()}#{S4()}#{S4()}"

Backbone.sync = (method, model, success, error) ->
    redisClient = redis.createClient()
    
    if method is 'update'
        if model.id.substr(0, 7) is "_:bnode"
            # Generate UUID as the URI of the object
            model.id = "urn:uuid:#{toUUID()}"
            console.log "Anonymous entity, saving with URI #{model.id}"
            
        for predicate, object of model.toJSONLD()
            if predicate is "@"
                continue
            
            if VIE.RDFa._isReference object
                if typeof object is "string"
                    object = [object]
                for reference in object
                    reference = VIE.RDFa._fromReference reference
                    console.log "Adding reference #{predicate}-#{reference} for #{model.id}"
                    redisClient.sadd "#{predicate}-#{reference}", model.id

            redisClient.hset model.id, predicate, JSON.stringify object
            
    if method is 'read'
        if model instanceof VIE.RDFEntityCollection
            if model.predicate and model.object
                redisClient.smembers "#{model.predicate}-#{model.object}", (err, item) ->
                    if err
                        console.log err
                        error err
                    else if item
                        for subject in item
                            itemInstance = VIE.EntityManager.getByJSONLD
                                "@": subject
                            itemInstance.fetch
                                success: (item) -> model.add(item)

            else
                throw "When seeking Collections, you must provide predicate and object"

        else if model.id
            console.log "Retrieving entity #{model.id}"
            redisClient.hgetall model.id, (err, item) ->
                if err
                    console.log err
                    error err
                else if item
                    jsonld =
                        "@": model.id
                    for predicate, object of item
                        jsonld[predicate] = JSON.parse object
                    success VIE.EntityManager.getByJSONLD jsonld
        else
            throw "Unknown entity, please provide ID"

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
