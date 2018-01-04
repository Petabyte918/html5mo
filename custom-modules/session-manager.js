"use strict"

var fs = require("fs");
var h = require("./helpers.js");

//---  SESSION MANAGER OBJECT   ---

class SessionManager {
	constructor() {
		this.sessions = [];
		this.nextSes = 0;
	}
	UserAuth(socket) {
		var sid = this.StripSID(socket.id);
		this.sessions[sid].auth = true;
	}
	CreateUser(name, socket, im) {
		var sid = this.StripSID(socket.id),
			id,
			file = "./saved-data/users/"+name+".dat";
		if(fs.existsSync(file)) {
			console.log('ERROR: user '+ name +' already exist!');
			return -1;
		} else {
			var definst = h.objectFindByKey(im.inst, 'default', true);
			socket.instance = definst.id;
			if(!definst.running) {
				definst.Start();
			}
			id = definst.om.AddUser('char.png', 100, 100, name, 1, sid);
			console.log('UPDATE: '+name+' connected');
			this.sessions[sid] = {
				name: name,
				socket: socket,
				oid: id,
				auth: true
			};
			this.nextSes++;
			return id;
		}
	}
	LoadUser(name, socket, im) {
		var sid = this.StripSID(socket.id),
			id,
			file = "./saved-data/users/"+name+".dat";
		if(fs.existsSync(file)) {
			var udata = JSON.parse(fs.readFileSync(file, 'utf8'));
			var userinst = h.objectFindByKey(im.inst, 'id', udata.instance);
			socket.instance = userinst.id;
			if(!userinst.running) {
				userinst.Start();
			}
			id = userinst.om.LoadUser(sid, udata);
			console.log('UPDATE: '+name+' connected');
			this.sessions[sid] = {
				name: name,
				socket: socket,
				oid: id,
				auth: true,
				instance: userinst.id
			};
			this.nextSes++;
			return id;
		} else {
			console.log('ERROR: Load user - user '+ name +' does not exist!');
			return -1;
		}
	}
	CloseSession(socket, im) {
		var sid = this.StripSID(socket.id);
		if(this.sessions[sid]) {
			var userinst = h.objectFindByKey(im.inst, 'id', socket.instance);
			if(this.sessions[sid].auth) {
				userinst.om.UserSave(this.sessions[sid].oid);
				console.log('UPDATE: '+this.sessions[sid].name + ' has disconnected');
			}
			userinst.om.RemoveObj(this.sessions[sid].oid);
			delete this.sessions[sid];
			return true;
		}
		return false;
	}
	GetSocketByID(id) {
		for (var i = 0; i < Object.keys(this.sessions).length; i++) {
			if (this.sessions[Object.keys(this.sessions)[i]] && this.sessions[Object.keys(this.sessions)[i]].oid == id) {
				return this.sessions[Object.keys(this.sessions)[i]].socket;
			}
		}
		return null;
	}
	Restart() {
		this.sessions = [];
		io.sockets.sockets.forEach(function(s) {
			s.disconnect(true);
		});
	}
	// Remove unwanted characters from socket ID
	StripSID(sid) {
		return sid.substring(2);
	}
}

module.exports = {
	SessionManager: SessionManager
}
