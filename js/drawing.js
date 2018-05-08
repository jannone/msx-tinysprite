/*

TinySprite - A Javascript MSX Sprite Editor
Copyright (C) 2006  Rafael de Oliveira Jannone

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

Please follow this link: http://www.gnu.org/licenses/gpl.txt

Contact the author by e-mail: rafael@jannone.org

*/

// drawing

function Drawing(pixels, size) {
	this.pixels = null;
	this.size = size || 16;
	this.last = this.size - 1;
	this.dirty = false;
	
	this.pixels = (pixels) ? pixels : this.createPixels();
}

Drawing.prototype.createPixels = function() {
	var sz = this.size;	
	var pixels = new Array(sz);
	for (var y = 0; y < sz; y++) {
		pixels[y] = new Array(sz);			
		for (var x = 0; x < sz; x++) {
			pixels[y][x] = null;
		}			
	}
	return pixels;
}

Drawing.prototype.clone = function() {
	var sz = this.size;
	var from = this.pixels;
	var pixels = new Array();
	for (var y = 0; y < sz; y++) {
		var line = from[y];
		pixels[y] = new Array();
		for (var x = 0; x < sz; x++) {
			pixels[y].push(line[x]);
		}
	}
	return new Drawing(pixels, sz);
}

Drawing.prototype.pset = function(x, y, color) {
	if (x >= 0 && x < this.size && y >=0 && y < this.size)
		this.pixels[y][x] = color;
}

Drawing.prototype.blit = function(from, over) {
	var dest = this.pixels;
	var source = from.pixels;		
	for (var y in source) {
		var line = source[y];
		var cline = dest[y];
		if (over) {
			for (x in line) {
				if (line[x] != null)
					cline[x] = line[x];
			}
		} else {
			for (x in line) {
				cline[x] = line[x];
			}
		}
	}
	this.dirty = true;
}

Drawing.prototype.copy = function(from) {
	this.blit(from, false);
}

Drawing.prototype.overlay = function(from) {
	this.blit(from, true);
}

Drawing.prototype.clear = function(color) {
	for (var y in this.pixels) {
		var line = this.pixels[y];
		for (var x in line) {
			line[x] = color;
		}
	}
	this.dirty = true;		
}

Drawing.prototype.cloneRotatedCW = function() {
	var n = new Drawing();
	var source = this.pixels;
	var dest = n.pixels;
	var x, y;
	for (y in source) {
		var line = source[y];
		var dy = this.last-y;
		for (x in line) {
			dest[x][dy] = line[x];
		}
	}
	return n;	
}

Drawing.prototype.cloneRotatedACW = function() {
	var n = new Drawing();
	var source = this.pixels;
	var dest = n.pixels;
	var x, y, l;
	l = this.last;
	for (y in source) {
		var line = source[y];
		for (x in line) {
			dest[l-x][y] = line[x];
		}
	}
	return n;	
}

Drawing.prototype.rotateCW = function() {
	var n = this.cloneRotatedCW();
	this.pixels = n.pixels;
	this.dirty = true;		
}

Drawing.prototype.rotateACW = function() {
	var n = this.cloneRotatedACW();
	this.pixels = n.pixels;
	this.dirty = true;		
}

Drawing.prototype.paintScan = function(x1, x2, line, lookfor) {
	var holes = new Array();
	var looking = true;
	for (var i = x1; i <= x2; i++) {
		if (looking) {
			if (line[i] == lookfor) {
				holes.push(i);
				looking = false;
			}
		} else {
			if (line[i] != lookfor) {
				looking = true;
			}
		}
	}
	return holes;
}

Drawing.prototype.paint = function(x, y, color, lookfor) {
	var pixels = this.pixels;
	var line = pixels[y];
	
	if (line[x] != lookfor)
		return;

	var bx = x, ex = x + 1;
	while (bx >= 0) {
		if (line[bx] != lookfor)
			break;
		bx--;
	}
	bx++;
	while (ex < this.size) {
		if (line[ex] != lookfor)
			break;
		ex++;
	}
	ex--;

	for (var i = bx; i <= ex; i++) {
		line[i] = color;
	}

	var next;
	var nexty;
	
	nexty = y+1;
	next = (y < this.size - 1) ? pixels[nexty] : null;

	var holes;
	if (next) {
		holes = this.paintScan(bx, ex, next, lookfor);
		for (var i in holes) {
			this.paint(holes[i], nexty, color, lookfor);
		}
	}
	
	nexty = y-1;
	next = (y > 0) ? pixels[nexty] : null;
	if (next) {
		holes = this.paintScan(bx, ex, next, lookfor);
		for (var i in holes) {
			this.paint(holes[i], nexty, color, lookfor);
		}
	}
	this.dirty = true;		
}

Drawing.prototype.filterColor = function(color) {
	var x, y;
	for (y in this.pixels) {
		var line = this.pixels[y];
		for (x in line) {
			if (line[x] == color)
				line[x] = 0;
		}
	}
	this.dirty = true;		
}	

Drawing.prototype.rollLeft = function() {
	var klast = this.last;

	for (var y in this.pixels) {
		var line = this.pixels[y];
		var rest = line[0];
		
		for (var x = 0; x < klast; x++) {
			line[x] = line[x+1];
		}
		line[klast] = rest;
	}
	this.dirty = true;		
}

Drawing.prototype.rollRight = function() {
	var klast = this.last;

	for (var y in this.pixels) {
		var line = this.pixels[y];
		var rest = line[klast];
		
		for (var x = klast; x > 0; x--) {
			line[x] = line[x-1];
		}
		line[0] = rest;
	}
	this.dirty = true;		
}

Drawing.prototype.rollUp = function() {
	var klast = this.last;
	var rest = this.pixels[0];
	for (var k = 0; k < klast; k++) {
		this.pixels[k] = this.pixels[k+1];				
	}
	this.pixels[klast] = rest;
	this.dirty = true;		
}

Drawing.prototype.rollDown = function() {
	var klast = this.last;
	var rest = this.pixels[klast];
	for (var k = klast; k > 0; k--) {
		this.pixels[k] = this.pixels[k-1];				
	}
	this.pixels[0] = rest;
	this.dirty = true;		
}

Drawing.prototype.flipHorizontal = function() {
	var x, y;
	var sz = this.last;
	var hsz = Math.floor(this.size / 2);
	for (y in this.pixels) {
		var line = this.pixels[y];
		for (x = 0; x < hsz; x++) {
			var t = line[x];
			line[x] = line[sz - x];
			line[sz - x] = t;
		}
	}
	this.dirty = true;
}

Drawing.prototype.flipVertical = function() {
	var y;
	var sz = this.last;
	var hsz = Math.floor(this.size / 2);
	for (y = 0; y < hsz; y++) {
		var t = this.pixels[y];
		this.pixels[y] = this.pixels[sz - y];
		this.pixels[sz - y] = t;		
	}
	this.dirty = true;		
}

Drawing.prototype.line = function(x1, y1, x2, y2, color) {
	var swap, error;
	var x = x1;
	var y = y1;
	var dx = Math.abs(x2 - x1);
	var dy = Math.abs(y2 - y1);
	var s1 = (x2 > x1) ? 1 : ((x2 < x1) ? -1 : 0);
	var s2 = (y2 > y1) ? 1 : ((y2 < y1) ? -1 : 0);	
	if (dy > dx) {
		var temp = dx;
		dx = dy;
		dy = temp;
		swap = true;
	}
	var d2x = 2*dx;	
	var d2y = 2*dy;
	error = d2y - dx;
	if (swap) {
		for (var i = 1; i <= dx; i++) {
			this.pset(x, y, color);
			while (error >= 0) {
				x += s1;
				error -= d2x;
			}
			y += s2;
			error += d2y;
		}	
	} else {
		for (var i = 1; i <= dx; i++) {
			this.pset(x, y, color);
			while (error >= 0) {
				y += s2;
				error -= d2x;
			}
			x += s1;
			error += d2y;
		}	
	}
	this.dirty = true;	
}

Drawing.prototype.circle = function(x, y, rad, color) {
	//@todo: implement arcs, elipses
	var d = 3 - (2 * rad);
	var px = 0;
	var py = rad;
	for (;;) {
		this.pset(x + px, y + py, color);
		this.pset(x + px, y - py, color);
		this.pset(x - px, y + py, color);
		this.pset(x - px, y - py, color);
		this.pset(x + py, y + px, color);
		this.pset(x + py, y - px, color);
		this.pset(x - py, y + px, color);
		this.pset(x - py, y - px, color);
		if (px >= py)
			break;
		if (d < 0) {
			d += (4 * px) + 6;
		} else {
			--py;
			d += 4 * (px - py) + 10;
			
		}
		++px;
	}
	this.dirty = true;
}

Drawing.prototype.inverse = function(color) {
	var x, y, c;
	var sz = this.size;
	for (y = 0; y < sz; y++) {
		var line = this.pixels[y];
		for (x = 0; x < sz; x++) {
			c = line[x];
			if (c == color) {
				line[x] = null;
			} else 
			if (c == null) {
				line[x] = color;
			}
		}
	}
	this.dirty = true;	
}

