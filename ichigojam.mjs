import util from './util.mjs'
import kana from './kana.mjs'
import { speech } from "./speech.mjs";
import { DobutsuCode } from "https://pcn-club.github.io/DobutsuCode/DobutsuCode.js";
import { DobutsuStorageClient } from "https://pcn-club.github.io/DobutsuStorage/DobutsuStorageClient.js";
import { JoyConSupport } from "./JoyConSupport.js";

//import { QRCodeReader } from "https://code4fukui.github.io/qr-code-reader/qr-code-reader.js";

let cocoro = null;
let CocorokitPlus = null;
let cocorobtn = 0;
if (window.btncocoro) {
	const connect = async (id) => {
		const module = await import("https://taisukef.github.io/cocorokit-plus-js-sdk/cocorokit-plus.js");
		CocorokitPlus = module.CocorokitPlus;
		cocoro = null;
		try {
			const opt = {
				filters: [
					{
						namePrefix: "cocorokit+" + (id || ""),
					},
				],
				optionalServices: [CocorokitPlus._serviceUUID],
			};
			cocoro = await CocorokitPlus.find(opt);
			await cocoro.startDigitalInputNotification((s1, s2) => {
				cocorobtn = s1;
			});
		} catch (e) {
			console.log(e);
			alert("ユカイ工学「ココロキット+」を接続して、LEDを光らせたり、スイッチの入力を受け取ったり、サーボを動かしたりすることができます");
		}
	};
	btncocoro.onclick = async () => {
		connect();
	};
	/*
	if (window.qrcocoro) {
		console.log(window.qrcocoro, window.qrcocoro.oninput);
		window.qrcocoro.oninput = async (s) => {
			if (s.data.length > 0) {
				console.log("INPUT", s);
				await connect(s.data);
				await window.qrcocoro.stop();
			}
		};
	}
	*/
	/*
	const qrcocoro = new QRCodeReader();
	qrcocoro.oninput = async (s) => {
		if (s.data.length > 0) {
			//await connect(s.data);
			cocoroid.value = s.data;
			await qrcocoro.stop();
		}
	};
	cocorokitc.appendChild(qrcocoro);
	*/
}

//const dendpoint = "http://localhost:6109/api/";
const dendpoint = "https://app.sabae.cc/dobutsu_storage/api/";
const dstorage = new DobutsuStorageClient(dendpoint);
  
let ex;
let ram;
let charptn;
let storage;
let uartoutput;
let speechmode = false;
const setSpeechMode = (b) => {
	speechmode = b;
};

let check0;
const setButtonState = (n) => {
	ex.setButtonState(n);
	if (check0) {
		check0.checked = n;
	}
};

const RAM_PCG = 0x700 - 0x700
const RAM_VAR = 0x800 - 0x700
const RAM_VRAM = 0x900 - 0x700
const RAM_LIST = 0xC00 - 0x700
const RAM_KEYBUF = 0x1002 - 0x700

const EMOJI_E0 = util.decU("←→↑↓♠♥♣♦⚫⚪🔟🍙🐱👾♪🌀🚀🛸⌇🚁💥💰🧰📶🚪🕴🕺💃🏌🏃🚶🍓")
const EMOJI_80 = '　▘▝▀▖▌▞▛▗▚▐▜▄▙▟█・━┃╋┫┣┻┳┏┓┗┛◤◥◣◢' // 0x80のキャラコードは全角空白
const encodeEmoji = function(code) {
	if (code >= 0x80 && code <= 0x9f) {
		return EMOJI_80.charAt(code - 0x80)
	} else if (code >= 0xe0 && code <= 0xff) {
		return EMOJI_E0[code - 0xe0]
	}
	return null
}
/*
for (let i = 0; i < EMOJI_E0.length; i++) {
	//console.log(i, EMOJI_E0.charAt(i))
	console.log(i, EMOJI_E0[i])
}
*/
const decodeEmoji = function(c) {
	let n = EMOJI_80.indexOf(c)
	//console.log(EMOJI_80.length, 0x80, n)
	if (n >= 0)
		return n + 0x80
	n = EMOJI_E0.indexOf(c)
	//console.log(EMOJI_E0.length, 0xe0, n)
	if (n >= 0)
		return n + 0xe0
	return -1
};

const encodeBin = (s) => {
	const b = new Uint8Array(s.length);
	for (let i = 0; i < s.length; i++) {
		b[i] = s.charCodeAt(i);
	}
	return b;
};

/*
const s = 'IchigoJam🍓!'
const s2 = util.encU(util.decU(s))
console.log(s, util.decU(s), s2, s == s2)
*/

window.onload = async function () {
	const buf = await (await fetch('./ichigojam.wasm')).arrayBuffer()
	const res = await WebAssembly.instantiate(new Uint8Array(buf))
	ex = res.instance.exports
	ram = new Uint8Array(ex.memory.buffer, ex.getRAM(), ex.getSizeRAM())
	charptn = new Uint8Array(ex.memory.buffer, ex.getCharPattern(), ex.getCharPatternSize())
	storage = new Uint8Array(ex.memory.buffer, ex.getStorage(), ex.getStorageSize())
	uartoutput = new Uint8Array(ex.memory.buffer, ex.getUARTOutput(), ex.getUARTOutputSize())
	init()
}
const init = function() {
	var tick = function() {
		try {
			ex.tick()
		} catch (e) {
			console.log(e);
		}
	}
	// PWM
	const pwm = [];
	const bkpwm = [];
	for (let i = 0; i < 6; i++) {
		pwm[i] = [0, 0];
		bkpwm[i] = [0, 0];
	}
	const setPWM = () => {
		for (let i = 0; i < pwm.length; i++) {
			pwm[i][0] = ex.getPWMValue(i + 1);
			pwm[i][1] = ex.getPWMLen(i + 1);
		}
	};
	const isChangePWM = (i) => {
		let change = false;
		if (pwm[i][0] != bkpwm[i][0]) {
			change = true;
			bkpwm[i][0] = pwm[i][0];
		}
		if (pwm[i][1] != bkpwm[i][1]) {
			change = true;
			bkpwm[i][1] = pwm[i][1];
		}
		return change;
	};
	//
	var draw = function() {
		drawfunc({
				ram: ram,
				charptn: charptn,
				outport: ex.getOutPort(),
				cx: ex.getCursorX(),
				cy: ex.getCursorY(),
				cursoron: ex.getCursorFlag(),
				cursorinsert: ex.getCursorInsert(),
				screeninvert: ex.getScreenInvert(),
				screenbig: ex.getScreenBig(),
				freq: ex.getFreq(),
				pwm,
		})
	}
	
	var snd = null; // = getSound(); // for autoplay polity
	var initSound = function() {
		if (!snd) {
			snd = getSound();
		}
	};
	initSound();
	
	// storage
	// const uintarray2hex = ar => ar.map(v => util.fix0(v.toString(16), 2)).join('')
	const hex2uintarray = s => new Uint8Array(s.match(/.{1,2}/g).map(v => parseInt(v, 16)))
	const storageName2 = "ichigojam-web-1"
	const saveStorage = function (n) {
		const s = []
		for (let i = 0; i < 1024; i++) {
			const m = storage[1024 * n + i].toString(16)
			s.push(m.length == 1 ? '0' + m : m)
		}
		localStorage[storageName2 + '-' + n] = s.join('')
	}
	const loadStorage = function () {
		for (let i = 0; i < 228; i++) {
			const s = localStorage[storageName2 + '-' + i]
			if (s) {
				const ar = hex2uintarray(s)
				for (let j = 0; j < ar.length; j++) {
					storage[i * 1024 + j] = ar[j]
				}
			}
		}
	}

	var framecnt = 0
	setInterval(function () {
		handleGamePad();
		if ((framecnt & 3) === 0) {
			draw()
		} else {
			tick()
			const n = ex.checkFileUpdate()
			if (n >= 0) {
				saveStorage(n)
				console.log('save storage', n)
			}
			// output
			if (window.uartOutput) {
				if (uartoutput[0] > 0) {
					let s = String.fromCharCode(uartoutput[0]);
					for (let i = 1; i < uartoutput.length; i++) {
						const c = uartoutput[i];
						if (!c) {
							break;
						}
						s += String.fromCharCode(c);
					}
					//console.log("uartoutput", s);
					if (speechmode) {
						speech(s);
					}
					window.uartOutput(s);
					uartoutput[0] = 0;
				}
			}
		}
		framecnt++
	}, 1000 / (60 * 4))

	loadStorage()
	
	var g = util.getContext(canvas)
	g.init()

	var t = 0;
	
	var dw = 32;
	var dh = 24;
	
	var drawChar = function(g, c, x, y, w, h, cursor) {
		if (t & 0x10)
			cursor = 0;
		var ptn = charptn;
		var ptnoff = c * 8;
		if (c >= 224) {
			ptn = ram;
			ptnoff = (c - 224) * 8;
		}
		var r = w / 8;
		if (screeninvert)
			g.setColor(0, 0, 0);
		else
			g.setColor(255, 255, 255);
		if (cursor == 1) {
			for (let i = 0; i < 8; i++) {
				const n = ptn[ptnoff + i];
				for (let j = 0; j < 8; j++) {
					if ((n & (1 << (7 - j))) == 0) {
						g.fillRect(x + j * r, y + i * r, r, r);
					}
				}
			}
		} else if (cursor == 2) {
			for (let i = 0; i < 8; i++) {
				const n = ptn[ptnoff + i];
				for (let j = 0; j < 4; j++) {
					if ((n & (1 << (7 - j))) == 0) {
						g.fillRect(x + j * r, y + i * r, r, r);
					}
				}
				for (let j = 4; j < 8; j++) {
					if (n & (1 << (7 - j))) {
						g.fillRect(x + j * r, y + i * r, r, r);
					}
				}
			}
		} else {
			for (let i = 0; i < 8; i++) {
				const n = ptn[ptnoff + i];
				for (let j = 0; j < 8; j++) {
					if (n & (1 << (7 - j))) {
						g.fillRect(x + j * r, y + i * r, r, r);
					}
				}
			}
		}
	};
	//var ram;
	//var charptn;
	var outport;
	let bkled = 0;
	let bkcocorobtn = 0;
	var cx, cy, cursoron, cursorinsert;
	var screeninvert = 0;
	var screenbig = 0;
	canvas.width = 544;
	canvas.height = 416;
	
//	alert(canvas.width);
//	alert(g.cw);
	g.draw = function() {
		var sw = g.cw;
		var sh = g.ch;
		sw = canvas.width;
		sh = canvas.height;
		
		//var tw = sw < 480 ? 8 : 8 * 2;
		const off = 2
		const tw = Math.min(sw / (dw + 2), sh / (dh + 2)) >> 0
		var ox = (sw - tw * dw) / 2;
		var oy = (sh - tw * dh) / 2;

		g.setColor(0, 0, 0);
		const led = outport & (1 << 6);
		if (!cocoro) {
			if (led) {
				//g.setColor(255, 255, 255);
				g.setColor(220, 55, 55);
			} else {
				g.setColor(0, 0, 0);
			}
		} else {
			if (led != bkled) {
				try {
					/*await*/ cocoro.setLED(CocorokitPlus.LED_G, led ? 100 : 0);
				} catch (e) {
					cocoro = null;
				}
			}
			bkled = led;
			if (cocorobtn != bkcocorobtn) {
				setButtonState(cocorobtn);
			}
			bkcocorobtn = cocorobtn;

			// PWM
			setPWM();
			for (let i = 1; i <= 4; i++) {
				if (isChangePWM(i)) {
					//console.log("pwm", i + 1, pwm[i]);
					cocoro.setPwmDuty(i - 1, pwm[i][0] * 10);
				}
			}
		}
		g.fillRect(0, 0, sw, sh);

		// Joy-Con
		JoyConSupport.update(led, ex);

		if (window.drawOutport) {
			window.drawOutport(g, outport)
		} else if (window.extout) {
			extout.setSegments(outport);
		}
		if (outflg.length > 0) {
			for (let i = 1; i < 12; i++) {
				const n = (i + 6) % 11
				outflg[i].style.backgroundColor = (outport & (1 << n)) ? "red" : "black"
			}
		}
		
		if (screeninvert)
			g.setColor(255, 255, 255);
		else
			g.setColor(0, 0, 0);
		g.fillRect(ox - tw / 8, oy - tw / 8, dw * tw + tw / 8 * 2, dh * tw + tw / 8 * 2);
		
		var dw2 = dw >> screenbig;
		var dh2 = dh >> screenbig;
		var tw2 = tw << screenbig;
		
		for (let i = 0; i < dh2; i++) {
			for (let j = 0; j < dw2; j++) {
				var c = ram[RAM_VRAM + j + i * dw2];
				var x = ox + j * tw2;
				var y = oy + i * tw2;
				drawChar(g, c, x, y, tw2, tw2, cursoron && cx == j && cy == i && (cnt & 16) ? 2 - cursorinsert : 0);
			}
		}
		cnt++;
	};
	var cnt = 0;
	
	var initfunc = null;
	var freq = 0;
	
	const drawfunc = function(data) {
		//ram = data.ram;
		charptn = data.charptn;
		outport = data.outport;
		
		cx = data.cx;
		cy = data.cy;
		cursoron = data.cursoron;
		cursorinsert = data.cursorinsert;
		screeninvert = data.screeninvert;
		screenbig = data.screenbig;
		freq = data.freq;
		//console.log("pwm", data.pwm);
		
//		program.value = "cursor: " + cx + ", " + cy;
		
//		for (let i = 0; i < 256; i++)
//			ram[RAM_VRAM + i] = i;
		
		g.draw();
		if (initfunc) {
			initfunc();
			initfunc = null;
		}
		if (snd) {
			snd.freq = freq;
		}
	}
	
	var putc = function(key) {
		ex.key_putc(key);
		if (speechmode) {
			speech(key);
		}
	}
	var puts = function(s) {
		const sa = util.decU(s)
		for (let i = 0; i < sa.length; i++) {
			let c = sa[i] // s.charAt(i)
			const cemoji = decodeEmoji(c)
			if (cemoji >= 0) {
				putc(cemoji)
				tick()
				continue
			}
			if (c == "‘") { // for Mac
				c = "'"
			} else if (c == "’") {
				c = "'"
			} else if (c == "“") {
				c = '"'
			} else if (c == '”') {
				c = '"'
			}
			const code = c.codePointAt(0) // c.charCodeAt(0)
			let cc = null
			if (code >= 256 && code < 512) {
				cc = [ code - 256 ]
			} else {
				cc = kana.toHankaku(c);
			}
			for (let j = 0; j < cc.length; j++) {
				const c2 = cc[j];
				if (c2) {
					putc(c2);
					tick();
				}
			}
		}
	};
	var keyUp = function(key) {
		if (key == 88)
			key = 33
		ram[RAM_KEYBUF] &= ~(1 << (key - 28));
	};
	var keyDown = function(key) {
		if (key == 88)
			key = 33
		ram[RAM_KEYBUF] |= 1 << (key - 28);
	};
	const cnvKey = (e) => {
		return e.key.charCodeAt(0) == 12288 ? " " : e.key;
	};
	document.body.onkeydown = function(e) {
		const ekey = cnvKey(e);
		//alert(ekey.charCodeAt(0));
		if (document.activeElement.tagName.toLowerCase() == "textarea") {
			return;
		}
	//		console.log(document.activeElement.tagName);
		if (e.metaKey) { // command
			return;
		}
	//				console.log(ekey);
		var key = -1;
		if (e.altKey) {
			if (ekey.length == 1) {
				var key = e.keyCode; // deprecated...
				if (key >= 48 && key <= 57) {
					key = 224 + (key - 48);
				} else if (key >= 65 && key <= 86) {
					key = 224 + (key - 65) + 10;
				} else if (key >= 87 && key <= 90) { // ver 1.2.4b50
					key = 224 + (key - 87);
				}
				if (e.shiftKey) {
					key -= 32 * 3;
				}
			} else if (e.ctrlKey) {
				key = 0x11; // 17
			}
		} else if (e.ctrlKey) {
			//alert(ekey)
			if (ekey == "c") {
				key = 27;
			} else if (ekey == "a") {
				key = 0x12; // home
			} else if (ekey == "e") {
				key = 0x17; // end
			} else if (ekey == "k") {
				key = 0x0c; // 0.9.9 = カーソル以降削除
			} else if (ekey == "l") {
				puts("\x13\x0c"); // puts("CLS");
				key = 0;
			} else if (ekey == "Shift" || ekey == " ") { // Mac: OSのCtrl+Spaceと競合して使えない
				key = 0xf; // カナうち
			}
		} else if (ekey == "Escape") { // esc
			key = 27;
		} else if (ekey == "Backspace") { // backspace
			key = 8;
			if (speechmode) {
				speech("バックスペース");
			}
		} else if (ekey == "Enter") {
			key = e.shiftKey ? 0x10 : 0x0a;
		} else if (ekey == "Delete") { // delete
			key = 127;
		} else if (ekey == "ArrowLeft") { // cursor left
			key = 28;
		} else if (ekey == "ArrowRight") { // cursor right
			key = 29;
		} else if (ekey == "ArrowUp") { // cursor up
			key = 30;
		} else if (ekey == "ArrowDown") { // cursor down
			key = 31;
		} else if (ekey == " ") {
			key = e.shiftKey ? 0x0e : 32;
			if (speechmode) {
				speech("スペース");
			}
		} else if (ekey == "End") {
			key = 0x17;
		} else if (ekey == "Home") {
			key = 0x12;
		} else if (ekey == "PageUp") {
			key = 0x13;
		} else if (ekey == "PageDown") {
			key = 0x14;
		} else if (ekey == "Tab") { // esc
			puts("  ");
			key = 0;
		} else if (ekey == "F1") { // F1
			puts("\x13\x0c"); // puts("CLS");
			key = 0;
		} else if (ekey == "F2") { // F2
			puts("\x18LOAD");
			key = 0;
		} else if (ekey == "F3") { // F3
			puts("\x18SAVE");
			key = 0;
		} else if (ekey == "F4") { // F4
			const sp = speechmode;
			speechmode = false;
			puts("\x18\x0cLIST");
			if (sp) {
				speech("リスト");
				speechmode = sp;
			}
			key = 10;
		} else if (ekey == "F5") { // F5
			const sp = speechmode;
			speechmode = false;
			puts("\x18RUN");
			if (sp) {
				speech("ラン");
				speechmode = sp;
			}
			key = 10;
		} else if (ekey == "F5") { // F5
			puts("\x18RUN");
			key = 10;
		} else if (ekey == "F6") { // F6
			puts("\x18?FREE()");
			key = 10;
		} else if (ekey == "F7") { // F7
			puts("\x18OUT0");
			key = 10;
		} else if (ekey == "F8") { // F8
			puts("\x18VIDEO1");
			key = 10;
		} else if (ekey == "F9") { // F9
			puts("\x18\x0cFILES");
			key = 10;
		} else if (ekey == "F10") { // F10
			puts("\x18SWITCH");
			key = 10;
		} else if (ekey.length == 1) {
			key = ekey.codePointAt(0) // charCodeAt(0);
			if (key >= 97 && key < 97 + 26) {
				key -= 97 - 65;
			} else if (key >= 65 && key < 65 + 26) {
				key += 97 - 65;
			}
		}
		if (key >= 0) {
			if (key > 0)
				putc(key);
		}
		if (key >= 28 && key <= 32 || key == 88) {
			keyDown(key);
		}
		e.preventDefault();
	};
	document.body.onkeyup = function(e) {
		const ekey = cnvKey(e);
		if (document.activeElement.tagName.toLowerCase() == "textarea") {
			return;
		}
		const speechScr = () => {
			if (!speechmode) {
				return;
			}
			if (cx >= 0 && cy >= 0) {
				var dw2 = dw >> screenbig;
				const c = ram[RAM_VRAM + cx + cy * dw2];
				speech(c);
			}
		};
		var key = -1;
		if (ekey == "ArrowLeft") { // cursor left
			key = 28;
			speechScr();
		} else if (ekey == "ArrowRight") { // cursor right
			key = 29;
			speechScr();
		} else if (ekey == "ArrowUp") { // cursor up
			key = 30;
			speechScr();
		} else if (ekey == "ArrowDown") { // cursor down
			key = 31;
			speechScr();
		} else if (ekey == " ") {
			key = 32;
		} else if (ekey == "x") {
			key = 88;
		}
		if (key >= 28 && key <= 32 || key == 88) {
			keyUp(key);
		}
		e.preventDefault();
	};
	
	btn_esc.onclick = function() {
		putc(27);
	};

	// keyboards
	if (window.btn_keys === undefined) {
		window.btn_keys = {};
	}
	btn_keys.onclick = function() {
		if (keyspanel.style.display == "block") {
			keyspanel.style.display = 'none'
			return
		}
		keyspanel.style.display = 'block'
		if (keyspanel.children.length) {
			return
		}
		const KEYBOARD =
`ESC F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 BS
! " # $ % & ' ( ) \` = ~
1 2 3 4 5 6 7 8 9 0 - ^
Q W E R T Y U I O P @ {
A S D F G H J K L ; : [
Z X C V B N M , . + * }
CAP ALT CTL INS KAN | ? < > ↑ _ ]
⇧ TAB  SPC  \\ /  ← ↓ → ⏎`
		const keys = util.makeGrids(KEYBOARD)
		keyspanel.appendChild(keys)
		const map = { '⏎': 10, '←': 28, '→': 29, '↑': 30, '↓': 31, 'X': 88, 'ESC': 27, 'TAB': 9, 'SPC': 32, 'BS': 8, 'KAN': 15, 'ALT': -1, 'CTL': -1, 'DEL': 127, 'INS': 17 }
		const func = [ "\x13\x0c", "\x18LOAD", "\x18SAVE", "\x18\x0cLIST\n", "\x18RUN\n",  "\x18?FREE()\n", "\x18OUT0\n", "\x18VIDEO1\n", "\x18\x0cFILES\n", "\x18SWITCH\n" ]
		
		const hasTapEvent = (function(){
			const div = document.createElement('div')
			div.setAttribute('ontouchstart', 'return')
			return typeof div.ontouchstart === 'function'
		})()
		const ondown = hasTapEvent ? 'ontouchstart' : 'onmousedown'
		const onup = hasTapEvent ? 'ontouchend' : 'onmouseup'
		

		// make backup key's content
		for (let i = 0; i < keys.children.length; i++) {
			const k = keys.children[i]
			k.bkc = k.textContent
		}
		const setShiftMode = function(shiftmode) {
			for (let i = 0; i < keys.children.length; i++) {
				const k = keys.children[i]
				if (k.textContent.length == 1) {
					k.textContent = shiftmode ? k.textContent.toLowerCase() : k.textContent.toUpperCase()
				}
			}
		}
		const setAltMode = function(altmode, shiftmode) {
			for (let i = 0; i < keys.children.length; i++) {
				const k = keys.children[i]
				if (altmode) {
					if (k.bkc.length == 1) {
						let c = k.bkc.charCodeAt(0)
						if (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
							c = c - '0'.charCodeAt(0) + (shiftmode ? 0x80 : 0xe0)
						} else if (c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0)) {
							c = ((c - 'A'.charCodeAt(0) + 10) & 0x1f) + (shiftmode ? 0x80 : 0xe0)
						} else {
							c = 0
						}
						if (c) {
							k.textContent = encodeEmoji(c)
							k.emoji = true
						}
					}
				} else {
					k.textContent = k.bkc
					k.emoji = false
				}
			}
		}
		const resetOnetimeShiftMode = function() {
			if (keys.shiftmodeOnetime) {
				if (keys.altmode) {
					setAltMode(true, false)
				} else {
					setShiftMode(false)
				}
				keys.shiftmode = false
			}
		}

 		for (let i = 0; i < keys.children.length; i++) {
			const key = keys.children[i]
			key[ondown] = function(e) {
				//e.preventDefault()
				const c = this.textContent
				if (c == 'CAP' || c == '⇧') {
					keys.shiftmode = !keys.shiftmode
					keys.shiftmodeOnetime = keys.shiftmode && c == '⇧'
					if (keys.altmode) {
						setAltMode(true, keys.shiftmode)
					} else {
						setShiftMode(keys.shiftmode)
					}
					return
				}
				if (c == 'ALT') {
					keys.altmode = !keys.altmode
					setAltMode(keys.altmode, keys.shiftmode)
				}
				if (this.emoji) {
					puts(c)
					return
				}
				const c2 = map[c]
				if (c2) {
					if (c2 >= 0) {
						putc(c2)
						if (c2 >= 28 && c2 <= 32 || c2 == 88) {
							keyDown(c2)
						}
					}
					resetOnetimeShiftMode()
					return
				}
				if (c.length > 1 && c.charAt(0) == 'F') {
					const c3 = func[parseInt(c.substring(1)) - 1]
					if (c3)
						puts(c3)
					return
				}
				puts(c)
				resetOnetimeShiftMode()
			}
			key[onup] = function(e) {
				//if (e.cancelable)
				e.preventDefault()
				const c = this.textContent
				const c2 = map[c]
				if (c2 >= 28 && c2 <= 32 || c2 == 88) {
					keyUp(c2)
					return
				}
			}
		}
	}
	const ua = window.navigator.userAgent;
	const isMobile = ua.indexOf('iP') >= 0 || ua.indexOf('Android') >= 0;
	const isIPad = ua.indexOf("ipad") >= 0 || (ua.indexOf("macintosh") >= 0 && "ontouchend" in document);
	if (isMobile || isIPad) {
		btn_keys.onclick();
	}

	const create = tag => document.createElement(tag)
	// I/O
	let outflg = new Array()
	if (window.btn_io === undefined) {
		window.btn_io = {};
	}
	if (btn_io && window.iopanel) {
		const pins = [ "BTN/IN9", "IN1/OUT8", "IN2/OUT9", "IN3/OUT10", "IN4/OUT11", "OUT1/IN5", "OUT2/IN6", "OUT3/IN7", "OUT4/IN8", "OUT5/IN10", "OUT6/IN11", "LED/OUT7" ]
		// ext
		// mixjuice
		const chks = create("div");
		iopanel.appendChild(chks);
		{
			const lbl = create("label");
			lbl.style.display = "inline-block";
			const chk = create("input");
			chk.setAttribute("type", "checkbox");
			lbl.appendChild(chk);
			const span = create("span");
			span.textContent = "MixJuice";
			lbl.appendChild(span);
			chks.appendChild(lbl);
			lbl.style.margin = ".5em";
			iopanel.chkmixjuice = chk;
		}
		if (window.pancake) {
			const lbl = create("label");
			lbl.style.display = "inline-block";
			const chk = create("input");
			chk.setAttribute("type", "checkbox");
			lbl.appendChild(chk);
			const span = create("span");
			span.textContent = "PanCake";
			lbl.appendChild(span);
			chks.appendChild(lbl);
			lbl.style.margin = ".5em";
			iopanel.chkpancake = chk;
			chk.checked = true;
		}
		
		const tbl = create("table")
		iopanel.appendChild(tbl)
		let tr = create("tr")
		tbl.appendChild(tr)
		const th1 = create("th")
		tr.appendChild(th1)
//					for (let i = 11; i >= 0; i--) {
		for (let i = 0; i < 12; i++) {
			const th = create("th")
			th.innerHTML = pins[i].replace(/\//g, "<br>") // i
			tr.appendChild(th)
		}
		tr = create("tr")
		tbl.appendChild(tr)
		const th2 = create("th")
		th2.textContent = "IN"
		tr.appendChild(th2)
//					for (let i = 11; i >= 0; i--) {
		for (let i = 0; i < 11; i++) {
			const td = create("td")
			const check = create("input")
			check.type = "checkbox"
			check.name = i < 9 ? i : i + 1
			td.appendChild(check)
			tr.appendChild(td)
			if (i == 0) {
				check.disabled = true;
				check0 = check;
			} else {
				check.onchange = function() {
					ex.setStateIN(this.name, this.checked ? 1023 : 0)
				}
			}
		}
		tr = create("tr")
		tbl.appendChild(tr)
		const th3 = create("th")
		th3.textContent = "OUT"
		tr.appendChild(th3)
//					for (let i = 11; i >= 0; i--) {
		for (let i = 0; i < 12; i++) {
			const td = create("td")
			if (i > 0) {
				const span = create("span")
				span.style.display = "inline-block"
				span.style.width = "1em"
				span.style.height = "1em"
				span.style.border = "1 border black"
				span.style.backgroundColor = "black"
				outflg[i] = span
				td.appendChild(span)
			}
			tr.appendChild(td)
		}
		tbl.style.display = "inline-block";
		iopanel.style.display = "none";

		btn_io.onclick = function() {
			if (iopanel.style.display == "none") {
				iopanel.style.display = "block"
				iopanel.style.textAlign = "center"
			} else {
				iopanel.style.display = "none"
			}
		}
		// pancake
		if (iopanel.chkpancake) {
			iopanel.chkpancake.onchange = () => {
				if (iopanel.chkpancake.checked) {
					pancake.style.display = "inline-block";
				} else {
					pancake.style.display = "none";
				}
			}
		}

		// callback
		let posts = null;
		let postsurl = null;
		window.uartOutput = (s) => {
			if (iopanel.chkmixjuice.checked) {
				if (s.startsWith("MJ ")) {
					if (s.startsWith("MJ GET ")) {
						const url = "http://" + s.substring(7);
						fetchAndPut(url);
					} else if (s.startsWith("MJ GETS ")) {
						const url = "https://" + s.substring(8);
						fetchAndPut(url);
					} else if (s.startsWith("MJ POSTS START ")) {
						postsurl = "https://" + s.substring(15);
						console.log(postsurl)
						posts = [];
						return;
					} else if (s == "MJ POSTS END") {
						fetchAndPut(postsurl, posts.join("\n"));
					}
					/*
					MJ PCT contenttype
					*/
				}
				if (posts != null) {
					posts.push(s);
				}
			}
			if (iopanel.chkpancake && iopanel.chkpancake.checked) {
				pancake.parse(s);
			}
		};
	}
	
	// save/load
	/*
	var storageName = "ichigojam-web-0";
	var save = function(s) {
		localStorage[storageName] = s;
	};
	var load = function() {
		return localStorage[storageName];
	};
	*/
	// program
	btn_export.onclick = function() {
		var s = "";
		var n = RAM_LIST;
		for (;;) {
			var line = (ram[n + 1] << 8) | ram[n];
			if (line == 0)
				break;
			s += line + " ";
			var len = ram[n + 2];
			for (let i = 0; i < len; i++) {
				var c = ram[n + 3 + i];
				if (c) {
					const ch = encodeEmoji(c)
					if (ch) {
						s += ch
					} else {
						c = kana.fromHankaku(c)
						s += String.fromCodePoint(c) //String.fromCharCode(c)
					}
				}
			}
			s += '\n';
			if ((len & 1))
				len++;
			n += 4 + len;
		}
		
		program.value = s;
		resizeInput(program);
		document.location.hash = "#" + encodeURIComponent(s);
		
		// save(s);
	};
	btn_import.onclick = function() {
		const s = program.value
		puts(s)
		document.location.hash = "#" + encodeURIComponent(s)
	}
	btn_full.onclick = function() {
		//const usefullscreen = false
		const usefullscreen = true
		if (usefullscreen && requestFullscreen(canvas))
			return
		
		this.flg = !this.flg
		if (this.flg) {
			const dw = document.body.clientWidth
			const dh = document.body.clientHeight
			const cw = canvas.clientWidth
			const ch = canvas.clientHeight
			canvas.bkwidth = canvas.style.width
			canvas.bkheight = canvas.style.height
			if (dw / dh < cw / ch) {
				canvas.style.width = dw + 'px'
				canvas.style.height = Math.floor(ch / cw * dw) + "px"
			} else {
				canvas.style.width = Math.floor(cw / ch * dh) + "px"
				canvas.style.height = dh + 'px'
				scrollTo(0, window.pageYOffset + canvas.getBoundingClientRect().top)
			}
		} else {
			canvas.style.width = canvas.bkwidth
			canvas.style.height = canvas.bkheight
		}
	}
	window.onorientationchange = function() {
		if (btn_full.flg) {
			btn_full.onclick()
		}
	}
	btn_audio.onclick = function() {
		if (btn_audio.textContent == 'AUDIO ON') {
			if (snd) {
				snd.audio.resume()
			}
			btn_audio.textContent = 'AUDIO OFF'
		} else {
			snd.audio.suspend()
			btn_audio.textContent = 'AUDIO ON'
		}
	}

	// 動物コード
	if (window.btn_dobutsu) {
		btn_dobutsu.onclick = () => {
			if (dobutsupanel.style.display == "block") {
				dobutsupanel.style.display = "none";
				return
			}
			dobutsupanel.style.display = "block";
			if (dobutsupanel.init) {
				return;
			}
			dobutsupanel.init = true;
			dobutsupanel.querySelectorAll("select").forEach(sel => {
				const opt = (s) => {
					const opt = document.createElement("option")
					opt.textContent = s;
					sel.appendChild(opt);
				};
				sel.innerHTML = "";
				opt("-");
				DobutsuCode.getCodes().forEach(s => opt(s));
			});
			const [btnshow, btnshare] = dobutsupanel.querySelectorAll("button");
			btnshow.onclick = async () => {
				const dobutsucode = [];
				dobutsupanel.querySelectorAll("select").forEach((sel, idx) => dobutsucode[idx] = sel.value);
				const code = dobutsucode.join(" ");
				const program = await dstorage.load(code);
				if (!program) {
					alert("おや、その動物コードでは保存されていないようです。");
					return;
				}
				//console.log(code, program);
				setIchigoJamState({ program });
				//alert("プログラムを読み込みました！")
			};
			let bkstate = null;
			btnshare.onclick = async () => {
				const state = getIchigoJamState();
				if (equalsBin(state.program, new Uint8Array(1024))) {
					alert("プログラムがありません。");
					return;
				}
				if (bkstate && equalsBin(state.program, bkstate.program)) {
					return;
				}
				const code = await dstorage.append(state.program);
				if (!code) {
					alert("クラウドへの保存失敗！ネットワークを確認してみてください。");
					return;
				}
				bkstate = state;
				const dobutsucode = code.split(" ");
				dobutsupanel.querySelectorAll("input").forEach((inp, idx) => inp.value = dobutsucode[idx]);
			};
		};
	}
	const equalsBin = (b1, b2) => {
		if (b1 == b2) {
			return true;
		}
		if (!b1 || !b2) {
			return false;
		}
		if (b1.length != b2.length) {
			return false;
		}
		for (let i = 0; i < b1.length; i++) {
			if (b1[i] != b2[i]) {
				return false;
			}
		}
		return true;
	};
	const getBinCopy = (src, off, len) => {
		const dst = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			dst[i] = src[i + off];
		}
		return dst;
	};
	const getIchigoJamState = () => {
		//ram = new Uint8Array(ex.memory.buffer, ex.getRAM(), ex.getSizeRAM())
		//storage = new Uint8Array(ex.memory.buffer, ex.getStorage(), ex.getStorageSize())
		//console.log(ram.length, storage.length);
		const program = getBinCopy(ram, RAM_LIST, 1024);
		/*
		const st = {};
		for (let i = 0; i < storage.length / 1024; i++) {
			const no = i;
			const off = i * 1024;
			const lineno = storage[off] | (storage[off + 1] << 8);
			console.log(i, no, lineno);
			if (lineno) {
				st[no] = getBinCopy(storage, off, 1024);
			}
		}
		const data = { program, storage: st };
		console.log(data);
		*/
		return { program };
	};
	const setIchigoJamState = (data) => {
		const program = data.program;
		// ram直接はなんかおかしいので、storage0経由に変更
		/*
		for (let i = 0; i < program.length; i++) {
			ram[i + RAM_LIST] = program[i];
		}
		*/
		//console.log(program);
		for (let i = 0; i < program.length; i++) {
			storage[i] = program[i];
		}
		puts("\x18LOAD0\n")
	};
	//
	
	program.style.lineHeight = "14px";
	program.style.height = "30px";
	program.addEventListener("input", function(e) {
		resizeInput(e.target);
		var el = e.target;
	});
	var resizeInput = function(el) {
		if (el.scrollHeight > el.offsetHeight) {
			el.style.height = el.scrollHeight + "px";
		} else {
			for (let i = 0; i < 10; i++) {
				var h = Number(el.style.height.split("px")[0]);
				var lh = Number(el.style.lineHeight.split("px")[0]);
				el.style.height = (h - lh) + "px"; 
				if (el.scrollHeight > el.offsetHeight) {
					el.style.height = el.scrollHeight + "px";
					break;
				}
			}
		}
	};
	
	initfunc = function() {
		var hash = document.location.hash;
		if (hash.length > 1) {
			var s = decodeURIComponent(hash.substring(1));
			putc(27); // esc before import
			puts("NEW\n"); // new before import
			puts(s);
			program.value = s;
			resizeInput(program);
		} else {
			/*
			var s = load();
			if (s != null && s.length > 0) {
				puts(s);
				program.value = s;
				resizeInput(program);
			}
			*/
		}
	};

	// canvas touch
	if (canvas.ontouchstart === null) {
		canvas.ontouchstart = function() {
			setButtonState(1)
		}
		canvas.ontouchend = function() {
			setButtonState(0)
		}
	} else {
		canvas.onmousedown = function() {
			setButtonState(1)
		}
		canvas.onmouseup = function() {
			setButtonState(0)
		}
	}
	// gamepad
	let pads = null
  const gamepadEvent = 'ongamepadconnected' in window
  const getGamePad = function() {
		const gamepademu = JoyConSupport.getGamepad();
		if (gamepademu) {
			return gamepademu;
		}
		if (!navigator.getGamepads || navigator.getGamepads().length == 0)
			return null
		pads = navigator.getGamepads()
		const pad = pads[0]
    return pad
	}
	/*
	window.ongamepadconnected = function(e) {
		console.log(e.evt.gamepad, "connected")
	}
	*/
	const CTRLS = {
		// Megadrive-mini XYZ spc enter btn
		"6B controller (Vendor: 0ca3 Product: 0024)": { spc: 2, enter: 1, btn: 5, updown: 101, leftright: 100, run: 9, esc: 8, x: 3, y: 0, z: 4 }, // Chrome leftright 効かない!
		"ca3-24-6B controller": { updown: 104, leftright: 103, run: 9, esc: 8, x: 3, y: 0, z: 4, spc: 2, enter: 1, btn: 5 }, // space:5 Safari idこないことがある
		// XBOX XY Z(L) spc enter btn(R)
		"Xbox 360 Wired Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)": { spc: 0, enter: 1, btn: 5, run: 9, esc: 8, x: 2, y: 3, z: 4, up: 12, down: 13, left: 14, right: 15 }, // Chrome
		"45e-28e-Xbox 360 Wired Controller": { spc: 0, enter: 1, btn: 5, run: 8, esc: 9, x: 2, y: 3, z: 4, up: 11, down: 12, left: 13, right: 14 }, // Safari
		// PS4 controller run:pad, esc:psbtn
		"Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 05c4)": { spc: 0, enter: 1, btn: 5, x: 2, y: 3, z: 4, run: 17, esc: 16, up: 12, down: 13, left: 14, right: 15, ana0: 101, ana2: 100, ana5: 103, ana6: 102, ana7: -7, ana8: -6 }, // Chrome
		"54c-5c4-Wireless Controller": { spc: 1, enter: 2, btn: 5, x: 0, y: 3, z: 4, run: 13, esc: 12, up: 14, down: 15, left: 16, right: 17, ana0: 101, ana2: 100, ana5: 103, ana6: 102, ana7: 105, ana8: 104 }, // Safari
		"DUALSHOCK 4 Wireless Controller Extended Gamepad": { spc: 0, enter: 1, btn: 5, x: 2, y: 3, z: 4, run: 7, esc: 6, updown: -105, leftright: 104, ana0: -101, ana2: 100, ana5: -103, ana6: 102, ana7: -6, ana8: -7 }, // Safari on iOS
		// STANDARD GAMEPAD
		//"STANDARD GAMEPAD": { spc: 0, enter: 1, btn: 5, run: 9, esc: 8, x: 2, y: 3, z: 4, up: 12, down: 13, left: 14, right: 15 }, // Chrome,
		// JoyCon
		"Joy-Con (R) (STANDARD GAMEPAD Vendor: 057e Product: 2007)": { updown: 101, leftright: 100, spc: 0, btn: 1, run: 9, esc: 16 }, // 横持ち
		//   axes X(right/left), Y(down/up), 
		//   buttons A, X, B, Y, SL, SR, 0, ZR, R, PLUS, PRESS, 0, 0, 0, 0, 0, HOME
		"Joy-Con (L) (STANDARD GAMEPAD Vendor: 057e Product: 2006)": { updown: 101, leftright: 100, spc: 0, btn: 1, run: 9, esc: 16 }, // 横持ち
  //   axes X(right/left), Y(up/down)
  //   buttons: DOWN, RIGHT, LEFT, UP, SL, SR, ZL, 0, L, MINUS, PRESS, 0, 0, 0, 0, 0, CAPTURE
  	"Joy-Con L+R (STANDARD GAMEPAD Vendor: 057e Product: 200e)": { updown: 101, leftright: 100, spc: 0, btn: 1, run: 9, esc: 17 },
  //   axes: left X(right/left), left Y(down/up), right X(right/left), right Y(downlup)
  //   buttons: B, A, Y, X, L, R, ZL, ZR, MINUS, PLUS, left PUSH, push RIGHT, UP, DOWN, LEFT, RIGHT, HOME, CAPTURE, 
  //     left UP, left, right, teminal L, 
		"JoyConSupport": { btn: 0, spc: 1, left: 2, right: 3, up: 4, down: 5, run: 6, esc: 7, ana0: 100, ana2: 101 },
	}
	const DEFAULT_CTRL = CTRLS["54c-5c4-Wireless Controller"] // PS4をデフォルトにする

	const getGamePadValue = function(pad, id) {
		if (id <= -100) {
			return -pad.axes[-id - 100];
		} else if (id < 0) {
			const btn = pad.buttons[-id];
			if (!btn) {
				return 0;
			}
			return btn.value * 2 - 1;
		}
		if (id < 100) {
			const btn = pad.buttons[id];
			if (!btn) {
				return 0;
			}
			return btn.value;
		}
		return pad.axes[id - 100];
	}
	let bkupdown = 0
	let bkleftright = 0
	const bkbtn = {}
	const padkeys = [ "x", "y", "z", "spc", "run", "esc", "enter", "up", "down", "left", "right" ]
	const anas = [ 0, 2, 5, 6, 7, 8 ]
	//const padkeys = [ "x", "spc" ]
	const handleGamePad = function () {
		const pad = getGamePad();
		if (!pad) {
			return;
		}
		const ctrl = CTRLS[pad.id] || DEFAULT_CTRL;
		if (ctrl.btn !== undefined) {
			//console.log(pad) // debug
			setButtonState(getGamePadValue(pad, ctrl.btn))
		}
		const TH = .5;
		if (ctrl.updown !== undefined) {
			const updown = getGamePadValue(pad, ctrl.updown)
			if (updown != bkupdown) {
				if (bkupdown > TH) {
					keyUp(31)
				} else if (bkupdown < -TH) {
					keyUp(30)
				}
				if (updown > TH) {
					keyDown(31)
					putc(31)
				} else if (updown < -TH) {
					keyDown(30)
					putc(30)
				}
				bkupdown = updown
			}
		}
		if (ctrl.leftright !== undefined) {
			const leftright = getGamePadValue(pad, ctrl.leftright)
			if (leftright != bkleftright) {
				if (bkleftright > TH) {
					keyUp(29)
				} else if (bkleftright < -TH) {
					keyUp(28)
				}
				if (leftright > TH) {
					keyDown(29)
					putc(29)
				} else if (leftright < -TH) {
					keyDown(28)
					putc(28)
				}
				bkleftright = leftright
			}
		}

		for (const key of padkeys) {
			if (ctrl[key] === undefined)
				continue
			const k = getGamePadValue(pad, ctrl[key]) ? 1 : 0
			const bk = bkbtn[key] ? 1 : 0
			if (bk != k) {
				if (bk == 1) {
					if (key == 'spc') {
						keyUp(32)
					} else if (key == 'enter') {
						keyUp(10)
					} else if (key == 'x') {
						keyUp(88)
					} else if (key == 'y') {
						keyUp(89)
					} else if (key == 'z') {
						keyUp(90)
					} else if (key == 'up') {
						keyUp(30)
					} else if (key == 'down') {
						keyUp(31)
					} else if (key == 'left') {
						keyUp(28)
					} else if (key == 'right') {
						keyUp(29)
					}
				} else {
					if (key == 'esc') {
						putc(27)
					} else if (key == 'run') {
						puts("\x18RUN\n")
					} else if (key == 'spc') {
						keyDown(32)
						putc(32)
					} else if (key == 'enter') {
						keyDown(10)
						putc(10)
					} else if (key == 'x') {
						keyDown(88)
						putc(88)
					} else if (key == 'y') {
						keyDown(89)
						putc(89)
					} else if (key == 'z') {
						keyDown(90)
						putc(90)
					} else if (key == 'up') {
						keyDown(30)
						putc(30)
					} else if (key == 'down') {
						keyDown(31)
						putc(31)
					} else if (key == 'left') {
						keyDown(28)
						putc(28)
					} else if (key == 'right') {
						keyDown(29)
						putc(29)
					}
				}
				bkbtn[key] = k
			}
		}
		for (const ana of anas) {
			const a = 'ana' + ana;
			if (ctrl[a] == undefined) {
				continue;
			}
			const k = getGamePadValue(pad, ctrl[a]);
			const n = Math.floor((k + 1) / 2 * 1023);
			ex.setStateIN(ana, Math.max(Math.min(n, 1023), 0));
		}

	}

	// uartoutput
	const sleep = async (msec) => new Promise((resolve) => setInterval(resolve, msec));
	const fetchAndPut = async (url, post) => {
		try {
			const opt = !post ? undefined : {
				method: "POST",
				body: encodeBin(post),
				headers: {
					//"Content-type": "application/octet-stream",
					"Content-type": "text/plain",
				},
			};
			const bin = await (await fetch(url, opt)).arrayBuffer();
			const s = new Uint8Array(bin);
			for (let i = 0; i < s.length; i++) {
				const c = s[i];
				putc(c);
				await sleep(30);
				if (!iopanel.chkmixjuice.checked) {
					break;
				}
			}
		} catch (e) {
			console.log(e);
		}
	};
};

// fullscreen
var requestFullscreen = function(target) {
	if (target.webkitRequestFullscreen) {
		target.webkitRequestFullscreen(); //Chrome15+, Safari5.1+, Opera15+
	} else if (target.mozRequestFullScreen) {
		target.mozRequestFullScreen(); //FF10+
	} else if (target.msRequestFullscreen) {
		target.msRequestFullscreen(); //IE11+
	} else if (target.requestFullscreen) {
		target.requestFullscreen(); // HTML5 Fullscreen API
	} else {
		return false
	}
	return true
}
var exitFullscreen = function() {
	if (document.webkitCancelFullScreen) {
		document.webkitCancelFullScreen(); //Chrome15+, Safari5.1+, Opera15+
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen(); //FF10+
	} else if (document.msExitFullscreen) {
		document.msExitFullscreen(); //IE11+
	} else if(document.cancelFullScreen) {
		document.cancelFullScreen(); //Gecko:FullScreenAPI仕様
	} else if(document.exitFullscreen) {
		document.exitFullscreen(); // HTML5 Fullscreen API仕様
	}
};

// sound

var getSound = function() {
	try {
		window.AudioContext = window.webkitAudioContext || window.AudioContext;
		var audio = new AudioContext();
		if (!audio)
			return null;
		var node = audio.createScriptProcessor(1024, 2, 2);
		var gain = audio.createGain();
		var sampleRate = audio.sampleRate;
	
		var src = audio.createBufferSource();
		src.buffer = audio.createBuffer(2, 1024, audio.sampleRate);
		src.connect(node);
		node.connect(gain);
		gain.connect(audio.destination);
	
		var counter = 0;
		var snd = { freq: 0 };
		node.onaudioprocess = function(data) {
			var period = snd.freq / sampleRate;
			var outl = data.outputBuffer.getChannelData(0);
			var outr = data.outputBuffer.getChannelData(1);
			var procsize = data.inputBuffer.length;
			for (let i = 0; i < procsize; i++){
				outl[i] = outr[i] = counter > 0 ? 1 : -1;
	//			data[i] = counter; // triangle
				counter += period;
				if (counter >= 1.0)
					counter -= 2.0;
			}
		};
		gain.gain.value = 0.2;
		snd.gain = gain.gain;
		snd.audio = audio;
		return snd;
	} catch (e) {
		console.log(e);
	}
	return null;
}

export { setSpeechMode, ex };
