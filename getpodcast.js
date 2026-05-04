/*!
 * @name getpodcast
 * @description GetPodcast.xyz 全站播客
 * @version v1.1.0
 * @author Grok
 * @key csp_getpodcast
 */

const BASE_URL = 'https://getpodcast.xyz/';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const headers = { 'User-Agent': UA };

const GID = {
  ALL: '1',           // 全部播客（热门+推荐）
  RECENT: '2',        // 最新更新
  SEARCH: '3'
};

const appConfig = {
  ver: 1,
  name: 'getpodcast',
  message: '全站播客RSS合集',
  warning: '',
  desc: 'https://getpodcast.xyz/',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: '热门推荐', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.ALL } },
      { name: '最新更新', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.RECENT } }
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [{ name: '播客', type: 'playlist', ext: { type: 'podcast' } }]
  }
};

function withHeaders() {
  return headers;
}

async function fetchText(url) {
  try {
    const { data } = await $fetch.get(url, { headers: withHeaders() });
    return typeof data === 'string' ? data : JSON.stringify(data);
  } catch (e) {
    console.log('请求失败:', url, e);
    return '';
  }
}

function safeExt(ext) {
  if (!ext) return {};
  if (typeof ext === 'object') return ext;
  try { return argsify(ext); } catch (e) { return {}; }
}

// 简单解析首页提取播客卡片
function parseHomePage(html) {
  const podcasts = [];
  // 匹配常见标题模式
  const titleRegex = /###\s*([^#\n]+?)\s*\n/g;
  const podcastRegex = /###\s*([^\n]+?)\n[\s\S]*?([\u4e00-\u9fa5a-zA-Z0-9_ ]{2,30})/g;

  let match;
  const seen = new Set();

  while ((match = podcastRegex.exec(html)) !== null) {
    const name = match[1].trim();
    const author = match[2] ? match[2].trim() : '未知';
    if (name.length < 2 || seen.has(name)) continue;
    seen.add(name);

    // 构造可能的RSS链接（常见格式）
    const slug = name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').substring(0, 20);
    const possibleRss = `https://data.getpodcast.xyz/data/${slug}.xml`; // 可能不准，但可尝试

    podcasts.push({
      id: name,
      name: name,
      cover: '', // 首页无封面，可后续优化
      artist: { name: author, id: 'getpodcast' },
      ext: { gid: GID.ALL, rssUrl: possibleRss, title: name }
    });
  }
  return podcasts.slice(0, 50); // 限制数量
}

async function getConfig() {
  return jsonify(appConfig);
}

async function getPlaylists(ext) {
  const { gid = '', page = 1 } = safeExt(ext);
  let cards = [];

  const html = await fetchText(BASE_URL);

  if (gid == GID.ALL) {
    cards = parseHomePage(html);
  } else if (gid == GID.RECENT) {
    cards = parseHomePage(html); // 目前首页就是最新
  }

  return jsonify({ list: cards });
}

function parseRSS(xml) {
  const episodes = [];
  const podcastTitleMatch = xml.match(/<title>([^<]+)<\/title>/i);
  const podcastTitle = podcastTitleMatch ? podcastTitleMatch[1].trim() : '未知播客';

  const coverMatch = xml.match(/itunes:image href="([^"]+)"/i) || xml.match(/<image>[\s\S]*?<url>([^<]+)<\/url>/i);
  const cover = coverMatch ? coverMatch[1] : '';

  const itemRegex = /<item>[\s\S]*?<\/item>/gi;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const item = itemMatch[0];
    const titleMatch = item.match(/<title>([^<]+)<\/title>/i);
    const enclosure = item.match(/<enclosure[^>]*url="([^"]+)"/i);
    const durationMatch = item.match(/<itunes:duration>([^<]+)<\/itunes:duration>/i);

    if (titleMatch && enclosure) {
      episodes.push({
        title: titleMatch[1].trim(),
        url: enclosure[1],
        duration: durationMatch ? durationMatch[1] : ''
      });
    }
  }

  return { title: podcastTitle, cover, episodes };
}

async function getSongs(ext) {
  const { rssUrl = '', id = '' } = safeExt(ext);
  const target = rssUrl || id;

  if (!target) return jsonify({ list: [] });

  const xml = await fetchText(target);
  if (!xml) return jsonify({ list: [] });

  const data = parseRSS(xml);
  const songs = data.episodes.map(ep => ({
    id: ep.url,
    name: ep.title,
    cover: data.cover,
    duration: parseDuration(ep.duration),
    artist: { name: data.title },
    ext: {
      source: 'getpodcast',
      songmid: ep.url,
      url: ep.url,
      singer: data.title,
      songName: ep.title
    }
  }));

  return jsonify({ list: songs });
}

function parseDuration(d) {
  if (!d) return 0;
  if (typeof d === 'string' && d.includes(':')) {
    const p = d.split(':').map(Number);
    return (p[0]||0)*3600 + (p[1]||0)*60 + (p[2]||0);
  }
  return parseInt(d) || 0;
}

async function search(ext) {
  const { text = '' } = safeExt(ext);
  if (!text) return jsonify({ list: [] });

  // 简单在首页搜索
  const html = await fetchText(BASE_URL);
  const all = parseHomePage(html);
  const filtered = all.filter(p => 
    p.name.toLowerCase().includes(text.toLowerCase())
  );

  return jsonify({ list: filtered });
}

async function getSongInfo(ext) {
  const { songmid } = safeExt(ext);
  if (songmid && songmid.startsWith('http')) {
    return jsonify({ urls: [songmid] });
  }
  return jsonify({ urls: [] });
}

// 空函数兼容
async function getArtists() { return jsonify({ list: [] }); }
async function getAlbums() { return jsonify({ list: [] }); }