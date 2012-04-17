document.write "<script type=\"text/javascript\" src=\"/static/Palsu/deps/underscore-min.js\"></script>"
document.write "<script type=\"text/javascript\" src=\"/static/Palsu/deps/backbone-min.js\"></script>"
document.write "<script type=\"text/javascript\" src=\"/static/Palsu/deps/vie-2.0.0.js\"></script>"
document.write "<script type=\"text/javascript\" src=\"/socket.io/socket.io.js\"></script>"
document.write "<script type=\"text/javascript\" src=\"/static/Palsu/deps/jquery.easydate-0.2.4.min.js\"></script>"
document.write "<script type=\"text/javascript\" src=\"/static/Palsu/deps/jquery-ui-1.8.18.custom.min.js\"></script>"
document.write "<script type=\"text/javascript\" src=\"/static/Palsu/deps/hallo-min.js\"></script>"
document.write "<script type=\"text/javascript\" src=\"/static/Palsu/deps/create-min.js\"></script>"

window.killPlaceholders = (entities) ->
  toRemove = []
  entities.forEach (entity) ->
    if entity.getSubjectUri().substr(0, 15) is 'mgd:placeholder'
      toRemove.push entity
  for entity in toRemove
    entities.remove entity

window.dateComparator = (item, collection) ->
  itemIndex = 0
  itemDate = item.get("dc:created")
  return -1  if typeof itemDate is "undefined"
  itemDate = new Date(itemDate)
  collection.pluck("dc:created").forEach (date, index) ->
    return true  if typeof date is "undefined"
    itemIndex = index + 1  if itemDate.getTime() > new Date(date).getTime()

  itemIndex

window.toUUID = ->
  S4 = -> ((1 + Math.random()) * 0x10000|0).toString(16).substring 1
  "#{S4()}#{S4()}-#{S4()}-#{S4()}-#{S4()}-#{S4()}#{S4()}#{S4()}"

jQuery(document).ready ->
  window.vie = new VIE
  vie.use new vie.RdfaService
  vie.namespaces.add 'dc', 'http://purl.org/dc/elements/1.1/'
  vie.namespaces.add 'mgd', 'http://www.midgard-project.org/midgard2/10.05'

  socket = io.connect()
  updateEntity = (data) ->
    inverseProperties =
      "sioc:has_container": "sioc:container_of"
      "rdfcal:attendeeOf": "rdfcal:attendee"
      "rdfcal:taskOf": "rdfcal:hasTask"
      "rdfcal:mentionOf": "rdfcal:hasMention"
      "rdfcal:component": "rdfcal:has_component"

    entity = vie.entities.addOrUpdate data,
      overrideAttributes: true
    for from, to of inverseProperties
      container = entity.get(from)
      continue unless container and container.get
      containerCollection = container.get(to)
      continue unless containerCollection
      if containerCollection.indexOf(entity) is -1
        containerCollection.add entity,
          fromServer: true

  socket.on "connect", ->
    $("#disconnectMessage").fadeOut()
    socket.emit "onlinestate", jQuery("#account").attr("about")

  socket.on "onlinestate", (user) ->
    updateEntity user

  socket.on "update", (data) ->
    updateEntity data

  socket.on "disconnect", ->
    $("#disconnectMessage").fadeIn()

  Backbone.sync = (method, model, options) ->
    json = model.toJSONLD()
    socket.emit "update", json

  vie.load
    element: 'body'
  .from('rdfa')
  .execute()

  jQuery('body').midgardEditable
    vie: vie
    disabled: false
    enableCollectionAdd: false
    toolbarState: 'min'
  jQuery('body').bind 'midgardeditablechanged', (event, options) ->
    options.instance.save()
