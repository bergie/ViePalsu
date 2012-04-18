io = require 'socket.io'
utils = require './utils'
vieRedis = require "#{__dirname}/../../lib/vie-redis"

exports.registerSockets = (server, config) ->
  vie = utils.getVie()
  vieRedis.createClient vie

  socket = io.listen server

  socketConf = config.socket ? {}
  socket.configure ->
    socket.set param, value for param, value of socketConf

  socket.on 'connection', (client) ->
    client.on 'onlinestate', (identifier) ->
      user = vie.entities.addOrUpdate
        '@subject': identifier
      ,
        overrideAttributes: true
      client.userInstance = user
      user.fetch
        success: ->
          user.set
            'iks:online': 1
          user.save()
          socket.sockets.emit 'onlinestate', user.toJSONLD()

    client.on 'update', (data) ->
      entity = vie.entities.addOrUpdate data,
        overrideAttributes: true
      console.log "Saving", entity.toJSONLD()
      entity.save {},
        success: (model) ->
          client.broadcast.emit 'update', model.toJSONLD()
        error: ->
          console.log "ERROR saving"

    client.on 'disconnect', ->
      return unless client.userInstance

      client.userInstance.set
        'iks:online': 0
      client.userInstance.save()

      socket.sockets.emit 'onlinestate', client.userInstance.toJSONLD()
