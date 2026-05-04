/*!
 * @name getpodcast
 * @description GetPodcast.xyz 全站播客（优化版）
 * @version v1.2.0
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
  message: '全站播客聚合',
  warning: '',
  desc: 'https://getpodcast.xyz/ - 中文播客RSS合集',
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

// 从首页Markdown提取播客列表
function parseHomePodcasts(html) {
  const podcasts = [];
  const seen = new Set();

  // 匹配 ### 标题 + 下一行作者/平台
  const regex = /###\s*([^\n]+?)\s*\n[\s\S]*?([^\n]{2,40})/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    let name = match[1].trim();
    let artist = match[2].trim();

    if (name.length < 3 || seen.has(name)) continue;
    seen.add(name);

    // 清理常见后缀
    name = name.replace(/（.*?\）/g, '').trim();

    // 构造可能的 RSS（很多是 data.getpodcast.xyz 格式，但目前不可直接访问）
    // 这里我们把名称作为 ID，后续点击时尝试常见 RSS 源或直接用名称搜索
    const slug = name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 30);

    podcasts.push({
      id: slug || name,
      name: name,
      cover: '', 
      artist: { id: 'getpodcast', name: artist || '未知' },
      ext: { 
        gid: GID.ALL, 
        rssUrl: '', 
        title: name,
        searchName: name 
      }
    });
  }

  return podcasts.slice(0, 80); // 取较多条目
}

async function getPlaylists(ext) {
  const { gid = '' } = safeExt(ext);
  const html = await fetchText(BASE_URL);

  let cards = parseHomePodcasts(html);

  if (gid == GID.RECENT) {
    // 最新更新和热门目前用同一数据源
    cards = cards.slice(0, 40);
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
    const titleM = item[0].match(/<title>([^<]+)<\/title>/i);
    const encl = item[0].match(/<enclosure[^>]*url="([^"]+)"/i);
    const dur = item[0].match(/<itunes:duration>([^<]+)<\/itunes:duration>/i);

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

  let targetRss = rssUrl;

  // 如果没有直接RSS，尝试常见数据源（目前很多不可用）
  if (!targetRss && searchName) {
    // 可尝试从其他公开RSS源，但这里先返回提示
    console.log('尝试加载播客:', searchName);
    // 目前无法自动获取RSS，建议用户手动提供RSS或等待站点更新
  }

  if (!targetRss) {
    return jsonify({ list: [], message: '暂无RSS地址，请尝试搜索其他播客或提供RSS链接' });
  }

  const xml = await fetchText(targetRss);
  if (!xml || xml.length < 100) {
    return jsonify({ list: [], message: 'RSS加载失败' });
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
  if (d.includes(':')) {
    const parts = d.split(':').map(Number);
    return (parts[0]||0)*3600 + (parts[1]||0)*60 + (parts[2]||0);
  }
  return parseInt(d) || 0;
}

async function search(ext) {
  const { text = '' } = safeExt(ext);
  if (!text) return jsonify({ list: [] });

  const html = await fetchText(BASE_URL);
  const all = parseHomePodcasts(html);
  const filtered = all.filter(p => 
    (p.name && p.name.toLowerCase().includes(text.toLowerCase())) ||
    (p.artist && p.artist.name.toLowerCase().includes(text.toLowerCase()))
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

async function getArtists(ext) { return jsonify({ list: [] }); }
async function getAlbums(ext) { return jsonify({ list: [] }); }