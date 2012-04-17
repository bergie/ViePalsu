jQuery ($) ->
  resize = ->
    history.css "top", agenda.outerHeight(true)
    history.css "bottom", input.outerHeight(true)
  agenda = $("#agenda")
  history = $("#chat-history")
  input = $("#chat-input")
  $("#agenda, #chat-input").bind "keydown keyup", resize
  $(window).bind "resize", resize
  resize()
