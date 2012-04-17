handleEvent = (event) ->
  event.url = event.getSubjectUri()
  event.url = "/m/" + encodeURIComponent(event.id) if event.getSubjectUri().substr(0, 4) is "urn:"
  console.log event.url, event.getSubjectUri()
  eventQ = "[about=\"#{event.getSubjectUri()}\"]"
  jQuery("#{eventQ} a").attr "href", event.url
  jQuery("#{eventQ} span[property=\"dc:created\"]").remove()
  jQuery("#{eventQ} abbr.easydate").attr("title", event.get("dc:created")).click ->
    jQuery("#{eventQ} div[property=\"mgd:agenda\"]").slideToggle()
  jQuery("#{eventQ} div[property=\"mgd:agenda\"]").html "<p>No agenda defined.</p>"  if jQuery("#{eventQ} div[property=\"mgd:agenda\"]").text() is "mgd:agenda"

jQuery(document).ready ->
  calendar = vie.entities.get 'urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66'
  eventCollection = calendar.get 'rdfcal:has_component'
  eventCollection.bind "add", (event, calendar, options) ->
    console.log "add", event.getSubjectUri()
    jQuery("div[property=\"mgd:agenda\"]").slideUp()
    handleEvent event
    return event.save() unless options.fromServer
    jQuery("[about=\"#{event.getSubjectUri()}\"] div[property=\"mgd:agenda\"]").slideDown()

  eventCollection.comparator = (item) ->
    dateComparator item, eventCollection

  killPlaceholders eventCollection

  mcounter = 0
  eventCollection.each (event) ->
    handleEvent event
    jQuery("[about=\"#{event.getSubjectUri()}\"] div[property=\"mgd:agenda\"]").hide() if mcounter > 0
    mcounter++

  jQuery("#eventadd").click ->
    eventTitle = jQuery("#newevent").attr("value")
    return  unless eventTitle
    date = new Date()
    eventCollection.add
      'rdfcal:summary': eventTitle
      'dc:created': date.toISOString()
      '@subject': window.location.href + "/" + eventCollection.length

    jQuery("#newevent").attr "value", ""

  jQuery(".easydate").easydate()
