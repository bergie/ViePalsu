{VIE} = require "#{__dirname}/static/deps/vie-2.0.0.js"
fs = require 'fs'
jsdom = require 'jsdom'
jQuery = require 'jquery'

jsdom.defaultDocumentFeatures =
  FetchExternalResources: false,
  ProcessExternalResources: false

exports.writeUser = (user, jQuery) ->
  jQuery('#account [property="foaf\\:nick"]').text user.displayName
  jQuery('#account').attr 'about', "http://twitter.com/#{user.username}"
  jQuery('#account [property="foaf\\:name"]').text user.name
  jQuery('#account [rel="foaf\\:img"] img').attr
    src: user.image
    title: "Picture of #{user.name}"
    alt: "Picture of #{user.name}"

exports.dateComparator = (item, collection) ->
  itemDate = new Date item.get "dc:created"
  itemIndex = 0
  for created, index in collection.pluck 'dc:created'
    if itemDate.getTime() > new Date(created).getTime()
      itemIndex = index + 1
  itemIndex

exports.dateComparatorChronological = (item, collection) ->
  itemDate = new Date item.get "dc:created"
  itemIndex = 0
  for created, index in collection.pluck 'dc:created'
    if itemDate.getTime() < new Date(created).getTime()
      itemIndex = index + 1
  itemIndex

exports.prepareTemplate = (file, req, cb) ->
  fs.readFile file, 'utf-8', (err, data) ->
    return cb err, null, null if err
    document = jsdom.jsdom data
    window = document.createWindow()
    jQ = jQuery.create window
    exports.writeUser req.user, jQ if req.user
    cb null, window, jQ

exports.loadTemplateEntities = (vie, window, jQ, cb) ->
  vie.load
    element: jQ '*'
  .from('rdfa')
  .execute()
  .success (entities) ->
    cb null, entities
  .fail (error) ->
    cb error, null

exports.prepareTemplateEntitized = (file, req, vie, cb) ->
  exports.prepareTemplate file, req, (err, window, jQ) ->
    return cb err, null, null, null if err
    exports.loadTemplateEntities vie, window, jQ, (err, entities) ->
      return cb err, null, null, null if err
      cb null, entities, window, jQ

exports.getVie = ->
  vie = new VIE
  vie.use new vie.RdfaService
    attributeExistenceComparator: ''
  , 'rdfa'
  vie.namespaces.add 'dc', 'http://purl.org/dc/elements/1.1/'
  vie.namespaces.add 'mgd', 'http://www.midgard-project.org/midgard2/10.05'
  vie

exports.fetchTasksForEvent = (event, callback) ->
  return if event.isNew()
  events = event.get "rdfcal:hasTask"

  return callback() unless events

  events.predicate = 'http://www.w3.org/2002/12/cal#taskOf'
  events.object = event.getSubjectUri()
  events.comparator = (item) -> exports.dateComparator item, events
  events.fetch
    add: true
    success: (taskCollection) ->
      console.log "Got task collection " + taskCollection.length
      callback()
    error: ->
      console.log "Failed to get task collection"
      callback()
