/*!
 * @name getpodcast
 * @description GetPodcast.xyz RSS播客
 * @version v1.0.0
 * @author Grok (adapted from netmusic)
 * @key csp_getpodcast
 */

// 默认配置
let baseUrl = 'https://getpodcast.xyz/';
const DATA_BASE = 'https://data.getpodcast.xyz/data/';

// UA 和 headers
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';
const headers = { 'User-Agent': UA };

const GID = {
  RECOMMENDED: '1',
  CATEGORIES: '2',
  SEARCH: '3',
  MY_SUBS: '4', // 可扩展
};

const appConfig = {
  ver: 1,
  name: 'getpodcast',
  message: '',
  warning: '',
  desc: 'GetPodcast.xyz - 中文播客RSS合集',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: '热门推荐', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.RECOMMENDED } },
      { name: '喜马拉雅', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.CATEGORIES, platform: 'ximalaya' } },
      { name: '网易云', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.CATEGORIES, platform: '163' } },
      { name: '其他平台', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.CATEGORIES, platform: 'other' } },
    ]
  },
  tabMe: {
    name: '我的',
    groups: [
      { name: '订阅列表', type: 'playlist', ext: { gid: GID.MY_SUBS } }
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '播客', type: 'playlist', ext: { type: 'podcast' } },
      { name: '单集', type: 'song', ext: { type: 'episode' } }
    ]
  }
};

function withHeaders(extra = {}) {
  return { ...headers, ...extra };
}

async function fetchJson(url, extraHeaders = {}) {
  try {
    const { data } = await $fetch.get(url, { headers: withHeaders(extraHeaders) });
    if (typeof data === 'string') {
      // RSS 是XML，尝试简单解析或直接返回文本
      return data;
    }
    return data ?? {};
  } catch (e) {
    console.log('请求失败：', url, e);
    return '';
  }
}

function parseRSS(xmlText) {
  // 简单RSS解析（实际生产建议用更好parser，此为简化版）
  const items = [];
  const titleMatch = xmlText.match(/<title>([^<]+)<\/title>/);
  const podcastTitle = titleMatch ? titleMatch[1].trim() : '未知播客';

  const coverMatch = xmlText.match(/<itunes:image href="([^"]+)"/) || xmlText.match(/<image>[\s\S]*?<url>([^<]+)<\/url>/);
  const cover = coverMatch ? coverMatch[1] : '';

  // 提取 episodes
  const itemRegex = /<item>[\s\S]*?<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const item = match[0];
    const epTitleMatch = item.match(/<title>([^<]+)<\/title>/);
    const enclosureMatch = item.match(/<enclosure[^>]*url="([^"]+)"/);
    const pubDateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);
    const durationMatch = item.match(/<itunes:duration>([^<]+)<\/itunes:duration>/);

    if (epTitleMatch && enclosureMatch) {
      items.push({
        title: epTitleMatch[1].trim(),
        url: enclosureMatch[1],
        pubDate: pubDateMatch ? pubDateMatch[1] : '',
        duration: durationMatch ? durationMatch[1] : '',
      });
    }
  }
  return { title: podcastTitle, cover, episodes: items };
}

// 映射播客卡片 (类似 playlist)
function mapPodcastCard(podcast, gid) {
  return {
    id: podcast.id || podcast.rssUrl,
    name: podcast.name || podcast.title,
    cover: podcast.cover || '',
    artist: {
      id: 'getpodcast',
      name: podcast.platform || '播客',
      cover: '',
    },
    ext: { 
      gid: gid, 
      rssUrl: podcast.rssUrl || podcast.id,
      type: 'podcast'
    }
  };
}

// 映射单集 (类似 song)
function mapEpisode(episode, podcast) {
  return {
    id: episode.url || Math.random().toString(36),
    name: episode.title,
    cover: podcast.cover || '',
    duration: episode.duration ? parseDuration(episode.duration) : 0,
    artist: {
      id: podcast.id,
      name: podcast.title || '播客',
    },
    ext: {
      source: 'getpodcast',
      songmid: episode.url,
      url: episode.url, // 直接MP3
      singer: podcast.title,
      songName: episode.title,
    }
  };
}

function parseDuration(dur) {
  if (!dur) return 0;
  // 支持 mm:ss 或 seconds
  if (dur.includes(':')) {
    const parts = dur.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  return parseInt(dur) || 0;
}

async function getConfig() {
  return jsonify(appConfig);
}

// 加载热门/推荐 (可从首页或固定列表)
async function loadRecommended() {
  // 这里可以硬编码一些热门，或从 data 目录抓（但目录 listing 可能受限）
  // 实际建议维护一个热门列表JSON，或从首页解析
  const popular = [
    { id: 'ximalaya/22509954', name: 'Englishpod', platform: '喜马拉雅', rssUrl: `${DATA_BASE}ximalaya/22509954.xml` },
    { id: '163/12', name: '董宝珍电台', platform: '网易云', rssUrl: `${DATA_BASE}163/12.xml` },
    // 添加更多...
  ];
  return popular.map(p => mapPodcastCard(p, GID.RECOMMENDED));
}

async function getPlaylists(ext) {
  const { page = 1, gid = '', platform = '' } = safeExt(ext);
  let cards = [];

  if (gid == GID.RECOMMENDED) {
    cards = await loadRecommended();
  } else if (gid == GID.CATEGORIES) {
    // 简化：根据平台返回示例列表。实际可扩展为动态
    if (platform === 'ximalaya') {
      // 示例，可通过工具发现更多
      cards = [
        mapPodcastCard({id: 'ximalaya/269179', name: '吴晓波频道', rssUrl: `${DATA_BASE}ximalaya/269179.xml`}, gid),
        // ... 更多
      ];
    } else if (platform === '163') {
      cards = [
        mapPodcastCard({id: '163/12', name: '董宝珍电台', rssUrl: `${DATA_BASE}163/12.xml`}, gid),
      ];
    }
  }

  return jsonify({ list: cards });
}

async function getSongs(ext) {
  const { page = 1, gid = '', id = '', rssUrl = '' } = safeExt(ext);
  let episodes = [];

  const targetRss = rssUrl || id;
  if (targetRss && targetRss.endsWith('.xml')) {
    const xml = await fetchJson(targetRss);
    const podcastData = parseRSS(xml);
    episodes = podcastData.episodes.map(ep => mapEpisode(ep, podcastData));
  }

  return jsonify({ list: episodes });
}

async function search(ext) {
  const { text = '', page = 1, type = '' } = safeExt(ext);
  if (!text || page > 5) return jsonify({ list: [] });

  // 简单关键词搜索（实际可改进为请求搜索接口，如果有）
  // 目前返回示例或依赖用户输入RSS
  if (type === 'podcast') {
    // 可返回匹配的播客
    return jsonify({ list: [] }); // TODO: 实现搜索
  }
  return jsonify({ list: [] });
}

async function getSongInfo(ext) {
  const { songmid } = safeExt(ext); // songmid 是 MP3 URL
  if (songmid) {
    return jsonify({ urls: [songmid] });
  }
  return jsonify({ urls: [] });
}

// 辅助函数
function safeExt(ext) {
  if (!ext) return {};
  if (typeof ext === 'object') return ext;
  try { return argsify(ext); } catch (e) { return {}; }
}

// 导出函数（根据模板需要）
async function getArtists(ext) { return jsonify({ list: [] }); }
async function getAlbums(ext) { return jsonify({ list: [] }); }

// 主入口
// 其他函数根据需要实现