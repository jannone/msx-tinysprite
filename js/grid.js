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

function Grid(size, small) {
	this.size = size;
	this.el = null;
	this.els = null;
	this.pixels = null;
	this.button = false;
	this.palette = null;
	this.colors = null;
	this.color = null;
	this.small = (small) ? true : false;
	this.classname = (small) ? 'previewCell' : 'gridCell';
	this.onPencil = null;

	this.create();
	this.click = this.pencil;
	this.setCell = (!this.small) ? this.setCellBig : this.setCellSmall;	
}
	
Grid.prototype.create = function() {
	var grid = this;

	this.el = document.createElement('table');
	this.el.setAttribute('border', 0);
	this.el.setAttribute('cellspacing', 0);
	this.el.setAttribute('cellpadding', 0);
	this.el.className = (this.small) ? 'smallGrid' : 'grid';

	this.el.onmouseup = function() {
		grid.releaseButton();
	}
	
	this.el.oncontextmenu = function(e) {
		e = e || window.event;
		e.cancelBubble = true;
	}	

	this.els = new Array();

	for (var y = 0; y < this.size; y++) {
		var tr = document.createElement('tr');
		for (var x = 0; x < this.size; x++) {
			var el = document.createElement('td');
			el.className = this.classname;
			el.setAttribute('oncontextmenu', 'return false;');
			this.els.push(el);
			tr.appendChild(el);
			if (!this.small) {
				el.style.background = img_blank;				
				this.setMouse(el, x, y);
			}
		}
		this.el.appendChild(tr);
	}
}

Grid.prototype.releaseButton = function() {
	var before = this.button;
	this.button = false;
	if (before != false && this.onMouseUp)
		this.onMouseUp();
}

Grid.prototype.setMouse = function(el, x, y) {
	var grid = this;
	el.onmouseover = function() {			
		if (grid.button)
			grid.click(el, x, y);
	}
	el.onmousedown = function(e) {
		var rightclick;
		e = e || window.event;
		if (e.which) 
			rightclick = (e.which == 3);
		else 
			if (e.button) 
				rightclick = (e.button == 2);

		grid.button = (rightclick) ? 2 : 1;
		if (grid.onMouseDown)
			grid.onMouseDown(x, y);
		grid.click(el, x, y);
		return false;
	}
}

Grid.prototype.setCellXY = function(x, y, value) {
	var el = this.els[y * this.size + x];
	this.setCell(el, value);
}

Grid.prototype.setCellBig = function(el, value) {
	el.style.background = (value) ? this.colors[value] : img_blank;
}

Grid.prototype.setCellSmall = function(el, value) {
	el.style.background = (value) ? this.colors[value] : '';
}

Grid.prototype.setCellBigSigZero = function(el, value) {
	el.style.background = (value != null) ? this.colors[value] : img_blank;
}

Grid.prototype.setCellSmallSigZero = function(el, value) {
	el.style.background = (value != null) ? this.colors[value] : '';
}

Grid.prototype.setPalette = function(palette) {
	this.palette = palette;
	this.colors = palette.hex;
	if (palette.sigzero)
		this.setCell = (!this.small) ? this.setCellBigSigZero : this.setCellSmallSigZero;
	else
		this.setCell = (!this.small) ? this.setCellBig : this.setCellSmall;
	this.updateGrid();	
}

Grid.prototype.setColor = function(value) {
	this.color = value;
}

Grid.prototype.clear = function(value) {
	this.drawing.clear(value);
	this.updateGrid();	
}

Grid.prototype.updateGridBlank = function() {
	var el;
	for (var k in this.els) {
		el = this.els[k];
		this.setCell(el, 0);
	}		
}

Grid.prototype.updateGrid = function() {
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
			el = this.els[k];
			this.setCell(el, v);
			k++;
		}
	}		
}

Grid.prototype.filterColor = function() {
	this.drawing.filterColor(this.color);
	this.updateGrid();
}

Grid.prototype.pencil = function (el, x, y) {
	var v = (this.button == 1) ? this.color : null;
	if (v == 0 && !this.palette.sigzero)
		v = null;
	this.drawing.pixels[y][x] = v;
	//this.drawing.dirty = true;
	this.setCell(el, v);
	(this.onPencil) && (this.onPencil(x, y, v));
}
