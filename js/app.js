if (is_ie) {
	var warning = eid('warning');
	warning.innerHTML = "Warning: no support for Internet Explorer yet. Try <a href='http://getfirefox.com'>Firefox</a> or <a href='http://www.opera.com'>Opera</a>.<br />";
}

// global app vars

var ff_file;

// var useCanvas = false;
// try {
// 	var is_windows2000 = /Windows NT 5\.0\;/.exec(window.navigator.userAgent);
// 	useCanvas = document.implementation.hasFeature("org.w3c.dom.svg", "1.0") && !is_windows2000;
// } catch (e) {}

var divgrid = eid('grid');
var divpal = eid('palette');
var divpreview = new Array();

var preview = null;
var preview_id = 0;
var clipboard = null;

var timerUpdater = null;
var tool = null;

var colorEditor = null;

// slots

var slots = new Slots(eid('slots'));

slots.onChange = function () {
	var slot = slots.getSelected();
	if (slot != null) {
		grid.drawing = slot.drawing;
		grid.updateGrid();

		if (preview) {
			preview.drawing = slot.drawing;
			preview.slot = slot.id;
			updatePreviewLabel(preview);
			preview.updateGrid();
		}
	}
}

// misc functions

function setupPreview(id, p) {
	p.previewId = id;
	p.el.onclick = function () {
		selectPreview(id);
	}
}

function updatePreviews(force) {
	for (var k in previews) {
		var p = previews[k];
		var slot = slots.items[p.slot];
		p.drawing = (slot) ? slot.drawing : null;
		updatePreviewLabel(p);
		if (p.drawing && (p.drawing.dirty || force))
			p.updateGrid();
	}
	for (var k in previews) {
		var p = previews[k];
		var slot = slots.items[p.slot];
		p.drawing = (slot) ? slot.drawing : null;
		if (p.drawing)
			p.drawing.dirty = false;
	}
}

function selectTool(toolid) {
	if (tool)
		tool.className = 'tool';
	tool = eid(toolid);
	tool.className = 'toolSelected';

	grid.onMouseDown = null;
	grid.onMouseUp = null;

	if (toolid == 'tool_pencil') {
		grid.onMouseDown = function () {
			var current = grid.drawing;
			var saved = current.clone();
			grid.onMouseUp = function () {
				var before = saved;
				var after = current.clone();

				var redoFunc = function () {
					current.copy(after);
				}
				var undoFunc = function () {
					current.copy(before);
				}
				Undo.save("Pencil", undoFunc, redoFunc);
			}
		}
	}
}

function updatePreviewLabel(preview) {
	var plabel = eid('previewLabel' + preview.previewId);
	if (plabel) {
		var slot = slots.items[preview.slot];
		var txt = (slot) ? slot.getName() : '??';
		plabel.innerHTML = txt.substring(0, 8) + ((txt.length > 8) ? '..' : '');
	}
}

function updateBackgroundSelect(palette) {
	var el_background = eid('background');
	while (el_background.firstChild)
		el_background.removeChild(el_background.firstChild);
	for (var k in palette.rgb) {
		var color = palette.rgb[k];
		var el_option = document.createElement('option');
		if (k == 0)
			el_option.setAttribute('selected', 'selected');
		el_option.value = k;
		el_option.innerHTML = color.name;
		el_background.appendChild(el_option);
	}
}

// app callbacks

function email(el) {
	var em = '@';
	var ponto = '.';
	el.setAttribute('href', 'mailto:' + 'rafael' + em + 'jannone' + ponto + 'org');
}

function gridRollUp() {
	var current = grid.drawing;

	var redoFunc = function () {
		current.rollUp();
	}
	var undoFunc = function () {
		current.rollDown();
	}
	Undo.runSave("Roll Up", undoFunc, redoFunc);
	return false;
}

function gridRollDown() {
	var current = grid.drawing;

	var redoFunc = function () {
		current.rollDown();
	}
	var undoFunc = function () {
		current.rollUp();
	}
	Undo.runSave("Roll Down", undoFunc, redoFunc);
	return false;
}

function gridRollLeft() {
	var current = grid.drawing;

	var redoFunc = function () {
		current.rollLeft();
	}
	var undoFunc = function () {
		current.rollRight();
	}
	Undo.runSave("Roll Left", undoFunc, redoFunc);
	return false;
}

function gridRollRight() {
	var current = grid.drawing;

	var redoFunc = function () {
		current.rollRight();
	}
	var undoFunc = function () {
		current.rollLeft();
	}
	Undo.runSave("Roll Right", undoFunc, redoFunc);
	return false;
}

function flipHorizontal() {
	var current = grid.drawing;

	var func = function () {
		current.flipHorizontal();
	}
	Undo.runSave("Flip Horizontal", func, func);
	return false;
}

function flipVertical() {
	var current = grid.drawing;

	var func = function () {
		current.flipVertical();
	}
	Undo.runSave("Flip Vertical", func, func);
	return false;
}

function rotateCW() {
	var current = grid.drawing;

	var redoFunc = function () {
		current.rotateCW();
	}
	var undoFunc = function () {
		current.rotateACW();
	}
	Undo.runSave("Rotate Clockwise", undoFunc, redoFunc);
	return false;
}

function rotateACW() {
	var current = grid.drawing;

	var redoFunc = function () {
		current.rotateACW();
	}
	var undoFunc = function () {
		current.rotateCW();
	}
	Undo.runSave("Rotate Anticlockwise", undoFunc, redoFunc);
	return false;
}

function undo() {
	Undo.undo();
}

function redo() {
	Undo.redo();
}

function updateUndo() {
	// update the previews instantly (if Undo needs update, we most likely have changed a drawing)
	clearInterval(timerUpdater);
	updatePreviews();
	timerUpdater = setInterval(updatePreviews, 1000);

	// update the undo/redo buttons
	var undo_title, redo_title;
	var tool_undo = eid('tool_undo');
	var tool_redo = eid('tool_redo');
	if (Undo.canUndo()) {
		// if (iDocID != null) {
		// 	parent.app.moduleDocumentChanged(iDocID);
		// }
		var next = Undo.getNextUndo();
		undo_title = next.desc;
	} else {
		// if (iDocID != null) {
		// 	parent.app.moduleDocumentChanged(iDocID, true);
		// }	
	}
	if (Undo.canRedo()) {
		var next = Undo.getNextRedo();
		redo_title = next.desc;
	}
	tool_undo.setAttribute('title', (undo_title) ? ('Undo "' + undo_title + '"') : 'Undo');
	tool_redo.setAttribute('title', (redo_title) ? ('Redo "' + redo_title + '"') : 'Redo');

	setOpacity(tool_undo, (undo_title) ? 100 : 30);
	setOpacity(tool_redo, (redo_title) ? 100 : 30);
}

function usePencil() {
	selectTool('tool_pencil');
	grid.click = grid.pencil;
}

function useBucket() {
	selectTool('tool_bucket');
	grid.click = function (el, x, y) {
		this.releaseButton();

		var saved = grid.drawing.clone();
		var current = grid.drawing;
		var color = grid.color;

		var redoFunc = function () {
			var lookfor = current.pixels[y][x];
			current.paint(x, y, color, lookfor);
		}
		var undoFunc = function () {
			// we can't just assign pixels, because a redo would paint over our saved copy
			current.copy(saved);
		}
		Undo.runSave("Paint Bucket", undoFunc, redoFunc);
	}
}

function usePicker() {
	selectTool('tool_picker');
	grid.click = function (el, x, y) {
		var pix = grid.drawing.pixels[y][x];
		picker.selectColor(pix);
	}
}

function useCircle() {
	selectTool('tool_circle');
	grid.click = function (el, x, y) {
		this.releaseButton();

		var rad = prompt("Circle radius?");
		if (!rad)
			return;
		try {
			rad = parseInt(rad, 10);
		} catch (e) {
			return;
		}

		var saved = grid.drawing.clone();
		var current = grid.drawing;
		var color = grid.color;

		var redoFunc = function () {
			current.circle(x, y, rad, color);
		}
		var undoFunc = function () {
			current.copy(saved);
		}
		Undo.runSave("Circle", undoFunc, redoFunc);
	}
}

function useInverse() {
	var saved = grid.drawing.clone();
	var current = grid.drawing;
	var color = grid.color;

	var redoFunc = function () {
		current.inverse(color);
	}
	var undoFunc = function () {
		current.copy(saved);
	}
	Undo.runSave("Inverse", undoFunc, redoFunc);
	return false;
}

function useLine() {
	selectTool('tool_line');
	var lx = null, ly = null;
	grid.click = function (el, x, y) {
		this.releaseButton();

		if (lx == null && ly == null) {
			lx = x;
			ly = y;
			return;
		}

		var saved = grid.drawing.clone();
		var current = grid.drawing;
		var color = grid.color;

		var redoFunc = function () {
			current.line(lx, ly, x, y, color);
			lx = x; ly = y;

		}
		var undoFunc = function () {
			current.copy(saved);
		}
		Undo.runSave("Line", undoFunc, redoFunc);
	}
}

function filterColor() {
	var r = confirm("This will erase the selected color from the drawing. Are you sure?");
	if (r) {
		grid.filterColor();
	}
}

function showExpOptions(el) {
	var expHasBasicLoader = (el.value == 'basic' || el.value == 'data');
	var basicOptions = eid('basicOptions');
	basicOptions.style.display = (expHasBasicLoader) ? 'block' : 'none';
	var chkExportAllSlots = eid('chkExportAllSlots');
	chkExportAllSlots.style.display = (el.value != 'backup') ? 'block' : 'none';
	var linkTryMSXPen = eid('linkTryMSXPen');
	linkTryMSXPen.style.display = (expHasBasicLoader) ? '' : 'none';
}

function selectBackground(el) {
	var bk = el.value;
	grid.el.style.backgroundColor = grid.colors[bk];
	for (var k in previews)
		previews[k].el.style.backgroundColor = grid.colors[bk];
}

function selectPreview(id) {
	divpreview[preview_id].className = 'preview';
	divpreview[id].className = 'previewSelected';
	preview = previews[id];
	preview_id = id;
	var slot = slots.items[previews[id].slot];
	slots.select(slot);
}

function clearGrid() {
	var r = confirm("Are you sure you want to ERASE this drawing?");
	if (r) {
		var current = grid.drawing;
		var saved = grid.drawing.clone();
		var undoFunc = function () {
			current.copy(saved);
		}
		var redoFunc = function () {
			current.clear();
		}
		Undo.runSave("Clear Drawing", undoFunc, redoFunc);
	}
	return true;
}

function createSlot() {
	var slot = slots.create();
	slots.select(slot);
}

function deleteSlot() {
	var slot = slots.getSelected();
	if (slot != null) {
		var name = slot.getName();
		var r = confirm("This can't be undone. Really DELETE the '" + name + "'?");
		if (r)
			slots.remove(slot);
	}
}

function renameSlot() {
	var slot = slots.getSelected();
	if (slot != null) {
		var name = slot.getName();
		var newname = prompt("Rename slot to...", name);
		if (newname) {
			slot.setName(newname);
			updatePreviews();
		}
	}
}

function onProjTypeChange(el) {
	if (el.value == 'msx1' && !palette.isEqual(msx1Palette)) {
		var r = confirm("This will reset your palette. Are you sure?");
		if (!r) {
			el.value = 'msx2';
			return false;
		}
	}
	projTypeChanged();
}

function projTypeChanged() {
	var projType = eid('projType');
	var paletteTip = eid('paletteTip');
	var type2 = (projType.value == 'msx2');
	palette.sigzero = type2;
	paletteTip.style.visibility = (type2) ? 'visible' : 'hidden';
	if (type2) {
		effectMovingArrow(paletteTip);
	} else {
		palette.copy(msx1Palette);
		colorEditor.hide();
	}
	colorEditor.updateGUI();
}

function projectEncode() {
	var x, y, s;
	var msx1 = (eid('projType').value == 'msx1');
	var enc = new Array();

	if (!palette.isEqual(msx1Palette)) {
		enc.push('!palette');
		enc.push(palette.encodeColors().join(","));
	}

	for (s in slots.items) {
		var hex = slots.items[s].save(msx1);
		if (hex != null) {
			var name = slots.items[s].getName();
			enc.push("#" + name);
			enc.push(hex);
		}
	}

	if (enc.length) {
		enc.unshift(eid('projType').value);
		enc.unshift('!type');
	}

	return enc.join("\n");
}

function saveMozilla(file) {
	if (file.exists() == false)
		file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420);
	var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
		.createInstance(Components.interfaces.nsIFileOutputStream);
	outputStream.init(file, 0x02 | 0x08 | 0x20, 420, 0);
	var output = projectEncode();
	var result = outputStream.write(output, output.length);
	outputStream.close();

	ff_file = file;
}

function loadMozilla(file) {
	if (file.exists() == false) {
		alert("File does not exist");
		return;
	}
	var is = Components.classes["@mozilla.org/network/file-input-stream;1"]
		.createInstance(Components.interfaces.nsIFileInputStream);
	is.init(file, 0x01, 00004, null);
	var sis = Components.classes["@mozilla.org/scriptableinputstream;1"]
		.createInstance(Components.interfaces.nsIScriptableInputStream);
	sis.init(is);
	var enc = sis.read(sis.available());
	receiveTXT(enc);

	ff_file = file;
}

function saveAll() {
	var saveMethod = eid('saveMethod').value;

	if (saveMethod == 'cookie') {
		eraseCookie("saved");
		createCookie("saved", projectEncode(), 36500); // 100 years of pain :)
		alert("Saved :)");
	} else
		if (saveMethod == 'export') {
			exportTXT();
		} else
			if (saveMethod == 'dataurl') {
				var str = projectEncode();
				var strBase64 = btoa(str);
				var strURL = escape(str);
				eid('saveLink').href = 'data:application/octet-stream;' +
					((strBase64.length < strURL.length) ? 'base64,' + strBase64 : ',' + strURL);
			} else
				if (saveMethod == 'mozilla') {
					try {
						netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
					} catch (e) {
						alert("Can't save Project: " + e);
						return;
					}

					var nsIFilePicker = Components.interfaces.nsIFilePicker;
					var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
					fp.init(window, "Save Project", nsIFilePicker.modeSave);
					fp.defaultExtension = "txt";
					fp.appendFilter("Sprite project (.txt)", "*.txt");

					var res = fp.show();
					if (res == nsIFilePicker.returnOK || res == nsIFilePicker.returnReplace) {
						saveMozilla(fp.file);
						alert("File saved :)");
					}
				}
	return false;
}

function loadAll() {
	var saveMethod = eid('saveMethod').value;

	if (saveMethod == 'cookie') {
		var l = confirm("This will erase your current work.\n" + "Are you sure you want to Load?");
		if (l == false)
			return;

		var c = readCookie('saved');
		if (c) {
			slots.clear();
			projectDecode(c);
		}
	} else
		if (saveMethod == 'export') {
			importTXT();
			return;
		} else
			if (saveMethod == 'mozilla') {
				try {
					netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
				} catch (e) {
					alert("Can't load Project: " + e);
					return;
				}

				var nsIFilePicker = Components.interfaces.nsIFilePicker;
				var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
				fp.init(window, "Load Project", nsIFilePicker.modeOpen);
				fp.defaultExtension = "txt";
				fp.appendFilter("Sprite project (.txt)", "*.txt");

				var res = fp.show();
				if (res == nsIFilePicker.returnOK || res == nsIFilePicker.returnReplace) {
					loadMozilla(fp.file);
				}
			}

	selectPreview(0);
	slots.selectIndex(0);
}

function copySlot() {
	clipboard = grid.drawing.clone();
}

function pasteSlot() {
	if (clipboard) {
		var current = grid.drawing;
		var saved = current.clone();
		var clip = clipboard.clone();
		var redoFunc = function () {
			current.overlay(clip);
		}
		var undoFunc = function () {
			current.copy(saved);
		}
		Undo.runSave("Paste", undoFunc, redoFunc);
	}
}

function projectDecode(c) {
	var slot = null;
	var ca = c.split("\n");
	var next = null;
	var enc;
	for (var i = 0; i < ca.length; i++) {
		var line = ca[i];
		if (line.charAt(0) == '#') {
			// begin slot			
			var name = line.substring(1, line.length);
			slot = slots.create();
			slot.setName(name);
			enc = '';
			next = 'slot';
		} else
			if (line.charAt(0) == '!') {
				var next = line.substring(1, line.length);
			} else {
				switch (next) {
					case 'slot':
						enc += line;
						if (enc.length >= 256)
							slot.load(enc);
						break;
					case 'palette':
						palette.decodeColors(line);
						next = null;
						break;
					case 'type':
						if (line == 'msx1' || line == 'msx2') {
							eid('projType').value = line;
							projTypeChanged();
						}
						next = null;
						break;
				}
			}
	}
	colorEditor.updateGUI();
	updatePreviews();
}

function exportWork() {
	var ptype = eid('projType').value;
	var etype = eid('expType').value;

	var all = eid('exportAll');
	var etype = eid('expType').value;
	var result = "";
	var colors = [];
	if (etype === "backup") {
		result = projectEncode();
	} else {
		if (all.checked) {
			var exp = new Array();
			for (var s in slots.items) {
				var slot = slots.items[s];
				var r = slot.export_(ptype, etype);
				if (r.result) {
					exp.push(r.result);
				}
				colors.push(r.colors);
			}
			result = exp.join(langComment(etype, "") + "\n");
		} else {
			var slot = slots.getSelected();
			if (slot != null) {
				var exp = slot.export_(ptype, etype);
				result = (exp.result != null) ? exp.result : "";
				colors.push(exp.colors);
			}
		}
	}

	var el = eid('exp');
	if (result == "")
		el.innerHTML = "// Nothing to export - Draw some sprites first!";
	else {
		if (etype == 'basic' || etype == 'data') {
			var startLine = 10000, stepLine = 10;
			if (eid('basic.useLine').checked) {
				startLine = parseInt(eid('basic.startLine').value, 10);
				if (isNaN(startLine))
					startLine = 10;
				stepLine = parseInt(eid('basic.step').value, 10);
				if (isNaN(stepLine))
					stepLine = 10;

				var r = result.split("\n");
				for (var k in r) {
					if (r[k] != "") {
						r[k] = startLine.toString() + " " + r[k];
						startLine += stepLine;
					}
				}
				result = r.join("\n");
			}

			if (eid('basic.includeLoader').checked) {
				result += startLine + " DATA *\n";
				startLine += stepLine;

				if (ptype === "msx1") {
					result += startLine + " SCREEN 2,2,0: GOSUB 10000\n";
					startLine += stepLine;
					var idx = 0, x = 0, y = 0;
					colors.forEach(function(spritesColors) {
						var lineSlot = spritesColors.map(function(color) {
							var putSprite = "PUT SPRITE " + idx + ",(" + (x*16) + "," + (y*16) + ")," + color + "," + idx;
							idx++;
							return putSprite;
						});
						if (lineSlot.length === 0) {
							return;
						}
						result += startLine + " " + lineSlot.join(":") + "\n";
						y++;
						if (y >= 12) {
							x++;
							y = 0;
						}
						startLine += stepLine;
					})
					result += startLine + " GOTO " + startLine + "\n";
					startLine += stepLine;
				}
				
				if (startLine < 10000) {
					startLine = 10000;
				}
				if (ptype == 'msx1') {
					var reader = (etype == 'data') ? "VAL(\"&H\"+R$)" : "VAL(R$)";
					result += (startLine + stepLine * 0) + " REM -- LOAD SPRITES\n" +
						(startLine + stepLine * 1) + " S=BASE(9)\n" +
						(startLine + stepLine * 2) + " READ R$: IF R$=\"*\" THEN RETURN ELSE VPOKE S," + reader +
						":S=S+1:GOTO " + (startLine + stepLine * 2) + "\n";
				} else {
					result += startLine + " REM -- MSX2 LOADER NOT YET IMPLEMENTED\n";
					/*
						300 COLOR 15,13,1:SCREEN 4,3,0:GOSUB 10000
						310 PUT SPRITE 0,(128,96),,0
						350 GOTO 350
						10000 REM -- LOAD SPRITES
						10010 SP=BASE(24):SC=BASE(23)-512:READ R$
						10020 IF R$="*" THEN RETURN
						10030 FOR I=0 TO 31:VPOKE SP+I,VAL("&H"+R$):READ R$:NEXT
						10040 FOR I=0 TO 15:VPOKE SC+I,VAL("&H"+R$):READ R$:NEXT:GOTO 10020					
					*/
				}
			}
		}
		el.innerHTML = result;
		eid("linkTryMSXPen").href = "https://msxpen.com/?draft=" +
			encodeURIComponent(btoa(JSON.stringify(buildMSXPenPayload(result))))
	}

	return result;
}

function copyExported() {
	var copyText = eid("exp");
	copyText.select();
	document.execCommand("Copy");
	$('#btnCopyClipboard').tooltip({
		title: "Code has been copied to clipboard",
		trigger: "manual",
	})
	$('#btnCopyClipboard').tooltip('show');
	setTimeout(function() {
		$('#btnCopyClipboard').tooltip('hide');
	}, 1000)
}

function buildMSXPenPayload(basic) {
	var payload = {
		"description" : "Generated by TinySprite",
		"files" : {
			"autoexec_bas": {
				"content": basic
			},
			"options_json" : {
				"content": "{\"asm\":{\"filename\":\"program.bin\",\"build\":\"bin\"},\"basic\":{}}"
			}
		}
	}
	return payload;
}

function exportTXT() {
	var txt = projectEncode();
	if (txt == "") {
		alert('All slots are empty');
		return;
	}

	var exp = eid('exp');
	exp.innerHTML = txt.replace(/\n/g, "<br />");

	showTab(1, 'tabExpCode');
}

function importTXT() {
	var w = window.open('import.html', 'importWindow', 'width=480,height=450,menubar=yes,location=no,' +
		'resizable=yes,scrollbars=yes,status=no');
}

function importSlot() {
	var w = window.open('import.html?slot', 'importWindow', 'width=480,height=450,menubar=yes,location=no,' +
		'resizable=yes,scrollbars=yes,status=no');
}

function receiveTXT(txt, loc) {
	if (loc.indexOf("?slot") >= 0) {
		var values = [];
		txt = txt.replace(/([0-9]+ )?data/ig, '').replace(/&h/ig, '');
		txt.replace(/[0-9a-f][0-9a-f]/ig, function (m) { values.push(parseInt(m, 16)); return ''; });
		var slot = slots.getSelected();
		slot.import_(values, grid.color);
	} else
		if (txt != "") {
			slots.clear();
			projectDecode(txt);
			selectPreview(0);
			slots.selectIndex(0);
			grid.updateGrid();
		}
}

function loadBackup() {
	var importField = eid('imp');
	var txt = importField.value.trim();
	if (txt != "") {
		if (confirm("This will erase your current project. Proceed?")) {
			slots.clear();
			projectDecode(txt);
			selectPreview(0);
			slots.selectIndex(0);
			grid.updateGrid();
			$('#importModal').modal('toggle');
		}
	}
}

// function exportFile() {
// 	var r = exportWork();
// 	if (iDocID != null && r != "") {
// 		var etype = eid('expType').value;
// 		switch (etype) {
// 			case 'hex':
// 			case 'bin':
// 				etype = 'asm';
// 				break;
// 			default:
// 				etype = 'txt';
// 				break;
// 		}
// 		var aFile = parent.app.moduleGetDocument(iDocID);
// 		var sPath = aFile.sPath.replace(/\.[^\.]*$/, '') + '.' + etype;
// 		parent.app.moduleGeneration(sPath, r);
// 	}
// }

// app setup

var msx1Palette = new Palette();
msx1Palette.add(255, 255, 255, 'None');
msx1Palette.add(0, 0, 0, 'Black');
msx1Palette.add(33, 200, 66, 'Green');
msx1Palette.add(94, 220, 120, 'Green (light)');
msx1Palette.add(84, 85, 237, 'Blue (dark)');
msx1Palette.add(125, 118, 252, 'Blue');
msx1Palette.add(212, 82, 77, 'Red (dark)');
msx1Palette.add(66, 235, 245, 'Cyan');
msx1Palette.add(252, 85, 84, 'Red');
msx1Palette.add(255, 121, 120, 'Red (light)');
msx1Palette.add(212, 193, 84, 'Yellow (dark)');
msx1Palette.add(230, 206, 128, 'Yellow');
msx1Palette.add(33, 176, 59, 'Green (dark)');
msx1Palette.add(201, 91, 186, 'Purple');
msx1Palette.add(204, 204, 204, 'Gray');
msx1Palette.add(255, 255, 255, 'White');

var palette = msx1Palette.clone();


// init grid and color pickers

// var grid = (useCanvas) ? new GridCanvas(16) : new Grid(16);
var grid = new GridCanvas(16);
grid.setPalette(palette);
divgrid.appendChild(grid.el);
grid.onPencil = function (x, y, v) {
	for (var i = 0; i < 4; i++) {
		if (previews[i].drawing == grid.drawing) {
			previews[i].setCellXY(x, y, v);
		}
	}
}

var picker = new Picker(palette);
picker.onclick = function (value) {
	grid.setColor(value);
}
picker.selectColor(1);
divpal.appendChild(picker.el);


// init previews

createSlot();
createSlot();
createSlot();
createSlot();

var previews = new Array();
for (var i = 0; i < 4; i++) {
	var div = eid('preview' + i);

	// previews[i] = (useCanvas) ? new GridCanvas(16, true) : new Grid(16, true);
	previews[i] = new GridCanvas(16, true);
	previews[i].setPalette(palette);

	var p = previews[i];
	setupPreview(i, p);
	p.slot = i;
	p.pixels = slots.items[i].drawing;

	divpreview[i] = div;
	div.appendChild(p.el);
}

preview = previews[0];
selectPreview(0);
slots.selectIndex(0);

timerUpdater = setInterval(updatePreviews, 1000);

selectTool('tool_pencil');
updateBackgroundSelect(grid.palette);
selectBackground(eid('background'));

showExpOptions(eid('expType'));

// var removeFileMethod = (is_opera || is_ie);

// if (document.location.href.substring(0,4).toLowerCase() == 'file') {
// 	var remote = eid('notice.remoteAccess');
// 	remote.style.display = 'none';
// } else {
// 	removeFileMethod = true;
// }

// if (removeFileMethod) {
// 	// remove Mozilla saveMethod
// 	var saveMethodMoz = eid('saveMethod.mozilla');
// 	saveMethodMoz.parentNode.removeChild(saveMethodMoz);
// }

// undo setup

Undo.onClear = Undo.onSave = updateUndo;
Undo.onUndo = Undo.onRedo = function () {
	if (grid.drawing.dirty)
		grid.updateGrid();
	updateUndo();
}

updateUndo();

// color editor setup

colorEditor = new ColorEditor(eid('colorEditor'), palette);

picker.ondblclick = function (value) {
	if (eid('projType').value == 'msx1')
		return;

	var el_cell = picker.cells[value];
	var offsetY;
	if (value > 7) {
		offsetY = el_cell.offsetHeight;
	} else {
		if (!colorEditor.height)
			colorEditor.show();
		offsetY = -colorEditor.height;
	}

	colorEditor.move(getOffsetLeft(el_cell), getOffsetTop(el_cell) + offsetY);

	var color = picker.palette.get333(value);
	colorEditor.setFields(color.r, color.g, color.b);

	colorEditor.show();
	colorEditor.focus();
	colorEditor.current = value;
}

projTypeChanged();

// export modal setup

$('#exportModal').on('shown.bs.modal', function () {
  exportWork()
})

// mouse setup

window.onmouseup = function () {
	grid.releaseButton();
	colorEditor.hide();
}

// touch setup

var blockScroll = false;
$(window).on('touchstart', function (e) {
	if ($(e.target).closest('.gridCanvas').length == 1) {
		blockScroll = true;
		grid.touchStart(e);
	}
});
$(window).on('touchend', function () {
	blockScroll = false;
});
$(window).on('touchmove', function (e) {
	if (blockScroll) {
		e.preventDefault();
		if ($(e.target).closest('.gridCanvas').length == 1) {
			grid.touchMove(e);
		}
	}
});

/* MSXGDE */

// var iDocID = null;
// if (parent.app) {
// 	eid('menu.saveMethod').style.display='none';
// 	eid('notice.remoteAccess').style.display='none';

// 	iDocID = parent.app.moduleDocID(document.location);
// 	if (iDocID != null) {
// 		var aEntryPoints = {
// 			loadDocument: function(aDoc, sData) {
// 				slots.clear();
// 				if (sData.length) {
// 					projectDecode(sData);
// 				} else {
// 					createSlot();
// 					createSlot();
// 					createSlot();
// 					createSlot();										
// 				}				
// 				selectPreview(0);
// 				slots.selectIndex(0);				
// 			},
// 			saveDocument: function(aDoc) {
// 				return projectEncode();
// 			},
// 			onSaveDocumentSuccess: function() {
// 				Undo.clear();
// 			}
// 		}
// 		parent.app.moduleSetMenubar(iDocID, eid('divTopMenuProto'));
// 		parent.app.moduleInit(iDocID, aEntryPoints);
// 	}
// }
