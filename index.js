"use strict"

//---   GLOBAL OBJECTS   ---

var express = require('express');
var app = express();
var http = require('http').Server(app);
var sio = require('socket.io')(http);
var sesManager;
var settings = require('./custom-modules/settings.js').Settings();
var res = require('./custom-modules/resources.js');
var h = require('./custom-modules/helpers.js');
var om = require('./custom-modules/object-models.js');
var map = require('./custom-modules/map.js');
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
		//this.map = map.Map(settings.cMapX, settings.cMapY);
		this.map = map.LoadMap(settings.startingMap);
		objManager.init(this.map);
	},
	this.update = function() {
		if(this.playing) {
			this.dtime = Date.now() - this.lastupdate;
			this.lastupdate = Date.now();
			objManager.update(this.dtime);
			setTimeout(this.update.bind(this),100);
		}
	};
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
	addSession: function (socket, om) {
		var newname = "User"+this.nextSes;
		var sid = this.stripSID(socket.id);
		var id = om.addUser('char.png', 100, 100, newname, 1, sid);
		console.log(newname+' connected');
		this.sessions[sid] = {
			name: newname,
			socket: socket,
			oid: id
		};
		this.nextSes++;
		return id;
	},
	closeSession: function (socket, om){
		var sid = this.stripSID(socket.id);
		console.log(this.sessions[sid].name+' has disconnected');
		om.removeObj(this.sessions[sid].oid);
		delete this.sessions[sid];
	},
	getSocketByID: function(id) {
		for (var i = 0; i < Object.keys(this.sessions).length; i++) {
			if (this.sessions[Object.keys(this.sessions)[i]] && this.sessions[Object.keys(this.sessions)[i]].oid == id) {
				return this.sessions[Object.keys(this.sessions)[i]].socket;
			}
		}
		return null;
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
		var removeList = [];
		for(var i = 0; i < this.objectsRef.length; i++) {
			if(this.objectsRef[i].status == 1) {
				cd.push({id: this.objectsRef[i].id, status: 1});
			} else if(this.objectsRef[i].status == 2) {
				if(this.objectsRef[i].action == 'dead') {
					removeList.push(this.objectsRef[i].id);
					console.log(this.objectsRef[i].name+' is dead '+ this.objectsRef[i].status);
					cd.push({id: this.objectsRef[i].id, status: 0, data: this.objectsRef[i]});
					this.objectsRef[i].status = 0;
				} else {
					cd.push({id: this.objectsRef[i].id, status: 2, data: this.objectsRef[i]});
					this.objectsRef[i].status = 1;
				}
			}
		}
		for(i = 0; i < removeList.length; i++) {
			console.log('remove '+ removeList[i]);
			const index = this.objectsRef.findIndex(item => item.id === removeList[i]);
			this.objectsRef.splice(index, 1);
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
	var newid = sesManager.addSession(socket, objManager);
	// Send initial data package to client
	socket.emit('condata', {
		data: {
			objdata: JSON.stringify(objManager.obj),
			mapdata: JSON.stringify(game.map.grid),
			pfmatrix: JSON.stringify(game.map.pf.pfMatrix),
			itemdata: JSON.stringify(res.itemList),
			newconid: newid
		},
		time: Date.now()
	});

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

		sesManager.closeSession(socket, objManager);
	});

	// Socket user interface events
	socket.on('ui', function(data){
		switch(data.type) {
			case 'mcl':
				var obj = objManager.get(sesManager.sessions[sesManager.stripSID(socket.id)].oid);
				obj.moveTo(h.V2(data.data.x,data.data.y));
				break;
			case 'mclo':
				var obj = objManager.get(sesManager.sessions[sesManager.stripSID(socket.id)].oid),
					t =  objManager.get(data.data);
				if(obj.alliance == t.alliance) {
					console.log(obj.name+' follow '+t.name);
					obj.follow(t.id);
				} else {
					console.log(obj.name+' attack '+t.name);
					obj.attack(t.id);
					obj.follow(t.id);
				}
				//console.log(obj.name+' target '+t.name);
				break;
			case 'mcr':
				break;
			case 'drop':
				data = data.data;
				var from,
					to;
				if(data.from && data.to) {
					from = data.from.split("_");
					to = data.to.split("_");
				} else {
					console.log('drop error! data:');
					console.log(data);
					break;
				}
				var fromobj = objManager.get(from[0]),
					frominv = {},
					toobj = objManager.get(to[0]),
					toinv = {};
				if (from[1] == 'i') {
					frominv = fromobj.inv;
				}
				else if (from[1] == 'l') {
					frominv = fromobj.loadout;
				} else
					console.log('inv undefined: '+from[1]);
				if (to[1] == 'i') {
					toinv = toobj.inv;
				}
				else if (to[1] == 'l') {
					toinv = toobj.loadout;
				} else
					console.log('inv undefined: '+to[1]);

				var err = inv.MoveItem(frominv.slot[from[2]],toinv.slot[to[2]]);
				if (err!='') {
					console.log(err);
				} else {
					if(from[0] == to[0]) {
						if (toobj.type == 'char') {
							dto.sendTo(to[0],'update_inv',JSON.stringify({l:fromobj.loadout,i:fromobj.inv}));
						}
					} else {
						fromobj.status = 2;
						toobj.status = 2;
					}
				}
				break;
			default:
				console.log('Error: unknown "ui" data type!');
				break;
		}
	});
});

game.start();
