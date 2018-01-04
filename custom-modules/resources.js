"use strict"

var fs = require('fs');

//---   RESOURCES   ---

var mobList = JSON.parse(fs.readFileSync('./resources/mobs.data', 'utf8'));
exports.mobList = mobList;

var npcList = JSON.parse(fs.readFileSync('./resources/npcs.data', 'utf8'));
exports.npcList = npcList;

var itemList = JSON.parse(fs.readFileSync('./resources/items.data', 'utf8'));
exports.itemList = itemList;

var questList = JSON.parse(fs.readFileSync('./resources/quests.data', 'utf8'));
exports.questList = questList;

var instanceList = JSON.parse(fs.readFileSync('./resources/instances.data', 'utf8'));
exports.instanceList = instanceList;

// itype: 1 = crafting, 2 = char item 3 = consumable, 4 = quest, 5 = etc

// 1 = main hand
// 2 = off hand
// 3 = ammo

// 4 = head
// 5 = shoulder
// 6 = chest
// 7 = hands
// 8 = legs
// 9 = feet

// 10 = shirt
// 11 = back
// 12 = belt
// 13 = neck
// 14 = finger 1
// 15 = finger 2
