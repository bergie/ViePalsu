io = require 'socket.io'

exports.registerSockets = (server, vie) ->
  socket = io.listen server
  socket.on 'connection', (client) ->
    client.on 'update', (data) ->
      client.broadcast.emit 'update', data
