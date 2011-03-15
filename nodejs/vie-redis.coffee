redis = require 'redis'
Backbone = require 'backbone'
VIE = require '../js/vie.js'

Backbone.sync = (method, model, success, error) ->
    redisClient = redis.createClient()
    
    toUUID = () ->
        S4 = () -> ((1 + Math.random()) * 0x10000|0).toString(16).substring 1
        "#{S4()}#{S4()}-#{S4()}-#{S4()}-#{S4()}-#{S4()}#{S4()}#{S4()}"
    
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
