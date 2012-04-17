jQuery(document).ready ->
  calendar = vie.entities.get 'urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66'
  eventCollection = calendar.get 'rdfcal:has_component'
  eventCollection.bind "add", (event, calendar, options) ->
    jQuery("div[property=\"mgd:agenda\"]").slideUp()
    if event.id
      jQuery("[about=\"" + event.id + "\"] a").attr "href", event.id
      jQuery("[about=\"" + event.id + "\"] span[property=\"dc:created\"]").remove()
      jQuery("[about=\"" + event.id + "\"] abbr.easydate").attr "title", event.get("dc:created")
      jQuery("[about=\"" + event.id + "\"] .easydate").easydate()
      jQuery("[about=\"" + event.id + "\"] div[property=\"mgd:agenda\"]").slideDown()
      jQuery("[about=\"" + event.id + "\"] div[property=\"mgd:agenda\"]").html "<p>No agenda defined.</p>"  if jQuery("[about=\"" + event.id + "\"] div[property=\"mgd:agenda\"]").text() is "mgd:agenda"
    if options.fromServer
      jQuery("[about=\"" + event.id + "\"] div[property=\"mgd:agenda\"]").slideDown()
      return
    event.save()

  eventCollection.comparator = (item) ->
    dateComparator item, eventCollection

  mcounter = 0
  eventCollection.forEach (event) ->
    if event.getSubjectUri() is 'mgd:placeholder'
      eventCollection.remove event
      mcounter = 0
      return
    event.url = event.id
    event.url = "/m/" + encodeURIComponent(event.id)  if event.id.substr(0, 4) is "urn:"
    jQuery("[about=\"" + event.id + "\"] a").attr "href", event.url
    jQuery("[about=\"" + event.id + "\"] span[property=\"dc:created\"]").remove()
    jQuery("[about=\"" + event.id + "\"] abbr.easydate").attr("title", event.get("dc:created")).click ->
      jQuery("[about=\"" + event.id + "\"] div[property=\"mgd:agenda\"]").slideToggle()

    jQuery("[about=\"" + event.id + "\"] div[property=\"mgd:agenda\"]").html "<p>No agenda defined.</p>"  if jQuery("[about=\"" + event.id + "\"] div[property=\"mgd:agenda\"]").text() is "mgd:agenda"
    jQuery("[about=\"" + event.id + "\"] div[property=\"mgd:agenda\"]").hide()  if mcounter > 0
    mcounter++

  jQuery("#eventadd").click ->
    eventTitle = jQuery("#newevent").attr("value")
    return  unless eventTitle
    date = new Date()
    eventCollection.add
      "rdfcal:summary": eventTitle
      "dc:created": date.toISOString()
      id: window.location.href + "/" + eventCollection.length

    jQuery("#newevent").attr "value", ""

  jQuery(".easydate").easydate()
