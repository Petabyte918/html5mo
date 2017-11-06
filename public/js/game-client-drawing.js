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
var imgList = [
	'char.png', 'flag.png',
	'm_1.png', 'm_2.png', 'm_3.png', 'm_4.png',
	'tiles/grass-sparse.jpg', 'tiles/water-plain.jpg', 'tiles/cobblestone-regular.jpg'
];
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

	if(engine.miniMapEnabled) {
		engine.miniMap.current = copyImageData(engine.miniMap.base, context);
	} else {
		if(engine.map) {
			engine.miniMap = miniMap(engine.map, context);
		}
	}

	if(engine.map) {
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
			if(o) {
				switch(o.type) {
				case 'char':
				case 'mob':
					var x = offsetX;
					var y = offsetY;
					if (o.type == 'char') {
						if(o.action == 'move' || o.action == 'follow'){
							if(o.path.length>1) {
								for(var j = 0;j<o.path.length;j++) { context.drawImage(content['flag.png'], o.path[j][0]*64+32+offsetX-10, o.path[j][1]*64+32+offsetY-20, 20,20); }
							} else {
								context.drawImage(content['flag.png'], o.tx+offsetX-10, o.ty+offsetY-20, 20,20);
							}
						}
					}
					if(o.drawData) {
						x += o.drawData.pos.x;
						y += o.drawData.pos.y;
					} else {
						x += o.pos.x;
						y += o.pos.y;
					}
					context.drawImage(content[o.img], x-cHObjIconSize, y-cHObjIconSize, cObjIconSize, cObjIconSize);
					if(engine.miniMapEnabled) {
						var ox = Math.round((o.pos.x)/cTileWidth*engine.miniMap.scale),
							oy = Math.round((o.pos.y)/cTileWidth*engine.miniMap.scale);
						drawPoint(engine.miniMap.current, ox, oy, 255, 128, 36, 255, 4);
					}
					break;
				default:
					console.log('data object type error! '+o.type);
				}
			} else {
				console.log('data object error: object undefined!');
				console.log(engine.data.obj);
				console.log(i);
			}
		}
	}

	if(engine.miniMapEnabled) {
		context.putImageData(engine.miniMap.current,10,10);
	}
}

// loop request your animation function to be called before the browser performs the next repaint
function animate() {
	reqAnimFrame(animate);
	canvasDraw();
}

// create minimap / hud
function miniMap(data, ctx) {
	var scale = 10;
	var imageData = ctx.createImageData(data[0].length*scale,data.length*scale)
	for(var i = 0; i < data.length; i++) {
		for(var j = 0; j < data[i].length; j++) {
			for(var k = 0; k < scale; k++) {
				for(var l = 0; l < scale; l++) {
					if (data[i][j].walkable==1) {
						setPixel(imageData, j*scale+k, i*scale+l, 150, 150, 255, 255);
					} else if (data[i][j].walkable==2) {
						setPixel(imageData, j*scale+k, i*scale+l, 100, 225, 100, 255);
					} else {
						setPixel(imageData, j*scale+k, i*scale+l, 150, 100, 100, 255);

					}
				}
			}
		}
	}
	return {
		base: imageData,
		current: imageData,
		scale: scale
	}
}

function setPixel(imageData, x, y, r, g, b, a) {
	var index = (x + y * imageData.width) * 4;
	imageData.data[index+0] = r;
	imageData.data[index+1] = g;
	imageData.data[index+2] = b;
	imageData.data[index+3] = a;
}

function copyImageData(src, ctx)
{
	var dst = ctx.createImageData(src.width, src.height);
	dst.data.set(src.data);
	return dst;
}

function drawPoint(imageData, x, y, r, g, b, a, radius) {
	setPixel(imageData, x, y, r, g, b, a);
	if (radius>1){
		setPixel(imageData, x+1, y  , r, g, b, a);
		setPixel(imageData, x-1, y  , r, g, b, a);
		setPixel(imageData, x,   y+1, r, g, b, a);
		setPixel(imageData, x,   y-1, r, g, b, a);
		if (radius>2){
			setPixel(imageData, x+1, y+1, r, g, b, a);
			setPixel(imageData, x-1, y  , r, g, b, a);
			setPixel(imageData, x-1, y-1, r, g, b, a);
			setPixel(imageData, x,   y-1, r, g, b, a);
			setPixel(imageData, x-1, y+1, r, g, b, a);
			setPixel(imageData, x+1, y-1, r, g, b, a);
			if (radius>3){
				setPixel(imageData, x-2, y,   r, g, b, a);
				setPixel(imageData, x+2, y,   r, g, b, a);
				setPixel(imageData, x,   y-2, r, g, b, a);
				setPixel(imageData, x,   y+2, r, g, b, a);
			}
		}
	}
}

function drawSquare(imageData, x, y, r, g, b, a, radius) {
	setPixel(imageData, x, y, r, g, b, a);
	if (radius>1){
		setPixel(imageData, x+1, y  , r, g, b, a);
		setPixel(imageData, x+1, y+1, r, g, b, a);
		setPixel(imageData, x,   y+1, r, g, b, a);
		if (radius>2){
			setPixel(imageData, x-1, y  , r, g, b, a);
			setPixel(imageData, x-1, y-1, r, g, b, a);
			setPixel(imageData, x,   y-1, r, g, b, a);
			setPixel(imageData, x-1, y+1, r, g, b, a);
			setPixel(imageData, x+1, y-1, r, g, b, a);
		}
	}
}
