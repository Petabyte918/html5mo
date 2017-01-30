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

var key_left = false;
var key_right = false;
var key_up = false;
var key_down = false;
var key_esc = false;

function handleKeyDown(event) {
	if (event.keyCode == 37) 
		key_left = true;
	else if (event.keyCode == 39)
		key_right = true;
	else if (event.keyCode == 38)
		key_up = true;
	else if (event.keyCode == 40)
		key_down = true;
	else if (event.keyCode == 27){
		// run function once per key press (if key was already pressed, do nothing)
		if(key_esc == false) {
			escapeKey();
			key_esc = true;
		}
	}
}

function handleKeyUp(event) {
	if (event.keyCode == 37) 
		key_left = false;
	else if (event.keyCode == 39)
		key_right = false;
	else if (event.keyCode == 38)
		key_up = false;
	else if (event.keyCode == 40)
		key_down = false;
	else if (event.keyCode == 27)
		key_esc = false;
}

function scrollMap(dtime) {
	var dOffset = Math.round(cScrollSpeed * dtime);
	
	if(key_left) offsetX+= dOffset;
	if(key_right) offsetX-= dOffset;
	if(key_up) offsetY+= dOffset;
	if(key_down) offsetY-= dOffset;
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
	var coord = {
		x: mouse.pos.x - offsetX,
		y: mouse.pos.y - offsetY
	};
	// We send ui (user interface) data which contains the more precise type mcl (mouse click left) and the coordinates
	sendData('ui', {type:'mcl', data:coord});
}

// Placeholder for actions to be done on mouse right click
function MouseRightClick() {
}

// Placeholder for actions to happen on Escape key press
function escapeKey() {
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
