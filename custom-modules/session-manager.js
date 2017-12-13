"use strict"

var fs = require("fs");

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
	CreateUser(name, socket, om) {
		var sid = this.StripSID(socket.id),
			id,
			file = "./saved-data/users/"+name+".dat";
		if(fs.existsSync(file)) {
			console.log('user '+ name +' already exist!');
			return -1;
		} else {
			console.log('create user');
			id = om.AddUser('char.png', 100, 100, name, 1, sid);
			console.log(name+' connected');
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
	LoadUser(name, socket, om) {
		var sid = this.StripSID(socket.id),
			id,
			file = "./saved-data/users/"+name+".dat";
		if(fs.existsSync(file)) {
			console.log('load user');
			id = om.LoadUser(sid, JSON.parse(fs.readFileSync(file, 'utf8')));
			console.log(name+' connected');
			this.sessions[sid] = {
				name: name,
				socket: socket,
				oid: id,
				auth: true
			};
			this.nextSes++;
			return id;
		} else {
			console.log('user '+ name +' does not exist!');
			return -1;
		}
	}
	CloseSession(socket, om) {
		var sid = this.StripSID(socket.id);
		if(this.sessions[sid]) {
			if(this.sessions[sid].auth) {
				om.UserSave(this.sessions[sid].oid);
				console.log(this.sessions[sid].name+' has disconnected');
			}
			om.RemoveObj(this.sessions[sid].oid);
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
