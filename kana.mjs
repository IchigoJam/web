// hiragana2katakana
const hiragana2katakana = function(s) {
	return s.replace(/[ぁ-ん]/g, function(s) {
		//return String.fromCharCode(s.charCodeAt(0) + 0x60)
		return String.fromCodePoint(s.codePointAt(0) + 0x60)
	})
}
const katakana2hiraana = function(s) {
	return s.replace(/[ア-ン]/g, function(s) {
		//return String.fromCharCode(s.charCodeAt(0) - 0x60)
		return String.fromCodePoint(s.codePointAt(0) + 0x60)
	})
}
// hankaku, half kana
const HALF_KANA_ZEN = "￥。「」、・ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン゛゜"
const HALF_KANA = "\¥｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞﾟ" // 	FORI=#A0TO#DF:?CHR$(I);:NEXT
const fromHankaku = function(c) {
	if (c >= 0xa0 && c <= 0xdf) {
		//c = HALF_KANA.charCodeAt(c - 0xa0)
		c = HALF_KANA.codePointAt(c - 0xa0)
	}
	return c
}
const DAKU_KANA = "ガギグゲゴザジズゼゾダヂヅデドバビブベボ"
const DAKU_HALF_KANA = "ｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾊﾋﾌﾍﾎ"
const HANDAKU_KANA = "パピプペポ"
const HANDAKU_HALF_KANA = "ﾊﾋﾌﾍﾎ"
const getHankakuCode = function(c) {
	var n = HALF_KANA.indexOf(c)
	if (n >= 0) {
		return n + 0xa0
	} else {
		//var n = c.charCodeAt(0)
		const n = c.codePointAt(0)
		if (n >= '！'.codePointAt(0) && n <= '～'.codePointAt(0)) {
			return n - 0xfee0
		}
		if (n == '　'.codePointAt(0)) {
			return 0x20
		}
		if (n < 0x100)
			return c.codePointAt(0) //c.charCodeAt(0);
		return 0
	}
}
const toHankaku = function(c) { // ret array
	c = hiragana2katakana(c)
	var n = DAKU_KANA.indexOf(c)
	if (n >= 0) {
		return [ getHankakuCode(DAKU_HALF_KANA.charAt(n)), getHankakuCode("ﾞ") ]
	}
	var n = HANDAKU_KANA.indexOf(c)
	if (n >= 0) {
		return [ getHankakuCode(HANDAKU_HALF_KANA.charAt(n)), getHankakuCode("ﾟ") ]
	}
	var n = HALF_KANA_ZEN.indexOf(c)
	if (n >= 0) {
		return [ getHankakuCode(HALF_KANA.charAt(n)) ]
	}
	return [ getHankakuCode(c) ]
}

export default { hiragana2katakana, katakana2hiraana, fromHankaku, getHankakuCode, toHankaku }
