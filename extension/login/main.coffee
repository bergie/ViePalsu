nodext = require 'nodext'
http = require 'express'

class Login extends nodext.Extension
  name: "Login"
  authentication: null
  config: {}

  configure: (server, models) ->
    redis = require('connect-redis') http

    server.use http.favicon "#{__dirname}/../palsu/static/img/favicon.ico"
    server.use http.logger()
    server.use http.cookieParser()
    server.use http.session
      secret: @config.session.secret
      store: new redis

    @authentication = require('./authentication').getAuthentication @config
    server.use @authentication.initialize()
    server.use @authentication.session()

    server.use '/', (req, res, next) =>
      return next() if req.isAuthenticated()

      if req.path is '/'
        return next()
      if req.path is "#{@config.urlPrefix}linkedin"
        return next()
      if req.path is "#{@config.urlPrefix}linkedin/callback"
        return next()
      if req.path.substr(0, 7) is '/static'
        return next()
      @authentication.authenticate('linkedin') req, res, next

  registerRoutes: (server) ->
    routes = require './routes'
    routes.registerRoutes server, @config.urlPrefix, @authentication

exports.extension = Login
