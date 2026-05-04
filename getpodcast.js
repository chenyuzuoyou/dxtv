/*!
 * @name getpodcast
 * @description GetPodcast.xyz 全站播客（强力解析版）
 * @version v1.3.0
 * @author Grok
 * @key csp_getpodcast
 */

const BASE_URL = 'https://getpodcast.xyz/';
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

// 强力解析首页Markdown，提取播客名称
function parseHomePodcasts(html) {
  const podcasts = [];
  const seen = new Set();

  // 匹配 ### 播客名称 模式（这是首页最主要的结构）
  const regex = /###\s*([^\n#]+?)(?=\s*\n)/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    let name = match[1].trim();

    // 过滤无效标题
    if (name.length < 3 || 
        name.includes('小时前') || 
        name.includes('天前') || 
        name.match(/^\d+$/) ||
        seen.has(name)) continue;

    seen.add(name);

    // 清理多余符号
    name = name.replace(/（.*?\）|\[.*?\]/g, '').trim();

    const slug = name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 40);

    podcasts.push({
      id: slug || name,
      name: name,
      cover: '',
      artist: { id: 'getpodcast', name: '播客' },
      ext: { 
        gid: GID.ALL, 
        rssUrl: '', 
        title: name,
        searchName: name 
      }
    });
  }

  // 去重并限制数量
  return podcasts.slice(0, 120);
}

async function getPlaylists(ext) {
  const { gid = '' } = safeExt(ext);
  const html = await fetchText(BASE_URL);

  let cards = parseHomePodcasts(html);

  console.log(`提取到 ${cards.length} 个播客`);

  if (gid == GID.RECENT) {
    cards = cards.slice(0, 60);
  }

  return jsonify({ list: cards });
}

function parseRSS(xml) {
  const episodes = [];
  const titleMatch = xml.match(/<title>([^<]+)<\/title>/i);
  const podcastTitle = titleMatch ? titleMatch[1].trim() : '未知播客';

  const coverMatch = xml.match(/itunes:image href="([^"]+)"/i) || xml.match(/<image>[\s\S]*?<url>([^<]+)<\/url>/i);
  const cover = coverMatch ? coverMatch[1] : '';

  const itemRegex = /<item>[\s\S]*?<\/item>/gi;
  let item;
  while ((item = itemRegex.exec(xml)) !== null) {
    const content = item[0];
    const titleM = content.match(/<title>([^<]+)<\/title>/i);
    const encl = content.match(/<enclosure[^>]*url="([^"]+)"/i);
    const dur = content.match(/<itunes:duration>([^<]+)<\/itunes:duration>/i);

    if (titleM && encl) {
      episodes.push({
        title: titleM[1].trim(),
        url: encl[1],
        duration: dur ? dur[1] : ''
      });
    }
  }
  return { title: podcastTitle, cover, episodes };
}

async function getSongs(ext) {
  const { rssUrl = '', id = '', searchName = '' } = safeExt(ext);

  // 当前版本暂不支持自动获取RSS（需用户在详情页复制订阅地址）
  if (!rssUrl) {
    return jsonify({ 
      list: [], 
      message: '请在 getpodcast.xyz 找到该播客 → 点击「raw / source / 订阅地址」复制RSS链接后重新搜索或手动输入' 
    });
  }

  const xml = await fetchText(rssUrl);
  if (!xml || xml.length < 200) {
    return jsonify({ list: [], message: 'RSS加载失败，请检查链接' });
  }

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

  const html = await fetchText(BASE_URL);
  const all = parseHomePodcasts(html);
  const filtered = all.filter(p => 
    p.name.toLowerCase().includes(text.toLowerCase())
  );

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