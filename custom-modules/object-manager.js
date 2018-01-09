"use strict"

var settings = require('./settings.js');
var objModels = require('./object-models.js');
var baseModels = require('./object-base.js');
var res = require('./resources.js');
var h = require('./helpers.js');
var inv = require('./inventory.js');
var PF = require('pathfinding');
var fs = require('fs');
var map;

//---  OBJECT MANAGER   ---

// Takes care of creating objects
class ObjManager {
	constructor(instanceRef) {
		this.instanceRef = instanceRef;
		console.log('UPDATE: objm created with instance '+this.instanceRef.id);
		this.obj = [];
		this.nextid = 0;
	}

	RespawnUser(id) {
		var obj = this.Get(id);
		obj.action = 'idle';
		obj.hp.Set(obj.hp.max/2);
		var s = this.instanceRef.map.NextSpawn();
		obj.pos = new h.V2(s.i,s.j);
		obj.curTile();
		obj.status = 2;
	};

	AddUser(icon, x, y, name, alliance, sid) {
		var s = this.instanceRef.map.NextSpawn();
		this.obj.push(new objModels.CharCreate(this.instanceRef, this.nextid, icon, s.i, s.j, name, alliance, sid, false, false));
		this.nextid++;
		return this.nextid-1;
	}
	AddMob(typeID, x, y) {
		this.obj.push(new objModels.MobLoad(this.instanceRef, this.nextid, typeID, x, y));
		this.nextid++;
		return this.nextid-1;
	}
	AddNPC(typeID, x, y) {
		this.obj.push(new objModels.NPCLoad(this.instanceRef, this.nextid, typeID, x, y));
		this.nextid++;
		return this.nextid-1;
	}
	AddObj(obj) {
		obj.stop();
		obj.id = this.nextid;
		this.obj.push(obj);
		this.nextid++;
		return this.nextid-1;
	}
	RemoveObj(id) {
		this.obj.splice(h.indexFindByKey(this.obj, 'id', id),1);
	}
	// Get object by id
	Get(id) {
		return this.obj.filter(function(o){return o.id == id;})[0];
	}

	Update(dt) {
		for(var i = 0; i < this.obj.length; i++) {
			if(this.obj[i]) {
				this.obj[i].update(dt, this.instanceRef);
			}
		}
		if(res.mobList) for(i = 0; i < this.instanceRef.map.mobSpawnList.length; i++) {
			if(this.instanceRef.map.mobSpawnList[i].spawned==-1) {
				if(this.instanceRef.map.mobSpawnList[i].spawnAt < (new Date()).getTime()) {
					this.instanceRef.map.mobSpawnList[i].spawned =
						this.AddMob(this.instanceRef.map.mobSpawnList[i].id,
									this.instanceRef.map.mobSpawnList[i].x * settings.tileW + settings.tileW/2,
									this.instanceRef.map.mobSpawnList[i].y * settings.tileW + settings.tileW/2);
				}
			}
		}
		if(res.npcList) for(i = 0; i < this.instanceRef.map.npcSpawnList.length; i++) {
			if(this.instanceRef.map.npcSpawnList[i].spawned==-1) {
				if(this.instanceRef.map.npcSpawnList[i].spawnAt < (new Date()).getTime()) {
					this.instanceRef.map.npcSpawnList[i].spawned =
						this.AddNPC(this.instanceRef.map.npcSpawnList[i].id,
									this.instanceRef.map.npcSpawnList[i].x * settings.tileW + settings.tileW/2,
									this.instanceRef.map.npcSpawnList[i].y * settings.tileW + settings.tileW/2);
				}
			}
		}
	}
	UserSave(id) {
		var u = this.Get(id);
		if(u) {
			fs.writeFile("./saved-data/users/" + u.name + ".dat", JSON.stringify(u) , function(err) {
				if(err) {
					return console.log(err);
				}
				console.log("UPDATE: User " + u.name + " saved!");
			});
		} else {
			console.log('ERROR: save user - user '+ id + ' instance ' + this.instanceRef.id + ' not found!');
		}
	}
	LoadUser(sid, nobj) {
		var obj = new baseModels.BaseObj(this.nextid, nobj.img, nobj.pos.x, nobj.pos.y, 'user', nobj.alliance, nobj.name, false);
		// Session ID
		obj.sid = sid;
		obj.instance = this.instanceRef.id;

		obj.lvl = nobj.lvl;
		obj.hp = new baseModels.BarVal(nobj.hp.val,nobj.hp.max,nobj.hp.reg);

		obj.range = nobj.range;
		obj.atrib = nobj.atrib;
		baseModels.baseCharFunctionality(obj, this.instanceRef.map);

		obj.money = nobj.money;
		obj.exp = nobj.exp;
		obj.nextlvl = nobj.nextlvl;

		obj.classType = nobj.classType;
		obj.gender = nobj.gender;
		obj.quest = nobj.quest;

		if(nobj.action == 'dead')
			obj.action = 'dead';

		obj.loadout = new inv.Inventory(this.nextid, 'l', 49);
		obj.inv = new inv.Inventory(this.nextid, 'i', 49);
		for(var i = 0; i<obj.loadout.slot.length; i++)
			if(nobj.loadout.slot[i].count>0)
				obj.loadout.slot[i].AddItem(nobj.loadout.slot[i].iid, nobj.loadout.slot[i].count);
		for(var i = 0; i<obj.inv.slot.length; i++)
			if(nobj.inv.slot[i].count>0)
				obj.inv.slot[i].AddItem(nobj.inv.slot[i].iid, nobj.inv.slot[i].count);
		obj.decide = function() {
			console.log('UPDATE: user.decide');
		};

		obj.recalcData();

		this.obj.push(obj);
		this.nextid++;
		return this.nextid-1;
	}
};

//---  EXPORTS   ---

module.exports = {
	ObjManager: ObjManager
};
