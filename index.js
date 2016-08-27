//---   GLOBAL OBJECTS   ---

var express = require('express');
var app = express();
var http = require('http').Server(app);
var sio = require('socket.io')(http);
var sesManager;

//---   CONSTANTS   ---

//---   CODE   ---

// Serving static files in ExpressJS
app.use(express.static(__dirname + '/public'));

// Use ExpressJS to deliver HTML File
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

// Start listening for incoming connections (choose any port you like)
http.listen(3000, function() {
  console.log('listening on *:3000');
});

// Session manager object
sesManager = {
	sessions:[],
	nextSes:0,
	addSession: function (socket) {
		var newname = "User"+this.nextSes;
		var sid= this.stripSID(socket.id);
		console.log(newname+' connected on socket '+sid);
		this.sessions[sid] = {
			name: newname,
			socket: socket
		};
		this.nextSes++;
	},
	closeSession: function (socket){
		var sid = this.stripSID(socket.id);
		console.log(this.sessions[sid].name+' has disconnected');
		delete this.sessions[sid];
	},
	// Remove unwanted characters from socket ID
	stripSID: function (sid) {
		return sid.substring(2);
	}
};

// Socket connection events
sio.on('connection', function(socket) {
	sesManager.addSession(socket);

	socket.on('disconnect', function() {
		sesManager.closeSession(socket);
    });
});
