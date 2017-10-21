"use strict"

//---  SETTINGS OBJECT   ---
module.exports = {
	Settings : function() {
		this.cMapX = 20;
		this.cMapY = 10;
		this.cFollowDist = 32;
		this.startingMap = './resources/maps/starter_map.data';
		return this;
	}
}
