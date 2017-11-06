"use strict"

var fs = require('fs');

//---   RESOURCES   ---

var mobList = JSON.parse(fs.readFileSync('./resources/mobs.data', 'utf8'));
exports.mobList = mobList;
