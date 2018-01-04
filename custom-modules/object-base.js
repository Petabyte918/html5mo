"use strict"

var settings = require('./settings.js');
var res = require('./resources.js');
var h = require('./helpers.js');
var inv = require('./inventory.js');
var PF = require('pathfinding');
var g = require('./globals.js').Globals;

var BarVal = function(val,max,regen) {
	this.val = val;
	this.max = max;
	this.p;
	this.reg = regen;
	this.Set = function(val) {
		this.val = val;
		this.p = Math.abs(val/this.max*100);
	};
	this.Regen = function(dt) {
		if(this.val<this.max) {
			this.Set(this.val + (this.reg*dt/1000));
			return true;
		}
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

var baseCharFunctionality = function(obj, map) {
	obj.stat = {};
	obj.targetID;
	obj.followID;
	obj.action = 'idle';
	obj.attacking = false;
	obj.atkcd = 0;
	obj.path = [];
	obj.agro = [];
	// Movement speed vector
	obj.v = h.V2(0,0);
	obj.tpos = obj.pos;
	obj.curTile = function() {
		this.tile = h.V2(Math.floor(this.pos.y/settings.tileW),Math.floor(this.pos.x/settings.tileW));
	};
	obj.curTile();

	obj.move = function(targetVector, map) {
		var ttile = map.tileByPos(targetVector);
		if(ttile) {
			this.path = map.pf.pfFinder.findPath(this.tile.y, this.tile.x, ttile.ind.x, ttile.ind.y, map.pf.pfGrid.clone());
			this.path.splice(0,1);
			if(this.path.length>0) {
				this.path = PF.Util.smoothenPath(map.pf.pfGrid.clone(), this.path);
				//this.path = PF.Util.compressPath(this.path);
				this.ppos = h.V2(map.grid[this.path[0][1]][this.path[0][0]].pos.x,map.grid[this.path[0][1]][this.path[0][0]].pos.y);
				this.ppos.x += settings.tileW/2;
				this.ppos.y += settings.tileW/2;
			}
			this.tpos = h.V2(targetVector.x, targetVector.y);
		}
	};
	// Order object to move
	obj.moveTo = function(targetVector, map) {
		this.move(targetVector, map);
		this.action = 'move';
	};
	obj.follow = function(id) {
		this.followID = id;
		this.action = 'follow';
	};
	obj.reachTarget = function(im) {
		this.tpos = this.pos;
		var targetObj = im.om.Get(this.followID);
		if(targetObj.action!='dead') {
			if(this.targetID==this.followID) {
				this.hit(targetObj, im);
			} else {
				if(targetObj.type == 'npc') {
					var data;
					switch (targetObj.classType) {
						case 'trader':
							data = {typeID: targetObj.typeID, action: 'trade'};							
						default:
							data = {typeID: targetObj.typeID, action: 'greet'};
					}
					this.loseTarget(this.followID);
					g.dto.SendTo(this.id, 'npc_dlg', data);
				}
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
		this.followID = id;
		this.action = 'follow';
	};
	obj.hit = function(targetObj, im) {
		if(targetObj.action!='dead') {
			if (this.atkcd<=0) {
				this.atkcd = this.stat.atkspd;
				var dmg = Math.round(this.stat.patk + (Math.random()-0.5)*this.stat.patk*0.2);
				console.log('UPDATE: '+this.name + ' dmg ' + this.stat.patk);
				var newHp = targetObj.hp.val-dmg;
				if (newHp>0) {
					targetObj.hp.Set(newHp);
					var agroId = h.indexFindByKey(targetObj.agro, 'id', this.id);
					if(targetObj.agro[agroId]) {
						targetObj.agro[agroId].val+=dmg;
					} else {
						targetObj.agro.push({'id':this.id, 'val':dmg});
					}
					if(targetObj.type == 'mob' && (targetObj.action == 'idle' || targetObj.action == 'move')) {
						targetObj.attack(this.id);	
					}
				} else {
					console.log('UPDATE: '+this.name + ' has killed ' + targetObj.name);
					// Get XP
					this.exp += targetObj.exp;
					console.log('UPDATE: exp ' + targetObj.exp);
					if(this.type == 'user')
						this.lvlUp();
					// Get loot
					this.money += Math.round(targetObj.money*(0.75+Math.random()/2));
					var loot;
					if(targetObj.loot)
						for(var i = 0; i<targetObj.loot.length; i++) {
							loot = {q:0, i:0};
							loot.q = Math.random()<targetObj.loot[i].c;
							if(loot.q>0) {
								loot.i = targetObj.loot[i].id;
								loot.q =  Math.floor(Math.random() * (targetObj.loot[i].qmax - targetObj.loot[i].qmin) + targetObj.loot[i].qmin);
								this.inv.AddItemInv(loot.i, loot.q);
							}
						}
					this.status = 2;

					targetObj.die(im);
					this.loseTarget(targetObj.id);
				}
				targetObj.status = 2;
			}
		} else {
			this.loseTarget(targetObj.id);
		}
	};
	obj.die = function(im) {
		this.hp.Set(0);
		this.targetID = null;
		this.followID = null;
		this.action = 'dead';
		this.status = 2;

		if(this.type == 'mob') {
			var spawn = h.objectFindByKey(im.map.mobSpawnList, 'spawned', this.id);
			if(spawn) {
				spawn.spawnAt = (new Date()).getTime() + res.mobList[this.typeID].respawn*1000;
				spawn.spawned = -1;
			}
		}
	};
	// Update object
	obj.update = function(dt, im) {
		if(this.action == 'dead') {
		// if is dead do nothing
		} else {
			if(this.atkcd>0)
				this.atkcd -= dt;
			if(this.action == 'follow') {
				if(this.followID !== null) {
					var t = im.om.Get(this.followID);
					if(t == null) {
						this.action = 'idle';
						this.followID = null;
					} else {
						// set target position to target object location
						this.move(t.pos, im.map);
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
						this.reachTarget(im);
					} else if(length < 5) {//this.v*2*dt) {
						if(this.path.length>1) {
							this.path.splice(0,1);
							this.ppos = im.map.grid[this.path[0][1]][this.path[0][0]].pos;
							//this.ppos.x += this.settings.tileW/2;
							//this.ppos.y += this.settings.tileW/2;
						} else {
							this.pos = tmppos;

							this.v = h.V2(0,0);
							this.curTile();
						}
					} else {
						// normalize vector
						this.v.x = vect.x/length*this.stat.spd;
						this.v.y = vect.y/length*this.stat.spd;
						this.pos.x += this.v.x*dt;
						this.pos.y += this.v.y*dt;

						this.curTile();
						this.status = 2;
					}
				} else {
					this.action = 'idle';
				}
			}
			if(this.action == 'idle') {
				if(this.hp.Regen(dt*1.5)) this.status = 2;
				if(this.type == 'mob') {
					var time = (new Date()).getTime();
					if(this.nextDecision< time) {
						this.decide();
						this.nextDecision = time + 1000;
					}
				} 
			} else {
				if(this.hp.Regen(dt)) this.status = 2;
			}
		}
	};
	// Update object
	obj.recalcData = function() {
		this.stat.patk = this.atrib[0];
		this.stat.pdef = this.atrib[2];
		this.stat.atkspd = 1000 - this.atrib[1];
		this.stat.pcrt = this.atrib[1];
		this.stat.pcrtd = this.atrib[0];
		this.stat.pacc = this.atrib[1];
		this.stat.pev = this.atrib[1];
		this.stat.shr = this.atrib[1];
		this.stat.shd = this.atrib[0] + this.atrib[2];
		//this.stat.hp.max = this.atrib[1]*3;
		this.stat.matk = this.atrib[3];
		this.stat.mdef = this.atrib[5];
		this.stat.cstspd = 1000 - this.atrib[4];
		this.stat.mcrt = this.atrib[4];
		this.stat.mcrtd = this.atrib[3];
		this.stat.macc = this.atrib[3];
		this.stat.mev = this.atrib[4];

		this.stat.spd = 0.05;

		if(this.loadout) {
			if(this.loadout.slot[0].iid!=0) {
				this.stat.patk += res.itemList[this.loadout.slot[0].iid].patk;
			}
			for(var i = 3; i<8; i++) {
				if(this.loadout.slot[i].iid!=0) {
					this.stat.pdef += res.itemList[this.loadout.slot[i].iid].pdef;
				}
			}
		}
	}

	obj.lvlUp = function() {
		if (this.exp > this.nextlvl) {
			this.exp = this.exp - this.nextlvl;
			this.lvl += 1;
			this.nextlvl = Math.round(this.nextlvl * 1.3);
		}
	}
};

//---  EXPORTS   ---

module.exports = {
	BarVal: BarVal,
	BaseObj: BaseObj,
	baseCharFunctionality: baseCharFunctionality
};
