nodext = require 'nodext'

class Palsu extends nodext.Extension
  name: 'Palsu'
  config: {}

  configure: (server) ->

  registerRoutes: (server) ->
    routes = require './routes'
    routes.registerRoutes server, @config.urlPrefix

exports.extension = Palsu
