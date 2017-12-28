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
				diff -= to_inv.slot[i].AddItem(from.iid,diff);
				this.slot[from.id].RemoveItem(diff);
			}
			i++;
		}
		return err;
	}

	AddItemInv(iid, count) {
		for (var i = 0; i<this.slot.length; i++) {
			if(this.slot[i].iid==iid || this.slot[i].iid==0) {
				count = this.slot[i].AddItem(iid, count);
				if(count<=0) return 0;
			}
		}
		return count;
	}

	RemoveItemInv(iid, count) {
		for (var i = this.slot.length-1; i>=0; i--) {
			if(this.slot[i].iid==iid) {
				count = this.slot[i].RemoveItem(count);
				if(count<=0) return 0;
			}
		}
		return count;
	}

}

function MoveItem(from, to) {
	var i = 0
	var err = "";
	if(to.count == 0 || to.iid == from.iid) {
		var diff = (from.count+to.count<=to.maxCount)? from.count : to.maxCount-to.count;
		//console.log('move qty: '+diff);
		diff -= to.AddItem(from.iid,diff);
			//console.log('ok, remove');
		from.RemoveItem(diff);
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
	AddItem(iid, count) {
		if(count<=0 || (this.count != 0 && this.iid!=iid))
			return count;
		//if(this.itype == 2)
		this.iid = iid;

		this.name = h.objectFindByKey(res.itemList, 'id', iid).name;

		this.count = this.count + count;
		if(this.count>=this.maxCount) {
			var left = this.count - this.maxCount;
			this.count = this.maxCount;
			return left;
		}
		return 0;
	}
	RemoveItem(count) {
		if(count > this.count) {
			this.iid = 0;
			this.count = 0;
			this.name = "";
			return count-this.count;
		} else if (count == this.count) {
			this.iid = 0;
			this.name = "";
		}
		this.count -= count;
		return 0;
	}
}

module.exports = {
	Inventory: Inventory,
	Slot: Slot,
	MoveItem: MoveItem
};

