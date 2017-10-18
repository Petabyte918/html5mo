"use strict"

//---   ENGINE   ---

var engine = {
	lastupdate: Date.now(),
	dtime: 0,
	data: {
		obj:{}
	},
	update: function() {
		LogClear();
		this.dtime = Date.now() - this.lastupdate;
		this.lastupdate = Date.now();

		scrollMap(this.dtime);

		mouse.over = [];

		if(this.data.obj) {
			for( var i = 0; i < this.data.obj.length; i++) {
				if(this.data.obj[i]) {
					if(	mouse.pos.x<engine.data.obj[i].pos.x+offsetX+cObjIconSize &&
						mouse.pos.x>engine.data.obj[i].pos.x+offsetX-cObjIconSize &&
						mouse.pos.y<engine.data.obj[i].pos.y+offsetY+cObjIconSize &&
						mouse.pos.y>engine.data.obj[i].pos.y+offsetY-cObjIconSize){
						mouse.over.push(engine.data.obj[i]);
					}
					if(mouse.over.length > 0) {
						var type = objectFindByKey(this.data.obj, 'id', mouse.over[mouse.over.length-1].id).type;
						switch(type) {
							case 'char':
								mouse.setCursor(2);
							break;
							case 'mob':
								mouse.setCursor(3);
							break;
							default:
								mouse.setCursor(0);
						}
					} else {
						mouse.coord = V2(mouse.pos.x-offsetX, mouse.pos.y-offsetY);
						if(mouse.coord.x > 0 && mouse.coord.x < this.map.bounds.x &&
							  mouse.coord.y > 0 && mouse.coord.y < this.map.bounds.y) {
							if(this.tileByPos(mouse.coord).walkable == 2) { // TODO add checking if tile is walkable
								mouse.setCursor(1);
							} else {
								mouse.setCursor(0);
							}
						} else {
							mouse.setCursor(0);
						}
					}
					switch(this.data.obj[i].type) {
						case 'char':
							var ch = this.data.obj[i];
							var tmppos;
							if(ch.path.length>1)
								tmppos = ch.ppos;
							else
								tmppos = ch.tpos;
							var ddlength, length;
							if(tmppos.y != ch.pos.y || tmppos.x != ch.pos.x) {
								var vect = V2( tmppos.x - ch.pos.x, tmppos.y - ch.pos.y);
								length = Math.sqrt(vect.x * vect.x + vect.y * vect.y);
								if(length < 2) {
									ch.pos.x = tmppos.x;
									ch.pos.y = tmppos.y;
									ch.v.x = 0;
									ch.v.y = 0;
								} else {
									// normalize vector
									ch.v.x = vect.x/length*ch.speed;
									ch.v.y = vect.y/length*ch.speed;
									// update position
									ch.pos.x+=ch.v.x*this.dtime;
									ch.pos.y+=ch.v.y*this.dtime;
								}
							}
							// Here we create data specifically for drawing. It smooths out movement but is less accurate.
							//We will mirror the same movement but from drawing position instead of real position
							if(ch.drawData){
								if(tmppos.y != ch.drawData.pos.y || tmppos.x != ch.drawData.pos.x) {
									var vect = V2( tmppos.x - ch.drawData.pos.x, tmppos.y - ch.drawData.pos.y);
									ddlength = Math.sqrt(vect.x * vect.x + vect.y * vect.y);
									if(Math.abs(ddlength - length) > 30) {
										// if position difference is very big (may be cause by lag or smth) we reset draw position to real position
										ch.drawData.pos = ch.pos;
									} else {
										if(ddlength < 1) {
											ch.drawData.pos = tmppos;
											ch.drawData.v.x = 0;
											ch.drawData.v.y = 0;
											ch.status = 'idle';
										} else {
											var speed = (ddlength > 2)? ch.speed : ch.speed/4;
											// normalize vector
											ch.drawData.v.x = vect.x/ddlength*speed;
											ch.drawData.v.y = vect.y/ddlength*speed;
											// update position
											ch.drawData.pos.x+=ch.drawData.v.x*this.dtime;
											ch.drawData.pos.y+=ch.drawData.v.y*this.dtime;
										}
									}
								}
							} else {
								ch.drawData = {pos: ch.pos, v: ch.v};
							}
						break;
					}
				}
			}
		}
	},
	tileByPos: function(position) {
		return Object.assign(
			this.map[Math.floor(position.y/cTileWidth)][Math.floor(position.x/cTileWidth)],{}
		);
	}
};

//---   HELPERS   ---

function objectFindByKey(array, key, value) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] && array[i][key] == value) {
			return array[i];
		}
	}
	return null;
}

// Two-dimensional vector constructor
var V2 = function(x,y) {
	return {x: x, y: y};
};

// Functions to run after page has loaded
 $(document).ready(function() {
	DrawingInit();
	AddUIevents();
 });

var Log = function(msg) {
	$('#debug-window').prepend($('<p>').text(msg));
}

var LogClear = function(msg) {
  	if ($("#debug-window p").length>20)
  		$('#debug-window p').last().remove();
}
