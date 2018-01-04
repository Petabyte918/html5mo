"use strict"

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
		this.hasUsers = false;
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

	AddUser(obj) {

	}

	RemoveUser(name) {

	}

	Update(dt) {
		this.om.Update(dt);
	}
}

//---  EXPORTS   ---

module.exports = {
	Instance: Instance
};
