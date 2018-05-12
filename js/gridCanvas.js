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

// class Grid

function GridCanvas(size, small, cellSize) {
	this.size = size;
	this.el = null;
	this.pixels = null;
	this.button = false;
	this.palette = null;
	this.colors = null;
	this.color = null;
	this.small = (small) ? true : false;
	this.classname = (small) ? 'previewCell' : 'gridCell';
	this.cellSize = (cellSize) || ((small) ? 4 : 16);
	this.onPencil = null;
	this.ctx = null;

	this.create();
	this.click = this.pencil;
	this.setCell = (!this.small) ? this.setCellBig : this.setCellSmall;	
}
	
GridCanvas.prototype.create = function() {
	var grid = this;

	this.el = document.createElement('canvas');
	this.el.className = "gridCanvas";
	this.el.style.border = (this.small) ? '' : 'solid 1px black';
	this.el.style.background = (this.small) ? '' : img_blank;
	this.el.width = this.cellSize * this.size;
	this.el.height = this.cellSize * this.size;
	this.el.setAttribute('oncontextmenu', 'return false;');
	this.ctx = this.el.getContext("2d");

	this.el.onmouseup = function() {
		grid.releaseButton();
	}
	
	this.el.oncontextmenu = function(e) {
		e = e || window.event;
		e.cancelBubble = true;
	}
	
	if (!this.small) {
		this.el.onmousemove = function(e) {
			e = e || window.event;
			if (grid.button) {
				var pos = grid.evtCoord(e);
				grid.click(null, pos.x, pos.y);
			}
		}
		
		this.el.onmousedown = function(e) {
			e = e || window.event;

			var rightclick;
			var pos = grid.evtCoord(e);

			if (e.which) {
				rightclick = (e.which == 3);
			} else {
				if (e.button) {
					rightclick = (e.button == 2);
				}
			}

			grid.button = (rightclick) ? 2 : 1;
			if (grid.onMouseDown) {
				grid.onMouseDown(pos.x, pos.y);
			}
			grid.click(null, pos.x, pos.y);
			return false;
		}
	}
}

GridCanvas.prototype.touchMove = function(e) {
	if (this.el.onmousemove) {
		this.el.onmousemove(e)
	}
}

GridCanvas.prototype.touchStart = function(e) {
	console.log("A")
	if (this.el.onmousedown) {
		console.log("B")
		this.el.onmousedown(e)
	}
}

GridCanvas.prototype.evtCoord = function(e) {
	var sz = this.size;
	var rect = this.el.getBoundingClientRect();
	var ox, oy;
	if (e.touches && e.touches.length > 0) {
		var touch = e.touches[0];
		ox = touch.clientX - rect.left;
		oy = touch.clientY - rect.top;		
	} else {
		ox = e.clientX - rect.left;
		oy = e.clientY - rect.top;
	}
	var x = Math.floor(ox / this.cellSize);
	var y = Math.floor(oy / this.cellSize);
	return {
		x: (x >= sz) ? sz-1 : x, 
		y: (y >= sz) ? sz-1 : y
	};
}

GridCanvas.prototype.releaseButton = function() {
	var before = this.button;
	this.button = false;
	if (before != false && this.onMouseUp)
		this.onMouseUp();
}

GridCanvas.prototype.setCellXY = function(x, y, value) {
	this.setCell(x, y, value);
}

GridCanvas.prototype.setCellBig = function(x, y, value) {
	var sz = this.cellSize;
	if (value) {
		this.ctx.fillStyle = this.colors[value];
		this.ctx.fillRect(x * sz, y * sz, sz, sz);
	} else {
		this.ctx.clearRect(x * sz, y * sz, sz, sz);
	}
	//el.style.background = (value) ? this.colors[value] : img_blank;
}

GridCanvas.prototype.setCellSmall = function(x, y, value) {
	var sz = this.cellSize;
	if (value) {
		this.ctx.fillStyle = this.colors[value];
		this.ctx.fillRect(x * sz, y * sz, sz, sz);
	} else {
		this.ctx.clearRect(x * sz, y * sz, sz, sz);
	}
	//el.style.background = (value) ? this.colors[value] : '';
}

GridCanvas.prototype.setCellBigSigZero = function(x, y, value) {
	var sz = this.cellSize;
	if (value != null) {
		this.ctx.fillStyle = this.colors[value];
		this.ctx.fillRect(x * sz, y * sz, sz, sz);
	} else {
		this.ctx.clearRect(x * sz, y * sz, sz, sz);
	}
	//el.style.background = (value != null) ? this.colors[value] : img_blank;
}

GridCanvas.prototype.setCellSmallSigZero = function(x, y, value) {
	var sz = this.cellSize;
	if (value != null) {
		this.ctx.fillStyle = this.colors[value];
		this.ctx.fillRect(x * sz, y * sz, sz, sz);
	} else {
		this.ctx.clearRect(x * sz, y * sz, sz, sz);
	}
	//el.style.background = (value != null) ? this.colors[value] : '';
}

GridCanvas.prototype.setPalette = function(palette) {
	this.palette = palette;
	this.colors = palette.hex;
	if (palette.sigzero)
		this.setCell = (!this.small) ? this.setCellBigSigZero : this.setCellSmallSigZero;
	else
		this.setCell = (!this.small) ? this.setCellBig : this.setCellSmall;
	this.updateGrid();	
}

GridCanvas.prototype.setColor = function(value) {
	this.color = value;
}

GridCanvas.prototype.clear = function(value) {
	this.drawing.clear(value);
	this.updateGrid();	
}

GridCanvas.prototype.updateGridBlank = function() {
	var sz = this.size;
	for (var y=0; y<sz; y++) {
		for (var x=0; x<sz; x++) {
			this.setCell(x, y, 0);
		}
	}
}

GridCanvas.prototype.updateGrid = function() {
	var drawing = this.drawing;
	if (!drawing)
		return this.updateGridBlank();
	var pixels = this.drawing.pixels;	
	if (pixels == null)
		return this.updateGridBlank();

	var x, y, el;
	var k = 0;
	for (y in pixels) {
		var line = pixels[y];
		for (x in line) {
			var v = line[x];
			this.setCell(x, y, v);
		}
	}		
}

GridCanvas.prototype.filterColor = function() {
	this.drawing.filterColor(this.color);
	this.updateGrid();
}

GridCanvas.prototype.pencil = function (el, x, y) {
	var v = (this.button == 1) ? this.color : null;
	if (v == 0 && !this.palette.sigzero)
		v = null;
	this.drawing.pixels[y][x] = v;
	//this.drawing.dirty = true;
	this.setCell(x, y, v);
	(this.onPencil) && (this.onPencil(x, y, v));		
}
