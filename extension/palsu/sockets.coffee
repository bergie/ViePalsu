io = require 'socket.io'
utils = require './utils'
vieRedis = require "#{__dirname}/../../lib/vie-redis"

exports.registerSockets = (server) ->
  vie = utils.getVie()
  vieRedis.createClient vie

  socket = io.listen server
  socket.on 'connection', (client) ->
    client.on 'update', (data) ->
      entity = vie.entities.addOrUpdate data,
        overrideAttributes: true
      console.log "Saving", entity.toJSONLD()
      entity.save {},
        success: (model) ->
          client.broadcast.emit 'update', model.toJSONLD()
        error: ->
          console.log "ERROR saving"
