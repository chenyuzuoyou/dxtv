const $config = argsify($config_str)
const cheerio = createCheerio()
const CryptoJS = createCryptoJS()

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const headers = {
	'User-Agent': UA,
}

const ALL_SOURCES = [
	{ id: 'netease', name: '网易' },
	{ id: 'kuwo', name: '酷我' },
	{ id: 'joox', name: 'JOOX' },
	{ id: 'tencent', name: 'QQ' },
	{ id: 'bilibili', name: 'b站' },
	//{ id: 'tidal', name: 'Tidal' },
	//{ id: 'spotify', name: 'Spotify' },
	//{ id: 'ytmusic', name: 'YouTube' },
	//{ id: 'qobuz', name: 'Qobuz' },
	//{ id: 'deezer', name: 'Deezer' },
	//{ id: 'migu', name: '咪咕' },
	//{ id: 'kugou', name: '酷狗' },
	//{ id: 'ximalaya', name: '喜马拉雅' },
	//{ id: 'apple', name: 'Apple' }
]

!(function (n) {
	'use strict'
	function _0x116c6g(n, t) {
		var _0x7eafe = (907513 ^ 907517) + (441961 ^ 441966)
		var r = ((81144 ^ 115463) & n) + ((168481 ^ 159198) & t)
		_0x7eafe = (434124 ^ 434121) + (652502 ^ 652497)
		return (
			(((n >> (786451 ^ 786435)) +
				(t >> (296638 ^ 296622)) +
				(r >> (393542 ^ 393558))) <<
				(876669 ^ 876653)) |
			((184802 ^ 142877) & r)
		)
	}
	function _0x56ac7c(n, t, r, e, o, u) {
		return _0x116c6g(
			((u = _0x116c6g(_0x116c6g(t, n), _0x116c6g(e, u))) << o) |
				(u >>> ((459493 ^ 459461) - o)),
			r
		)
	}
	function _0x1c64f(n, t, r, e, o, u, c) {
		return _0x56ac7c((t & r) | (~t & e), n, t, o, u, c)
	}
	function _0xfb_0x5f5(n, t, r, e, o, u, c) {
		return _0x56ac7c((t & e) | (r & ~e), n, t, o, u, c)
	}
	function _0xd_0x5e9(n, t, r, e, o, u, c) {
		return _0x56ac7c(t ^ r ^ e, n, t, o, u, c)
	}
	function _0xge8d(n, t, r, e, o, u, c) {
		return _0x56ac7c(r ^ (t | ~e), n, t, o, u, c)
	}
	function c(n, t) {
		var r, e, o, u
		;(n[t >> (593882 ^ 593887)] |=
			(153886 ^ 154014) << t % (296523 ^ 296555)),
			(n[
				(934620 ^ 934610) +
					(((t + (797509 ^ 797445)) >>> (233967 ^ 233958)) <<
						(838110 ^ 838106))
			] = t)
		for (
			var c = 1732584193,
				f = -271733879,
				i = -1732584194,
				a = 271733878,
				h = 358662 ^ 358662;
			h < n['\u006C\u0065\u006E\u0067\u0074\u0068'];
			h += 556107 ^ 556123
		)
			(c = _0x1c64f(
				(r = c),
				(e = f),
				(o = i),
				(u = a),
				n[h],
				203195 ^ 203196,
				-680876936
			)),
				(a = _0x1c64f(
					a,
					c,
					f,
					i,
					n[h + (668723 ^ 668722)],
					371783 ^ 371787,
					-389564586
				)),
				(i = _0x1c64f(
					i,
					a,
					c,
					f,
					n[h + (949049 ^ 949051)],
					938935 ^ 938918,
					606105819
				)),
				(f = _0x1c64f(
					f,
					i,
					a,
					c,
					n[h + (930796 ^ 930799)],
					155265 ^ 155287,
					-1044525330
				)),
				(c = _0x1c64f(
					c,
					f,
					i,
					a,
					n[h + (641944 ^ 641948)],
					344334 ^ 344329,
					-176418897
				)),
				(a = _0x1c64f(
					a,
					c,
					f,
					i,
					n[h + (431303 ^ 431298)],
					531914 ^ 531910,
					1200080426
				)),
				(i = _0x1c64f(
					i,
					a,
					c,
					f,
					n[h + (507733 ^ 507731)],
					286130 ^ 286115,
					-1473231341
				)),
				(f = _0x1c64f(
					f,
					i,
					a,
					c,
					n[h + (915513 ^ 915518)],
					223744 ^ 223766,
					-45705983
				)),
				(c = _0x1c64f(
					c,
					f,
					i,
					a,
					n[h + (412142 ^ 412134)],
					875728 ^ 875735,
					1770035416
				)),
				(a = _0x1c64f(
					a,
					c,
					f,
					i,
					n[h + (219497 ^ 219488)],
					508069 ^ 508074,
					-1958414417
				)),
				(i = _0x1c64f(
					i,
					a,
					c,
					f,
					n[h + (318384 ^ 318394)],
					283908 ^ 283925,
					-(656920 ^ 696919)
				)),
				(f = _0x1c64f(
					f,
					i,
					a,
					c,
					n[h + (426894 ^ 426885)],
					511658 ^ 511676,
					-1990404162
				)),
				(c = _0x1c64f(
					c,
					f,
					i,
					a,
					n[h + (337386 ^ 337382)],
					703997 ^ 703994,
					1804603682
				)),
				(a = _0x1c64f(
					a,
					c,
					f,
					i,
					n[h + (868334 ^ 868323)],
					167771 ^ 167767,
					-40341101
				)),
				(i = _0x1c64f(
					i,
					a,
					c,
					f,
					n[h + (437888 ^ 437902)],
					613007 ^ 613022,
					-1502002290
				)),
				(c = _0xfb_0x5f5(
					c,
					(f = _0x1c64f(
						f,
						i,
						a,
						c,
						n[h + (252446 ^ 252433)],
						160598 ^ 160576,
						1236535329
					)),
					i,
					a,
					n[h + (938072 ^ 938073)],
					841271 ^ 841266,
					-165796510
				)),
				(a = _0xfb_0x5f5(
					a,
					c,
					f,
					i,
					n[h + (729061 ^ 729059)],
					340519 ^ 340527,
					-1069501632
				)),
				(i = _0xfb_0x5f5(
					i,
					a,
					c,
					f,
					n[h + (426084 ^ 426095)],
					488481 ^ 488495,
					643717713
				)),
				(f = _0xfb_0x5f5(
					f,
					i,
					a,
					c,
					n[h],
					454780 ^ 454760,
					-373897302
				)),
				(c = _0xfb_0x5f5(
					c,
					f,
					i,
					a,
					n[h + (869090 ^ 869095)],
					753617 ^ 753620,
					-701558691
				)),
				(a = _0xfb_0x5f5(
					a,
					c,
					f,
					i,
					n[h + (511330 ^ 511336)],
					325620 ^ 325629,
					38016083
				)),
				(i = _0xfb_0x5f5(
					i,
					a,
					c,
					f,
					n[h + (422400 ^ 422415)],
					436787 ^ 436797,
					-660478335
				)),
				(f = _0xfb_0x5f5(
					f,
					i,
					a,
					c,
					n[h + (730717 ^ 730713)],
					631499 ^ 631519,
					-405537848
				)),
				(c = _0xfb_0x5f5(
					c,
					f,
					i,
					a,
					n[h + (569928 ^ 569921)],
					345268 ^ 345265,
					568446438
				)),
				(a = _0xfb_0x5f5(
					a,
					c,
					f,
					i,
					n[h + (976674 ^ 976684)],
					915924 ^ 915933,
					-1019803690
				)),
				(i = _0xfb_0x5f5(
					i,
					a,
					c,
					f,
					n[h + (483370 ^ 483369)],
					118410 ^ 118404,
					-187363961
				)),
				(f = _0xfb_0x5f5(
					f,
					i,
					a,
					c,
					n[h + (331905 ^ 331913)],
					296287 ^ 296267,
					1163531501
				)),
				(c = _0xfb_0x5f5(
					c,
					f,
					i,
					a,
					n[h + (205920 ^ 205933)],
					845245 ^ 845240,
					-1444681467
				)),
				(a = _0xfb_0x5f5(
					a,
					c,
					f,
					i,
					n[h + (394678 ^ 394676)],
					519578 ^ 519571,
					-51403784
				)),
				(i = _0xfb_0x5f5(
					i,
					a,
					c,
					f,
					n[h + (716049 ^ 716054)],
					828862 ^ 828848,
					1735328473
				)),
				(c = _0xd_0x5e9(
					c,
					(f = _0xfb_0x5f5(
						f,
						i,
						a,
						c,
						n[h + (611289 ^ 611285)],
						380507 ^ 380495,
						-1926607734
					)),
					i,
					a,
					n[h + (952986 ^ 952991)],
					649350 ^ 649346,
					-378558
				)),
				(a = _0xd_0x5e9(
					a,
					c,
					f,
					i,
					n[h + (931855 ^ 931847)],
					649199 ^ 649188,
					-2022574463
				)),
				(i = _0xd_0x5e9(
					i,
					a,
					c,
					f,
					n[h + (824364 ^ 824359)],
					731251 ^ 731235,
					1839030562
				)),
				(f = _0xd_0x5e9(
					f,
					i,
					a,
					c,
					n[h + (735313 ^ 735327)],
					832357 ^ 832370,
					-35309556
				)),
				(c = _0xd_0x5e9(
					c,
					f,
					i,
					a,
					n[h + (715041 ^ 715040)],
					668616 ^ 668620,
					-1530992060
				)),
				(a = _0xd_0x5e9(
					a,
					c,
					f,
					i,
					n[h + (103314 ^ 103318)],
					312171 ^ 312160,
					1272893353
				)),
				(i = _0xd_0x5e9(
					i,
					a,
					c,
					f,
					n[h + (101467 ^ 101468)],
					444248 ^ 444232,
					-155497632
				)),
				(f = _0xd_0x5e9(
					f,
					i,
					a,
					c,
					n[h + (884303 ^ 884293)],
					177582 ^ 177593,
					-1094730640
				)),
				(c = _0xd_0x5e9(
					c,
					f,
					i,
					a,
					n[h + (641499 ^ 641494)],
					808818 ^ 808822,
					681279174
				)),
				(a = _0xd_0x5e9(a, c, f, i, n[h], 718981 ^ 718990, -358537222)),
				(i = _0xd_0x5e9(
					i,
					a,
					c,
					f,
					n[h + (367825 ^ 367826)],
					170342 ^ 170358,
					-722521979
				)),
				(f = _0xd_0x5e9(
					f,
					i,
					a,
					c,
					n[h + (838503 ^ 838497)],
					968360 ^ 968383,
					76029189
				)),
				(c = _0xd_0x5e9(
					c,
					f,
					i,
					a,
					n[h + (908418 ^ 908427)],
					607083 ^ 607087,
					-640364487
				)),
				(a = _0xd_0x5e9(
					a,
					c,
					f,
					i,
					n[h + (258045 ^ 258033)],
					740678 ^ 740685,
					-421815835
				)),
				(i = _0xd_0x5e9(
					i,
					a,
					c,
					f,
					n[h + (375201 ^ 375214)],
					713066 ^ 713082,
					530742520
				)),
				(c = _0xge8d(
					c,
					(f = _0xd_0x5e9(
						f,
						i,
						a,
						c,
						n[h + (640770 ^ 640768)],
						598057 ^ 598078,
						-995338651
					)),
					i,
					a,
					n[h],
					184424 ^ 184430,
					-198630844
				)),
				(a = _0xge8d(
					a,
					c,
					f,
					i,
					n[h + (117062 ^ 117057)],
					272072 ^ 272066,
					1126891415
				)),
				(i = _0xge8d(
					i,
					a,
					c,
					f,
					n[h + (101517 ^ 101507)],
					474789 ^ 474794,
					-1416354905
				)),
				(f = _0xge8d(
					f,
					i,
					a,
					c,
					n[h + (481168 ^ 481173)],
					284190 ^ 284171,
					-57434055
				)),
				(c = _0xge8d(
					c,
					f,
					i,
					a,
					n[h + (963513 ^ 963509)],
					782784 ^ 782790,
					1700485571
				)),
				(a = _0xge8d(
					a,
					c,
					f,
					i,
					n[h + (552248 ^ 552251)],
					632946 ^ 632952,
					-1894986606
				)),
				(i = _0xge8d(
					i,
					a,
					c,
					f,
					n[h + (572015 ^ 572005)],
					274813 ^ 274802,
					-1051523
				)),
				(f = _0xge8d(
					f,
					i,
					a,
					c,
					n[h + (870735 ^ 870734)],
					725173 ^ 725152,
					-2054922799
				)),
				(c = _0xge8d(
					c,
					f,
					i,
					a,
					n[h + (671801 ^ 671793)],
					929882 ^ 929884,
					1873313359
				)),
				(a = _0xge8d(
					a,
					c,
					f,
					i,
					n[h + (586039 ^ 586040)],
					167396 ^ 167406,
					-30611744
				)),
				(i = _0xge8d(
					i,
					a,
					c,
					f,
					n[h + (140557 ^ 140555)],
					563789 ^ 563778,
					-1560198380
				)),
				(f = _0xge8d(
					f,
					i,
					a,
					c,
					n[h + (249727 ^ 249714)],
					284711 ^ 284722,
					1309151649
				)),
				(c = _0xge8d(
					c,
					f,
					i,
					a,
					n[h + (301693 ^ 301689)],
					974141 ^ 974139,
					-145523070
				)),
				(a = _0xge8d(
					a,
					c,
					f,
					i,
					n[h + (499061 ^ 499070)],
					381725 ^ 381719,
					-1120210379
				)),
				(i = _0xge8d(
					i,
					a,
					c,
					f,
					n[h + (157228 ^ 157230)],
					991419 ^ 991412,
					718787259
				)),
				(f = _0xge8d(
					f,
					i,
					a,
					c,
					n[h + (956698 ^ 956691)],
					529761 ^ 529780,
					-343485551
				)),
				(c = _0x116c6g(c, r)),
				(f = _0x116c6g(f, e)),
				(i = _0x116c6g(i, o)),
				(a = _0x116c6g(a, u))
		return [c, f, i, a]
	}
	function _0x77f8c(n) {
		for (
			var t = '',
				r =
					(788838 ^ 788806) *
					n['\u006C\u0065\u006E\u0067\u0074\u0068'],
				e = 897385 ^ 897385;
			e < r;
			e += 823433 ^ 823425
		)
			t += String[
				'\u0066\u0072\u006F\u006D\u0043\u0068\u0061\u0072\u0043\u006F\u0064\u0065'
			](
				(n[e >> (276380 ^ 276377)] >>> e % (477668 ^ 477636)) &
					(116135 ^ 116056)
			)
		return t
	}
	function _0x4cbe4f(n) {
		var _0x_0x9c8
		var t = []
		_0x_0x9c8 = 243631 ^ 243624
		for (
			t[
				(n['\u006C\u0065\u006E\u0067\u0074\u0068'] >>
					(431982 ^ 431980)) -
					(502514 ^ 502515)
			] = void (398355 ^ 398355),
				e = 987172 ^ 987172;
			e < t['\u006C\u0065\u006E\u0067\u0074\u0068'];
			e += 549036 ^ 549037
		)
			t[e] = 194263 ^ 194263
		for (
			var r =
					(442162 ^ 442170) *
					n['\u006C\u0065\u006E\u0067\u0074\u0068'],
				e = 281249 ^ 281249;
			e < r;
			e += 321446 ^ 321454
		)
			t[e >> (287797 ^ 287792)] |=
				((774133 ^ 773898) &
					n[
						'\u0063\u0068\u0061\u0072\u0043\u006F\u0064\u0065\u0041\u0074'
					](e / (510838 ^ 510846))) <<
				e % (556650 ^ 556618)
		return t
	}
	function e(n) {
		for (
			var t,
				r =
					'\u0030\u0031\u0032\u0033\u0034\u0035\u0036\u0037\u0038\u0039\u0061\u0062\u0063\u0064\u0065\u0066',
				e = '',
				o = 591987 ^ 591987;
			o < n['\u006C\u0065\u006E\u0067\u0074\u0068'];
			o += 704728 ^ 704729
		)
			(t =
				n[
					'\u0063\u0068\u0061\u0072\u0043\u006F\u0064\u0065\u0041\u0074'
				](o)),
				(e +=
					r['\u0063\u0068\u0061\u0072\u0041\u0074'](
						(t >>> (156221 ^ 156217)) & (768092 ^ 768083)
					) +
					r['\u0063\u0068\u0061\u0072\u0041\u0074'](
						(489029 ^ 489034) & t
					))
		return e
	}
	function _0xddd4fg(n) {
		return unescape(encodeURIComponent(n))
	}
	function _0x04461d(n) {
		return _0x77f8c(
			c(
				_0x4cbe4f((n = _0xddd4fg(n))),
				(969332 ^ 969340) * n['\u006C\u0065\u006E\u0067\u0074\u0068']
			)
		)
	}
	function _0xa7cfg(n, t) {
		return (function (n, t) {
			var r,
				e = _0x4cbe4f(n),
				o = [],
				u = []
			for (
				o[938141 ^ 938130] = u[132587 ^ 132580] =
					void (698490 ^ 698490),
					(478722 ^ 478738) <
						e['\u006C\u0065\u006E\u0067\u0074\u0068'] &&
						(e = c(
							e,
							(448963 ^ 448971) *
								n['\u006C\u0065\u006E\u0067\u0074\u0068']
						)),
					r = 354231 ^ 354231;
				r < (547489 ^ 547505);
				r += 113715 ^ 113714
			)
				(o[r] = 909522486 ^ e[r]), (u[r] = 1549556828 ^ e[r])
			return (
				(t = c(
					o['\u0063\u006F\u006E\u0063\u0061\u0074'](_0x4cbe4f(t)),
					(437550 ^ 438062) +
						(406556 ^ 406548) *
							t['\u006C\u0065\u006E\u0067\u0074\u0068']
				)),
				_0x77f8c(
					c(
						u['\u0063\u006F\u006E\u0063\u0061\u0074'](t),
						784180 ^ 783796
					)
				)
			)
		})(_0xddd4fg(n), _0xddd4fg(t))
	}
	function t(n, t, r) {
		return t
			? r
				? _0xa7cfg(t, n)
				: e(_0xa7cfg(t, n))
			: r
			? _0x04461d(n)
			: e(_0x04461d(n))
	}
	'\u0066\u0075\u006E\u0063\u0074\u0069\u006F\u006E' == typeof define &&
	define['\u0061\u006D\u0064']
		? define(function () {
				return t
		  })
		: '\u006F\u0062\u006A\u0065\u0063\u0074' == typeof module &&
		  module['\u0065\u0078\u0070\u006F\u0072\u0074\u0073']
		? (module['\u0065\u0078\u0070\u006F\u0072\u0074\u0073'] = t)
		: (n['\u006D\u0064\u0035'] = t)
})(this)

function crc32(id) {
	const mkPlayer = {
		version: '1.0.0'
	};
	
	if (!id) return '';
	
	const hostname = 'music.gdstudio.xyz';
	const version = mkPlayer.version || '1.0.0';
	const versionStr = version.split('.').map(part => {
		return part.length === 1 ? '0' + part : part;
	}).join('');
	
	const timestamp = Date.now();
	const timeStr = timestamp.toString().slice(0, 9);
	
	const signStr = hostname + '|' + versionStr + '|' + timeStr + '|' + id;
	const md5Hash = md5(signStr);
	
	return md5Hash.slice(-8).toUpperCase();
}

function urlEncode(str) {
	return encodeURIComponent(str).replace(/%20/g, '+');
}

const apis = {
	lo: 'https://music-api.gdstudio.xyz/api.php',
	cn: 'https://music-api-cn.gdstudio.xyz/api.php',
	hk: 'https://music-api-hk.gdstudio.xyz/api.php',
	us: 'https://music-api-us.gdstudio.xyz/api.php',
}

function sourceNode(source) {
	const mapping = {
		kuwo: 'lo',
		tencent: 'lo',
		migu: 'cn',
		kugou: 'cn',
		ximalaya: 'cn',
		joox: 'hk',
		qobuz: 'us',
		ytmusic: 'us',
		tidal: 'us',
		spotify: 'us',
		deezer: 'us',
		apple: 'us'
	};
	
	source = source.replace('_album', '');
	const node = mapping[source] || 'lo';
	return node;
}

const appConfig = {
	ver: 1,
	name: 'GD音乐',
	message: '基于GD Studio音乐API',
	warning: '基于GD音乐台API(music.gdstudio.xyz)制作\n⚠️仅供学习参考，请勿商用',
	desc: '',
	tabLibrary: {
		name: '探索',
		groups: [
			{
				name: '热门歌曲',
				type: 'song',
				ui: 0,
				showMore: true,
				ext: {
					gid: 'hot',
					source: 'netease',
					keyword: '热门歌曲'
				},
			},
			{
				name: '新歌推荐',
				type: 'song',
				ui: 0,
				showMore: true,
				ext: {
					gid: 'new',
					source: 'netease',
					keyword: '新歌'
				},
			},
			{
				name: '华语流行',
				type: 'song',
				ui: 0,
				showMore: true,
				ext: {
					gid: 'chinese',
					source: 'netease',
					keyword: '华语流行'
				},
			},
			{
				name: '欧美音乐',
				type: 'song',
				ui: 0,
				showMore: true,
				ext: {
					gid: 'western',
					source: 'netease',
					keyword: '欧美流行'
				},
			},
			{
				name: 'J-pop',
				type: 'song',
				ui: 0,
				showMore: true,
				ext: {
					gid: 'japanese',
					source: 'netease',
					keyword: '日语流行'
				},
			},
			{
				name: '排行榜',
				type: 'playlist',
				ui: 1,
				showMore: true,
				ext: {
					gid: 'qq_toplist'
				}
			},
			{
				name: '创作者',
				type: 'artist',
				ui: 0,
				showMore: true,
				ext: {
					gid: 'artists',
					source: 'tencent'
				},
			},
			{
				name: 'VOCALOID·UTAU',
				type: 'song',
				ui: 0,
				showMore: true,
				ext: {
					gid: 'bilibili_30',
					rid: 30
				}
			},
			{
				name: '演奏',
				type: 'song',
				ui: 0,
				showMore: true,
				ext: {
					gid: 'bilibili_59',
					rid: 59
				}
			},
			{
				name: 'MV',
				type: 'song',
				ui: 0,
				showMore: true,
				ext: {
					gid: 'bilibili_193',
					rid: 193
				}
			},
			{
				name: '音乐综合',
				type: 'song',
				ui: 0,
				showMore: true,
				ext: {
					gid: 'bilibili_130',
					rid: 130
				}
			}
		],
	},
	tabMe: {
		name: '我的',
		groups: [{
			name: '红心',
			type: 'song'
		}, {
			name: '歌单',
			type: 'playlist'
		}, {
			name: '创作者',
			type: 'artist'
		}]
	},
	tabSearch: {
		name: '搜索',
		groups: [
			{
				name: 'QQ',
				type: 'song',
				ext: {
					type: 'song'
				}
			},
			{
				name: 'b站',
				type: 'song',
				ext: {
					type: 'song',
					source: 'bilibili'
				}
			}
		].concat(ALL_SOURCES.filter(source => 
			source.id !== 'tencent' && source.id !== 'bilibili'
		).map(source => ({
			name: source.name,
			type: 'song',
			ext: {
				type: 'song',
				source: source.id
			},
		})))
	}
}

async function getConfig() {
	return jsonify(appConfig)
}

async function getCoverUrl(pic_id, source = 'netease') {
	if (!pic_id) {
		return 'https://music.gdstudio.xyz/favicon.ico'
	}
	
	try {
		const signature = crc32(urlEncode(pic_id));
		const node = sourceNode(source);
		const coverApiUrl = `${apis[node]}?types=pic&source=${source}&id=${pic_id}&size=300&s=${signature}`
		
		const { data } = await $fetch.get(coverApiUrl, { headers })
		
		let result
		if (typeof data === 'string') {
			try {
				result = JSON.parse(data)
			} catch(e) {
				return 'https://music.gdstudio.xyz/favicon.ico'
			}
		} else {
			result = data
		}
		
		if (result && result.url) {
			return result.url
		}
	} catch (error) {
	}
	
	return 'https://music.gdstudio.xyz/favicon.ico'
}

async function getArtists(ext) {
	const { page = 1, gid, source = 'tencent', from } = argsify(ext)
	let artists = []
	
	if (gid !== 'artists' && from !== 'me') {
		return jsonify({ list: [] })
	}
	
	try {
		if (from === 'me') {
			return jsonify({
				list: artists,
			})
		}
		
		const url = 'https://y.qq.com/n/ryqq/singer_list'
		const { data } = await $fetch.get(url, { headers })
		
		const $ = cheerio.load(data)
		
		$('li.singer_list__item').each((index, element) => {
			const $item = $(element)
			const link = $item.find('a').attr('href')
			const name = $item.find('a').attr('title')
			
			if (link && name) {
				const match = link.match(/singer\/(\d+)/)
				if (match) {
					const artistId = match[1]
					const cover = `https://y.qq.com/music/photo_new/T001R500x500M000${artistId}.jpg`
					
					artists.push({
						id: artistId,
						name: name,
						cover: cover,
						groups: [{
							name: '热门歌曲',
							type: 'song',
							ext: {
								gid: 'artist_songs',
								source: source,
								artist_name: name
							}
						}]
					})
				}
			}
		})
		
		$('li.singer_list_txt__item').each((index, element) => {
			const $item = $(element)
			const link = $item.find('a').attr('href')
			const name = $item.find('a').attr('title') || $item.find('a').text().trim()
			
			if (link && name) {
				let artistId = 'unknown'
				const match1 = link.match(/singer\/(\d+)/)
				const match2 = link.match(/singer\/([^\/]+)$/)
				
				if (match1) {
					artistId = match1[1]
				} else if (match2) {
					artistId = match2[1]
				}
				
				const cover = artistId !== 'unknown' ? `https://y.qq.com/music/photo_new/T001R500x500M000${artistId}.jpg` : 'https://music.gdstudio.xyz/favicon.ico'
				
				if (!artists.some(a => a.name === name)) {
					artists.push({
						id: artistId,
						name: name,
						cover: cover,
						groups: [{
							name: '热门歌曲',
							type: 'song',
							ext: {
								gid: 'artist_songs',
								source: source,
								artist_name: name
							}
						}]
					})
				}
			}
		})
		
		const uniqueArtists = []
		const seenNames = new Set()
		
		for (const artist of artists) {
			if (!seenNames.has(artist.name)) {
				seenNames.add(artist.name)
				uniqueArtists.push(artist)
			}
		}
		
		artists = uniqueArtists
		
		return jsonify({
			list: artists,
		})
		
	} catch (error) {
		return jsonify({
			list: [],
		})
	}
}

async function searchSource(text, source, page = 1, count = 20) {
	let songs = []
	
	if (source === 'tencent') {
		try {
			const searchUrl = `http://c.y.qq.com/soso/fcgi-bin/client_search_cp?new_json=1&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=${page}&n=${count}&w=${encodeURIComponent(text)}&needNewCode=0`
			const { data } = await $fetch.get(searchUrl, { headers })
			
			let result
			if (typeof data === 'string') {
				try {
					result = JSON.parse(data.slice(9, -1))
				} catch(e) {
					return songs
				}
			} else {
				result = data
			}
			
			if (result && result.data && result.data.song && result.data.song.list) {
				result.data.song.list.forEach((each, i) => {
					if (i < count) {
						songs.push({
							id: `${each.mid}`,
							name: each.name,
							cover: `https://y.gtimg.cn/music/photo_new/T002R800x800M000${each.album.mid}.jpg`,
							duration: each.interval || 0,
							artist: {
								id: `${each.singer[0]?.id}`,
								name: each.singer[0]?.name || '未知歌手',
								cover: each.singer[0]?.mid ? `https://y.qq.com/music/photo_new/T001R500x500M000${each.singer[0].mid}.jpg` : ''
							},
							ext: {
								qid: each.mid,
								source: 'tencent'
							}
						})
					}
				})
			}
		} catch (error) {
		}
	} else if (source === 'bilibili') {
		const isBvId = text.startsWith('BV') || /^[A-Za-z0-9]{10,12}$/.test(text)
		const isAvId = text.toLowerCase().startsWith('av') || /^\d+$/.test(text)
		
		if (isBvId || isAvId) {
			try {
				let videoInfo = null
				if (isBvId) {
					const bvid = text.startsWith('BV') ? text : `BV${text}`
					videoInfo = await getBilibiliVideoInfo(null, bvid)
				} else if (isAvId) {
					const aid = text.toLowerCase().startsWith('av') ? text.substring(2) : text
					videoInfo = await getBilibiliVideoInfo(aid, null)
				}
				
				if (videoInfo) {
					let duration = videoInfo.duration || 0
					
					songs.push({
						id: `${videoInfo.aid}`,
						name: videoInfo.title,
						cover: videoInfo.pic || 'https://music.gdstudio.xyz/favicon.ico',
						duration: duration,
						artist: {
							id: `${videoInfo.owner?.mid}`,
							name: videoInfo.owner?.name || '未知作者',
							cover: videoInfo.owner?.face || ''
						},
						ext: {
							aid: videoInfo.aid,
							bvid: videoInfo.bvid,
							source: 'bilibili'
						}
					})
				}
			} catch (error) {
			}
		} else {
			try {
				const { img_key, sub_key } = await getWbiKeys()
				
				const params = {
					keyword: text,
					page: page
				}
				
				const query = encWbi(params, img_key, sub_key)
				const { data } = await $fetch.get(`https://api.bilibili.com/x/web-interface/wbi/search/all/v2?${query}`, {
					headers: {
						...headers,
						'Referer': 'https://www.bilibili.com/',
						'Origin': 'https://www.bilibili.com'
					}
				})
				
				let result
				if (typeof data === 'string') {
					try {
						result = JSON.parse(data)
					} catch(e) {
						return songs
					}
				} else {
					result = data
				}
				
				if (result && result.code === 0 && result.data && result.data.result) {
					result.data.result.forEach((each) => {
						if (each?.result_type === 'video') {
							each?.data.forEach((item) => {
								if (songs.length < count) {
									let duration = 0
									if (item.duration) {
										const timeParts = item.duration.split(':')
										if (timeParts.length === 2) {
											duration = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1])
										} else if (timeParts.length === 3) {
											duration = parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60 + parseInt(timeParts[2])
										}
									}
									
									const cover = item.pic ? (item.pic.startsWith('http') ? item.pic : 'https:' + item.pic) : 'https://music.gdstudio.xyz/favicon.ico'
									
									songs.push({
										id: `${item.aid}`,
										name: item.title.replace(/<[^>]*>/g, ''),
										cover: cover,
										duration: duration,
										artist: {
											id: `${item.mid}`,
											name: item.author,
											cover: item.upic || ''
										},
										ext: {
											aid: item.aid,
											bvid: item.bvid,
											source: 'bilibili'
										}
									})
								}
							})
						}
					})
				}
			} catch (error) {
			}
		}
	} else {
		try {
			const signature = crc32(text);
			const node = sourceNode(source);
			const searchUrl = `${apis[node]}?types=search&source=${source}&name=${encodeURIComponent(text)}&count=${count}&pages=${page}&s=${signature}`
			const { data } = await $fetch.get(searchUrl, { headers })
			
			let result
			if (typeof data === 'string') {
				try {
					result = JSON.parse(data)
				} catch(e) {
					return songs
				}
			} else {
				result = data
			}
			
			let searchResults = []
			
			if (Array.isArray(result)) {
				searchResults = result.slice(0, count)
			} else if (result && result.data && Array.isArray(result.data)) {
				searchResults = result.data.slice(0, count)
			}
			
			const coverPromises = searchResults.map(async (item, index) => {
				try {
					let coverUrl = 'https://music.gdstudio.xyz/favicon.ico'
					if (item.pic_id) {
						coverUrl = await getCoverUrl(item.pic_id, item.source || source)
					}
					return { index, coverUrl, success: true }
				} catch (error) {
					return { index, coverUrl: 'https://music.gdstudio.xyz/favicon.ico', success: false }
				}
			})
			
			const coverResults = await Promise.allSettled(coverPromises)
			const coverMap = {}
			
			coverResults.forEach(result => {
				if (result.status === 'fulfilled') {
					const { index, coverUrl } = result.value
					coverMap[index] = coverUrl
				}
			})
			
			for (let i = 0; i < searchResults.length; i++) {
				const item = searchResults[i]
				
				let artistName = '未知歌手'
				let artistId = 'unknown'
				
				if (item.artist) {
					if (Array.isArray(item.artist)) {
						artistName = item.artist.join(' / ')
						artistId = item.artist[0] || 'unknown'
					} else {
						artistName = item.artist
						artistId = item.artist
					}
				}
				
				const coverUrl = coverMap[i] || 'https://music.gdstudio.xyz/favicon.ico'
				
				songs.push({
					id: `${item.source || source}_${item.id || i}`,
					name: item.name || '未知歌曲',
					cover: coverUrl,
					duration: item.duration || 0,
					artist: {
						id: artistId,
						name: artistName
					},
					ext: {
						track_id: item.id ? String(item.id) : '',
						source: item.source || source,
						pic_id: item.pic_id || ''
					}
				})
			}
		} catch (error) {
		}
	}
	
	return songs
}

async function getSongs(ext) {
	const { page = 1, gid, text, keyword, source = 'netease', count = 20, artist_name, rid, id, period } = argsify(ext)
	let songs = []
	
	if (gid && gid.startsWith('bilibili_')) {
		const bilibiliRid = rid || parseInt(gid.split('_')[1])
		const { data } = await $fetch.get(`https://api.bilibili.com/x/web-interface/dynamic/region?ps=${count}&pn=${page}&rid=${bilibiliRid}`, {
			headers: {
				...headers,
				'Referer': 'https://www.bilibili.com/',
				'Origin': 'https://www.bilibili.com'
			}
		})
		
		let result
		if (typeof data === 'string') {
			try {
				result = JSON.parse(data)
			} catch(e) {
				return jsonify({ list: songs })
			}
		} else {
			result = data
		}
		
		if (result && result.data && result.data.archives) {
			result.data.archives.forEach(each => {
				songs.push({
					id: `${each.aid}`,
					name: each.title,
					cover: each.pic || 'https://music.gdstudio.xyz/favicon.ico',
					duration: each.duration,
					artist: {
						id: `${each.owner.mid}`,
						name: each.owner.name,
						cover: each.owner.face,
					},
					ext: {
						aid: each.aid,
						cid: each.cid,
						bvid: each.bvid,
						source: 'bilibili'
					}
				})
			})
		}
		
		return jsonify({
			list: songs,
		})
	}
	
	if (gid === 'qq_toplist' && id) {
		if (page > 1) {
			return jsonify({
				list: [],
			})
		}
		
		try {
			const url = `https://u.y.qq.com/cgi-bin/musicu.fcg?g_tk=5381&data=%7B%22detail%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetDetail%22%2C%22param%22%3A%7B%22topId%22%3A${id}%2C%22offset%22%3A0%2C%22num%22%3A100%2C%22period%22%3A%22${period || ''}%22%7D%7D%2C%22comm%22%3A%7B%22ct%22%3A24%2C%22cv%22%3A0%7D%7D`
			const { data } = await $fetch.get(url, {
				headers: {
					...headers,
					Cookie: 'uin=',
				}
			})
			
			let result
			if (typeof data === 'string') {
				try {
					result = JSON.parse(data)
				} catch(e) {
					return jsonify({ list: songs })
				}
			} else {
				result = data
			}
			
			if (result && result.detail && result.detail.data && result.detail.data.songInfoList) {
				result.detail.data.songInfoList.forEach((e) => {
					songs.push({
						id: e.mid,
						name: e.name,
						cover: e?.album?.mid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${e.album.mid}.jpg` : '',
						duration: e.interval || 0,
						artist: {
							id: e.singer[0]?.mid || '',
							name: e.singer[0]?.name || '未知歌手',
							cover: '',
						},
						ext: {
							qid: e.mid,
							source: 'tencent'
						}
					})
				})
			}
		} catch (error) {
		}
		
		return jsonify({
			list: songs,
		})
	}
	
	let searchText = text || keyword || '热门歌曲'
	
	if (gid === 'artist_songs' && artist_name) {
		searchText = artist_name
	}
	
	songs = await searchSource(searchText, source, page, count)
	
	return jsonify({
		list: songs,
	})
}

async function getPlaylists(ext) {
	const { page, gid, from } = argsify(ext)
	if (page > 1) {
		return jsonify({
			list: [],
		})
	}
	
	let cards = []
	
	if (gid == 'qq_toplist') {
		try {
			const { data } = await $fetch.get(
				'https://u.y.qq.com/cgi-bin/musicu.fcg?_=1577086820633&data=%7B%22comm%22%3A%7B%22g_tk%22%3A5381%2C%22uin%22%3A123456%2C%22format%22%3A%22json%22%2C%22inCharset%22%3A%22utf-8%22%2C%22outCharset%22%3A%22utf-8%22%2C%22notice%22%3A0%2C%22platform%22%3A%22h5%22%2C%22needNewCode%22%3A1%2C%22ct%22%3A23%2C%22cv%22%3A0%7D%2C%22topList%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetAll%22%2C%22param%22%3A%7B%7D%7D%7D',
				{
					headers: {
						...headers,
						Cookie: 'uin=',
					}
				}
			)
			
			let result
			if (typeof data === 'string') {
				try {
					result = JSON.parse(data)
				} catch(e) {
					return jsonify({ list: cards })
				}
			} else {
				result = data
			}
			
			if (result && result.topList && result.topList.data && result.topList.data.group) {
				result.topList.data.group.forEach((each) => {
					each.toplist.forEach((e) => {
						if (e.title === 'MV榜') {
							return
						}
						cards.push({
							id: `${e.topId}`,
							name: e.title,
							cover: e.headPicUrl || e.frontPicUrl,
							artist: {
								id: 'qq',
								name: 'QQ音乐',
							},
							ext: {
								gid: 'qq_toplist',
								id: `${e.topId}`,
								type: 'toplist',
								period: e.period,
							},
						})
					})
				})
			}
		} catch (error) {
		}
	}
	
	return jsonify({
		list: cards
	})
}

async function getAlbums(ext) {
	return jsonify({ list: [] })
}

async function search(ext) {
	const { text, page = 1, type, source } = argsify(ext)
	
	if (!text) {
		return jsonify({ list: [] })
	}
	
	if (type === 'song') {
		const songs = await searchSource(text, source || 'tencent', page, 20)
		return jsonify({
			list: songs,
		})
	}
	
	return jsonify({ list: [] })
}

async function getSongInfo(ext) {
	const { track_id, source = 'netease', pic_id, qid, aid, cid, bvid } = argsify(ext)
	
	const qqMusicId = qid || track_id
	
	if (source === 'tencent' && qqMusicId) {
		try {
			const apiUrl = `https://lxmusicapi.onrender.com/url/tx/${qqMusicId}/320k`
			const { data } = await $fetch.get(apiUrl, {
				headers: {
					'X-Request-Key': 'share-v2',
					'User-Agent': UA
				}
			})
			
			let result
			if (typeof data === 'string') {
				try {
					result = JSON.parse(data)
				} catch(e) {
					result = null
				}
			} else {
				result = data
			}
			
			let playUrl = ''
			if (result && result.url) {
				playUrl = result.url
			}
			
			let coverUrl = 'https://music.gdstudio.xyz/favicon.ico'
			if (pic_id) {
				coverUrl = await getCoverUrl(pic_id, source)
			} else if (qqMusicId) {
				coverUrl = `https://y.gtimg.cn/music/photo_new/T002R800x800M000${qqMusicId}.jpg`
			}
			
			return jsonify({
				urls: playUrl ? [playUrl] : [],
				headers: [{
					'User-Agent': UA,
					'Referer': 'https://y.qq.com/'
				}],
				cover: coverUrl
			})
			
		} catch (error) {
			return await getBackupSongInfo(source, qqMusicId, pic_id)
		}
	} else if (source === 'bilibili') {
		let bilibiliAid = aid
		let bilibiliCid = cid
		let bilibiliBvid = bvid
		
		if (!bilibiliCid && !bilibiliBvid && !bilibiliAid) {
			return jsonify({ urls: [] })
		}
		
		try {
			let coverUrl = 'https://music.gdstudio.xyz/favicon.ico'
			let videoInfo = null
			
			if (bilibiliBvid) {
				videoInfo = await getBilibiliVideoInfo(null, bilibiliBvid)
			} else if (bilibiliAid) {
				videoInfo = await getBilibiliVideoInfo(bilibiliAid, null)
			}
			
			if (videoInfo) {
				coverUrl = videoInfo.pic || 'https://music.gdstudio.xyz/favicon.ico'
				
				if (!bilibiliCid) {
					bilibiliCid = videoInfo.cid || videoInfo.pages?.[0]?.cid
				}
				if (!bilibiliAid) {
					bilibiliAid = videoInfo.aid
				}
				if (!bilibiliBvid && videoInfo.bvid) {
					bilibiliBvid = videoInfo.bvid
				}
			}
			
			if (!bilibiliCid) {
				return jsonify({ urls: [] })
			}
			
			try {
				const { img_key, sub_key } = await getWbiKeys()
				const params = {
					avid: bilibiliAid,
					cid: bilibiliCid,
					qn: 16,
					fnval: 16,
					fnver: 0,
					fourk: 0
				}
				
				const query = encWbi(params, img_key, sub_key)
				const { data } = await $fetch.get(`https://api.bilibili.com/x/player/wbi/playurl?${query}`, {
					headers: {
						...headers,
						'Referer': 'https://www.bilibili.com/',
						'Origin': 'https://www.bilibili.com'
					}
				})
				
				let result
				if (typeof data === 'string') {
					try {
						result = JSON.parse(data)
					} catch(e) {
						result = null
					}
				} else {
					result = data
				}
				
				if (result && result.code === 0 && result.data && result.data.dash && result.data.dash.audio) {
					const audioUrl = result.data.dash.audio[0]?.baseUrl
					if (audioUrl) {
						return jsonify({ 
							urls: [audioUrl], 
							headers: [
								{
									"User-Agent": UA,
									"Referer": `https://www.bilibili.com/video/${bilibiliBvid ? 'BV' + bilibiliBvid : 'av' + bilibiliAid}`,
									"Origin": "https://www.bilibili.com"
								}
							],
							cover: coverUrl
						})
					}
				}
			} catch (error) {
			}
			
			try {
				const params = {
					avid: bilibiliAid,
					cid: bilibiliCid,
					qn: 32,
					fnval: 0,
					fnver: 0,
					fourk: 0
				}
				
				const { data } = await $fetch.get(`https://api.bilibili.com/x/player/playurl?` + dictToURI(params), {
					headers: {
						...headers,
						'Referer': 'https://www.bilibili.com/',
						'Origin': 'https://www.bilibili.com'
					}
				})
				
				let result
				if (typeof data === 'string') {
					try {
						result = JSON.parse(data)
					} catch(e) {
						result = null
					}
				} else {
					result = data
				}
				
				if (result && result.code === 0 && result.data && result.data.durl) {
					const videoUrl = result.data.durl[0]?.url
					if (videoUrl) {
						return jsonify({ 
							urls: [videoUrl], 
							headers: [
								{
									"User-Agent": UA,
									"Referer": `https://www.bilibili.com/video/${bilibiliBvid ? 'BV' + bilibiliBvid : 'av' + bilibiliAid}`,
									"Origin": "https://www.bilibili.com"
								}
							],
							cover: coverUrl
						})
					}
				}
			} catch (error) {
			}
			
			return jsonify({ urls: [], cover: coverUrl })
			
		} catch (error) {
			return jsonify({ urls: [] })
		}
	} else {
		if (!track_id) {
			return jsonify({ 
				urls: []
			})
		}
		
		try {
			const signature = crc32(urlEncode(track_id));
			const node = sourceNode(source);
			const apiUrl = `${apis[node]}?types=url&source=${source}&id=${track_id}&br=999&s=${signature}`
			
			const { data } = await $fetch.get(apiUrl, { headers })
			
			let result
			if (typeof data === 'string') {
				try {
					result = JSON.parse(data)
				} catch(e) {
					result = null
				}
			} else {
				result = data
			}
			
			let playUrl = ''
			if (result && result.url) {
				playUrl = result.url
			} else {
				try {
					const backupUrl = `https://api.injahow.cn/meting/?type=url&id=${track_id}&source=${source}`
					const { data } = await $fetch.get(backupUrl, { 
						headers: {
							'User-Agent': UA,
						}
					})
					
					if (data && data.url) {
						playUrl = data.url
					}
				} catch(e) {
				}
			}
			
			let coverUrl = 'https://music.gdstudio.xyz/favicon.ico'
			if (pic_id) {
				coverUrl = await getCoverUrl(pic_id, source)
			}
			
			return jsonify({
				urls: playUrl ? [playUrl] : [],
				headers: [{
					'User-Agent': UA,
					'Referer': 'https://music.gdstudio.xyz/'
				}],
				cover: coverUrl
			})
			
		} catch (error) {
			return jsonify({ 
				urls: []
			})
		}
	}
}

async function getPlaylistInfo(ext) {
	const { aid, bvid, gid, has_ugc_season, has_multiple_pages } = argsify(ext)
	
	if (gid === '99') {
		try {
			let videoInfo = null
			
			if (bvid) {
				videoInfo = await getBilibiliVideoInfo(null, bvid)
			} else if (aid) {
				videoInfo = await getBilibiliVideoInfo(aid, null)
			}
			
			if (videoInfo) {
				let songs = []
				
				if (videoInfo.ugc_season && videoInfo.ugc_season.id && videoInfo.owner?.mid) {
					try {
						const seasonList = await getBilibiliSeasonArchives(videoInfo.owner.mid, videoInfo.ugc_season.id)
						if (seasonList && seasonList.length > 0) {
							seasonList.forEach(each => {
								songs.push({
									id: `${each.aid}`,
									name: each.title,
									cover: each.pic || videoInfo.pic || 'https://music.gdstudio.xyz/favicon.ico',
									duration: each.duration || 0,
									artist: {
										id: `${videoInfo.owner?.mid}`,
										name: videoInfo.owner?.name || '未知作者',
										cover: videoInfo.owner?.face || ''
									},
									ext: {
										aid: each.aid,
										bvid: each.bvid,
										source: 'bilibili'
									}
								})
							})
							
							return jsonify({
								list: songs
							})
						}
					} catch (error) {
					}
				}
				
				if (videoInfo.ugc_season && videoInfo.ugc_season.sections) {
					videoInfo.ugc_season.sections.forEach(section => {
						if (section.episodes) {
							section.episodes.forEach(each => {
								songs.push({
									id: `${each.cid}`,
									name: each.title || each.arc?.title || '未知标题',
									cover: each.arc?.pic || videoInfo.pic || 'https://music.gdstudio.xyz/favicon.ico',
									duration: each.arc?.duration || 0,
									artist: {
										id: `${videoInfo.owner?.mid}`,
										name: videoInfo.owner?.name || '未知作者',
										cover: videoInfo.owner?.face || ''
									},
									ext: {
										aid: each.aid,
										cid: each.cid,
										bvid: each.bvid,
										source: 'bilibili'
									}
								})
							})
						}
					})
				}
				
				if (songs.length == 0 && videoInfo.pages && videoInfo.pages.length > 1) {
					videoInfo.pages.forEach(each => {
						songs.push({
							id: `${each.cid}`,
							name: each.part || `P${each.page}`,
							cover: each.first_frame || videoInfo.pic || 'https://music.gdstudio.xyz/favicon.ico',
							duration: each.duration || 0,
							artist: {
								id: `${videoInfo.owner?.mid}`,
								name: videoInfo.owner?.name || '未知作者',
								cover: videoInfo.owner?.face || ''
							},
							ext: {
								aid: videoInfo.aid,
								cid: each.cid,
								bvid: videoInfo.bvid,
								source: 'bilibili'
							}
						})
					})
				}
				
				if (songs.length == 0) {
					songs.push({
						id: `${videoInfo.cid}`,
						name: videoInfo.title,
						cover: videoInfo.pic || 'https://music.gdstudio.xyz/favicon.ico',
						duration: videoInfo.duration || 0,
						artist: {
							id: `${videoInfo.owner?.mid}`,
							name: videoInfo.owner?.name || '未知作者',
							cover: videoInfo.owner?.face || ''
						},
						ext: {
							aid: videoInfo.aid,
							cid: videoInfo.cid,
							bvid: videoInfo.bvid,
							source: 'bilibili'
						}
					})
				}
				
				return jsonify({
					list: songs
				})
			}
		} catch (error) {
		}
	}
	
	return jsonify({})
}

async function getAlbumInfo(ext) {
	return jsonify({ list: [] })
}

async function getBackupSongInfo(source, track_id, pic_id) {
	if (!track_id) {
		return jsonify({ 
			urls: []
		})
	}
	
	try {
		const signature = crc32(urlEncode(track_id));
		const node = sourceNode(source);
		const apiUrl = `${apis[node]}?types=url&source=${source}&id=${track_id}&br=999&s=${signature}`
		
		const { data } = await $fetch.get(apiUrl, { headers })
		
		let result
		if (typeof data === 'string') {
			try {
				result = JSON.parse(data)
			} catch(e) {
				result = null
			}
		} else {
			result = data
		}
		
		let playUrl = ''
		if (result && result.url) {
			playUrl = result.url
		} else {
			try {
				const backupUrl = `https://api.injahow.cn/meting/?type=url&id=${track_id}&source=${source}`
				const { data } = await $fetch.get(backupUrl, { 
					headers: {
						'User-Agent': UA,
					}
				})
				
				if (data && data.url) {
					playUrl = data.url
				}
			} catch(e) {
			}
		}
		
		let coverUrl = 'https://music.gdstudio.xyz/favicon.ico'
		if (pic_id) {
			coverUrl = await getCoverUrl(pic_id, source)
		}
		
		return jsonify({
			urls: playUrl ? [playUrl] : [],
			headers: [{
				'User-Agent': UA,
				'Referer': 'https://music.gdstudio.xyz/'
			}],
			cover: coverUrl
		})
		
	} catch (error) {
		return jsonify({ 
			urls: []
		})
	}
}

function dictToURI(dict) {
	var str = [];
	for(var p in dict){
		str.push(encodeURIComponent(p) + "=" + encodeURIComponent(dict[p]));
	}
	return str.join("&");
}

const mixinKeyEncTab = [
	46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
	33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
	61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
	36, 20, 34, 44, 52
]

function getMixinKey(orig) {
	let temp = ''
	mixinKeyEncTab.forEach((n) => {
		temp += orig[n]
	})
	return temp.slice(0, 32)
}

function encWbi(params, imgKey, subKey) {
	const mixinKey = getMixinKey(imgKey + subKey)
	const currTime = Math.round(Date.now() / 1000)
	const chrFilter = /[!'()*]/g
	let query = []
	Object.assign(params, { wts: currTime })
	Object.keys(params).sort().forEach((key) => {
		query.push(
			`${encodeURIComponent(key)}=${encodeURIComponent(
				params[key].toString().replace(chrFilter, '')
			)}`
		)
	})
	query = query.join('&')
	const wbiSign = CryptoJS.MD5(query + mixinKey).toString()
	return query + '&w_rid=' + wbiSign
}

async function getWbiKeys() {
	try {
		const { data } = await $fetch.get('https://api.bilibili.com/x/web-interface/nav', {
			headers: {
				...headers,
				'Referer': 'https://www.bilibili.com/',
				'Origin': 'https://www.bilibili.com'
			}
		})
		
		let result
		if (typeof data === 'string') {
			try {
				result = JSON.parse(data)
			} catch(e) {
				return { img_key: '', sub_key: '' }
			}
		} else {
			result = data
		}
		
		const imgUrl = result?.data?.wbi_img?.img_url || ''
		const subUrl = result?.data?.wbi_img?.sub_url || ''
		
		return {
			img_key: imgUrl.slice(
				imgUrl.lastIndexOf('/') + 1,
				imgUrl.lastIndexOf('.')
			),
			sub_key: subUrl.slice(
				subUrl.lastIndexOf('/') + 1,
				subUrl.lastIndexOf('.')
			)
		}
	} catch (error) {
		return { img_key: '', sub_key: '' }
	}
}

async function getBilibiliVideoInfo(aid, bvid) {
	try {
		let url = 'https://api.bilibili.com/x/web-interface/view'
		let params = {}
		
		if (aid) {
			params.aid = aid
		} else if (bvid) {
			params.bvid = bvid
		} else {
			return null
		}
		
		const { data } = await $fetch.get(`${url}?${dictToURI(params)}`, {
			headers: {
				...headers,
				'Referer': 'https://www.bilibili.com/',
				'Origin': 'https://www.bilibili.com'
			}
		})
		
		let result
		if (typeof data === 'string') {
			try {
				result = JSON.parse(data)
			} catch(e) {
				return null
			}
		} else {
			result = data
		}
		
		if (result && result.code === 0 && result.data) {
			return result.data
		}
	} catch (error) {
		try {
			const { img_key, sub_key } = await getWbiKeys()
			let params = { wts: Math.round(Date.now() / 1000) }
			
			if (aid) {
				params.aid = aid
			} else if (bvid) {
				params.bvid = bvid
			}
			
			const query = encWbi(params, img_key, sub_key)
			const { data } = await $fetch.get(`https://api.bilibili.com/x/web-interface/wbi/view?${query}`, {
				headers: {
					...headers,
					'Referer': 'https://www.bilibili.com/',
					'Origin': 'https://www.bilibili.com'
				}
			})
			
			let result
			if (typeof data === 'string') {
				try {
					result = JSON.parse(data)
				} catch(e) {
					return null
				}
			} else {
				result = data
			}
			
			if (result && result.code === 0 && result.data) {
				return result.data
			}
		} catch (error) {
		}
	}
	
	return null
}

async function getBilibiliSeasonArchives(mid, season_id) {
	try {
		const { img_key, sub_key } = await getWbiKeys()
		
		const params = {
			mid: mid,
			season_id: season_id,
			page_num: 1,
			page_size: 50,
			sort_reverse: false
		}
		
		const query = encWbi(params, img_key, sub_key)
		const { data } = await $fetch.get(`https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?${query}`, {
			headers: {
				...headers,
				'Referer': 'https://www.bilibili.com/',
				'Origin': 'https://www.bilibili.com'
			}
		})
		
		let result
		if (typeof data === 'string') {
			try {
				result = JSON.parse(data)
			} catch(e) {
				return null
			}
		} else {
			result = data
		}
		
		if (result && result.code === 0 && result.data && result.data.archives) {
			return result.data.archives
		}
	} catch (error) {
		try {
			const params = {
				mid: mid,
				season_id: season_id,
				page_num: 1,
				page_size: 50,
				sort_reverse: false
			}
			
			const { data } = await $fetch.get(`https://api.bilibili.com/x/polymer/space/seasons_archives_list?${dictToURI(params)}`, {
				headers: {
					...headers,
					'Referer': 'https://www.bilibili.com/',
					'Origin': 'https://www.bilibili.com'
				}
			})
			
			let result
			if (typeof data === 'string') {
				try {
					result = JSON.parse(data)
				} catch(e) {
					return null
				}
			} else {
				result = data
			}
			
			if (result && result.code === 0 && result.data && result.data.archives) {
				return result.data.archives
			}
		} catch (error) {
		}
	}
	
	return null
}