jQuery(function() {
    
    /*
    $.VIE2.connectors['stanbol'].options({
 	    "proxy_url" : "/proxy",
 	    "enhancer_url" : "http://stanbol.iksfordrupal.net:9000/engines/",
 	    "entityhub_url" : "http://stanbol.iksfordrupal.net:9000/entityhub/"
    });
    */
    
    $.VIE2.connectors['dbpedia'].options({
        "proxy_url" : "/proxy"
    });
    
    $.VIE2.connectors['semantictweet'].options({
        "proxy_url" : "/proxy"
    });
    
               
    $.VIE2.Backbone['person']['collection'].bind("add", function (p) {
        new AgentView({id: 'agent-' + PseudoGuid.GetNew(), model: p});
        new PersonView({id: 'person-' + PseudoGuid.GetNew(), model: p});
    });
    
    $.VIE2.Backbone['task']['collection'].bind("add", function (t) {
         new TaskView({id: 'task-' + PseudoGuid.GetNew(), model: t});
    });
    
    var PersonView = Backbone.View.extend({
        tagName: 'li',
        
        initialize: function() {
            _.bindAll(this, "render");
            this.model.bind('change', this.render);
            $(this.el).css('display', 'none');
            $('.persons').append($(this.el));
        },
        
        render: function() {
            var name = this.model.get("foaf:name");
            if (name && name[0]) {
                var names = name[0].value;
                for (var x = 1; x < name.length; x++) {
                    names += " aka. " + name[x].value;
                }
                $(this.el).text(names);
                $(this.el).css('display', 'list-item');
            } else {
               $(this.el).css('display', 'none');
            }
          return this;
        }
    });
    
    var AgentView = Backbone.View.extend({
        
        tagName: 'li',
        
        initialize: function() {
            _.bindAll(this, "render");
          this.model.bind('change', this.render);
          $('.mentions').append($(this.el));
          this.render();
        },
        
        render: function() {
            var name = this.model.get("foaf:name");
            
            if (name) {
                if (typeof name === 'string') {
                    name = name;
                } else if ($.isArray(name)) {
                    name = name[0];
                } else {
                    name = "???";
                }    
            } else {
                 name = "???";
            }
            $(this.el).text(name);
          return this;
        }
    });
    
    var TaskView = Backbone.View.extend({
        tagName: 'li',
        
        initialize: function() {
            _.bindAll(this, "render");
          this.model.bind('change', this.render);
          $('.tasks').append($(this.el));
        },
        
        render: function() {
            var agentUri = (this.model.get("rdfcal:hasAgent"))? this.model.get("rdfcal:hasAgent")[0].toString() : "";
            var agentName = "";
            
            var agentModel = $.VIE2.Backbone['person']['collection'].get(agentUri);
            var agentView = new AgentView({id: 'agent-' + PseudoGuid.GetNew(), model: agentModel})
            .render();
            
            var name = (this.model.get("rdfcal:name"))? this.model.get("rdfcal:name")[0].value : "";
            var startDate = (this.model.get("rdfcal:startDate"))? this.model.get("rdfcal:startDate")[0].value : "";
            var targetDate = (this.model.get("rdfcal:targetDate"))? this.model.get("rdfcal:targetDate")[0].value : "";

            $(this.el)
            .append($(agentView.el))
            .append($("<span> needs to <i>" + name + "</i> before " + targetDate + "!"));
            return this;
        },
    });
});

function analyzeText (elem, button) {
	//disable button
	//$(button).attr('disabled', 'disabled');
    $(button).text('Analyzing...');
	
	//start analysis
	elem.vie2().vie2('analyze', function (status) {
        if (status === 'ok') {
            $(button).text('Done!');
        }
    });
};
            
function annotateAsTask (elem, agent, todo, targetDate, startDate) {
    var x = $.rdf.blank('[]');
    elem.vie2().vie2('annotate',
        [agent + ' a foaf:Person']);
    elem.vie2().vie2('annotate',
      [
      x + ' a rdfcal:Task',
      x + ' rdfcal:hasAgent ' + ((agent === '' || agent === undefined)? '[]' : agent),
      x + ' rdfcal:name ' + ((todo === '' || todo === undefined)? '' : todo),
      x + ' rdfcal:startDate ' + ((startDate === '' || startDate === undefined)? '\"now\"' : startDate), //TODO: figure out how to write proper date
      x + ' rdfcal:targetDate ' + ((targetDate === '' || targetDate === undefined)? '\"tonight\"' : targetDate) //TODO: figure out how to write proper date
      ]);
};


function addName () {
    $(document).vie2().vie2('annotate',
      '<http://dbpedia.org/resource/Barack_Obama> foaf:name "B B Obama"');
};
