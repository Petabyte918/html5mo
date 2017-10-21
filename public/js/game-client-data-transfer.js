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
	engine.userID = data.newconid;
	var user = objectFindByKey(engine.data.obj, 'id', engine.userID);
	document.getElementById("user-name").innerHTML = user.name;

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

socket.on('updatedata', function(data) {
	updateData(data);
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

}
