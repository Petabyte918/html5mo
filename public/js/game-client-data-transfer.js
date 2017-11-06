"use strict"
//---   DATA TRANSFER   ---

var socket = io();

// Send data to server
function sendData(call, data) {
	socket.emit(call, data);
}

// When receive message from server, add text to the messages list
socket.on('chat', function(data) {
	$('#messages').append($('<li>').text(data.sendername+" : "+data.msg));
});

socket.on('condata', function(JSONdata) {
	var data = JSONdata.data;
	objData(JSON.parse(data.objdata));
	mapData(JSON.parse(data.mapdata));
	itemData(JSON.parse(data.itemdata));
	engine.userID = data.newconid;
	var user = objectFindByKey(engine.data.obj, 'id', engine.userID);
	document.getElementById("user-name").innerHTML = user.name;

	// INVENTORY
	var inv = document.getElementById("inventory-slots");
	var strInv ='';
	for (var i=0; i<user.inv.slot.length; i++) {
		strInv += "<li class='inv-slot' id='s_"+engine.userID+"_i_"+i+"'data-slot-index='"+i+"' "+((user.inv.slot[i].count>0)?user.inv.slot[i].count:'')+" ondrop='drop(event)' ondragover='allowDrop(event)'></li>"
	}
	inv.innerHTML = strInv;
	var inv = document.getElementById("inventory-slots");

	// LOADOUT
	var lwep = document.getElementById("loadout-weapon").getElementsByTagName('li');
	var i = 0,
		index = 0;
	for(i; i<lwep.length; i++) {
		lwep[i].id="s_"+engine.userID+"_l_"+i;
	}
	var larm = document.getElementById("loadout-armor").getElementsByTagName('li');
	index = i;
	for(i=0; i<larm.length; i++) {
		larm[i].id="s_"+engine.userID+"_l_"+(index+i);
	}
	var lext = document.getElementById("loadout-extra").getElementsByTagName('li');
	index += i;
	for(i=0; i<lext.length; i++) {
		lext[i].id="s_"+engine.userID+"_l_"+(index+i);
	}
});

// read obj data
function objData(data) {
	engine.data.obj = data;
}

// read map data
function mapData(data) {
	engine.map = data;
	engine.map.bounds = V2(engine.map[0].length*cTileWidth,engine.map.length*cTileWidth);
	engine.miniMapEnabled = false;
}

// read item data
function itemData(data) {
	engine.data.item = data;
}

socket.on('updatedata', function(data) {
	updateData(data);
});

socket.on('update_inv', function(data) {
	updateInv(data);
});

// read update data
function updateData(JSONdata) {
	var newdata = JSON.parse(JSONdata.data);
	var objn = [];
	for(var i = 0; i < newdata.length; i++) {
		var oldObj = objectFindByKey(engine.data.obj, 'id', newdata[i].id);
		if(newdata[i].status == 1) {
			if(oldObj != null) objn.push(oldObj);
		} else if(newdata[i].status == 2) {
			var newObj = newdata[i].data;
			if(oldObj && oldObj.drawData) newObj.drawData = oldObj.drawData;
			if(newdata[i].data != null) objn.push(newObj);
		}
	}
	engine.data.obj = objn;
	var user = objectFindByKey(engine.data.obj, 'id', engine.userID),
		user_hp = document.getElementById("user-hp"),
		hpBarU = user.hp.p;
	user_hp.style.width = hpBarU + '%';

	if(engine.targetID != null) {
		var target = objectFindByKey(engine.data.obj, 'id', engine.targetID);
		if(target == null) {
			engine.targetID = null;
			document.getElementById("target-box").style.display = "none";
		} else {
			var target_hp = document.getElementById("target-hp"),
				hpBarT = target.hp.p;
			target_hp.style.width = hpBarT + '%';
		}
	}

	updateInventory(user);
}

function updateInv(JSONdata) {
	var user = objectFindByKey(engine.data.obj, 'id', engine.userID);

	var newdata = JSON.parse(JSONdata);
	user.loadout = newdata.l;
	user.inv = newdata.i;

	updateInventory(user);
}

function updateInventory(user) {
	if (gui.inventoryOpen) {
		var inv = document.getElementById("inventory-slots"),
			slots = inv.childNodes;

		for (var i=0; i<user.inv.slot.length; i++) {
			if(user.inv.slot[i].count > 0 ) {
				if(slots[i].childNodes[0]) {
					if(slots[i].childNodes[0].getAttribute("data-iid") != user.inv.slot[i].iid) {
						//console.log('replace');
						slots[i].innerHTML = ((user.inv.slot[i].count>0)?"<img "+
						"id='"+engine.userID+"_i_"+i+"' "+
						"data-iid='"+user.inv.slot[i].iid+"' "+
						"title='"+user.inv.slot[i].count+"' "+
						"src='img/item/i_"+user.inv.slot[i].iid+".png' "+
						"draggable='true' "+
						"ondragstart='drag(event)'>":'');
					} else
					if(slots[i].childNodes[0].getAttribute("title") != user.inv.slot[i].count) {
						//console.log('update qty');
						slots[i].childNodes[0].setAttribute("title", user.inv.slot[i].count);
					}

				} else {
					//console.log('insert item empty');
					slots[i].innerHTML = ((user.inv.slot[i].count>0)?"<img "+
						"id='"+engine.userID+"_i_"+i+"' "+
						"title='"+user.inv.slot[i].count+"' "+
						"src='img/item/i_"+user.inv.slot[i].iid+".png' "+
						"draggable='true' "+
						"ondragstart='drag(event)'>":'');
				}
			} else {
				if(slots[i])
					while (slots[i].firstChild) {
						slots[i].removeChild(slots[i].firstChild);
					}
			}
		}

	}
}
