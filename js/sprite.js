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

// --- Sprite

function Sprite(type) {
	this.type = (type) ? type : 1;
	this.mask = new Array(32);
	this.attr = new Array(16);
	this.color = null;	

	this.clear();
}
	
Sprite.prototype.clear = function() {
	for (var p=0; p<32; p++)
		this.mask[p] = 0;
	for (var p=0; p<16; p++)
		this.attr[p] = 0;
	this.color = null;
}	

Sprite.prototype.setMask = function(x, y) {
	var idx = (y & 15) + ((x & 8) << 1);
	var bit = 128 >> (x & 7);
	this.mask[idx] |= bit;
}

Sprite.prototype.setAttribute = function(line, color, ored) {
	this.attr[line] = color | ((ored) ? 0x40 : 0);
}

Sprite.prototype.exportMask = function(type) {
	return langFormatBytes(type, this.mask);
}

Sprite.prototype.exportAttributes = function(type) {
	return langFormatBytes(type, this.attr);
}

// --- LayersEvaluator

function LayersEvaluator(layers) {
	this.layers = layers;
	this.ored = null;
	this.last = null;
}

LayersEvaluator.prototype.hex = {
	'0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
	'8': 8, '9': 9, 'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15
};
	
LayersEvaluator.prototype.next = function() {
	var l = this.layers.length;
	if (l<1)
		return false;
	var c = this.layers[0];
	var v = this.hex[c];
	this.layers = this.layers.substring(1, l);
	
	this.ored |= v;
	this.value = v;
	
	return true;
}	

// --- Exporter

function Exporter() {}

Exporter.lineColors = function(line, colors) {
	var numcolors = 0;
	for (var x in line) {
		var c = line[x];
		if (c != null) {
			if (colors[c] != true) {
				colors[c] = true;
				numcolors++;
			}
		}
	}
	return numcolors;
}

Exporter.drawingColors = function(dest, pixels) {
	var colors = 0;
	for (var y in pixels) {
		var line = pixels[y];
		colors += Exporter.lineColors(line, dest);
	}
	return colors;
}

Exporter.toMSX1 = function(pixels) {
	var colors = {};
	var nsprites = Exporter.drawingColors(colors, pixels);
	var sprites = {};
	
	// create sprites
	for (var c in colors) {
		if (c > 0) {
			sprites[c] = new Sprite(1);
			sprites[c].color = c;
		}
	}
	
	// build sprites
	for (var y in pixels) {
		var line = pixels[y];
		for (var x in line) {
			var c = line[x];
			if (c > 0)
				sprites[c].setMask(x, y);
		}
	}
	
	return sprites;
}

Exporter.toMSX2 = function(pixels) {
	var lines = new Array();
	var lcolors = new Array();
	var nsprites = 0;
	
	// discover color layers and number of sprites required
	for (var y in pixels) {
		var line = pixels[y];
		var colors = {};
		Exporter.lineColors(line, colors);		
		var bits = 0;
		for (var b=0; b<16; b++) {
			if (colors[b])
				bits |= (1 << b);			
		}
		var layers = tableMSX2[bits];
		lines[y] = layers;
		lcolors[y] = colors;
		if (layers.length > nsprites)
			nsprites = layers.length;
	}
	// /*debug*/ alert(arrayDump(lines, "\n"));
	
	// create sprites
	var sprites = new Array();
	var lastSprite = nsprites - 1;
	while (nsprites--)
		sprites.push(new Sprite(2));
	
	// build sprites
	for (var y in lines) {
		var layers = lines[y];
		var colors = lcolors[y];
		var line = pixels[y];
		var evtor = new LayersEvaluator(layers);
		var trail = new Array();
		var sp = 0;
		while (evtor.next()) {
			trail.push(evtor.value);
			sprites[sp].setAttribute(y, evtor.value, (sp > 0));
			for (var x in line) {
				var c = line[x];
				if (c == null) {
					continue;
				} else
				if (c == evtor.value) {
					sprites[sp].setMask(x, y);
				} else if (c == evtor.ored) {
					for (var psp = sp; psp>=0; psp--)
						sprites[psp].setMask(x, y);
				} else if ((c | evtor.ored) == evtor.ored)
				{
					// the color is contained into the ORed layers
					// so we must find at what level
					var psp = sp;
					var oring = 0;
					while (psp >= 0) {
						oring |= trail[psp];
						if (oring == c)
							break;
						psp--;
					}
					if (oring == c)
						while (psp <= sp)
							sprites[psp++].setMask(x, y);
				}
			}
			sp++;
		}
	}
	
	return sprites;
}

