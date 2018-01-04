"use strict"

var h = require('./helpers.js');
var PF = require('pathfinding');
var fs = require('fs');
var settings = require('./settings.js');

//---  MAP CONSTRUCTOR  ---

function InitMap(_this) {
	_this.grid = [];
	_this.settings = {
		spawnI: 1,
		spawnJ: 1,
		nextSpawn: 1
	}
	_this.spawnMapI = [0,-1,0,1,1,1,0,-1,-1];
	_this.spawnMapJ = [0,-1,-1,-1,0,1,1,1,0];
	_this.pf = {
		pfMatrix : [],
		pfGrid : {},
		pfFinder : new PF.BestFirstFinder({
			allowDiagonal: true,
			dontCrossCorners: true
		})
	}
	_this.NextSpawn = function() {
		this.settings.nextSpawn++;
		if(this.settings.nextSpawn>8) this.settings.nextSpawn = 1;
		return {
			i: (this.settings.spawnI+this.spawnMapI[this.settings.nextSpawn])*settings.tileW + settings.tileW/2,
			j: (this.settings.spawnJ+this.spawnMapJ[this.settings.nextSpawn])*settings.tileW + settings.tileW/2
		};
	}
}

function FinalizeMap(_this) {
	_this.pf.pfGrid = new PF.Grid(_this.pf.pfMatrix);
	// get the tile at position
	_this.tileByPos = function(position) {
		return Object.assign( //copy the object so that someone don't accidentally edit the tile
			_this.grid[Math.floor(position.y/settings.tileW)][Math.floor(position.x/settings.tileW)],{}
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
			this.grid[j].push(new Tile(nextTile, i, j, settings.tileW, 2, 'tiles/grass-sparse.jpg'));
			this.pf.pfMatrix[j].push(0);
			nextTile++;
		}
	}
	// Finalize
	FinalizeMap(this);
	return this;
}

//---  MAP LOADER  ---

function _LoadMap(instanceID, fileName) {
	this.instanceID = instanceID;
	// Read data
	var obj, data;
	var data = JSON.parse(fs.readFileSync(fileName, 'utf8'));
	// Init base
	InitMap(this);
	this.settings.spawnI = data.spawnI;
	this.settings.spawnJ = data.spawnJ;
	this.mobSpawnList = data.mobSpawnList;
	this.npcSpawnList = data.npcSpawnList;
	// Generate data
	for(var j = 0; j < data.y; j++) {
		this.grid.push([]);
		this.pf.pfMatrix.push([]);
		for (var i = 0; i < data.x; i++) {
			this.grid[j].push(
				new Tile(data.tileData[j][i].id, i, j, settings.tileW, data.tileData[j][i].walkable, data.textureList[data.tileData[j][i].img])
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
