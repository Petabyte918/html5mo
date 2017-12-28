"use strict"

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
	constructor(mapRef) {
		this.map = mapRef;
		this.obj = [];
		this.nextid = 0;
	}

	AddUser(icon, x, y, name, alliance, sid) {
		var s = this.map.NextSpawn();
		this.obj.push(new objModels.CharCreate(this.map, this.nextid, icon, s.i, s.j, name, alliance, sid, false, false));
		this.nextid++;
		return this.nextid-1;
	}
	AddMob(typeID, x, y) {
		this.obj.push(new objModels.MobLoad(this.map, this.nextid, typeID, x, y));
		this.nextid++;
		return this.nextid-1;
	}
	AddNPC(typeID, x, y) {
		this.obj.push(new objModels.NPCLoad(this.map, this.nextid, typeID, x, y));
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
	Init(mapRef) {
		this.map = mapRef;
	}
	Update(dt) {
		for(var i = 0; i < this.obj.length; i++) {
			if(this.obj[i]) {
				this.obj[i].update(dt, this);
			}
		}
		if(res.mobList) for(i = 0; i < this.map.mobSpawnList.length; i++) {
			if(this.map.mobSpawnList[i].spawned==-1) {
				if(this.map.mobSpawnList[i].spawnAt < (new Date()).getTime()) {
					this.map.mobSpawnList[i].spawned =
						this.AddMob(this.map.mobSpawnList[i].id,
									this.map.mobSpawnList[i].x * this.map.settings.tileW + this.map.settings.tileW/2,
									this.map.mobSpawnList[i].y * this.map.settings.tileW + this.map.settings.tileW/2);
				}
			}
		}
		if(res.npcList) for(i = 0; i < this.map.npcSpawnList.length; i++) {
			if(this.map.npcSpawnList[i].spawned==-1) {
				if(this.map.npcSpawnList[i].spawnAt < (new Date()).getTime()) {
					this.map.npcSpawnList[i].spawned =
						this.AddNPC(this.map.npcSpawnList[i].id,
									this.map.npcSpawnList[i].x * this.map.settings.tileW + this.map.settings.tileW/2,
									this.map.npcSpawnList[i].y * this.map.settings.tileW + this.map.settings.tileW/2);
				}
			}
		}
	}
	UserSave(id) {
		var u = this.Get(id);
		if(u) {
			fs.writeFile("./saved-data/users/"+u.name+".dat", JSON.stringify(u) , function(err) {
				if(err) {
					return console.log(err);
				}
				console.log("User "+u.name+" saved!");
			});
		} else {
			console.log('Save error: user not found!');
		}
	}
	LoadUser(sid, nobj) {
		var obj = new baseModels.BaseObj(this.nextid, nobj.img, nobj.pos.x, nobj.pos.y, 'char', nobj.alliance, nobj.name);
		// Session ID
		obj.sid = sid;

		obj.lvl = nobj.lvl;
		obj.hp = new baseModels.BarVal(nobj.hp.val,nobj.hp.max,nobj.hp.reg);

		obj.range = nobj.range;
		obj.atrib = nobj.atrib;
		baseModels.baseCharFunctionality(obj, this.map);

		obj.money = nobj.money;
		obj.exp = nobj.exp;
		obj.nextlvl = nobj.nextlvl;

		obj.classType = nobj.classType;
		obj.gender = nobj.gender;
		obj.quest = nobj.quest;

		obj.loadout = new inv.Inventory(this.nextid, 'l', 49);
		obj.inv = new inv.Inventory(this.nextid, 'i', 49);
		for(var i = 0; i<obj.loadout.slot.length; i++)
			if(nobj.loadout.slot[i].count>0)
				obj.loadout.slot[i].AddItem(nobj.loadout.slot[i].iid, nobj.loadout.slot[i].count);
		for(var i = 0; i<obj.inv.slot.length; i++)
			if(nobj.inv.slot[i].count>0)
				obj.inv.slot[i].AddItem(nobj.inv.slot[i].iid, nobj.inv.slot[i].count);
		obj.decide = function() {
			console.log('user.decide');
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
