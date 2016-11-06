"use strict"

var h = require('./helpers.js');

//---  MAP CONSTRUCTOR  ---

function _Map(x,y) {
	this.grid = [];
	this.settings = {
		tileW : 64,
		cWalkablePercentage : 85,
		cWaterPercentage: 30 //(% of unwalkable)
	}
	var nextTile = 0;
	for(var j = 0; j < y; j++) {
		this.grid.push([]);
		//pf.pfMatrix.push([]);
		for (var i = 0; i < x; i++) {
			// is tile walkable?
			// 0- not; 1- water; 2- ground;
			var walkable, img;
			if(Math.random()*100 < this.settings.cWalkablePercentage) {
				walkable = 2;
				img = 'tiles/grass-sparse.jpg';
			} else if(Math.random()*100 < this.settings.cWaterPercentage){ // if it is unwalkable, check whether it should be water or wall
				walkable = 1;
				img = 'tiles/water-plain.jpg';
			} else {
				walkable = 0;
				img = 'tiles/cobblestone-regular.jpg';
			}
			this.grid[j].push(new Tile(nextTile, i, j, this.settings.tileW, img));
			//walkable = (walkable == 0) ? 1 : 0;
			//pf.pfMatrix[j].push(walkable);
			nextTile++;
		}
	}
	//pf.pfGrid = new PF.Grid(pf.pfMatrix);
	// get the tile at position
	this.tileByPos = function(position) {
		return Object.assign( //copy the object so that someone don't accidentally edit the tile
			this.grid[Math.floor(position.y/this.settings.tileW)][Math.floor(position.x/this.settings.tileW)],{}
		);
	}
	return this;
}

//--- TILE ---

function Tile(id, i, j, width, img) {
	this.id = id;
	this.ind = h.V2(i, j);
	this.pos = h.V2(i*width, j*width);
	this.img = img; 
	return this;
}

//---  EXPORTS   ---

module.exports = {
	Map: _Map
};
