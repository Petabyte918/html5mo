"use strict"

var fs = require("fs");
var map = require('./map.js');
var settings = require('./settings.js');

//---   MAIN APP CONTROLLER   ---

class App {
	constructor(dto,instanceManager) {
		this.instManager = instanceManager;
		this.dto = dto;
		this.lastupdate = Date.now();
		this.dtime = 0;
		this.running = false;		
	}

	Start() {
		this.Init();
		this.running = true;
		this.lastupdate = Date.now();
		this.Update();
		this.dto.StartEmitUpdates(this.instManager);
		console.log('INFO: app started!');
	}

	Stop() {
		this.running = false;
		this.dto.stopEmitUpdates();
		console.log('INFO: app stopped!');
	}

	Init() {
		this.instManager.Init();
		console.log('INFO: app initialized');
	}

	Update() {
		if(this.running) {
			this.dtime = Date.now() - this.lastupdate;
			this.lastupdate = Date.now();
			this.instManager.Update(this.dtime);
			setTimeout(this.Update.bind(this),100);
		}
	}

	Save() {
		console.log('UNINITIALIZED: Saving!');
		/*console.log('Saving...');
		fs.writeFile("./saved-data/save1.dat", JSON.stringify(this.objManager.obj) , function(err) {
			if(err) {
				return console.log(err);
			}
			console.log("The state was saved!");
		});*/
	}
	
	Load() {
		console.log('UNINITIALIZED: Loading!');
	}
};
	
module.exports = {
	App: App
}
