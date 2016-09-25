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
});

// read obj data
function objData(data) {
	engine.data.obj = data;
}

socket.on('updatedata', function(data) {
	updateData(data);
});

// read update data
function updateData(JSONdata) {
	var newdata = JSON.parse(JSONdata.data);
	var objn = [];
	for(var i = 0; i < newdata.length; i++) {
		if(newdata[i].status == 1) {
			var oldobj = objectFindByKey(engine.data.obj, 'id', newdata[i].id);
			if(oldobj != null) objn.push(oldobj);
		} else if(newdata[i].status == 2) {
			if(newdata[i].data != null) objn.push(newdata[i].data);
		}
	}
	engine.data.obj = objn;
}
