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

// constants and utilities

var agt = navigator.userAgent.toLowerCase();
var is_ie = (agt.indexOf("msie") != -1);
var is_opera = (agt.indexOf("opera") != -1);

var img_blank = (is_ie) ? 'url("img/gridcell.gif")' : 'url("img/gridcell.png")';

function eid(id) {
	return document.getElementById(id);
}

String.prototype.reverse = function() {
    var s = "";
    var i = this.length;
    while (i>0) {
        s += this.substring(i-1,i);
        i--;
    }
    return s;
}

function hashDump(a, sep) {
	sep = (sep == null) ? ',' : sep;
	var r = new Array();
	for (var k in a) {
		var v = a[k];
		if (typeof v == 'object')
			v = "{" + hashDump(v) + "}";
		r.push("[" + k + "]=" + v);
	}
	return r.join(sep);
}

function arrayDump(a, sep) {
	sep = (sep == null) ? ',' : sep;
	var r = new Array();
	for (var k in a) {
		var v = a[k];
		if (typeof v == 'object')
			v = "{" + hashDump(v) + "}";
		r.push(v);
	}
	return r.join(sep);
}

function keyDump(a, sep) {
	sep = (sep == null) ? ',' : sep;
	var r = new Array();
	for (var k in a) {
		if (a[k] != null)
			r.push(k);
	}
	return r.join(sep);
}

function inRange(value, min, max) {
	return (value < min) ? min : ((value > max) ? max : value);
}

function getOffsetLeft(el) {
	var ret = 0;
	do {
		ret += el.offsetLeft;
	} while (el = el.offsetParent);
	return ret;
}

function getOffsetTop(el) {
	var ret = 0;
	do {
		ret += el.offsetTop;
	} while (el = el.offsetParent);
	return ret;
}

function toHex(v) {
	var htab = "0123456789ABCDEF";
	var r = htab.substr(v & 15, 1);
	v >>= 4;
	r = htab.substr(v & 15, 1) + r;
	return r;
}

function toHex1(v) {
	var htab = "0123456789ABCDEF";
	return htab.substr(v & 15, 1);
}

function toBin(v) {
	var r = "";
	r += ((v & 128) ? "1" : "0");
	r += ((v & 64) ? "1" : "0");
	r += ((v & 32) ? "1" : "0");
	r += ((v & 16) ? "1" : "0");
	r += ((v & 8) ? "1" : "0");
	r += ((v & 4) ? "1" : "0");
	r += ((v & 2) ? "1" : "0");
	r += ((v & 1) ? "1" : "0");
	return r;
}

function langComment(type, str) {
	var r;
	if (type == 'C')
		r = "/* " + str + " */";
	else
	if (type == 'pascal')
		r = "{ " + str + " }";
	else
	if (type == 'bin' || type == 'hex')
		r = "; " + str;
	else
		r = "' " + str;
	return r;
}

function langBytes(type, data) {
	var r = new Array();
	for (var k in data) {
		var v = data[k];
		if (type == 'data') {
			r.push(toHex(v));
		} else
		if (type == 'basic') {
			r.push('&H' + toHex(v));
		} else
		if (type == 'hex') {
			r.push('$' + toHex(v));
		} else
		if (type == 'bin') {
			r.push('DB ' + toBin(v)+'b');
		} else
		if (type == 'C') {
			r.push('0x' + toHex(v));
		} else
		if (type == 'pascal') {
			r.push('$' + toHex(v));
		}
	}
	return r;
}

function langFormatBytes(type, data) {
	var bytes = langBytes(type, data);
	var r = new Array();
	if (type == 'data' || type == 'basic') {
		var cut = (type == 'data') ? 16 : 8;
		for (var k in bytes) {
			var v = bytes[k];
			if (k % cut == 0)
				r.push("DATA ");
			r.push(v);
			if (k % cut == cut-1)
				r.push("\n");
			else
				r.push(",");
		}
	} else
	if (type == 'hex') {
		var cut = 8;
		for (var k in bytes) {
			var v = bytes[k];
			if (k % cut == 0)
				r.push("DB ");
			r.push(v);
			if (k % cut == cut-1)
				r.push("\n");
			else
				r.push(",");
		}
	} else
	if (type == 'bin') {
		for (var k in bytes) {
			var v = bytes[k];
			r.push(v);
			r.push("\n");	
		}
	} else
	if (type == 'C' || type == 'pascal') {
		for (var k in bytes) {
			var v = bytes[k];
			r.push(v);
			if (k < bytes.length-1)
				r.push(",");			
			if (k % 8 == 7)
				r.push("\n");
		}
	}
	return r.join("");
}

function createCookie(name, value, days) {
	var expiration = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (24 * 60 * 60 * 1000 * days));
		expiration = "; expires=" + date.toGMTString();
	}
	document.cookie = name + "=" + escape(value) + expiration + "; path=/";
}

function readCookie(name)
{
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') 
			c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0)
			return unescape(c.substring(nameEQ.length, c.length));
	}
}

function eraseCookie(name) {
	document.cookie = name + "=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/";
}

function setOpacity(el, value) {
	el.style.opacity = value/100;
	el.style.filter = 'alpha(opacity=' + value + ')';
}

function effectMovingArrow(el) {
	var arrow = document.createElement('span');
	var near = false;
	arrow.style.color = 'red';
	el.appendChild(arrow);
	var times = 0;
	var timer = setInterval(function() {
		arrow.innerHTML = (near) ? "&laquo;" : "&nbsp;&laquo;";
		near = !near;
		times++;
		if (times > 6) {
			clearInterval(timer);
			el.removeChild(arrow);
		}
	}, 500);	
}

function enabler(enabled, fields) {
	for (var i=0; i<fields.length; i++) {
		var field = eid(fields[i]);
		field.disabled=!enabled;
	}
}
