"use strict"

// data transfer object - an interface to send data
class DTO {
	constructor(sio, sm) {
		this.sio = sio;
		this.sm = sm;
		this.sendingUpdates = false;		
	}
	SendTo(userID, dataType, data) {
		var s = this.sm.GetSocketByID(userID);
		if(s) s.emit(dataType, data);
	}
	SendToAll(dataType, data) {
		this.sio.emit(dataType, data);
	}
	SendToRoom(room, dataType, data) {
		this.sio.sockets.in(room).emit(dataType, data);
	}
	StartEmitUpdates(objRef) {
		this.objectsRef = objRef;
		if(!this.sendingUpdates) {
			this.sendingUpdates = true;
			this.EmitUpdates();
		}
	}
	StopEmitUpdates() {
		this.sendingUpdates = false;
	}
	EmitUpdates() {
		var cd = [];
		var removeList = [];
		for(var i = 0; i < this.objectsRef.length; i++) {
			if(this.objectsRef[i].status == 1) {
				cd.push({id: this.objectsRef[i].id, status: 1});
			} else if(this.objectsRef[i].status == 2) {
				if(this.objectsRef[i].action == 'dead') {
					removeList.push(this.objectsRef[i].id);
					console.log(this.objectsRef[i].name+' is dead '+ this.objectsRef[i].status);
					cd.push({id: this.objectsRef[i].id, status: 0, data: this.objectsRef[i]});
					this.objectsRef[i].status = 0;
				} else {
					cd.push({id: this.objectsRef[i].id, status: 2, data: this.objectsRef[i]});
					this.objectsRef[i].status = 1;
				}
			}
		}
		for(i = 0; i < removeList.length; i++) {
			console.log('remove '+ removeList[i]);
			const index = this.objectsRef.findIndex(item => item.id === removeList[i]);
			this.objectsRef.splice(index, 1);
		}
		this.sio.emit('update-data', {
			data: JSON.stringify(cd),
			time: Date.now()
		});
		if(this.sendingUpdates) setTimeout(this.EmitUpdates.bind(this),200);
	}
};

module.exports = {
	DTO: DTO
}
