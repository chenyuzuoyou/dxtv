/*!
 * @name getpodcast
 * @description GetPodcast.xyz 全站RSS播客（自动版）
 * @version v1.4.0
 * @author Grok
 * @key csp_getpodcast
 */

const BASE_URL = 'https://getpodcast.xyz/';
const DATA_BASE = 'https://data.getpodcast.xyz/data/';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const headers = { 'User-Agent': UA };

const GID = {
  ALL: '1',
  RECENT: '2',
  SEARCH: '3'
};

const appConfig = {
  ver: 1,
  name: 'getpodcast',
  message: '自动提取RSS',
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

async function fetchText(url) {
  try {
    const { data } = await $fetch.get(url, { headers });
    return typeof data === 'string' ? data : '';
  } catch (e) {
    console.log('请求失败:', url);
    return '';
  }
}

function safeExt(ext) {
  if (!ext) return {};
  if (typeof ext === 'object') return ext;
  try { return argsify(ext); } catch (e) { return {}; }
}

async function getConfig() {
  return jsonify(appConfig);
}

// 强力提取首页所有播客名称
function parseHomePodcasts(html) {
  const podcasts = [];
  const seen = new Set();

  // 匹配 ### 标题
  const regex = /###\s*([^\n#]+?)(?=\s*\n)/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    let name = match[1].trim();
    if (name.length < 3 || seen.has(name) || name.includes('小时前') || name.includes('天前')) continue;
    seen.add(name);

    name = name.replace(/（.*?\）|\[.*?\]/g, '').trim();
    const slug = name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 40);

    podcasts.push({
      id: slug,
      name: name,
      cover: '',
      artist: { id: 'getpodcast', name: '中文播客' },
      ext: { 
        gid: GID.ALL, 
        title: name,
        slug: slug 
      }
    });
  }
  return podcasts.slice(0, 150);
}

async function getPlaylists(ext) {
  const { gid = '' } = safeExt(ext);
  const html = await fetchText(BASE_URL);
  let cards = parseHomePodcasts(html);

  console.log(`✅ 成功提取 ${cards.length} 个播客`);

  if (gid == GID.RECENT) cards = cards.slice(0, 80);

  return jsonify({ list: cards });
}

function parseRSS(xml, podcastName) {
  const episodes = [];
  const titleMatch = xml.match(/<title>([^<]+)<\/title>/i);
  const podcastTitle = titleMatch ? titleMatch[1].trim() : podcastName;

  const coverMatch = xml.match(/itunes:image href="([^"]+)"/i) || xml.match(/<image>[\s\S]*?<url>([^<]+)<\/url>/i);
  const cover = coverMatch ? coverMatch[1] : '';

  const itemRegex = /<item>[\s\S]*?<\/item>/gi;
  let item;
  while ((item = itemRegex.exec(xml)) !== null) {
    const content = item[0];
    const titleM = content.match(/<title>([^<]+)<\/title>/i);
    const encl = content.match(/<enclosure[^>]*url="([^"]+)"/i);
    const dur = content.match(/<itunes:duration>([^<]+)<\/itunes:duration>/i);

    if (titleM && encl?.[1]) {
      episodes.push({
        title: titleM[1].trim(),
        url: encl[1],
        duration: dur ? dur[1] : ''
      });
    }
  }
  return { title: podcastTitle, cover, episodes };
}

async function tryGetRSS(slug, name) {
  // 尝试常见路径
  const candidates = [
    `${DATA_BASE}ximalaya/${slug}.xml`,
    `${DATA_BASE}163/${slug}.xml`,
    `${DATA_BASE}lizhi/${slug}.xml`,
    `${DATA_BASE}other/${slug}.xml`,
    `${DATA_BASE}${slug}.xml`
  ];

  for (const url of candidates) {
    const xml = await fetchText(url);
    if (xml && xml.includes('<rss') || xml.includes('<channel')) {
      console.log('✅ 找到RSS:', url);
      return { url, xml };
    }
  }
  return null;
}

async function getSongs(ext) {
  const { slug = '', id = '', title = '' } = safeExt(ext);
  const searchSlug = slug || id;

  if (!searchSlug) return jsonify({ list: [], message: '加载中...' });

  const result = await tryGetRSS(searchSlug, title);
  if (!result) {
    return jsonify({ 
      list: [], 
      message: `暂未找到 ${title} 的RSS（站点可能未收录或路径变化）` 
    });
  }

  const data = parseRSS(result.xml, title);
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

  const html = await fetchText(BASE_URL);
  const all = parseHomePodcasts(html);
  const filtered = all.filter(p => p.name.toLowerCase().includes(text.toLowerCase()));

  return jsonify({ list: filtered });
}

async function getSongInfo(ext) {
  const { songmid } = safeExt(ext);
  if (songmid?.startsWith('http')) {
    return jsonify({ urls: [songmid] });
  }
  return jsonify({ urls: [] });
}

async function getArtists() { return jsonify({ list: [] }); }
async function getAlbums() { return jsonify({ list: [] }); }