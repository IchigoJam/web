const speechtable = {
	":": "コロン",
	";": "セミコロン",
	"'": "クォート",
	"\"": "ダブルクォート",
	",": "コンマ",
	".": "ドット",
	"-": "マイナス",
	"?": "はてな",
	"#": "ハッシュ",
	"!": "エクスクラメーション",
	"^": "ハット",
	")": "みぎかっこ",
	"}": "みぎちゅうかっこ",
	">": "だいなり",
	"RUN": "ラン",
};
const speech = (s) => {
	if (!window.SpeechSynthesisUtterance) {
		//console.log("not supported speech API");
		return;
	}
	if (typeof s == "number") {
		s = String.fromCharCode(s);
		const ss = speechtable[s];
		if (ss) {
			s = ss;
		}
	}
	const msg = new SpeechSynthesisUtterance();
	msg.volume = 1.0;
	msg.rate = 2.0;
	msg.pitch = 1.0;
	// msg.lang = sellang.value; // en-US or ja-JP
	msg.text = s;
	speechSynthesis.speak(msg);
	/*
	msg.onend = (e) => {
		console.log(e.elapsedTime);
	};
	*/
};

export { speech };
