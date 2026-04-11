/*!
 * @name apple_podcast
 * @description 苹果播客 公开接口版 (极致兼容版 - 解决引擎白屏崩溃)
 * @author codex12
 * @key csp_applepodcast
 */

var UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
var headers = { 'User-Agent': UA };
var PAGE_LIMIT = 20;

var GID = {
  RECOMMENDED: '1',
  CATEGORY: '2',
  ALBUM_DETAIL: '3'
};

var podcastCategories = [
  { name: '新闻', kw: '新闻' },
  { name: '历史', kw: '历史' },
  { name: '喜剧', kw: '喜剧' },
  { name: '真实犯罪', kw: '犯罪' },
  { name: '商业', kw: '商业' },
  { name: '教育', kw: '教育' },
  { name: '健康', kw: '健康' },
  { name: '社会文化', kw: '社会文化' },
  { name: '科技', kw: '科技' },
  { name: '体育', kw: '体育' },
  { name: '哲学', kw: '哲学' },
  { name: '有声书', kw: '有声书' },
  { name: '脱口秀', kw: '脱口秀' },
  { name: '儿童', kw: '儿童' },
  { name: '音乐', kw: '音乐' }
];

// 使用 ES5 的方式拼接数组，绝对避免使用 ... 展开符
var exploreGroups = [
  {
    name: "推荐播客",
    type: "album",
    ui: 1,
    showMore: true,
    ext: { gid: GID.RECOMMENDED }
  }
];

for (var i = 0; i < podcastCategories.length; i++) {
  exploreGroups.push({
    name: podcastCategories[i].name,
    type: "album",
    ui: 1,
    showMore: true,
    ext: { gid: GID.CATEGORY, kw: podcastCategories[i].kw }
  });
}

var appConfig = {
  ver: 1,
  name: "苹果播客",
  desc: "Apple Podcasts",
  tabLibrary: {
    name: "探索",
    groups: exploreGroups
  },
  tabSearch: {
    name: "搜索",
    groups: [
      { name: "播客", type: "album", ext: { type: "album" } }
    ]
  },
  tabMe: {
    name: "我的",
    groups: [
      { name: "收藏", type: "song" },
      { name: "订阅", type: "album" }
    ]
  }
};

// 放弃框架自带的 bug 较多的 argsify/jsonify，直接使用原生 JSON
function safeParse(d) {
  if (!d) return {};
  if (typeof d === 'object') return d;
  try { return JSON.parse(d); } catch(e) { return {}; }
}

function safeStringify(d) {
  try { return JSON.stringify(d); } catch(e) { return "{}"; }
}

async function fetchJson(url) {
  try {
    var res = await $fetch.get(url, { headers: headers });
    var body = res;
    if (res && typeof res === 'object' && res.data !== undefined) {
      body = res.data;
    }
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e){}
    }
    return body || {};
  } catch (e) {
    return {};
  }
}

async function loadPodcasts(keyword, page) {
  var p = page || 1;
  var offset = (p - 1) * PAGE_LIMIT;
  var url = "https://itunes.apple.com/search?term=" + encodeURIComponent(keyword) + "&media=podcast&limit=" + PAGE_LIMIT + "&offset=" + offset + "&country=cn";
  var res = await fetchJson(url);
  if (res && Array.isArray(res.results)) {
    return res.results;
  }
  return [];
}

function mapAlbum(i) {
  var id = i.collectionId ? String(i.collectionId) : String(Math.random());
  var name = i.collectionName || i.trackName || "未知播客";
  var cover = i.artworkUrl600 || i.artworkUrl100 || "https://is1-ssl.mzstatic.com/image/thumb/Podcasts113/v4/f2/f4/f4/f2f4f4f4-0b1a-8b1a-8b1a-8b1a8b1a8b1a/mza_123456789.jpg/600x600bb.jpg";
  var artistName = i.artistName || "主播";
  return {
    id: id,
    name: name,
    cover: cover,
    artist: { name: artistName },
    ext: {
      gid: GID.ALBUM_DETAIL,
      feedUrl: i.feedUrl
    }
  };
}

// ==============================
// 暴露给播放器框架的出口方法
// ==============================

async function getConfig() {
  return safeStringify(appConfig);
}

async function getAlbums(ext, page) {
  try {
    var args = safeParse(ext);
    var actualExt = args.ext || args;
    var gid = String(actualExt.gid);
    var kw = actualExt.kw;
    var p = page || args.page || actualExt.page || 1;

    var list = [];
    if (gid === GID.RECOMMENDED) {
      list = await loadPodcasts("播客", p);
    } else if (gid === GID.CATEGORY && kw) {
      list = await loadPodcasts(kw, p);
    } else {
      list = await loadPodcasts("播客", p);
    }

    var mappedList = list.map(mapAlbum);
    
    // 如果没有获取到数据，返回一个提示卡片，防止彻底白屏
    if (mappedList.length === 0) {
      mappedList.push({
        id: "empty_01",
        name: "未能获取到数据，请检查网络",
        cover: "https://via.placeholder.com/400x400?text=Empty",
        artist: { name: "系统提示" },
        ext: {}
      });
    }

    return safeStringify({ list: mappedList });
  } catch (e) {
    return safeStringify({
      list: [{
        id: "error_01",
        name: "程序报错: " + e.message,
        cover: "https://via.placeholder.com/400x400?text=Error",
        artist: { name: "错误" },
        ext: {}
      }]
    });
  }
}

async function getSongs(ext) {
  try {
    var args = safeParse(ext);
    var actualExt = args.ext || args;

    if (String(actualExt.gid) !== GID.ALBUM_DETAIL || !actualExt.feedUrl) {
      return safeStringify({ list: [] });
    }

    var res = await $fetch.get(actualExt.feedUrl, {
      headers: { 'User-Agent': UA, 'Accept': 'application/xml' }
    });
    var xml = res;
    if (res && typeof res === 'object' && res.data !== undefined) {
      xml = res.data;
    }
    if (typeof xml !== 'string') xml = "";

    var items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
    var eps = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      
      // 去除 ?.[1] 这种可选链写法
      var titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
      var title = titleMatch ? titleMatch[1] : "无标题";
      title = title.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim();

      var urlMatch = item.match(/<enclosure[^>]*url="([^"]+)"/i);
      var url = urlMatch ? urlMatch[1] : "";

      var durMatch = item.match(/<itunes:duration>([\s\S]*?)<\/itunes:duration>/i) || item.match(/<duration>([\s\S]*?)<\/duration>/i);
      var dur = durMatch ? durMatch[1].trim() : "0";

      var durationSec = 0;
      if (dur.indexOf(':') > -1) {
        var parts = dur.split(':');
        if (parts.length === 3) durationSec = parseInt(parts[0])*3600 + parseInt(parts[1])*60 + parseInt(parts[2]);
        if (parts.length === 2) durationSec = parseInt(parts[0])*60 + parseInt(parts[1]);
      } else {
        durationSec = parseInt(dur) || 0;
      }

      if (url) {
        eps.push({
          id: String(url),
          name: title,
          duration: durationSec,
          artist: { name: "播客主播" },
          ext: { url: url }
        });
      }
    }

    return safeStringify({ list: eps });
  } catch (e) {
    return safeStringify({ list: [] });
  }
}

async function search(ext, page) {
  var args = safeParse(ext);
  var actualExt = args.ext || args;
  var text = args.text || actualExt.text;
  var p = page || args.page || actualExt.page || 1;

  if (!text) return safeStringify({ list: [] });

  var list = await loadPodcasts(text, p);
  var mappedList = list.map(mapAlbum);
  return safeStringify({ list: mappedList });
}

async function getSongInfo(ext) {
  var args = safeParse(ext);
  var actualExt = args.ext || args;
  return safeStringify({ urls: actualExt.url ? [actualExt.url] : [] });
}

async function getArtists() { return safeStringify({ list: [] }); }
async function getPlaylists() { return safeStringify({ list: [] }); }
