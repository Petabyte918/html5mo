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
	StartEmitUpdates(instRef) {
		this.instRef = instRef;
		if(!this.sendingUpdates) {
			this.sendingUpdates = true;
			this.EmitUpdates();
		}
	}
	StopEmitUpdates() {
		this.sendingUpdates = false;
	}
	EmitUpdates() {
		var instancedata = [];
		for(var ins = 0; ins<this.instRef.inst.length; ins++) {
			var objList = [];
			if(this.instRef.inst[ins].running) {
				var objRef = this.instRef.inst[ins].om.obj;
				for(var i = 0; i < objRef.length; i++) {
					objList.push({
						id:objRef[i].id,
						type:objRef[i].type,
						action:objRef[i].action,
						name:objRef[i].name
					});
				}
			}
			
			instancedata.push({
				instid:this.instRef.inst[ins].id,
				instname:this.instRef.inst[ins].name,
				instrun:this.instRef.inst[ins].running, 
				objectData:objList});
		}
		for(ins = 0; ins<this.instRef.inst.length; ins++) {
			if(this.instRef.inst[ins].running) {
				var objRef = this.instRef.inst[ins].om.obj,
					cd = [],
					removeList = [];
				for(var i = 0; i < objRef.length; i++) {
					if(objRef[i].status == 1) {
						cd.push({id: objRef[i].id, status: 1});
					} else if(objRef[i].status == 2) {
						if(objRef[i].action == 'dead' && objRef[i].type != 'user') {
							removeList.push(objRef[i].id);
							console.log('UPDATE: '+objRef[i].name+' is dead '+ objRef[i].status);
							cd.push({id: objRef[i].id, status: 0, data: objRef[i]});
							objRef[i].status = 0;
						} else {
							cd.push({id: objRef[i].id, status: 2, data: objRef[i]});
							objRef[i].status = 1;
						}
					}
				}
				for(i = 0; i < removeList.length; i++) {
					console.log('UPDATE: remove '+ removeList[i]);
					const index = objRef.findIndex(item => item.id === removeList[i]);
					objRef.splice(index, 1);
				}
				this.SendToRoom(this.instRef.inst[ins].id,'update-data', {
					instance: this.instRef.inst[ins].id,
					data: JSON.stringify(cd),
					instData: instancedata,
					time: Date.now()
				});
			}
		}
		if(this.sendingUpdates) setTimeout(this.EmitUpdates.bind(this),200);
	}
};

module.exports = {
	DTO: DTO
}
