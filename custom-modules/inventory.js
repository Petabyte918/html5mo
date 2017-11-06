"use strict"

var settings = require("./settings.js").Settings();
var h = require("./helpers.js");
var res = require('./resources.js');
var fs = require("fs");

//---  INVENTORY  ---

class Inventory {
	constructor(name, type, cap) {
		this.name = name;
		this.type = type;
		//called first time before the ngOnInit()
		if(cap<1)
		 cap = 1;
		this.capacity = cap;
		this.slot = new Array(0);
		var sType = 0;
		if(type == 'i') {sType = 0;} else
		if(type == 'l') {sType = 2;}
		for (var i = 0; i < cap; i++) {
		 this.slot.push(new Slot(i,sType));
		}
	}

	MoveItemInv(from, to_inv) {
		var i = 0
		var err = "";
		while(i<to_inv.slot.length && from.count>0) {
			if(to_inv.slot[i].count == 0 || to_inv.slot[i].name == from.name) {
				var diff = (from.count+to_inv.slot[i].count<=to_inv.slot[i].maxCount)? from.count : to_inv.slot[i].maxCount-to_inv.slot[i].count;
				if (to_inv.slot[i].AddItem(from.name,diff)) {
					this.slot[from.id].RemoveItem(diff);
				} else {
					err ='failed to add '+diff;
				}
			}
			i++
		}
		return err;
	}
}

function MoveItem(from, to) {
	var i = 0
	var err = "";
	if(to.count == 0 || to.iid == from.iid) {
		var diff = (from.count+to.count<=to.maxCount)? from.count : to.maxCount-to.count;
		//console.log('move qty: '+diff);
		if (to.AddItem(from.iid,from.name,diff)) {
			//console.log('ok, remove');
			from.RemoveItem(diff);
		} else {
			err ='failed to add '+diff;
		}
	}
	return err;
}

class Slot {
	constructor(_id, iType) {
		this.id = _id;
		this.iid = 0;
		this.name = "";
		this.count = 0;
		this.maxCount = 100;
		this.iType = iType;
	}
	AddItem(iid, name, count) {
		if(count<=0 || (this.count != 0 && this.iid!=iid))
			return false;
		//if(this.itype == 2)

		this.iid = iid;
		this.name = name;

		this.count = this.count + count;
		if(this.count>=this.maxCount)
			this.count = this.maxCount;
		return true;
	}
	RemoveItem(count) {
		if(count > this.count) {
			return false;
		} else if (count == this.count) {
			this.iid = 0;
			this.name = "";
		}
		this.count = this.count - count;
		return true;
	}
}

module.exports = {
	Inventory: Inventory,
	Slot: Slot,
	MoveItem: MoveItem
};

