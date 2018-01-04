"use strict"

var settings = require('./settings.js');
var baseModels = require('./object-base.js');
var res = require('./resources.js');
var inv = require('./inventory.js');

// Character object - the object that will live and move in game
var CharCreate = function(instance, id, img, x, y, name, alliance, sid, classType, gender) {
	var obj = new baseModels.BaseObj(id, img, x, y, 'user', alliance, name);
	// Session ID
	obj.sid = sid;
	obj.instance = instance;

	obj.lvl = 1;
	obj.hp = new baseModels.BarVal(150,150,1);

	obj.range = 32;
	obj.atrib = [10,10,10,10,10,10];
	baseModels.baseCharFunctionality(obj, instance.map);
	obj.money = 100;
	obj.exp = 0;
	obj.nextlvl = 50;

	obj.classType = classType;
	obj.gender = gender;
	obj.quest = [];

	obj.loadout = new inv.Inventory(id, 'l', 49);
	obj.inv = new inv.Inventory(id, 'i', 49);
	obj.decide = function() {
		console.log('UPDATE: char.decide');
	};
	obj.recalcData();
	return obj;
};

// Mob object - non user controlled object that will be fought by users
var MobLoad = function(instance, id, typeID, x, y) {
	var mob = res.mobList.filter(function(o){return o.typeID == typeID})[0];
	var obj = new baseModels.BaseObj(id, mob.img, x, y, 'mob', mob.alliance, mob.name);
	obj.typeID = typeID;
	obj.lvl = mob.level;
	obj.hp = new baseModels.BarVal(mob.hp,mob.hp,mob.hpreg);
	obj.exp = mob.exp;
	obj.money = mob.money;
	obj.nextDecision = 0;
	
	obj.range = 32;
	obj.loot = mob.loot;
	baseModels.baseCharFunctionality(obj, instance.map);

	obj.stat.patk = mob.patk;
	obj.stat.pdef = mob.pdef;
	obj.stat.atkspd = 1000;
	obj.stat.spd = mob.speed;
	
	obj.decide = function() { //mob obj decide
		if(this.agro.length>0) {
			if(this.agro.length>1) {
				this.agro.sort(function (a, b) {
					return a.val - b.val;
				});
			}
			this.attack(this.agro[0].id);
		} else {
			if(this.action == 'idle' && this.nextDecision<(new Date()).getTime()) {
				this.nextDecision = (new Date()).getTime() + 10000;	
			}
		}
	};
	return obj;
};

var NPCLoad = function(instance, id, typeID, x, y) {
	var npc = res.npcList.filter(function(o){return o.id == typeID})[0];
	var obj = new baseModels.BaseObj(id, npc.img, x, y, 'npc', npc.alliance, npc.name);
	obj.typeID = typeID;
	obj.classType = npc.classType;
	obj.lvl = npc.level;
	obj.hp = new baseModels.BarVal(npc.hp,npc.hp,npc.hpreg);
	obj.stat = {};
	obj.stat.patk = npc.patk;
	obj.stat.pdef = npc.pdef;
	obj.stat.atkspd = 1000;
	obj.stat.spd = npc.speed;
	obj.exp = npc.exp;
	obj.money = npc.money;
	obj.nextDecision = 0;
	
	obj.quests = npc.quests;
	obj.range = 32;
	obj.loot = npc.loot;
	obj.sell = npc.sell;
	obj.priceMod = npc.priceMod;
	baseModels.baseCharFunctionality(obj, instance.map);
	obj.decide = function() { //npc obj decide
	};
	return obj;
};

//---  EXPORTS   ---

module.exports = {
	CharCreate: CharCreate,
	MobLoad: MobLoad,
	NPCLoad: NPCLoad
};
