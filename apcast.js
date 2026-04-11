/*!
 * @name apple_podcast
 * @description 苹果播客 公开接口版 (高兼容防错版)
 * @author codex32
 * @key csp_applepodcast
 */

// 兼容安全的 JSON 转换，防止因底层 argsify/jsonify 崩溃
function safeArgs(d) {
  if (!d) return {};
  if (typeof d === "object") return d;
  if (typeof d === "string") {
    try { if (typeof argsify === 'function') return argsify(d); } catch (e) {}
    try { return JSON.parse(d); } catch (e) { return {}; }
  }
  return {};
}

function safeJsonify(d) {
  try { if (typeof jsonify === 'function') return jsonify(d); } catch (e) {}
  try { return JSON.stringify(d); } catch (e) { return "{}"; }
}

const $config = typeof $config_str !== 'undefined' ? safeArgs($config_str) : {}
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const headers = { 'User-Agent': UA }

const PAGE_LIMIT = 20

// 统一强制转换为字符串类型对比
const GID = {
  RECOMMENDED: '1',
  CATEGORY: '2',
  ALBUM_DETAIL: '3',
}

// 优化了搜索关键词，使用中文在 cn 区搜索结果会更多更准
const podcastCategories = [
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
  { name: '音乐', kw: '音乐' },
]

const appConfig = {
  ver: 1,
  name: "苹果播客",
  desc: "Apple Podcasts 公开播客",
  tabLibrary: {
    name: "探索",
    groups: [
      {
        name: "推荐播客",
        type: "album",
        ui: 1,
        showMore: true,
        ext: { gid: GID.RECOMMENDED }
      },
      ...podcastCategories.map(c => ({
        name: c.name,
        type: "album",
        ui: 1,
        showMore: true,
        ext: {
          gid: GID.CATEGORY,
          kw: c.kw
        }
      }))
    ]
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
}

function firstArray(...arrays) {
  for (const a of arrays) {
    if (Array.isArray(a) && a.length > 0) return a
  }
  return []
}

// 超强兼容版网络请求
async function fetchJson(url) {
  try {
    let res;
    // 兼容多种框架内置的 $fetch 和原生 fetch
    if (typeof $fetch !== 'undefined') {
      res = typeof $fetch.get === 'function' 
        ? await $fetch.get(url, { headers }) 
        : await $fetch(url, { headers });
    } else {
      res = { data: await (await fetch(url, { headers })).json() };
    }
    
    let body = (res && res.data !== undefined) ? res.data : res;
    // 如果拿到的是 JSON 字符串，帮它 Parse 掉
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }
    return body || {};
  } catch (e) {
    throw new Error("网络请求失败: " + e.message);
  }
}

// 统一加载播客接口
async function loadPodcasts(keyword, page = 1) {
  const offset = (page - 1) * PAGE_LIMIT;
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&media=podcast&limit=${PAGE_LIMIT}&offset=${offset}&country=cn`;
  const res = await fetchJson(url);
  return firstArray(res.results);
}

// 解析 RSS 单集
async function loadEpisodes(feedUrl) {
  try {
    let res;
    if (typeof $fetch !== 'undefined') {
      res = typeof $fetch.get === 'function' 
        ? await $fetch.get(feedUrl, { headers: { ...headers, Accept: "application/xml" } }) 
        : await $fetch(feedUrl, { headers: { ...headers, Accept: "application/xml" } });
    } else {
      res = { data: await (await fetch(feedUrl, { headers })).text() };
    }

    const xml = (res && res.data !== undefined ? res.data : res) || "";
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
    
    return items.map(item => {
      let title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "无标题";
      title = title.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim();
      
      const url = item.match(/<enclosure[^>]*url="([^"]+)"/i)?.[1] || "";
      const durMatch = item.match(/<itunes:duration>([\s\S]*?)<\/itunes:duration>/i) || item.match(/<duration>([\s\S]*?)<\/duration>/i);
      let dur = durMatch ? durMatch[1].trim() : "0";
      
      let durationSec = 0;
      if (dur.includes(':')) {
        const parts = dur.split(':').map(Number);
        if (parts.length === 3) durationSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) durationSec = parts[0] * 60 + parts[1];
      } else {
        durationSec = parseInt(dur) || 0;
      }

      return { title, url, duration: durationSec };
    }).filter(i => i.url);
  } catch (e) {
    return [];
  }
}

// 专辑格式化
function mapAlbum(i) {
  return {
    id: String(i.collectionId || Math.random().toString(36).slice(2)),
    name: i.collectionName || i.trackName || "未知播客",
    cover: i.artworkUrl600 || i.artworkUrl100 || "https://is1-ssl.mzstatic.com/image/thumb/Podcasts113/v4/f2/f4/f4/f2f4f4f4-0b1a-8b1a-8b1a-8b1a8b1a8b1a/mza_123456789.jpg/600x600bb.jpg",
    artist: { name: i.artistName || "主播" },
    ext: {
      gid: GID.ALBUM_DETAIL,
      feedUrl: i.feedUrl
    }
  }
}

// ==============================
// 标准出口方法
// ==============================

async function getConfig() {
  return safeJsonify(appConfig);
}

// 首页列表、分类列表
async function getAlbums(ext) {
  try {
    const args = safeArgs(ext);
    const actualExt = args.ext || args;
    
    // 强制转换为 String 避免底层框架类型自动转换导致全等 (===) 判断失败
    const gid = String(actualExt.gid); 
    const kw = actualExt.kw;
    const page = Number(args.page || actualExt.page || 1);

    let list = [];

    if (gid === GID.RECOMMENDED) {
      list = await loadPodcasts("播客", page);
    } else if (gid === GID.CATEGORY && kw) {
      list = await loadPodcasts(kw, page);
    } else {
      // 容错：如果参数全丢了，兜底搜索"播客"
      list = await loadPodcasts("播客", page);
    }

    // 可视化 DEBUG：如果列表还是空，抛出可视化卡片供排查
    if (!list || list.length === 0) {
      return safeJsonify({
        list: [{
          id: "error_empty",
          name: "接口未返回数据或网络被阻断，请检查网络",
          cover: "https://via.placeholder.com/150/000000/FFFFFF?text=Empty",
          artist: { name: "系统调试提示" },
          ext: {}
        }]
      });
    }

    return safeJsonify({
      list: list.map(mapAlbum)
    });

  } catch(e) {
    // 捕捉代码崩溃，直接显示在 UI 上
    return safeJsonify({
      list: [{
        id: "error_crash",
        name: "代码执行报错: " + e.message,
        cover: "https://via.placeholder.com/150/FF0000/FFFFFF?text=Error",
        artist: { name: "代码错误提示" },
        ext: {}
      }]
    });
  }
}

// 播客详情单集
async function getSongs(ext) {
  try {
    const args = safeArgs(ext);
    const actualExt = args.ext || args;
    
    if (String(actualExt.gid) !== GID.ALBUM_DETAIL || !actualExt.feedUrl) {
      return safeJsonify({ list: [] });
    }

    const eps = await loadEpisodes(actualExt.feedUrl);
    return safeJsonify({
      list: eps.map(e => ({
        id: String(e.url), 
        name: e.title,
        duration: e.duration,
        artist: { name: "播客主播" },
        ext: { url: e.url }
      }))
    });
  } catch(e) {
    return safeJsonify({ list: [] });
  }
}

// 搜索
async function search(ext) {
  const args = safeArgs(ext);
  const actualExt = args.ext || args;
  const text = args.text || actualExt.text;
  const page = Number(args.page || actualExt.page || 1);
  
  if (!text) {
    return safeJsonify({ list: [] });
  }
  
  const list = await loadPodcasts(text, page);
  return safeJsonify({ list: list.map(mapAlbum) });
}

// 播放地址
async function getSongInfo(ext) {
  const args = safeArgs(ext);
  const actualExt = args.ext || args;
  return safeJsonify({ urls: actualExt.url ? [actualExt.url] : [] });
}

async function getArtists() { return safeJsonify({ list: [] }) }
async function getPlaylists() { return safeJsonify({ list: [] }) }
