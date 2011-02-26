var http = require('http'); 
var io = require('socket.io');
var url = require('url');  
var path = require('path'); 
var fs = require('fs');
var jQuery = require("jquery");

server = http.createServer(function(request, response){ 
    var uri = url.parse(request.url).pathname;
    if (uri === '/') {
        var filename = path.join(process.cwd(), 'index.html');
        console.log(filename);
    } else {
        var filename = path.join(process.cwd(), uri);
    }
    path.exists(filename, function(exists) {  
        if (!exists) {  
            response.writeHead(404, {"Content-Type": "text/plain"});  
            response.write("404 Not Found\n");  
            response.end();  
            return;  
        }  
  
        fs.readFile(filename, "binary", function(err, file) {  
            if (err) {  
                response.writeHead(500, {"Content-Type": "text/plain"});  
                response.write(err + "\n");  
                response.end();  
                return;  
            }  
  
            response.writeHead(200);  
            response.write(file, "binary");  
            response.end();  
        });  
    });  
});
server.listen(8002);
  
// socket.io 
var socket = io.listen(server);

var socketClients = [];

socket.on('connection', function(client) {
    client.identifier = socketClients.length;
    socketClients.push(client);
    console.log("New client " + client.identifier + " connected, client list is now", socketClients.length);

    client.on('message', function(data) {
        console.log("Got message from client " + client.identifier, data);

        jQuery.each(socketClients, function(index, socketClient) {
            if (socketClient == client) {
                
                socketClient.send("Pong client " + socketClient.identifier);
                return true;
            }
            console.log("Forwarding data to " + socketClient.identifier);
            socketClient.send(data);
        });
    });

    client.on('disconnect', function() {
        socketClients = jQuery.grep(socketClients, function(value) {
            return value != client;
        });

        console.log("Client " + client.identifier + " disconnected, client list is now", socketClients.length);
    }) 
});
