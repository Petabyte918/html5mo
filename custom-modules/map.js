"use strict"

var h = require('./helpers.js');
var PF = require('pathfinding');
var fs = require('fs');

//---  MAP CONSTRUCTOR  ---

function InitMap(_this) {
	_this.grid = [];
	_this.settings = {
		tileW : 64,
		spawnI: 1,
		spawnJ: 1,
		nextSpawn: 1
	}
	_this.pf = { 
		pfMatrix : [],
		pfGrid : {},
		pfFinder : new PF.BestFirstFinder({
			allowDiagonal: true,
			dontCrossCorners: true
		})
	}
}

function FinalizeMap(_this) {
	_this.pf.pfGrid = new PF.Grid(_this.pf.pfMatrix);
	// get the tile at position
	_this.tileByPos = function(position) {
		return Object.assign( //copy the object so that someone don't accidentally edit the tile
			_this.grid[Math.floor(position.y/_this.settings.tileW)][Math.floor(position.x/_this.settings.tileW)],{}
		);
	}
}

function _Map(x,y) {
	// Init base
	InitMap(this);

	// Generate data
	var nextTile = 0;
	for(var j = 0; j < y; j++) {
		this.grid.push([]);
		this.pf.pfMatrix.push([]);
		for (var i = 0; i < x; i++) {
			this.grid[j].push(new Tile(nextTile, i, j, this.settings.tileW, 2, 'tiles/grass-sparse.jpg'));
			this.pf.pfMatrix[j].push(0);
			nextTile++;
		}
	}
	// Finalize
	FinalizeMap(this);
	return this;
}

//---  MAP LOADER  ---

function _LoadMap(fileName) {
	// Read data
	var obj, data;
	var data = JSON.parse(fs.readFileSync(fileName, 'utf8'));
	// Init base
	InitMap(this);
	this.settings.spawnI = data.spawnI;
	this.settings.spawnJ = data.spawnJ;
	this.mobSpawnList = data.mobSpawnList;
	// Generate data
	for(var j = 0; j < data.y; j++) {
		this.grid.push([]);
		this.pf.pfMatrix.push([]);
		for (var i = 0; i < data.x; i++) {
			this.grid[j].push(
				new Tile(data.tileData[j][i].id, i, j, this.settings.tileW, data.tileData[j][i].walkable, data.textureList[data.tileData[j][i].img])
			);
			this.pf.pfMatrix[j].push((data.tileData[j][i].walkable > 1) ? 0 : 1); // 0-walkable
		}
	}
	// Finalize
	FinalizeMap(this);
	return this;
}

//--- TILE ---

function Tile(id, i, j, width, walkable, img) {
	this.id = id;
	this.ind = h.V2(i, j);
	this.pos = h.V2(i*width, j*width);
	this.walkable = walkable;
	this.img = img; 
	return this;
}

//---  EXPORTS   ---

module.exports = {
	LoadMap: _LoadMap,
	Map: _Map
};
