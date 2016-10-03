"use strict"

var h = require('./helpers.js');

//---  OBJECT MODELS   ---

// BaseObj - the base object that all the other game objects derives from
var BaseObj = function(id, img, x, y, type, name) {
	this.id = id;
	this.img = img;
	this.pos = new h.V2(x,y);
	this.type = type;
	this.name = name;
	this.status = 2; //0- removed, 1-same, 2-changed
	return this;
};

// Character object - the object that will live and move in game
var CharObj = function(id, img, x, y, name, sid) {
	var obj = new BaseObj(id, img, x, y, 'char', name);
	obj.tpos = obj.pos;
	obj.targetID;
	obj.action = 'idle';
	// Session ID
	obj.sid = sid;
	// Absolute object speed
	obj.speed = 0.02;
	// Movement speed vector
	obj.v = h.V2(0,0);
	// Order object to move
	obj.moveTo = function(targetVector) {
		this.tpos = targetVector;
		this.action = 'move';
	};
	// Update object
	obj.update = function(dt) {
		if(this.action == 'dead') {
		// if is dead do nothing
		} else {
			// if object is moving
			if(this.action == 'move') {
				// get target vector
				var vect = h.V2(this.tpos.x - this.pos.x, this.tpos.y - this.pos.y);
				// get distance to target
				var length = Math.sqrt(vect.x * vect.x + vect.y * vect.y);
				if(length < 5) { // if target is near - stop
					this.tpos.x = this.pos.x;
					this.tpos.y = this.pos.y;
					// reset speed vector
					this.v = h.V2(0,0);
					this.action = 'idle';
				} else { // if target is far - move towards it
					// normalize vector
					this.v.x = vect.x / length * this.speed;
					this.v.y = vect.y / length * this.speed;
					// update coordinates (move object)
					this.pos.x += this.v.x * dt;
					this.pos.y += this.v.y * dt;
					// object had changed
					this.status = 2;
				}
			}
		}
	};
	return obj;
};

//---  OBJECT MANAGER   ---

// Takes care of creating objects
var _ObjManager = {
	obj: [],
	nextid: 0,
	addObj: function(icon, x, y, name, sid) {
		this.obj.push(new CharObj(this.nextid, icon, x+this.nextid*50, y, name, sid));
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
	init: function() {
	},
	update: function(dt) {
		for(var i = 0; i < this.obj.length; i++) {
			if(this.obj[i]) this.obj[i].update(dt);
		}
	}
};

//---  EXPORTS   ---

module.exports = {
	ObjManager: _ObjManager
};
