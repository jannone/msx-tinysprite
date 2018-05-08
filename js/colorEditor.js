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

// color editor

function ColorEditor(parent, palette) {
	this.palette = palette;
	this.current = null;
	this.height = null;

	this.create(parent);
}

ColorEditor.prototype.create = function(parent) {
	this.el = parent;
	this.el.innerHTML = 
		"<table width='256px' cellspacing='0'>" +
			"<tr>" +
				"<td></td>" +
				"<td><small><b>Red</b></small></td>" +
				"<td><small><b>Green</b></small></td>" +
				"<td><small><b>Blue</b></small></td>" +
			"</tr>" +
			"<tr>" +
				"<td><div id='colorPreview' class='pickerCell'></div></td>" +
				"<td><input id='colorR' type='text' style='width: 32px' maxlength='1' /></td>" +
				"<td><input id='colorG' type='text' style='width: 32px' maxlength='1' /></td>" +
				"<td><input id='colorB' type='text' style='width: 32px' maxlength='1' /></td>" +
			"</tr>" +
			"<tr>" +
				"<td></td>" +
				"<td><small>0-7</small></td>" +
				"<td><small>0-7</small></td>" +
				"<td><small>0-7</small></td>" +
			"</tr>" +
			"<tr style='background-color: #E0E0E0'>" +
				"<td colspan='3' style='padding: 3px'>" +
					"<a href='#' id='colorEditorCancel'>cancel</a> | " + 
					"<a href='#' id='colorEditorReset'>reset</a>" +
				"</td>" +
				"<td style='text-align: right; padding: 3px'>" +
					"<a href='#' id='colorEditorApply'>apply</a>" + 
				"<td>" +
			"</tr>" +
		"</table>";
		
	this.el.onmouseup = function(e) {
		e.stopPropagation();
	}
	this.colorPreview = eid('colorPreview');
	this.colorFieldR = eid('colorR');
	this.colorFieldG = eid('colorG');
	this.colorFieldB = eid('colorB');
	
	var editor = this;
	eid('colorEditorCancel').onclick = function() {
		editor.hide();
		return false;
	}			
	eid('colorEditorApply').onclick = function() {
		editor.apply();
		return false;
	}			
	eid('colorEditorReset').onclick = function() {
		editor.resetColor();
		return false;
	}
	
	this.setupField(this.colorFieldR, 7);
	this.setupField(this.colorFieldG, 7);
	this.setupField(this.colorFieldB, 7);
}

ColorEditor.prototype.updatePreview = function() {
	var rgb = this.parse();
	this.colorPreview.style.background = '#' + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
}

ColorEditor.prototype.parse = function() {
	var r = parseInt(this.colorFieldR.value, 10);
	var g = parseInt(this.colorFieldG.value, 10);
	var b = parseInt(this.colorFieldB.value, 10);
	r = inRange(r, 0, 7);
	g = inRange(g, 0, 7);
	b = inRange(b, 0, 7);
	r = Math.floor(255 * r / 7);
	g = Math.floor(255 * g / 7);
	b = Math.floor(255 * b / 7);
	return {r: r, g: g, b: b};
}

ColorEditor.prototype.show = function() {
	this.el.style.display = 'block';
	this.height = this.el.offsetHeight;
}

ColorEditor.prototype.hide = function() {
	this.el.style.display = 'none';
}

ColorEditor.prototype.resetColor = function() {
	var rgb = msx1Palette.rgb[this.current];
	this.palette.set(this.current, rgb.r, rgb.g, rgb.b, rgb.name);
	this.updateGUI();
	this.hide();
}

ColorEditor.prototype.apply = function() {
	var rgb = this.parse();
	this.palette.set(this.current, rgb.r, rgb.g, rgb.b);
	this.updateGUI();
	this.hide();
}

ColorEditor.prototype.updateGUI = function() {
	picker.update();
	for (var s in slots.items) {
		var slot = slots.items[s];
		slot.dirty = true;
	}
	grid.updateGrid();
	updatePreviews(true);
	selectBackground(eid('background'));
}

ColorEditor.prototype.setupField = function(field, max) {
	var editor = this;
	field.onkeyup = function() {
		editor.updatePreview();
	}
	field.onblur = function() {
		var v = parseInt(field.value);
		if (v) {
			v = inRange(v, 0, max);
			field.value = v;
		} else
			field.value = 0;
	}
}

ColorEditor.prototype.move = function(x, y) {
	this.el.style.top = y;
	this.el.style.left = x;	
}

ColorEditor.prototype.setFields = function(r, g, b) {
	this.colorFieldR.value = r;
	this.colorFieldG.value = g;
	this.colorFieldB.value = b;
	this.updatePreview();
}

ColorEditor.prototype.focus = function() {
	this.colorFieldR.focus();
	this.colorFieldR.select();
}
