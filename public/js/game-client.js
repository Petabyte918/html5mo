//---   GLOBAL OBJECTS   ---

var canvas;
var context;
var socket = io();

var reqAnimFrame = window.requestAnimationFrame    	  ||
				   window.webkitRequestAnimationFrame ||
				   window.mozRequestAnimationFrame    ||
				   window.msRequestAnimationFrame     ||
				   window.oRequestAnimationFrame;

// Canvas background color
var color_canvas_bg = "#70CC5A";

//---   CONSTANTS   ---

//---   CODE   ---

window.onload = function() {
	// prepare canvas
	canvas = document.getElementById("mainCanvas");
	context = canvas.getContext("2d");
	
	canvasResize();

	animate();
};

window.onresize = function() {
	canvasResize();
};

// Canvas resize function
function canvasResize() {
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight-3;
}

// Canvas drawing function
function canvasDraw() {
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = color_canvas_bg;
	context.fillRect(0, 0, canvas.width, canvas.height);
}

// loop request your animation function to be called before the browser performs the next repaint
function animate() {
	reqAnimFrame(animate);
	canvasDraw();
}

// When user enters text, send it to the server as chat message
$('form').submit( function() {
	socket.emit('chat', { 
		msg: $('#m').val(),
		timestamp: Date.now()
	});
	// clear the input box
	$('#m').val('');
	return false;
});

// When receive message from server, add text to the messages list
socket.on('chat', function(data){
	$('#messages').append($('<li>').text(data.sendername+" : "+data.msg));
});