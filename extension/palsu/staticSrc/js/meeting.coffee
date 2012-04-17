jQuery(document).ready ->
  eventId = jQuery("body").attr("about")
  jQuery("#chat-history div[rev=\"sioc:has_container\"]").attr "about", eventId
  event = vie.entities.get eventId
  taskCollection = event.get 'rdfcal:hasTask'
  killPlaceholders taskCollection

  mentionCollection = event.get 'rdfcal:hasMention'
  killPlaceholders mentionCollection

  postCollection = event.get 'sioc:container_of'
  killPlaceholders postCollection
  killPlaceholders event.get 'rdfcal:attendee'

  taskCollection.bind "add", (task, task_list, options) ->
    return  if options.fromServer
    if task.id
      jQuery("[about=\"" + task.id + "\"] a").attr "href", task.id
      if task.get("rdfcal:completed") is 1 and not task.isNew()
        jQuery("[about=\"" + task.id + "\"]").addClass("task_status_completed").removeClass "task_status_active"
      else
        jQuery("[about=\"" + task.id + "\"]").addClass("task_status_active").removeClass "task_status_completed"
      jQuery("[about=\"" + task.id + "\"]").click ->
        uuid = false
        uuid = jQuery(this).attr("about")  if jQuery(this).attr("about")
        data = vie.entities.get uuid
        complete_status = data.get("rdfcal:completed")
        if complete_status is 1
          jQuery("[about=\"" + uuid + "\"]").addClass("task_status_active").removeClass "task_status_completed"
          data.set "rdfcal:completed": "0"
        else
          jQuery("[about=\"" + uuid + "\"]").addClass("task_status_completed").removeClass "task_status_active"
          data.set "rdfcal:completed": "1"
        data.save()
    task.save()

  mentionCollection.bind "add", (mention, mention_list, options) ->
    return  if options.fromServer
    mention.save()

  taskCollection.comparator = (item) ->
    dateComparator item, taskCollection

  taskCollection.forEach (task) ->
    task.bind "change", (event, calendar, options) ->
      if task.get("rdfcal:completed") is 1 and task.id
        jQuery("[about=\"" + task.id + "\"]").addClass("task_status_completed").removeClass "task_status_active"
      else
        jQuery("[about=\"" + task.id + "\"]").addClass("task_status_active").removeClass "task_status_completed"

    if task.get("rdfcal:completed") is 1 and task.id
      jQuery("[about=\"" + task.id + "\"]").addClass("task_status_completed").removeClass "task_status_active"
    else
      jQuery("[about=\"" + task.id + "\"]").addClass("task_status_active").removeClass "task_status_completed"
    jQuery("[about=\"" + task.id + "\"] a").attr "href", task.id  if task.id
    jQuery("[about=\"" + task.id + "\"] span[property=\"rdfcal:name\"]").each (index, value) ->
      jQuery(value).parents("li").remove()  if jQuery(value).text() is "rdfcal:name"

  jQuery(".task_complete_action").click ->
    uuid = false
    uuid = jQuery(this).parent().attr("about")  if jQuery(this).parent().attr("about")
    data = vie.entities.get uuid
    complete_status = data.get("rdfcal:completed")
    if complete_status is 1
      jQuery("[about=\"" + uuid + "\"]").addClass("task_status_active").removeClass "task_status_completed"
      data.set "rdfcal:completed": "0"
    else
      jQuery("[about=\"" + uuid + "\"]").addClass("task_status_completed").removeClass "task_status_active"
      data.set "rdfcal:completed": "1"
    data.save()

  jQuery('#chat-input .ui-widget-content').hallo
    placeholder: 'Write something for the chat'
  jQuery('#chat-input button').click ->
    date = new Date
    newPost =
      'sioc:content': jQuery('#chat-input .ui-widget-content').hallo 'getContents'
      'dc:created': date.toISOString()
      'sioc:has_container': event.getSubject()
    postCollection.create newPost
