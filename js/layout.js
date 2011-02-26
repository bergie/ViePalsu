jQuery(function($) {
    var agenda = $('#agenda'),
        history = $('#chat-history'),
        input = $('#chat-input');
    
    function resize () {
        history.css('top', agenda.outerHeight(true));
        history.css('bottom', input.outerHeight(true));
    }
    
    $("#agenda, #chat-input").bind('keydown keyup', resize);
    $(window).bind('resize', resize);
    
    resize();
});