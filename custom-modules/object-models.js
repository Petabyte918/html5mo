"use strict"

var settings = require('./settings.js').Settings();
var h = require('./helpers.js');
var PF = require('pathfinding');
var fs = require('fs');
var map,
	mobList;

var BarVal = function(val,max,regen) {
	this.val = val;
	this.max = max;
	this.p;
	this.reg = regen;
	this.Set = function(val) {
		this.val = val;
		this.p = Math.abs(val/this.max*100);
	}
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
	}
	obj.curTile();
		// Order object to move
	obj.moveTo = function(targetVector) {
		var ttile = map.tileByPos(targetVector);
		if(ttile) {
			this.path = map.pf.pfFinder.findPath(this.tile.y, this.tile.x, ttile.ind.x, ttile.ind.y, map.pf.pfGrid.clone());
			this.path.splice(0,1);
			if(this.path.length>0) {
				//this.path = PF.Util.smoothenPath(pf.pfGrid, this.path);
				//this.path = PF.Util.compressPath(this.path);
				this.ppos = h.V2(map.grid[this.path[0][1]][this.path[0][0]].pos.x,map.grid[this.path[0][1]][this.path[0][0]].pos.y);
				this.ppos.x += map.settings.tileW/2;
				this.ppos.y += map.settings.tileW/2;
			}
			this.tpos = targetVector;
			this.action = 'move';
		}
	};
	obj.follow = function(id) {
		this.followID = id;
		this.action = 'follow';
	};
	obj.reachTarget = function() {
		this.tpos = this.pos;
		var targetObj = objManager.get(this.followID);
		if(targetObj.action!='dead') {
			if (this.relation(targetObj) < 2){ // TODO change to 0
				this.hit(targetObj);
			}
		} else {
			this.loseTarget();
		}
	};
	obj.loseTarget = function() {
		this.targetID = null;
		this.decide();
	}
	obj.attack = function(id) {
		this.targetID = id;
		this.action = 'attack';
	};
	// Update object
	obj.update = function(dt) {
		if(this.action == 'dead') {
		// if is dead do nothing
		} else {
			if(this.action == 'follow') if(this.targetID!= null) {
				var t = objManager.get(this.targetID);
				if(t == null) {
					this.action = 'idle';
					this.targetID = null;
				} else {
					// set target position to target object location
					this.tpos = t.pos;
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
					if(this.action == 'follow' && length<constants.cFollowDist){
						this.reachTarget();
					} else if(length < 5) {//this.v*2*dt) {
						if(this.path.length>1) {
							this.path.splice(0,1);
							this.ppos = map.grid[this.path[0][1]][this.path[0][0]].pos,{};
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
}

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
	obj.decide = function() {
	};
	return obj;
};

// Mob object - non user controlled object that will be fought by users
var MobObj = function(id, typeID, x, y) {
	var mob = mobList.filter(function(o){return o.typeID == typeID})[0];
	var obj = new BaseObj(id, mob.img, x, y, 'mob', mob.alliance, mob.name);
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
		this.obj.push(new CharObj(this.nextid, icon, si, sj, name, alliance, sid));
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
		fs.readdir('./resources/mobs', function(err, files) {
			console.log('Reading mob list: ' + (h.replaceAll(files.join(),'.data', '')));
			mobList = Array();
			for (var i=0; i<files.length; i++) {
				mobList.push(JSON.parse(fs.readFileSync('./resources/mobs/' + files[i], 'utf8')));
			}
		});
	},
	update: function(dt) {
		for(var i = 0; i < this.obj.length; i++) {
			if(this.obj[i]) this.obj[i].update(dt);
		}
		if(mobList)for(var i = 0; i < map.mobSpawnList.length; i++) {
			if(!map.mobSpawnList[i].spawned) {
				this.addMob(
					map.mobSpawnList[i].id,
					map.mobSpawnList[i].x * map.settings.tileW + map.settings.tileW/2,
					map.mobSpawnList[i].y * map.settings.tileW + map.settings.tileW/2)
				console.log('Spawn '+  mobList.filter(function(o){return o.typeID == map.mobSpawnList[i].id})[0].name);
				map.mobSpawnList[i].spawned = 1;
			}
		}
	}
};

//---  EXPORTS   ---

module.exports = {
	ObjManager: _ObjManager
};
