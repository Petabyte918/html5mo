"use strict"

var settings = require('./settings.js');
var h = require('./helpers.js');
var res = require('./resources.js');
var map = require('./map.js');
var om = require('./object-manager.js');

//---  INSTANCE   ---

class Instance {
	constructor(typeID, id) {
		if(res.instanceList[id].name=='') {
			console.log('ERROR: instance ' + id + ' not found!');
			return -1;
		}
		this.initialized = false;
		this.userCount = 0;
		this.running = false;

		this.id = id;
		this.typeID = typeID;
		this.name = res.instanceList[id].name;
		this.singleInstance = res.instanceList[id].singleInstance;
		this.default = res.instanceList[id].default;
		this.mapID = res.instanceList[id].map;
		return this;
	}

	Initialize() {
		console.log('UPDATE: initializing instance '+this.id);
		this.map = map.LoadMap(this.id, './resources/maps/' + this.mapID + '.data');
		this.om = new om.ObjManager(this);
		this.om.instanceRef = this;
		this.initialized = true;
	}

	Start() {
		if(!this.initialized) {
			try {
				this.Initialize();
				this.om.Update(0);
			}
			catch(err) {
				console.log("ERROR: instance " + this.typeID + ":" + this.id + " failed to initialize!");
			}
		}
		this.om.instanceRef = this;
		this.running = true;
		console.log("INFO: instance type " + this.typeID + " id: " + this.id + " started");
	}

	Stop() {
		this.running = false;
		console.log("INFO: instance " + this.typeID + ":" + this.id + " stopped");
	}

	AddNewUser(icon, x, y, name, alliance, sid) {
		this.userCount++;
		return this.om.AddUser(icon, x, y, name, alliance, sid);
	}

	AddUserObj(obj) {
		console.log('UPDATE: add user to instance '+ this.id);
		if(!this.running)
			this.Start();
		this.userCount++;
		obj.instance = this.id;
		obj.pos = h.V2(this.map.settings.spawnI*settings.tileW, this.map.settings.spawnJ*settings.tileW);
		obj.curTile();
		return this.om.AddObj(obj);
	}

	LoadUser(sid, nobj) {
		this.userCount++;
		return this.om.LoadUser(sid, nobj);
	}

	RemoveUser(id) {
		this.userCount--;
		this.om.RemoveObj(id);
		// if (this.userCount<1)
		// 	this.running = false;
	}

	Update(dt) {
		if(this.userCount>0) {
			this.om.Update(dt);
			//console.log('update instance '+this.id + ' c: '+this.userCount);
		}
			
	}
}

//---  EXPORTS   ---

module.exports = {
	Instance: Instance
};
