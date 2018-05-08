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

// class Palette

function Palette(sigzero) {
	this.rgb = null;
	this.hex = null;
	this.sigzero = (sigzero == true);

	this.clear();
}
	
Palette.prototype.clear = function() {
	this.rgb = new Array();
	this.hex = new Array();
}

Palette.prototype.clone = function() {
	var n = new Palette(this.sigzero);
	for (var k in this.rgb) {
		var c = this.rgb[k];
		n.add(c.r, c.g, c.b, c.name);
	}
	return n;
}

Palette.prototype.copy = function(from) {
	for (var k in from.rgb) {
		var c = from.rgb[k];
		this.set(k, c.r, c.g, c.b, c.name);
	}
}

Palette.prototype.add = function(r, g, b, name) {
	name = (name != null) ? name : '';
	var color = {r: r, g: g, b: b, name: name};
	var hex = '#' + toHex(r) + toHex(g) + toHex(b);
	color.hex = hex;
	this.rgb.push(color);
	this.hex.push(hex);		
}

Palette.prototype.set = function(index, r, g, b, name) {
	name = (name != null) ? name : '';
	var color = {r: r, g: g, b: b, name: name};
	var hex = '#' + toHex(r) + toHex(g) + toHex(b);
	color.hex = hex;
	this.rgb[index] = color;
	this.hex[index] = hex;		
}

Palette.prototype.get333 = function(index) {
	var color = this.rgb[index];
	return {
		r: Math.floor(color.r / 32),
		g: Math.floor(color.g / 32),
		b: Math.floor(color.b / 32)
	};
}

Palette.prototype.isEqual = function(palette) {
	if (this.hex.length != palette.hex.length)
		return false;
	for (var k in this.hex) {
		if (this.hex[k] != palette.hex[k])
			return false;
	}
	return true;
}

Palette.prototype.encodeColors = function() {
	var r = new Array();
	for (var k in this.hex) {
		var value = this.hex[k].replace(/\#/, '');
		r.push(value);
	}
	return r;
}

Palette.prototype.decodeColors = function(txt) {
	var values = txt.split(",");
	
	for (var k in values) {
		var value = values[k];
		/*
		var r = (value >> 6) & 7;
		var g = (value >> 3) & 7;
		var b = (value) & 7;
		r = Math.floor(255 * r / 7);
		g = Math.floor(255 * g / 7);
		b = Math.floor(255 * b / 7);
		*/
		var r = parseInt(value.substring(0, 2), 16);
		var g = parseInt(value.substring(2, 4), 16);
		var b = parseInt(value.substring(4, 6), 16);			
		
		this.set(k, r, g, b);
	}
}

Palette.prototype.exportColors = function() {
	var r = new Array();
	for (var k in this.rgb) {
		var color = this.get333(k);
		r.push(color.b + (color.g << 3) + (color.r << 6));
	}
	return r;
}
