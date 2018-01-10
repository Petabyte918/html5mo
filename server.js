'use strict';

var ex = require('express')();
var http = require('http').Server(ex);
var io = require('socket.io')(http);
var fs = require("fs");

var g = require('./custom-modules/globals.js').Globals;
var settings = require('./custom-modules/settings.js');
var res = require('./custom-modules/resources.js');
var h = require('./custom-modules/helpers.js');

var inv = require('./custom-modules/inventory.js');
var om = require('./custom-modules/object-manager.js');

var sm = new (require('./custom-modules/session-manager.js')).SessionManager();
g.sm = sm;

var im = new (require('./custom-modules/instance-manager.js')).InstanceManager();

var dto = new (require('./custom-modules/dto.js')).DTO(io, sm);
g.dto = dto;
var app = new (require('./custom-modules/app.js')).App(dto, im);
g.app = app;
app.Start();

var map = require('./custom-modules/map.js');

io.on('connection', (socket) => {
	console.log('UPDATE: session started');
	socket.room = 'unauthenticated';
	socket.join(socket.room);
	
	socket.emit('server-handshake', {
		appName: settings.appName,
		appSubName: settings.appSubName,
		appVersion: settings.appVersion
	});

	socket.on('disconnect', function() {
		console.log('UPDATE: session disconnected');
		if(sm.CloseSession(socket, im))
			io.sockets.in(socket.room).emit('message', {user: 'server', text: 'user disconnected', time: Date.now()});
		socket.leave(socket.room);
	});

	socket.on('cli-message', (message) => {
		if(message[0]=='/') {
			ProcessCommand(socket, message);
		} else {
			io.sockets.in(socket.room).emit('message', {
				user : sm.sessions[sm.StripSID(socket.id)].name,
				text : message,
				timestamp : Date.now()
			});
		}
	});
	socket.on('cli-login', (message) => {
		if(message.u != '') {
			var id = sm.LoadUser(message.u,socket,im);
			console.log('UPDATE: user created id: '+id);
			if(id>=0) {
				socket.name = message.u;
				socket.leave(socket.room);
				socket.room = socket.instance;
				socket.join(socket.room);
				io.sockets.in(socket.room).emit('message', {user: 'server', text: 'user '+ message.u+' connected', time: Date.now()});
				var inst = im.GetInstance(socket.instance);
				socket.emit('login-confirm', {
					id : id,
					sid: sm.nextSes-1,
					created: true,
					instance: socket.instance,
					data: {
						objdata: JSON.stringify(inst.om.obj),
						mapdata: JSON.stringify(inst.map.grid),
						instancedata: JSON.stringify(res.instanceList),
						itemdata: JSON.stringify(res.itemList),
						npcdata: JSON.stringify(res.npcList),
						mobdata: JSON.stringify(res.mobList),
						questdata: JSON.stringify(res.questList)
					}
				});
				var inst = sm.sessions[sm.StripSID(socket.id)];
				console.log('UPDATE: user authenticated, join room ' + socket.instance);
			} else {
				socket.emit('login-confirm', {
					id : -1,
					sid: -1,
					created: false,
					data: {
						error: 'Login failed: user ' + message.u + ' does not exist'
					}
				});
			}
		}
	});
	socket.on('cli-register', (message) => {
		if(message.u != '') {
			var file = "./saved-data/users/" + message.u + ".dat";
			if(fs.existsSync(file)) {
				console.log('ERROR: user ' + message.u + ' already exist!');
				socket.emit('register-confirm', {
					sid: -1,
					error: 'user ' + message.u + ' already exists!'
				});
			} else {
				socket.leave(socket.room);
				socket.room = 'authenticated';
				socket.join(socket.room);
				socket.name = message.u;
				io.sockets.in(socket.room).emit('message', {user: 'server', text: 'user '+ message.u + ' connected', time: Date.now()});
				socket.emit('register-confirm', {
					sid: 0
				});
				console.log('UPDATE: user registered');
			}
		}
	});
	socket.on('cli-create', (message) => {
		var id = sm.CreateUser(message.u,socket,im);
		socket.leave(socket.room);
		socket.room = socket.instance;
		socket.join(socket.room);
		io.sockets.in(socket.room).emit('message', {user: 'server', text: 'user '+ message.u+' connected', time: Date.now()});
		var inst = im.GetInstance(socket.instance);
		socket.emit('create-confirm', {
			id : id,
			created: true,
			instance: socket.instance,
			data: {
				objdata: JSON.stringify(inst.om.obj),
				mapdata: JSON.stringify(inst.map.grid),
				instancedata: JSON.stringify(res.instanceList),
				itemdata: JSON.stringify(res.itemList),
				npcdata: JSON.stringify(res.npcList),
				mobdata: JSON.stringify(res.mobList)
			}
		});
		console.log('UPDATE: user of type '+message.c+' created');
	});

	// Socket user interface events
	socket.on('ui', function(data) {
		var inst = im.GetInstance(socket.instance),
			obj = inst.om.Get(sm.sessions[sm.StripSID(socket.id)].oid);
		if (obj.action =="dead") {
			if(data.type=='respawn')
				inst.om.RespawnUser(obj.id);
			return;
		}

		switch(data.type) {
			case 'mcl':
				obj.moveTo(h.V2(data.data.x,data.data.y),inst.map);
				break;
			case 'mclo':
				var t =  inst.om.Get(data.data);
				if(t) {
					if(obj.alliance == t.alliance || t.alliance == 0) {
						//console.log(obj.name+' follow '+t.name);
						obj.follow(t.id);
					} else {
						//console.log(obj.name+' attack '+t.name);
						obj.attack(t.id);
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
					console.log('ERROR: drop error - data:');
					console.log(data);
					break;
				}
				var fromobj = inst.om.Get(from[0]),
					frominv = {},
					toobj = inst.om.Get(to[0]),
					toinv = {};
				if (from[1] == 'i') {
					frominv = fromobj.inv;
				}
				else if (from[1] == 'l') {
					frominv = fromobj.loadout;
				} else
					console.log('ERROR: inv undefined: ' + from[1]);
				if (to[1] == 'i') {
					toinv = toobj.inv;
				}
				else if (to[1] == 'l') {
					toinv = toobj.loadout;
				} else
					console.log('ERROR: inv undefined: ' + to[1]);

				var err = inv.MoveItem(frominv.slot[from[2]],toinv.slot[to[2]]);
				if (err!='') {
					console.log(err);
				} else {
					if(from[0] == to[0]) {
						if (toobj.type == 'char') {
							if (from[1] == 'l' || to[1] == 'l') {
								toobj.status = 2;
								toobj.recalcData();
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
			case 'buy':
				var data = data.data,
					item = res.itemList[data.iid],
					npc = res.npcList[data.npc],
					price = item.value*data.qty*npc.priceMod;
					
				if(price<obj.money) {obj.inv.AddItemInv(data.iid,data.qty); obj.money -= price; obj.status = 2;} else {console.log('UPDATE: not enough money '+price);}
				break;
			case 'sell':
				var data = data.data,
					item = res.itemList[data.iid],
					npc = res.npcList[data.npc],
					diff = data.qty - obj.inv.RemoveItemInv(data.iid, data.qty);
					
				if (diff!=0) {
					obj.money += item.value*(diff)/npc.priceMod;
					obj.status = 2;
				}
				break;
			case 'portal':
				var data = data.data,
					instanceID = data.iid,
					instanceTo = im.GetInstance(instanceID);
				if(inst.id!=instanceID) {
					var newid = im.MoveUser(obj.id, inst.id, instanceID);
					if(newid >-1) {
						socket.leave(socket.room);
						socket.instance = instanceID;
						socket.room = socket.instance;
						socket.join(socket.room);
						sm.sessions[sm.StripSID(socket.id)].oid = newid;
						socket.emit('instance-data', {
							id : newid,
							instance: socket.instance,
							data: {
								objdata: JSON.stringify(instanceTo.om.obj),
								mapdata: JSON.stringify(instanceTo.map.grid),
							}
						});
					}	
				}	
				break;
			default:
				console.log('ERROR: unknown "ui" data type '+ data.type);
				break;
		}
	});

	// Socket quest events
	socket.on('quest', function(data) {
		var inst = im.GetInstance(socket.instance),
			obj = inst.om.Get(sm.sessions[sm.StripSID(socket.id)].oid);
		switch(data.type) {
			case 'accept':
				var q = h.objectFindByKey(obj.quest,'id',data.id);
				if(!q) {
					console.log('UPDATE: '+obj.name + ' accepted quest '+ res.questList[data.id].name);
					obj.quest.push({
						id: data.id,
						status: 'started'
					});
					obj.status = 2;
				}
				break;
			case 'finish':
				break;
			case 'cancel':
				var q = h.indexFindByKey(obj.quest,'id',data.id);
				if(q!=-1) {
					console.log('UPDATE: '+obj.name + ' cancelled quest '+ res.questList[data.id].name);
					obj.quest.splice(q, 1);
					obj.status = 2;
				}
				break;
			default:
				console.log('ERROR: unknown "quest" data type '+ data.type);
				break;
		}
	});
});

function ProcessCommand(socket, msg) {
	var command = msg.split(" ");
	command[0] = command[0].substring(1,command[0].length);

	switch(command[0]) {
		case 'start':
			if(!app.playing) {
				app.Start();
			} else {
				console.log('CLIENT FAULT: app already running!');
			}
			break;
		case 'stop':
			if(app.playing) {
				app.Stop();
			} else {
				console.log('CLIENT FAULT: app already stopped!');
			}
			break;
		case 'save':
			app.Save();
			break;
		case 'load':
			app.Load();
			break;
		case 'gm':
			console.log('generate map');
			map.SaveMap(new map.Map(30,20));
			break;
		default:
			console.log('CLIENT FAULT: Unknown command: ' + command[0]);
	}
}

http.listen(5000, "0.0.0.0", () => {
  console.log('INFO: started on port 5000');
});
