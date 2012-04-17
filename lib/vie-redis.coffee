redis = require 'redis'
Backbone = require 'backbone'

isEmpty = (object) ->
  for key of object
    return false
  return true

toUUID = ->
  S4 = -> ((1 + Math.random()) * 0x10000|0).toString(16).substring 1
  "#{S4()}#{S4()}-#{S4()}-#{S4()}-#{S4()}-#{S4()}#{S4()}#{S4()}"

exports.createClient = (vie, config) ->
  redisClient = redis.createClient()

  Backbone.sync = (method, model, options) ->
    method = 'update' if method is 'create'
    if method is 'update'
      console.log "Update entity: ", model.getSubjectUri()
      if model.isNew()
        # Generate UUID as the URI of the object
        model['@subject'] = model.id = "urn:uuid:#{toUUID()}"
        console.log "Anonymous entity, saving with URI #{model.getSubjectUri()}"
        
      console.log "backbone update: ", model.toJSONLD()
      for predicate, object of model.toJSONLD()
        continue if predicate is '@subject'
        predicate = model.fromReference predicate
        continue unless predicate and model.getSubjectUri()
        if model.isReference object
          if typeof object is 'string'
            object = [object]
          for reference in object
            reference = model.fromReference reference
            console.log "Adding reference #{predicate}-#{reference} for #{model.getSubjectUri()}"
            redisClient.sadd "#{predicate}-#{reference}", model.getSubjectUri()
        redisClient.hset model.getSubjectUri(), predicate, JSON.stringify(object), ->
      options.success model

    if method is 'read'
      if model instanceof Backbone.Collection
        model.bind 'add', (entity, col) ->
          console.log "Adding #{entity.getSubjectUri()} to collection"
        if model.predicate and model.object
          console.log "Retrieving #{model.predicate} connected to #{model.object}"
          return redisClient.smembers "#{model.predicate}-#{model.object}", (err, subjects) ->
            return options.error err if err
            subjects = subjects ? []
            return options.error 'Not found' if subjects.length is 0
            instances = []
            for subject in subjects
              itemInstance = vie.entities.addOrUpdate
                '@subject': subject
              ,
                 overrideAttributes: true
              itemInstance.fetch
                success: (item) ->
                  instances.push item
                  if instances.length >= subjects.length
                    options.success instances
                error: (error) ->
                  console.log "Failed to fetch #{model.object} #{model.predicate} #{subject}"
                  options.error err
        else
          throw "When seeking Collections, you must provide predicate and object"

      throw "Unknown entity, please provide ID" unless model.getSubjectUri()

      console.log "Retrieving entity #{model.getSubjectUri()}"
      redisClient.hgetall model.getSubjectUri(), (err, item) ->
        return options.error err if err
        item = item ? {}
        return options.error "Not found" if isEmpty item

        jsonld =
          '@subject': model.getSubjectUri()
        for predicate, object of item
          jsonld[predicate] = JSON.parse object
        options.success vie.entities.addOrUpdate jsonld,
          overrideAttributes: true
