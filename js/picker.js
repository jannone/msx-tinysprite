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

function Picker(palette) {
	this.palette = palette;
	this.onclick = function(value) {};
	this.ondblclick = function(value) {};
	this.cells = {};
	this.el = null;
	this.selected = null;

	this.create();
}
	
Picker.prototype.createCell = function(color, value) {
	var el = document.createElement('div');
	el.className = 'pickerCell';
	
	var picker = this;		
	el.onclick = function() {
		picker.selectColor(value);
		// hack to handle double-click for tapping devices
		if (picker.clickTimeout) {
			picker.editColor(value);
			clearTimeout(picker.clickTimeout);
			delete picker.clickTimeout;
		} else {
			picker.clickTimeout = setTimeout(function() {
				delete picker.clickTimeout;
			}, 300)
		}
	}
	// el.ondblclick = function() {
	// 	picker.editColor(value);
	// 	// FIXME: this is a hack for opera, should be a cleaner way
	// 	if (is_opera) {
	// 		picker.enteringEdit = true;
	// 	}
	// }
	el.onmouseup = function(e) {
		// FIXME: this is a hack for opera, should be a cleaner way
		if (picker.enteringEdit) {
			e = e || window.event;
			e.cancelBubble = true;
			picker.enteringEdit = false;
		}
	}
	
	el.style.backgroundColor = color;
	if (!this.palette.sigzero && value == 0) {
		el.style.background = 'url("img/blank.gif")';
	}
	return el;
}

Picker.prototype.create = function() {
	var pal = this.palette.hex;
	this.el = document.createElement('div');
	this.el.className = 'picker';
	for (var i in pal) {
		var cell = this.createCell(pal[i], i);
		this.el.appendChild(cell);
		this.cells[i] = cell;
		if (i == 7 || i == 15) {
			var br = document.createElement('br');
			br.style.clear = 'both';
			this.el.appendChild(br);
		}
	}
}

Picker.prototype.selectColor = function(value) {
	var cell = this.cells[value];
	if (this.selected) {
		var prevcell = this.cells[this.selected];
		prevcell.style.border = 'solid 1px black';
		// prevcell.style.margin = '4px';
	}
	cell.style.border = 'solid 3px black';
	// cell.style.margin = '2px';
	this.selected = value;
	return this.onclick(value);				
}

Picker.prototype.editColor = function(value) {			
	return this.ondblclick(value);
}

Picker.prototype.update = function() {
	var pal = this.palette.hex;
	for (var i in pal) {
		var color = pal[i];
		var cell = this.cells[i];
		cell.style.background = color;
		if (i == 0 && !this.palette.sigzero) {
			cell.style.background = 'url("img/blank.gif")';
		}			
	}	
}
