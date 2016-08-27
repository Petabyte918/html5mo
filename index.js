//---   GLOBAL OBJECTS   ---

var express = require('express');
var app = express();
var http = require('http').Server(app);
var sio = require('socket.io')(http);

//---   CONSTANTS   ---

//---   CODE   ---

// Serving static files in ExpressJS
app.use(express.static(__dirname + '/public'));

// Use ExpressJS to deliver HTML File
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

// Start listening for incoming connections (choose any port you like)
http.listen(3000, function(){
  console.log('listening on *:3000');
});
