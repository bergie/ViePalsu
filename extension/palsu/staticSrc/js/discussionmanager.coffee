ViePalsu = ViePalsu ? {}

ViePalsu.DiscussionManager =
  defaultMessage: "<p>Write your message here</p>"
  initInput: ->
    @chatInput = jQuery("#chat-input div")
    @chatInput.hallo
      plugins:
        halloformat: {}
        hallolists: {}
      placeholder: @defaultMessage

    jQuery("#chat-input button").button().click =>
      return true unless @chatInput.hallo 'isModified'

      newMessage = @chatInput.hallo 'getContents'
      return true unless newMessage

      date = new Date
      @collection.add
        '@subject': "urn:uuid:#{toUUID()}"
        "dc:creator": jQuery("#username").text()
        "foaf:depiction": [ "<" + jQuery("#account [rel=\"foaf\\:img\"] img").attr("src") + ">" ]
        "dc:created": date.toISOString()
        "sioc:content": newMessage

  autoScroll: (force) ->
    log = jQuery("#chat-history")
    if log.length > 0
      if log.scrollTop() + 100 >= log[0].scrollHeight - log.height() or force
        window.setTimeout (->
          log.scrollTop log[0].scrollHeight
        ), 10

  getEvent: -> vie.entities.get jQuery("body").attr 'about' 

  getCollection: ->
    event = @getEvent()
    @collection = event.get 'sioc:container_of'
    killPlaceholders @collection
    dman = @
 
    @collection.bind 'add', (postInstance, collectionInstance, options) ->
      dman.autoScroll()

      window.setTimeout (->
        jQuery("[typeof=\"sioc:Post\"]").each ->
          dman.updateDate this
      ), 20
      postInstance.save() unless options.fromServer

    @collection.comparator = (item) -> dateComparator item, dman.collection

  participate: ->
    attendees = undefined
    event = @getEvent()
    attendees = event.get 'rdfcal:attendee'
    attendees.bind 'add', (person, attendees, options) ->
      console.log person.toJSONLD()
      person.save() unless options.fromServer

    me = vie.entities.get jQuery('#account').attr 'about'
    attendees.add me if attendees.indexOf(me) is -1

  updateDate: (element) ->
    jQuery(".easydate", element).attr "title", jQuery("div[property=\"dc:created\"]", element).hide().text()
    jQuery(".easydate", element).easydate()

jQuery(document).ready ->
  jQuery("[typeof=\"sioc:Post\"]").each ->
    ViePalsu.DiscussionManager.updateDate this

  ViePalsu.DiscussionManager.initInput()
  ViePalsu.DiscussionManager.getCollection()
  ViePalsu.DiscussionManager.autoScroll true
  ViePalsu.DiscussionManager.participate()
