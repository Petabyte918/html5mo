"use strict"

var fs = require("fs");
var map = require('./map.js');
var settings = require('./settings.js').Settings();

//---   MAIN APP CONTROLLER   ---

class App {
	constructor(dto,objManager) {
		this.objManager = objManager;
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
		this.dto.StartEmitUpdates(this.objManager.obj);
		console.log('app started!');
	}
	Stop() {
		this.running = false;
		this.dto.stopEmitUpdates();
		console.log('app stopped!');
	}
	Init() {
		this.map = map.Map(settings.cMapX, settings.cMapY);
		this.map = map.LoadMap(settings.startingMap);
		this.objManager.Init(this.map);
		console.log('app initialized');
	}
	Update() {
		if(this.running) {
			this.dtime = Date.now() - this.lastupdate;
			this.lastupdate = Date.now();
			this.objManager.Update(this.dtime);
			setTimeout(this.Update.bind(this),100);
		}
	}
	Save() {
		console.log('Saving...');
		fs.writeFile("./saved-data/save1.dat", JSON.stringify(this.objManager.obj) , function(err) {
			if(err) {
				return console.log(err);
			}
			console.log("The state was saved!");
		});
	}
	Load() {
		console.log('Loading!');
	}
};
	
module.exports = {
	App: App
}
