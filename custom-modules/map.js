"use strict"

var h = require('./helpers.js');
var PF = require('pathfinding');
var fs = require('fs');
var settings = require('./settings.js');

//---  MAP CONSTRUCTOR  ---

function InitMap(map) {
	map.grid = [];
	map.settings = {
		spawnI: 1,
		spawnJ: 1,
		nextSpawn: 1
	}
	map.spawnMapI = [0,-1,0,1,1,1,0,-1,-1];
	map.spawnMapJ = [0,-1,-1,-1,0,1,1,1,0];
	map.pf = {
		pfMatrix : [],
		pfGrid : {},
		pfFinder : new PF.BestFirstFinder({
			allowDiagonal: true,
			dontCrossCorners: true
		})
	}
	map.NextSpawn = function() {
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
	var map = {};
	InitMap(map);

	map.x = x;
	map.y = y;
	// Generate data
	var nextTile = 0;
	for(var j = 0; j < y; j++) {
		map.grid.push([]);
		map.pf.pfMatrix.push([]);
		for (var i = 0; i < x; i++) {
			map.grid[j].push(new Tile(nextTile, i, j, settings.tileW, 2, 'tiles/grass-sparse.jpg'));
			map.pf.pfMatrix[j].push(0);
			nextTile++;
		}
	}
	// Finalize
	FinalizeMap(map);
	return map;
}

//---  MAP LOADER  ---

function _LoadMap(instanceID, fileName) {
	var map = {};
	map.instanceID = instanceID;
	// Read data
	var obj, data;
	var data = JSON.parse(fs.readFileSync(fileName, 'utf8'));
	// Init base
	InitMap(map);
	map.settings.spawnI = data.spawnI;
	map.settings.spawnJ = data.spawnJ;
	map.mobSpawnList = data.mobSpawnList;
	map.npcSpawnList = data.npcSpawnList;
	// Generate data
	for(var j = 0; j < data.y; j++) {
		map.grid.push([]);
		map.pf.pfMatrix.push([]);
		for (var i = 0; i < data.x; i++) {
			map.grid[j].push(
				new Tile(data.tileData[j][i].id, i, j, settings.tileW, data.tileData[j][i].walkable, data.textureList[data.tileData[j][i].img])
			);
			map.pf.pfMatrix[j].push((data.tileData[j][i].walkable > 1) ? 0 : 1); // 0-walkable
		}
	}

	// Finalize
	FinalizeMap(map);
	return map;
}

function _SaveMap(obj) {
	var m,
		id = 0;

	m = {
		name: "new map",
		x: obj.x,
		y: obj.y,
		spawnI: 2,
		spawnJ: 2,
		textureList: {},
		mobSpawnList: [],
		npcSpawnList: [],
		tileData: []
	}
	
	for(var j = 0; j < obj.y; j++) {
		m.tileData.push([]);
		for (var i = 0; i < obj.x; i++) {
			if(i == 0 || j == 0 || i == obj.x || j == obj.y)
				m.tileData[j].push({id: id, walkable: 2, img: 2});
			else
				m.tileData[j].push({id: id, walkable: 0, img: 1});
		id++;
		}
	}
	fs.writeFileSync('resources\\maps\\newmap.json', JSON.stringify(m)); 

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
	SaveMap: _SaveMap,
	Map: _Map
};
