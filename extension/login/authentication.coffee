authentication = require 'passport'
{Strategy} = require 'passport-linkedin'
{VIE} = require "#{__dirname}/../palsu/static/deps/vie-2.0.0.js"
vieRedis = require "#{__dirname}/../../lib/vie-redis"

exports.getAuthentication = (config) ->
  vie = new VIE
  vie.namespaces.add 'foaf', 'http://xmlns.com/foaf/0.1/'
  vie.namespaces.add 'iks', 'http://www.iks-project.eu/#'

  profileToEntity = (profile) ->
    entity = vie.entities.addOrUpdate
      '@subject': "http://linkedin.com/#user/#{profile.id}"
      '@type': 'foaf:Person'
      'foaf:name': profile.displayName
    ,
      overrideAttributes: true
    entity

  apiKey = process.env.LINKEDINAPIKEY ? config.linkedIn.apiKey
  secretKey = process.env.LINKEDINSECRETKEY ? config.linkedIn.secretKey

  authentication.use new Strategy
    consumerKey: apiKey
    consumerSecret: secretKey
    callbackURL: config.linkedin.callbackURL
  , (token, tokenSecret, profile, done) ->
    done null, profileToEntity profile

  authentication.serializeUser (user, done) ->
    user.save {},
      success: ->
        done null, user.getSubjectUri()
      error: (err) -> done err, null

  authentication.deserializeUser (id, done) ->
    entity = vie.entities.addOrUpdate
      '@subject': id
    ,
      overrideAttributes: true
    entity.fetch
      success: ->
        done null, entity
      error: (err) ->
        done err, null

  authentication
