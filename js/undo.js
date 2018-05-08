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

// undo

var Undo = {};

Undo.steps = new Array();

Undo.marker = -1;

Undo.onClear = Undo.onSave = Undo.onUndo = Undo.onRedo = function(step) {};

Undo.removeTail = function() {
	var marker = Undo.marker;
	while (marker >= 0) {
		Undo.steps.shift();
		--marker;
	}
	Undo.marker = marker;
}

Undo.clear = function() {
	Undo.steps = new Array();
	Undo.marker = -1;
	Undo.onClear();
}

Undo.save = function(desc, undoFunc, redoFunc) {
	Undo.removeTail();
	var step = {desc: desc, undoFunc: undoFunc, redoFunc: redoFunc};
	Undo.steps.unshift(step);
	Undo.onSave(step);
	return step;
}

Undo.runSave = function(desc, undoFunc, redoFunc) {
	Undo.save(desc, undoFunc, redoFunc);
	var result = redoFunc();
	Undo.onRedo(Undo.steps[Undo.marker]);
	return result;
}

Undo.canUndo = function() {
	return (Undo.marker < Undo.steps.length-1);
}

Undo.canRedo = function() {
	return (Undo.marker >= 0);
}

Undo.getNextUndo = function() {
	if (!Undo.canUndo())
		return null;
	return Undo.steps[Undo.marker+1];
}

Undo.getNextRedo = function() {
	if (!Undo.canRedo())
		return null;
	return Undo.steps[Undo.marker];
}

Undo.undo = function() {
	if (Undo.canUndo()) {
		var step = Undo.steps[++Undo.marker];
		step.undoFunc();
		Undo.onUndo(step);
		return step;
	}
}

Undo.redo = function() {
	if (Undo.canRedo()) {
		var step = Undo.steps[Undo.marker--];
		step.redoFunc();
		Undo.onRedo(step);
		return step;
	}
}
