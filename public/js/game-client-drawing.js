"use strict"

//---   GLOBAL OBJECTS   ---

var canvas;
var context;
var content = {};

var reqAnimFrame = window.requestAnimationFrame    	  ||
				   window.webkitRequestAnimationFrame ||
				   window.mozRequestAnimationFrame    ||
				   window.msRequestAnimationFrame     ||
				   window.oRequestAnimationFrame;

//---   DRAWING SETTINGS   ---

// Canvas background color
var color_canvas_bg = "#70CC5A";

// object icon and half object icon sizes
var cObjIconSize = 30;
var cHObjIconSize = cObjIconSize/2;

// Tile size
var cTileWidth = 64;

// drawing offset for moving on the map
var offsetX = 0;
var offsetY = 0;

//---   CONTENT   ---

// load all the content required
var imgList = ['char.png', 'tiles/grass-sparse.jpg', 'tiles/water-plain.jpg', 'tiles/cobblestone-regular.jpg'];
for(var i = 0; i < imgList.length; i++) {
	content[imgList[i]] = new Image();
	content[imgList[i]].src = 'img/'+imgList[i];
}

//---   WINDOW LOADING AND SIZING   ---

var DrawingInit = function() {
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
	
	engine.update();
	
	if(engine.map){
		// calculate minimum and maximum indexes of visible tiles 
		var imin, imax, jmin, jmax;
		
		jmin = Math.round(-offsetY/cTileWidth); //index of tile = the offset / tile height
		jmin = jmin<1 ? 0 : jmin-1; // start at 0 or draw 1 tile more around the edge of screen
		
		jmax = Math.round((-offsetY+canvas.height)/cTileWidth);
		jmax = jmax<engine.map.length-1 ? jmax+1 : engine.map.length;
		
		imin = Math.round(-offsetX/cTileWidth);
		imin = imin<1 ? 0 : imin-1;
		
		imax = Math.round((-offsetX+canvas.width)/cTileWidth);
		imax = imax<engine.map[0].length-1 ? imax+1 : engine.map[0].length;
		
		// only draw tiles visible on screen
		for(var j = jmin; j<jmax; j++) {
			for (var i = imin; i<imax; i++) {
				var tile = engine.map[j][i];
				context.drawImage(content[tile.img], tile.pos.x+offsetX, tile.pos.y+offsetY, cTileWidth, cTileWidth);
			}
		}
	}
	
	if(engine.data.obj) {
		for(var i = 0; i < engine.data.obj.length; i++) {
			var o = engine.data.obj[i];
			if(o)switch(o.type) {
			case 'char':
				var x = offsetX;
				var y = offsetY;
				if(o.drawData) {
					x += o.drawData.pos.x;
					y += o.drawData.pos.y;
				} else {
					x += o.pos.x;
					y += o.pos.y;
				}
				
				context.drawImage(content[o.img], x-cHObjIconSize, y-cHObjIconSize, cObjIconSize, cObjIconSize);
				break;
			default:
				console.log('data object type error! '+o.type);
			} else {
				console.log('data object error: object undefined!');
				console.log(engine.data.obj);
				console.log(i);
			}
		}
	}
}

// loop request your animation function to be called before the browser performs the next repaint
function animate() {
	reqAnimFrame(animate);
	canvasDraw();
}
