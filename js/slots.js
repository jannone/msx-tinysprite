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

// --- Slot

function Slot(id, drawing, option) {
	this.id = id;
	this.drawing = drawing;
	this.option = option;
}

Slot.prototype.setName = function(name) {
	this.option.text = name;
}

Slot.prototype.getName = function() {
	return this.option.text;
}

Slot.prototype.export_ = function(ptype, etype) {
	var result = "";
	var sprites;
	var colors = [];
	if (ptype == 'msx2') {
		sprites = Exporter.toMSX2(this.drawing.pixels);		
		for (var sp in sprites) {
			var sprite = sprites[sp];
			var mask = sprite.exportMask(etype);
			var attr = sprite.exportAttributes(etype);
			result += langComment(etype, "mask " + sp) + "\n" + mask +
				langComment(etype, "attr " + sp) + "\n" + attr;
		}
	} else {
		sprites = Exporter.toMSX1(this.drawing.pixels);

		for (var sp in sprites) {
			var sprite = sprites[sp];
			var mask = sprite.exportMask(etype);
			result += langComment(etype, "color " + sprite.color) + "\n" + mask;
			colors.push(sprite.color);
		}		
	}
	if (result != "") {
		result = langComment(etype, "--- " + this.getName()) + "\n" + result;
	}
		
	return {
		result: result,
		colors: colors,
	}
}

Slot.prototype.load = function(enc) {
	var p = 0;
	var x, y;
	enc = enc.replace("\n", '');
	var drw = this.drawing;
	for (y = 0; y < drw.size; y++) {
		var line = drw.pixels[y];
		for (x = 0; x < drw.size; x++) {
			var c = enc.charAt(p);
			line[x] = (c == '.') ? null : parseInt(c, 16);
			p++;
		}
	}
	drw.dirty = true;
}

Slot.prototype.import_ = function(values, color) {
	for (var i=0; i<32; i++) {
		var ofs = (i>=16) ? 8 : 0;
		var line = this.drawing.pixels[i % 16];
		var v = values[i] || 0;
		if (v & 128) line[ofs+0] = color;
		if (v &  64) line[ofs+1] = color;
		if (v &  32) line[ofs+2] = color;
		if (v &  16) line[ofs+3] = color;
		if (v &   8) line[ofs+4] = color;
		if (v &   4) line[ofs+5] = color;
		if (v &   2) line[ofs+6] = color;
		if (v &   1) line[ofs+7] = color;
	}
	this.drawing.dirty = true;
}

Slot.prototype.save = function(msx1) {
	var hex = "";
	var drw = this.drawing;
	var empty = true;
	for (y = 0; y < grid.size; y++) {
		var line = drw.pixels[y];
		if (y > 0)
			hex += "\n";
		for (x = 0; x < grid.size; x++) {
			var byt = line[x];
			if (msx1 && byt == 0)
				byt = null;
			if (byt == null) {
				hex += '.';
			} else {
				hex += toHex1(byt);
				empty = false;
			}
		}
	}
	return (empty) ? null : hex;
}

// --- slots

function Slots(el) {
	this.cnt = 0;
	this.el = el;
	this.items = {};
	this.onChange = null;
	
	var slots = this;
	this.el.onchange = function() {
		(slots.onChange) && (slots.onChange());
	}
}

Slots.prototype.findIndex = function(slot) {
	var el = this.el;
	for (var i=0; i<el.options.length; i++) {
		if (el.options[i].value == slot.id)
			return i;
	}
	return null;
}

Slots.prototype.create = function(drw, id) {
	if (!id)
		id = this.cnt++;
	var opt = new Option("Slot " + id, id);
	opt.value = id;
	if (!drw)
		drw = new Drawing();
	var slot = new Slot(id, drw, opt);
	this.items[id] = slot;
	var idx = this.el.options.length;
	this.el.options[idx] = opt;
	return slot;
}

Slots.prototype.remove = function(slot) {
	var idx = this.findIndex(slot);	
	this.el.options[idx] = null;
	delete this.items[slot.id];
}

Slots.prototype.selectIndex = function(idx) {
	this.el.selectedIndex = idx;
	(slots.onChange) && (slots.onChange());
}

Slots.prototype.select = function(slot) {	
	var idx = this.findIndex(slot);
	return this.selectIndex(idx);
}

Slots.prototype.getSelected = function() {
	var idx = this.el.selectedIndex;
	if (idx >= 0) {
		var id = this.el.options[idx].value;
		return this.items[id];
	}
	return null;
}

Slots.prototype.clear = function() {
	this.el.options.length = 0;
	this.cnt = 0;
	this.items = {};
}
