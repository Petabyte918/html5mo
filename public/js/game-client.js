"use strict"

//---   ENGINE   ---

var engine = {
	lastupdate: Date.now(),
	dtime: 0,
	data: {
		obj:{}
	},
	update: function() {
		this.dtime = Date.now() - this.lastupdate;
		this.lastupdate = Date.now();
		
		scrollMap(this.dtime);
		
		if(this.data.obj) {
			for( var i = 0; i < this.data.obj.length; i++) {
				if(this.data.obj[i]) {
					switch(this.data.obj[i].type) {
						case 'char':
							var ch = this.data.obj[i];
							var ddlength, lenght;
							if(ch.tpos.y != ch.pos.y || ch.tpos.x != ch.pos.x) {
								var vect = V2( ch.tpos.x - ch.pos.x, ch.tpos.y - ch.pos.y);
								length = Math.sqrt(vect.x * vect.x + vect.y * vect.y);
								if(length < 2) {
									ch.pos.x = ch.tpos.x;
									ch.pos.y = ch.tpos.y;
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
								if(ch.tpos.y != ch.drawData.pos.y || ch.tpos.x != ch.drawData.pos.x) {
									var vect = V2( ch.tpos.x - ch.drawData.pos.x, ch.tpos.y - ch.drawData.pos.y);
									ddlength = Math.sqrt(vect.x * vect.x + vect.y * vect.y);
									if(Math.abs(ddlength - length) > 30) {
										// if position difference is very big (may be cause by lag or smth) we reset draw position to real position
										ch.drawData.pos = ch.pos;
									} else {
										if(ddlength < 1) {
											ch.drawData.pos.x = ch.tpos.x;
											ch.drawData.pos.y = ch.tpos.y;
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
