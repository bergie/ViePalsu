express = require 'express'
io = require 'socket.io'
Backbone = require 'backbone'
VIE = require '../js/vie.js'
redis = require 'redis'

Backbone.sync = (method, model, success, error) ->
    redisClient = redis.createClient()
    
    if method is 'update'
        if model.id is 'undefined'
            # Anonymous entity, save to Redis list based on type
            console.log "Saving anonymous entity #{model.type}"
            redisClient.rpush "anon-#{model.type}", JSON.stringify model.toJSONLD()
            redisClient.hset "anon-ontologies", model.type, true
        else
            # Identified object, save to Redis hash based on type
            console.log "Saving entity #{model.type} #{model.id}"
            redisClient.hset model.type, model.id, JSON.stringify model.toJSONLD()
            redisClient.hset 'ontologies', model.type, true
            
    if method is 'read'
        if model.id and model.type
            console.log "Retrieving entity #{model.type} #{model.id}"
            redisClient.hget model.type, model.id, (err, item) ->
                if err
                    console.log err
                    error err
                else if item
                    success VIE.EntityManager.getByJSONLD JSON.parse item

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

    client.on 'message', (data) ->
        if typeof data isnt 'object'
            # If we get a regular string from the user, we answer with Pong
            client.send "Pong"
            return

        # Generate a RDF Entity instance for the JSON-LD we got from the client
        modelInstance = VIE.EntityManager.getByJSONLD(data)
        #modelInstance.save()

        # Send the item back to everybody else
        for clientId, clientObject of socket.clients
            if clientObject isnt client
                console.log "Forwarding data to #{clientId}"
                clientObject.send data
