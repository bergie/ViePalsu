io = require 'socket.io'
utils = require './utils'
vieRedis = require "#{__dirname}/../../lib/vie-redis"

exports.registerSockets = (server) ->
  vie = utils.getVie()
  vieRedis.createClient vie

  socket = io.listen server
  socket.on 'connection', (client) ->
    client.on 'update', (data) ->
      entity = vie.entities.addOrUpdate data 
      console.log "Saving", entity.toJSONLD()
      entity.save()

      client.broadcast.emit 'update', data
