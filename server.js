'use strict';

var ex = require('express')();
var http = require('http').Server(ex);
var io = require('socket.io')(http);
var fs = require("fs");

var settings = require('./custom-modules/settings.js').Settings();
var res = require('./custom-modules/resources.js');
var h = require('./custom-modules/helpers.js');

var map = require('./custom-modules/map.js');
var inv = require('./custom-modules/inventory.js');
var om = require('./custom-modules/object-models.js');

var objManager = new om.ObjManager(map);
var sm = new (require('./custom-modules/session-manager.js')).SessionManager();
var dto = new (require('./custom-modules/dto.js')).DTO(io, sm);
var app = new (require('./custom-modules/app.js')).App(dto, objManager);

app.Start();

io.on('connection', (socket) => {
  console.log('session started');
  socket.room = 'unauthenticated';
  socket.join(socket.room);
  socket.on('disconnect', function() {
    console.log('session disconnected');
	if(sm.CloseSession(socket, objManager))
		io.sockets.in(socket.room).emit('message', {user: 'server', text: 'user disconnected', time: Date.now()});
	socket.leave(socket.room);
  });

  socket.on('cli-message', (message) => {
    io.sockets.in(socket.room).emit('message', {
		user : 'user',//data.name,
		text : message,
		timestamp : Date.now()
	});
  });
  socket.on('cli-login', (message) => {
	if(message.u != '') {
		socket.leave(socket.room);
		socket.room = 'authenticated';
		socket.join(socket.room);
		var id = sm.LoadUser(message.u,socket,objManager);
		if(id>=0) {
			socket.name = message.u;
			io.sockets.in(socket.room).emit('message', {user: 'server', text: 'user '+ message.u+' connected', time: Date.now()});
			socket.emit('login-confirm', {
				id : id,
				sid: sm.nextSes-1,
				created: true,
				data: {
					objdata: JSON.stringify(objManager.obj),
					mapdata: JSON.stringify(app.map.grid),
					pfmatrix: JSON.stringify(app.map.pf.pfMatrix),
					itemdata: JSON.stringify(res.itemList),
					mobdata: JSON.stringify(res.mobList)
				}
			});
			console.log('user authenticated');
		} else {
			socket.emit('login-confirm', {
				id : -1,
				sid: -1,
				created: false,
				data: {
					error: 'Login failed: user '+ message.u+' does not exist'
				}
			});
		}
	}
  });
  socket.on('cli-register', (message) => {
	if(message.u != '') {
		var file = "./saved-data/users/"+message.u+".dat";
		if(fs.existsSync(file)) {
			console.log('user '+ message.u +' already exist!');
			socket.emit('register-confirm', {
				sid: -1,
				error: 'user ' + message.u + ' already exists!'
			});
		} else {
			socket.leave(socket.room);
			socket.room = 'authenticated';
			socket.join(socket.room);
			socket.name = message.u;
			io.sockets.in(socket.room).emit('message', {user: 'server', text: 'user '+ message.u+' connected', time: Date.now()});
			socket.emit('register-confirm', {
				sid: 0
			});
			console.log('user registered');
		}
	}
  });
  socket.on('cli-create', (message) => {
  	var id = sm.CreateUser(message.u,socket,objManager);
	socket.emit('create-confirm', {
		id : id,
		created: true,
		data: {
			objdata: JSON.stringify(objManager.obj),
			mapdata: JSON.stringify(app.map.grid),
			pfmatrix: JSON.stringify(app.map.pf.pfMatrix),
			itemdata: JSON.stringify(res.itemList)
		}
	});
	console.log('user of type '+message.c+' created');
  });

  // Socket user interface events
	socket.on('ui', function(data) {
		switch(data.type) {
			case 'mcl':
				var obj = objManager.Get(sm.sessions[sm.StripSID(socket.id)].oid);
				obj.moveTo(h.V2(data.data.x,data.data.y),app.map);
				break;
			case 'mclo':
				var obj = objManager.Get(sm.sessions[sm.StripSID(socket.id)].oid),
					t =  objManager.Get(data.data);
				if(t) {
					if(obj.alliance == t.alliance) {
						console.log(obj.name+' follow '+t.name);
						obj.follow(t.id);
					} else {
						console.log(obj.name+' attack '+t.name);
						obj.attack(t.id);
						obj.follow(t.id);
					}
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
				var fromobj = objManager.Get(from[0]),
					frominv = {},
					toobj = objManager.Get(to[0]),
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
							if (from[1] == 'l' || to[1] == 'l') {
								toobj.status = 2;
								to.recalcData();
							} else {
								dto.SendTo(to[0],'update_inv',JSON.stringify({l:fromobj.loadout,i:fromobj.inv}));
							}
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

function ProcessCommand(socket, data) {
	var command = data.msg.split(" ");
	command[0] =  command[0].substring(1,command[0].length);

	switch(command[0]) {
		case 'start':
			if(!app.playing) {
				app.Start();
			} else {
				console.log('app already running!');
			}
			break;
		case 'stop':
			if(app.playing) {
				app.Stop();
			} else {
				console.log('app already stopped!');
			}
			break;
		case 'save':
			app.Save();
			break;
		case 'load':
			app.Load();
			break;
		default:
			console.log('Unknown command: ' + command[0]);
	}
}

http.listen(5000, () => {
  console.log('started on port 5000');
});
