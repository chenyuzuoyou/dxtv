/*!
 * @name getpodcast
 * @description GetPodcast.xyz 全站播客（最终自动版）
 * @version v1.5.0
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
  message: '自动RSS',
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

// 超级强力解析首页（适配当前Markdown结构）
function parseHomePodcasts(html) {
  const podcasts = [];
  const seen = new Set();

  // 匹配 ### 播客标题 + 下一行平台/作者
  const regex = /###\s*([^\n#]+?)\s*\n[\s\S]*?([^\n]{3,50})/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    let name = match[1].trim();
    let artist = match[2].trim();

    if (name.length < 3 || seen.has(name) || name.includes('小时前') || name.includes('天前')) continue;
    seen.add(name);

    name = name.replace(/（.*?\）|\[.*?\]/g, '').trim();

    podcasts.push({
      id: name,
      name: name,
      cover: '',
      artist: { id: 'getpodcast', name: artist || '播客' },
      ext: { 
        gid: GID.ALL, 
        title: name,
        slug: name 
      }
    });
  }
  console.log(`✅ 解析到 ${podcasts.length} 个播客`);
  return podcasts.slice(0, 120);
}

async function getPlaylists(ext) {
  const { gid = '' } = safeExt(ext);
  const html = await fetchText(BASE_URL);
  let cards = parseHomePodcasts(html);

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
  return { title: podcastTitle, cover, episodes: episodes.slice(0, 100) };
}

async function getSongs(ext) {
  const { title = '', slug = '' } = safeExt(ext);
  const podcastName = title || slug;

  if (!podcastName) return jsonify({ list: [] });

  // 先尝试直接访问 data.getpodcast.xyz 常见路径
  const possibleRss = [
    `https://data.getpodcast.xyz/data/ximalaya/${podcastName.replace(/[^a-zA-Z0-9]/g,'')}.xml`,
    `https://data.getpodcast.xyz/data/163/${podcastName.replace(/[^a-zA-Z0-9]/g,'')}.xml`,
    `https://data.getpodcast.xyz/data/lizhi/${podcastName.replace(/[^a-zA-Z0-9]/g,'')}.xml`
  ];

  for (let rssUrl of possibleRss) {
    const xml = await fetchText(rssUrl);
    if (xml && xml.includes('<rss') || xml.includes('<channel')) {
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
  }

  return jsonify({ list: [], message: '未找到RSS，尝试在原网站复制「RAW SIGNAL SOURCE」链接后搜索' });
}

function parseDuration(d) {
  if (!d) return 0;
  if (d.includes(':')) {
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