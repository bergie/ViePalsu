nodext = require 'nodext'
express = require 'express'
fs = require 'fs'

class Palsu extends nodext.Extension
  name: 'Palsu'
  config: {}

  makeDir: (dir, cb) ->
    fs.stat dir, (err, stat) ->
      return cb() unless err
      fs.mkdir dir, 0o0777, cb

  configure: (server) ->
    @makeDir "#{__dirname}/static/js", ->
      console.log "Created static JS directory"

    server.use "/static/#{@name}", express.compiler
      src: "#{__dirname}/staticSrc"
      dest: "#{__dirname}/static"
      enable: [
        'coffeescript'
      ]
    server.use "/static/#{@name}", express.static "#{__dirname}/static"

    server.use express.cookieParser()
    server.use express.bodyParser()

    sockets = require './sockets'
    sockets.registerSockets server

  registerRoutes: (server) ->
    routes = require './routes'
    routes.registerRoutes server, @config.urlPrefix, @config.idPrefix

exports.extension = Palsu
