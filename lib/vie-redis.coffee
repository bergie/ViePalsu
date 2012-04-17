redis = require 'redis'
Backbone = require 'backbone'
{VIE} = require "#{__dirname}/../extension/palsu/static/deps/vie-2.0.0.js"

isEmpty = (object) ->
    for key of object
        return false
    return true

redisClient = redis.createClient()

Backbone.sync = (method, model, options) ->
    toUUID = () ->
        S4 = () -> ((1 + Math.random()) * 0x10000|0).toString(16).substring 1
        "#{S4()}#{S4()}-#{S4()}-#{S4()}-#{S4()}-#{S4()}#{S4()}#{S4()}"

    if method is 'update'
        console.log "Update entity: ", model.id
        if model.id.substr(0, 7) is "_:bnode"
            # Generate UUID as the URI of the object
            model.id = "urn:uuid:#{toUUID()}"
            console.log "Anonymous entity, saving with URI #{model.id}"
        
        console.log "backbone update: ", model.toJSONLD()
        for predicate, object of model.toJSONLD()
            if predicate is "@"
                continue
            if VIE.RDFa._isReference(object)
                if typeof object is "string"
                    object = [object]
                for reference in object
                    reference = VIE.RDFa._fromReference reference
                    console.log "Adding reference #{predicate}-#{reference} for #{model.id}"
                    redisClient.sadd "#{predicate}-#{reference}", model.id

            redisClient.hset model.id, predicate, JSON.stringify object

    if method is 'read'
        if model instanceof Backbone.Collection
            if model.predicate and model.object
                console.log "Retrieving #{model.predicate} connected to #{model.object}"
                return redisClient.smembers "#{model.predicate}-#{model.object}", (err, subjects) ->
                    if err
                        console.log err
                        return options.error err
                    else if subjects
                        if subjects.length is 0
                            return options.error "Not found"

                        instances = []
                        for subject in subjects
                            itemInstance = VIE.EntityManager.getByJSONLD
                                "@": subject
                            itemInstance.fetch
                                success: (item) ->
                                    instances.push item
                                    if instances.length >= subjects.length
                                        options.success instances
            else
                throw "When seeking Collections, you must provide predicate and object"

        else if model.id
            console.log "Retrieving entity #{model.id}"
            redisClient.hgetall model.id, (err, item) ->
                if err
                    console.log err
                    options.error err
                else if item
                    if isEmpty item
                        return options.error "Not found"
                    jsonld =
                        "@": model.id
                    for predicate, object of item
                        jsonld[predicate] = JSON.parse object
                    options.success VIE.EntityManager.getByJSONLD jsonld
        else
            console.log model
            throw "Unknown entity, please provide ID"
