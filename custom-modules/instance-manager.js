"use strict"

var h = require('./helpers.js');
var res = require('./resources.js');
var instance = require('./instance.js');


//---  INSTANCE MANAGER   ---

// Takes care of creating objects
class InstanceManager {
	constructor() {
		this.inst = [];
		this.nextid = 0;
		for(var i = 0; i<res.instanceList.length; i++) {
			if(res.instanceList[i].singleInstance) {
				this.AddInstance(i);
			}		
		}
		console.log('INFO: Instances loaded: ' + this.inst.length);
	}

	MoveUser(id, from, to) {
		var iFrom = this.GetInstance(from),
			iTo = this.GetInstance(to),
			obj = iFrom.om.Get(id),
			newid = -1;
		if(obj && iFrom && iTo) {
			iFrom.RemoveUser(id);
			newid = iTo.AddUserObj(obj);
		}
		if(newid == -1)
			console.log('ERROR: failed to move user' + id+ ' from '+from+' to '+to);	
		return newid;
	}

	AddUser(id, to) {

	}

	GetInstance(id) {
		return h.objectFindByKey(this.inst, 'id', id);
	}

	AddInstance(typeID) {
		if(res.instanceList[typeID].singleInstance==true) {
			if(h.indexFindByKey(this.inst, 'typeID', typeID)!= null) {
				console.log('ERROR: instance type ' + typeID+ ' already exist!');
				return -1;
			}
		}

		var i = new instance.Instance(typeID, this.nextid);
		if(i != -1) {
			this.inst.push(i);
			this.nextid++;
			return this.nextid-1;
		}
		
		return -1;
	}

	RemoveInstance(id) {
		this.inst[id].splice(h.indexFindByKey(this.inst, 'id', id),1);
	}

	StartInstance(id) {
		this.inst[id].Start();
	}

	StopInstance(id) {
		this.inst[id].Stop();
	}

	Init() {
	}

	Update(dt) {
		for(var i = 0; i < this.inst.length; i++) {
			if(this.inst[i].running) {
				this.inst[i].Update(dt);
			}
		}
	}
	
};

//---  EXPORTS   ---

module.exports = {
	InstanceManager: InstanceManager
};
