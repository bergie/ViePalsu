//jQuery(function() {
jQuery(document).ready(function() {    
    
    /*
    if ($.VIE2.connectors['stanbol']) {
        $.VIE2.connectors['stanbol'].options({
        	    "proxy_url" : "/proxy",
        	    "enhancer_url" : "http://stanbol.iksfordrupal.net/engines/",
        	    "entityhub_url" : "http://stanbol.iksfordrupal.net/entityhub/"
        });
    }
    
    if ($.VIE2.connectors['dbpedia']) {
        $.VIE2.connectors['dbpedia'].options({
            "proxy_url" : "/proxy"
        });
    }
    
    if ($.VIE2.connectors['semantictweet']) {
        $.VIE2.connectors['semantictweet'].options({
            "proxy_url" : "/proxy"
        });
    }
               
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
    
    var Agent2View = Backbone.View.extend({
                
        initialize: function() {
            _.bindAll(this, "render");
          this.model.bind('change', this.render);
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
            var agentModel = (this.model.get("rdfcal:hasAgent"))? this.model.get("rdfcal:hasAgent")[0] : undefined;
            var agentSpan = $("<span>");
            
            var agentView = new Agent2View({id: 'agent-' + PseudoGuid.GetNew(), model: agentModel, el: agentSpan})
            .render();
            
            var name = (this.model.get("rdfcal:name"))? this.model.get("rdfcal:name")[0] : "";
            var startDate = (this.model.get("rdfcal:startDate").length)? this.model.get("rdfcal:startDate")[0] : "";
            var targetDate = (this.model.get("rdfcal:targetDate").length)? this.model.get("rdfcal:targetDate")[0] : "";
            
            $(this.el)
            .append(agentSpan)
            .append($("<span> needs to <i>" + name + "</i> before " + targetDate + "!</span>"));
            return this;
        },
    });
    */
});

/*
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
    $.VIE2.registerBackboneModel({
        id : $.rdf.blank('[]'), 
        a : ['rdfcal:Task'],
        'rdfcal:hasAgent' : ((agent === '' || agent === undefined)? '[]' : agent.replace(/&lt;/, "<").replace(/&gt;/, ">")),
        'rdfcal:name' : ((todo === '' || todo === undefined)? '' : todo),
        'rdfcal:targetDate' : ((targetDate === '' || targetDate === undefined)? '' : targetDate),
    });
};


function addName () {
    $(document).vie2().vie2('annotate',
      '<http://dbpedia.org/resource/Barack_Obama> foaf:name "B B Obama"');
};
*/
