"use strict"

//--- USER INPUT ---

//--- Variables and constants ---

var cScrollSpeed = 0.1;
var cursorsDir;
if(window.innerWidth > 800) {
	cursorsDir = 'img/cursors32/';
} else {
	cursorsDir = 'img/cursors16/';
}

//--- Keyboard input ---

var kbKey = {
	esc : false,
	left : false,
	right : false,
	up : false,
	down : false,
	c : false,
	i : false,
	m : false
};

function handleKeyDown(event) {
	switch(event.keyCode) {
	case 27:
		// run function once per key press (if key was already pressed, do nothing)
		if(kbKey.esc == false) {
			escapeKey();
			kbKey.esc = true;
		}
		break;
	case 37:
		kbKey.left = true;
		break;
	case 38:
		kbKey.up = true;
		break;
	case 39:
		kbKey.right = true;
		break;
	case 40:
		kbKey.down = true;
		break;
	case 67:
		kbKey.c = true;
		break;
	case 73:
		if(kbKey.i == false) {
			iKey();
			kbKey.i = true;
		}
		break;
	case 77:
		if(kbKey.m == false) {
			mKey();
			kbKey.m = true;
		}
		break;
	}
}

function handleKeyUp(event) {
	switch(event.keyCode) {
	case 27:
		kbKey.esc = false;
		break;
	case 37:
		kbKey.left = false;
		break;
	case 38:
		kbKey.up = false;
		break;
	case 39:
		kbKey.right = false;
		break;
	case 40:
		kbKey.down = false;
		break;
	case 67:
		kbKey.c = false;
		break;
	case 73:
		kbKey.i = false;
		break;
	case 77:
		kbKey.m = false;
		break;
	}
}

function scrollMap(dtime) {
	var dOffset = Math.round(cScrollSpeed * dtime);

	if(kbKey.left) offsetX+= dOffset;
	if(kbKey.right) offsetX-= dOffset;
	if(kbKey.up) offsetY+= dOffset;
	if(kbKey.down) offsetY-= dOffset;
}

//--- Mouse input ---

// disable right click options menu over canvas
$('body').on('contextmenu', '#mainCanvas', function(e){ return false; });

// set default cursor
$('body').css({'cursor': 'url('+cursorsDir+'2.ico), default'});

// Object to store mouse data
var mouse = {
	left: false,
	right: false,
	pos: { x: 0, y: 0 },
	coord: { x: 0, y: 0 },
	over: [],
	cursor: 0,
	setCursor: function (newCur) {
		if(newCur != this.cursor) {
			this.cursor = newCur;
			$('#mainCanvas').css({'cursor': 'url('+cursorsDir+newCur+'.ico), default'});
		}
	}
};

// A function that gets the mouse coordinates in canvas (from http://www.html5canvastutorials.com/advanced/html5-canvas-mouse-coordinates/)
function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: Math.round((evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
		y: Math.round((evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height)
	};
}

// Constant mouse button codes
var cMleft = 0;
var cMright = 2;

// Bind events and their respective functions
function AddUIevents() {
	// Keyboard events
	window.addEventListener('keydown', handleKeyDown, true);
	window.addEventListener('keyup', handleKeyUp, true);

	// On mouse move, we update the mouse position
	document.body.addEventListener('mousemove', function (e) {
		mouse.pos = getMousePos(canvas, e);
	}, false);

	// On mouse down we call functions only if key was not pressed before. Note it is attached to canvas object - not window.
	canvas.addEventListener('mousedown', function (e) {
		if(e.button === cMleft){
			if(mouse.left == false){
				mouse.left = true;
				MouseLeftClick();
			}
		}
		else if(e.button === cMright) {
			if(mouse.left == false){
				mouse.right = true;
				MouseRightClick();
			}
		}
	}, false);

	// On mouse up we reset properties of mouse object
	canvas.addEventListener('mouseup', function (e) {
		if(e.button === cMleft) {
			mouse.left = false;
		}
		else if(e.button === cMright) {
			mouse.right = false;
		}
	}, false);
}

// On mouse left click we get the coordinates of click and send this data to server
function MouseLeftClick() {
	if(mouse.cursor!=0) {
		var target_lvl = document.getElementById("target-lvl"),
			target_name = document.getElementById("target-name"),
			target_box = document.getElementById("target-box"),
			coord = {
				x: mouse.pos.x - offsetX,
				y: mouse.pos.y - offsetY
			};
			if(mouse.over.length > 0) {
				// We send ui (user interface) data which contains the more precise type mcl (mouse click left) and the object clicked
				if(mouse.over[0].id == engine.userID) {
					var obj = objectFindByKey(engine.data.obj, 'id', engine.userID);
					target_lvl.innerHTML = obj.lvl;
					target_name.innerHTML = obj.name;
					target_box.style.display = "block";
					engine.targetID = engine.userID;
				} else {
					if(engine.targetID == mouse.over[0].id)
					{
						sendData('ui', {type:'mclo', data:mouse.over[0].id});
					} else {
						var obj = objectFindByKey(engine.data.obj, 'id', mouse.over[0].id);
						target_lvl.innerHTML = obj.lvl;
						target_name.innerHTML = obj.name;
						target_box.style.display = "block";
						engine.targetID = mouse.over[0].id;
					}
				}
			} else {
				engine.targetID = null;
				target_box.style.display = "none";
				// We send ui (user interface) data which contains the more precise type mcl (mouse click left) and the coordinates
				sendData('ui', {type:'mcl', data:coord});
			}
	}
}

// Placeholder for actions to be done on mouse right click
function MouseRightClick() {
}

// Placeholder for actions to happen on Escape key press
function escapeKey() {
}

// Placeholder for actions to happen on I key press
function iKey() {
	gui.ToggleInventory();
}

// Placeholder for actions to happen on M key press
function mKey() {
	if (engine.miniMapEnabled)
		engine.miniMapEnabled = false;
	else if(engine.miniMap)
		if(engine.miniMap.base) {
			engine.miniMapEnabled = true;
		}
}

//--- USER PANELS ---

// When user enters text, send it to the server as chat message
$('form').submit( function() {
	sendData('chat', {
		msg: $('#m').val(),
		timestamp: Date.now()
	});
	// clear the input box
	$('#m').val('');
	return false;
});
