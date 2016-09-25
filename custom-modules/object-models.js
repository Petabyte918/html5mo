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
	obj.t = obj.pos;
	obj.targetID;
	obj.action = 'idle';
	obj.sid = sid;
	obj.update = function(dt) {
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
