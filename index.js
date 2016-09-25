//---   GLOBAL OBJECTS   ---

var express = require('express');
var app = express();
var http = require('http').Server(app);
var sio = require('socket.io')(http);
var sesManager;
var h = require('./custom-modules/helpers.js');
var om = require('./custom-modules/object-models.js');
var objManager = om.ObjManager;
var game;

//---   MAIN GAME CONTROLLER   ---

var Game = function() {
	this.lastupdate = Date.now(),
	this.dtime = 0,
	this.playing = false,
	this.start = function() {
		this.init();
		this.playing = true;
		this.lastupdate = Date.now();
		this.update(); 
		dto.startEmitUpdates(objManager.obj);
		console.log('game started!');
	},
	this.stop = function() {
		this.playing = false;
		dto.stopEmitUpdates();
		console.log('game stopped!'); 
	},
	this.init = function() {
		objManager.init();
	},
	this.update = function() {
		if(this.playing) {
			this.dtime = Date.now() - this.lastupdate;
			this.lastupdate = Date.now();
			objManager.update(this.dtime);
			setTimeout(this.update.bind(this),100);
		}
	}
};

game = new Game();

//---   DATA TRANSFER   ---

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

// data transfer object - an interface to send data
var dto = {
	sendingUpdates: false,
	sendTo: function(userID, dataType, data) {
		var s = sesManager.getSocketByID(userID);
		if(s) s.emit(dataType, data);
	},
	sendToAll: function(dataType, data) {
		sio.emit(dataType, data);
	},
	startEmitUpdates: function(objRef) {
		this.objectsRef = objRef;
		if(!this.sendingUpdates) {
			this.sendingUpdates = true;
			this.emitUpdates();
		}
	},
	stopEmitUpdates: function() {
		this.sendingUpdates = false;
	},
	emitUpdates: function() {
		var cd = [];
		for(var i = 0; i < this.objectsRef.length; i++) {
			if(this.objectsRef[i]) {
				if(this.objectsRef[i].status == 1) {
					cd.push({id: this.objectsRef[i].id, status: 1});
				} else if(this.objectsRef[i].status == 2) {
					cd.push({id: this.objectsRef[i].id, status: 2, data: this.objectsRef[i]});
					this.objectsRef[i].status = 1;
				}
			}
		}
		sio.emit('updatedata', {
			data: JSON.stringify(cd),
			time: Date.now()
		});
		if(this.sendingUpdates) setTimeout(this.emitUpdates.bind(this),200);
	}
};

// Socket connection events
sio.on('connection', function(socket) {
	sesManager.addSession(socket);
	
	// Warn other players that new user connected
	sio.emit('chat', {
		msg: 'User '+sesManager.sessions[sesManager.stripSID(socket.id)].name+' connected',
		timestamp : Date.now(),
		sendername : 'Server'
	});
	
	// if we receive chat message, forward it to other players as well
	socket.on('chat', function(data){
		sio.emit('chat', {
			msg: data.msg,
			timestamp : data.timestamp,
			sendername : sesManager.sessions[sesManager.stripSID(socket.id)].name
		});
	});

	socket.on('disconnect', function() {
		// Warn other players that user disconnected
		sio.emit('chat', {
			msg: 'User '+sesManager.sessions[sesManager.stripSID(socket.id)].name+' disconnected',
			senderid : socket.id,
			sendername : 'Server'
		});
		
		sesManager.closeSession(socket);
    });
});
