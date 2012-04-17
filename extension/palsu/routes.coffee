utils = require "#{__dirname}/utils"
vieRedis = require "#{__dirname}/../../lib/vie-redis"
{auto} = require 'async'
fs = require 'fs'

exports.registerRoutes = (server, prefix) ->
  server.param 'task_id', (req, res, next, id) ->
    unless id.substr(0, 4) is 'urn:'
      req.params.task_id = "http://localhost:8001/t/#{id}"
    next()
  server.param 'meeting_id', (req, res, next, id) ->
    unless id.substr(0, 4) is 'urn:'
      req.params.meeting_id = "http://localhost:8001/m/#{id}"
    next()

  server.get prefix, (req, res) ->
    fs.readFile "#{__dirname}/views/welcome.html", 'utf-8', (err, data) ->
      return res.send 404 if err
      res.send data

  server.get "#{prefix}t", (req, res) ->
    vie = utils.getVie()
    vieRedis.createClient vie
    utils.prepareTemplateEntitized "#{__dirname}/views/tasks.html", req, vie, (err, entities, window, jQuery) ->
      calendar = vie.entities.get 'urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66'
      return res.send 404 unless calendar
      events = calendar.get 'http://www.w3.org/2002/12/cal#has_component'
      events.comparator = (item) -> utils.dateComparatorChronological item, events
      events.predicate = 'http://www.w3.org/2002/12/cal#component'
      events.object = calendar.getSubjectUri()
      events.fetch
        add: true
        success: (eventCollection) ->
          fetched = 0
          eventCollection.forEach (event) ->
            utils.fetchTasksForEvent event, ->
              fetched++
              return unless fetched is eventCollection.length
              res.send window.document.innerHTML
        error: ->
          res.send window.document.innerHTML

  server.get "#{prefix}t/:task_id", (req, res) ->
    vie = utils.getVie()
    vieRedis.createClient vie
    utils.prepareTemplate "#{__dirname}/views/task.html", req, (err, window, jQuery) ->
      return res.send 404 if err

      # Write the Task identifier into the DOM
      jQuery('[typeof="rdfcal\\:Task"]').attr 'about', req.params.task_id

      utils.loadTemplateEntities vie, window, jQuery, (err, entities) ->
        task = vie.entities.get req.params.task_id
        return res.send 404 unless task
        task.fetch
          success: (task) ->
            res.send window.document.innerHTML
          error: ->
            res.send 404

  server.get "#{prefix}m", (req, res) ->
    vie = utils.getVie()
    vieRedis.createClient vie
    utils.prepareTemplateEntitized "#{__dirname}/views/meetings.html", req, vie, (err, entities, window) ->
      calendar = vie.entities.get 'urn:uuid:e1191010-5bb1-11e0-80e3-0800200c9a66'
      return res.send 404 unless calendar
      events = calendar.get 'http://www.w3.org/2002/12/cal#has_component'
      events.comparator = (item) -> utils.dateComparatorChronological item, events
      events.predicate = 'http://www.w3.org/2002/12/cal#component'
      events.object = calendar.getSubjectUri()
      events.fetch
        add: true
        success: (eventCollection) ->
          fetched = 0
          eventCollection.forEach (event) ->
            utils.fetchTasksForEvent event, ->
              fetched++
              return unless fetched is eventCollection.length
              res.send window.document.innerHTML
        error: ->
          res.send window.document.innerHTML

  server.get "#{prefix}m/:meeting_id", (req, res) ->
    vie = utils.getVie()
    vieRedis.createClient vie
    utils.prepareTemplate "#{__dirname}/views/meeting.html", req, (err, window, jQuery) ->
      return res.send 404 if err

      # Write the Task identifier into the DOM
      jQuery('[typeof="rdfcal\\:Vevent"]').attr 'about', req.params.meeting_id

      utils.loadTemplateEntities vie, window, jQuery, (err, entities) ->
        event = vie.entities.get req.params.meeting_id
        return res.send 404 unless event

        auto
          getEvent: (cb) ->
            event.fetch
              success: -> do cb
              error: -> do cb
          getPosts: [
            'getEvent'
            (cb) ->
              posts = event.get 'http://rdfs.org/sioc/ns#container_of'
              return cb() unless posts
              posts.predicate = 'http://rdfs.org/sioc/ns#has_container'
              posts.object = event.getSubjectUri()
              posts.comparator = (item) -> utils.dateComparator item, posts
              posts.fetch
                add: true
                success: (models) ->
                  do cb
                error: -> do cb
          ]
          getParticipants: [
            'getEvent'
            (cb) ->
              participants = event.get 'http://www.w3.org/2002/12/cal#attendee'
              return cb() unless participants
              participants.predicate = 'http://www.w3.org/2002/12/cal#attendeeOf'
              participants.object = event.getSubjectUri()
              participants.fetch
                add: true
                success: -> do cb
                error: -> do cb
          ]
          getTasks: [
            'getEvent'
            (cb) ->
              taskList = event.get 'http://www.w3.org/2002/12/cal#hasTask'
              return cb() unless taskList
              taskList.predicate = 'http://www.w3.org/2002/12/cal#taskOf'
              taskList.object = event.getSubjectUri()
              taskList.fetch
                add: true
                success: -> do cb
                error: -> do cb
          ]
          getMentions: [
            'getEvent'
            (cb) ->
              mentionList = event.get 'http://www.w3.org/2002/12/cal#hasMention'
              return cb() unless mentionList
              mentionList.predicate = 'http://www.w3.org/2002/12/cal#mentionOf'
              mentionList.object = event.getSubjectUri()
              mentionList.fetch
                add: true
                success: -> do cb
                error: -> do cb
          ]
          sendResponse: [
            'getEvent'
            'getPosts'
            'getParticipants'
            'getTasks'
            'getMentions'
            (cb) ->
              res.send window.document.innerHTML
              do cb
          ]
