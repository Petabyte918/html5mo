"use strict"

var settings = require('./settings.js').Settings();
var res = require('./resources.js');
var h = require('./helpers.js');
var inv = require('./inventory.js');
var PF = require('pathfinding');
var fs = require('fs');
var map;

var BarVal = function(val,max,regen) {
	this.val = val;
	this.max = max;
	this.p;
	this.reg = regen;
	this.Set = function(val) {
		this.val = val;
		this.p = Math.abs(val/this.max*100);
	};
	this.Set(val);
	return this;
};

//---  OBJECT MODELS   ---

// BaseObj - the base object that all the other game objects derives from
var BaseObj = function(id, img, x, y, type, alliance, name) {
	this.id = id;
	this.img = img;
	this.pos = new h.V2(x,y);
	this.type = type;
	this.name = name;
	this.alliance = alliance;
	this.status = 2; //0- removed, 1-same, 2-changed
	return this;
};

var baseCharFunctionality = function(obj) {
	obj.targetID;
	obj.followID;
	obj.action = 'idle';
	obj.attacking = false;
	obj.atkcd = 0;
	obj.path = [];
	// Movement speed vector
	obj.v = h.V2(0,0);
	obj.tpos = obj.pos;
	obj.curTile = function() {
		this.tile = h.V2(Math.floor(this.pos.y/map.settings.tileW),Math.floor(this.pos.x/map.settings.tileW));
	};
	obj.curTile();

	obj.move = function(targetVector) {
		var ttile = map.tileByPos(targetVector);
		if(ttile) {
			this.path = map.pf.pfFinder.findPath(this.tile.y, this.tile.x, ttile.ind.x, ttile.ind.y, map.pf.pfGrid.clone());
			this.path.splice(0,1);
			if(this.path.length>0) {
				this.path = PF.Util.smoothenPath(map.pf.pfGrid.clone(), this.path);
				//this.path = PF.Util.compressPath(this.path);
				this.ppos = h.V2(map.grid[this.path[0][1]][this.path[0][0]].pos.x,map.grid[this.path[0][1]][this.path[0][0]].pos.y);
				this.ppos.x += map.settings.tileW/2;
				this.ppos.y += map.settings.tileW/2;
			}
			this.tpos = h.V2(targetVector.x, targetVector.y);
		}
	};
	// Order object to move
	obj.moveTo = function(targetVector) {
		this.move(targetVector);
		this.action = 'move';
	};
	obj.follow = function(id) {
		this.followID = id;
		this.action = 'follow';
	};
	obj.reachTarget = function(om) {
		this.tpos = this.pos;
		var targetObj = om.get(this.followID);
		if(targetObj.action!='dead') {
			if(this.targetID==this.followID) {
				this.hit(targetObj);
			}
		} else {
			this.loseTarget(this.followID);
		}
	};
	obj.loseTarget = function(target) {
		if(this.targetID == target)
			this.targetID = null;
		if(this.followID == target)
			this.followID = null;
		this.action = 'idle';
		this.decide();
	};
	obj.attack = function(id) {
		this.targetID = id;
		this.action = 'attack';
	};
	obj.hit = function(targetObj) {
		if(targetObj.action!='dead') {
			if (this.atkcd<=0) {
				this.atkcd = this.atkspd;
				var dmg = Math.abs(this.patk + (Math.random()-0.5)*this.patk*0.2);
				//console.log('dmg '+dmg);
				var newHp = targetObj.hp.val-dmg;
				if (newHp>0) {
					targetObj.hp.Set(newHp);
				} else {
					console.log(this.name + ' has killed ' + targetObj.name);
					targetObj.die();
					this.loseTarget(targetObj.id);
				}
				targetObj.status = 2;
			}
		} else {
			this.loseTarget(targetObj.id);
		}
	};
	obj.die = function() {
		this.hp.Set(0);
		this.targetID = null;
		this.followID = null;
		this.action = 'dead';
		this.status = 2;
	};
	// Update object
	obj.update = function(dt, om) {
		if(this.action == 'dead') {
		// if is dead do nothing
		} else {
			if(this.atkcd>0)
				this.atkcd -= dt;
			if(this.action == 'follow') {
				if(this.followID !== null) {
					var t = om.get(this.followID);
					if(t === null) {
						this.action = 'idle';
						this.followID = null;
					} else {
						// set target position to target object location
						this.move(t.pos);
					}
				}
			}
			if(this.action == 'follow' || this.action == 'move') {
				var tmppos;
				if(this.path.length>1)
					tmppos = this.ppos;
				else
					tmppos = this.tpos;
				if(tmppos!= this.pos.y || tmppos.x!= this.pos.x) {
					var vect = h.V2(tmppos.x-this.pos.x, tmppos.y-this.pos.y);
					var length = Math.sqrt(vect.x * vect.x + vect.y * vect.y);
					if(this.action == 'follow' && length<settings.cFollowDist){
						this.reachTarget(om);
					} else if(length < 5) {//this.v*2*dt) {
						if(this.path.length>1) {
							this.path.splice(0,1);
							this.ppos = map.grid[this.path[0][1]][this.path[0][0]].pos;
							//this.ppos.x += map.settings.tileW/2;
							//this.ppos.y += map.settings.tileW/2;
						} else {
							this.pos = tmppos;

							this.v = h.V2(0,0);
							this.curTile();
						}
					} else {
						// normalize vector
						this.v.x = vect.x/length*this.speed;
						this.v.y = vect.y/length*this.speed;
						this.pos.x += this.v.x*dt;
						this.pos.y += this.v.y*dt;

						this.curTile();
						this.status = 2;
					}
				} else {
					this.action = 'idle';
				}
			}
		}
	};
};

// Character object - the object that will live and move in game
var CharObj = function(id, img, x, y, name, alliance, sid) {
	var obj = new BaseObj(id, img, x, y, 'char', alliance, name);
	// Session ID
	obj.sid = sid;

	obj.lvl = 1;
	obj.hp = new BarVal(150,150,1);
	obj.patk = 10;
	obj.pdef = 10;
	obj.atkspd = 1000;
	// Absolute object speed
	obj.speed = 0.05;

	obj.range = 32;
	baseCharFunctionality(obj);
	obj.loadout = new inv.Inventory(id, 'l', 49);
	obj.inv = new inv.Inventory(id, 'i', 49);
	obj.decide = function() {
	};
	return obj;
};

// Mob object - non user controlled object that will be fought by users
var MobObj = function(id, typeID, x, y) {
	var mob = res.mobList.filter(function(o){return o.typeID == typeID})[0];
	var obj = new BaseObj(id, mob.img, x, y, 'mob', mob.alliance, mob.name);
	obj.typeID = typeID;
	obj.lvl = mob.level;
	obj.hp = new BarVal(mob.hp,mob.hp,mob.hpreg);
	obj.patk = mob.patk;
	obj.pdef = mob.pdef;
	obj.atkspd = 1000;
	obj.exp = mob.exp;
	// Absolute object speed
	obj.speed = mob.speed;

	obj.range = 32;
	baseCharFunctionality(obj);
	obj.decide = function() {
	};
	return obj;
};


var MobLoad = function(id, typeID, x, y) {
	var mob = res.mobList.filter(function(o){return o.typeID == typeID})[0];
	var obj = new BaseObj(id, mob.img, x, y, 'mob', mob.alliance, mob.name);
	obj.typeID = typeID;
	obj.lvl = mob.level;
	obj.hp = new BarVal(mob.hp,mob.hp,mob.hpreg);
	obj.patk = mob.patk;
	obj.pdef = mob.pdef;
	obj.atkspd = 1000;
	obj.exp = mob.exp;
	// Absolute object speed
	obj.speed = mob.speed;

	obj.range = 32;
	baseCharFunctionality(obj);
	obj.decide = function() {
	};
	return obj;
};

//---  OBJECT MANAGER   ---

// Takes care of creating objects
var _ObjManager = {
	obj: [],
	nextid: 0,
	spawnMapI: [0,-1,0,1,1,1,0,-1,-1],
	spawnMapJ: [0,-1,-1,-1,0,1,1,1,0],
	addUser: function(icon, x, y, name, alliance, sid) {
		map.settings.nextSpawn++;
		if(map.settings.nextSpawn>8) map.settings.nextSpawn = 1;
		var si, sj;
		si = (map.settings.spawnI+this.spawnMapI[map.settings.nextSpawn])*map.settings.tileW + map.settings.tileW/2;
		sj = (map.settings.spawnJ+this.spawnMapJ[map.settings.nextSpawn])*map.settings.tileW + map.settings.tileW/2;
		this.obj.push(new CharObj(this.nextid, icon, si, sj, name, alliance, sid, this));
		this.nextid++;
		return this.nextid-1;
	},
	addMob: function(typeID, x, y) {
		this.obj.push(new MobObj(this.nextid, typeID, x, y));
		this.nextid++;
		return this.nextid-1;
	},
	removeObj: function(id) {
		this.obj.splice(h.indexFindByKey(this.obj, 'id', id),1);
	},
	// Get object by id
	get: function(id) {
		return this.obj.filter(function(o){return o.id == id;})[0];
	},
	init: function(mapRef) {
		map = mapRef;
	},
	update: function(dt) {
		for(var i = 0; i < this.obj.length; i++) {
			if(this.obj[i]) this.obj[i].update(dt, this);
		}
		if(res.mobList)for(i = 0; i < map.mobSpawnList.length; i++) {
			if(!map.mobSpawnList[i].spawned) {
				this.addMob(
					map.mobSpawnList[i].id,
					map.mobSpawnList[i].x * map.settings.tileW + map.settings.tileW/2,
					map.mobSpawnList[i].y * map.settings.tileW + map.settings.tileW/2)
				//console.log('Spawn '+  res.mobList.filter(function(o){return o.typeID == map.mobSpawnList[i].id})[0].name);
				map.mobSpawnList[i].spawned = 1;
			}
		}
	},
	UserSave: function(id) {
		var u = this.get(id);
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
	},
	LoadUser: function(sid, nobj) {
		var obj = new BaseObj(this.nextid, nobj.img, nobj.pos.x, nobj.pos.y, 'char', nobj.alliance, nobj.name);
		// Session ID
		obj.sid = sid;

		obj.lvl = nobj.lvl;
		obj.hp = new BarVal(nobj.hp.val,nobj.hp.max,nobj.hp.regen);
		obj.patk = nobj.patk;
		obj.pdef = nobj.pdef;
		obj.atkspd = nobj.atkspd;
		// Absolute object speed
		obj.speed = nobj.speed;

		obj.range = nobj.range;
		baseCharFunctionality(obj);
		obj.loadout = new inv.Inventory(this.nextid, 'l', 49);
		obj.inv = new inv.Inventory(this.nextid, 'i', 49);
		for(var i = 0; i<obj.loadout.slot.length; i++)
			if(nobj.loadout.slot[i].count>0)
				obj.loadout.slot[i].AddItem(nobj.loadout.slot[i].iid, nobj.loadout.slot[i].name, nobj.loadout.slot[i].count);
		for(var i = 0; i<obj.inv.slot.length; i++)
			if(nobj.inv.slot[i].count>0)
				obj.inv.slot[i].AddItem(nobj.inv.slot[i].iid, nobj.inv.slot[i].name, nobj.inv.slot[i].count);
		obj.decide = function() {
		};
		this.obj.push(obj);
		this.nextid++;
		return this.nextid-1;
	}
};

//---  EXPORTS   ---

module.exports = {
	ObjManager: _ObjManager
};
