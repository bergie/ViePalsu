var express = require('express'); 
var io = require('socket.io');
var url = require('url');  
var path = require('path'); 
var fs = require('fs');
var jQuery = require('jquery');
var redis = require('redis');

var server = require('express').createServer();

server.use('/js', express.static(process.cwd() + '/js')); 
server.use('/styles', express.static(process.cwd() + '/styles'));

server.get('/', function(request, response) {
    var filename = path.join(process.cwd(), 'index.html');
    path.exists(filename, function(exists) {  
        if (!exists) {  
            response.writeHead(404, {"Content-Type": "text/plain"});  
            response.write("404 Not Found\n");  
            response.end();  
            return;  
        }  
  
        fs.readFile(filename, "binary", function(err, file) {  
            response.writeHead(200);  
            response.write(file, "binary");  
            response.end();  
        });
    });
});

server.listen(8002);

// REDIS
var redisClient = redis.createClient();

redisClient.on('error', function (err) {
    console.log('Redis error ' + err);
});

// socket.io 
var socket = io.listen(server);

var socketClients = [];

socket.on('connection', function(client) {
    client.identifier = socketClients.length;
    socketClients.push(client);
    console.log("New client " + client.identifier + " connected, client list is now", socketClients.length);

    // Send current data from Redis
    redisClient.hkeys('anon-ontologies', function(err, ontologies) {
        if (ontologies === undefined) {
            return;
        }
        ontologies.forEach(function(ontology, i) {
            redisClient.lrange('anon-' + ontology, 0, -1, function(err, anonItems) {
                anonItems.forEach(function(anonItem, i) {
                    console.log(anonItem);
                    client.send(JSON.parse(anonItem));
                });
            });
        });
    });
    redisClient.hkeys('ontologies', function(err, ontologies) {
        if (ontologies === undefined) {
            return;
        }
        ontologies.forEach(function(ontology, i) {
            redisClient.hkeys(ontology, function(err, itemIdentifiers) {
                itemIdentifiers.forEach(function(itemIdentifier, i) {
                    redisClient.hget(ontology, itemIdentifier, function(err, item) {
                        console.log(item);
                        client.send(JSON.parse(item));
                    });
                });
            });
        });
    });

    client.on('message', function(data) {
        console.log("Got message from client " + client.identifier, data);
        
        if (typeof data === 'object') {
            if (data['a'] !== undefined) {
                if (data['@'] !== '<undefined>') {
                    // Identified object, save to Redis hash based on type
                    redisClient.hset(data['a'], data['@'], JSON.stringify(data));
                    redisClient.hset('ontologies', data['a'], true);
                } else {
                    // Anonymous entity, save to Redis list based on type
                    redisClient.rpush('anon-' + data['a'], JSON.stringify(data));
                    redisClient.hset('anon-ontologies', data['a'], true);
                }
            }
        }

        jQuery.each(socketClients, function(index, socketClient) {
            if (socketClient == client) {
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
