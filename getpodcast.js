/*!
 * @name getpodcast
 * @description GetPodcast 全站播客解析脚本
 * @author codex
 * @key csp_getpodcast
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
const headers = {
  'User-Agent': UA,
  'Referer': 'https://getpodcast.xyz/'
}
const PAGE_LIMIT = 999
const SEARCH_PAGE_LIMIT = 5
const PODCAST_SOURCE = 'getpodcast'
const GID = {
  RECOMMENDED_PODCASTS: '1',
  CATEGORY_PODCASTS: '2',
  PODCAST_EPISODES: '3',
}

// 全站播客分类
const allCategories = [
  '热门推荐', '悬疑灵异', '商业财经', '科技数码', '历史人文',
  '情感生活', '影视评论', '英语学习', '儿童启蒙', '脱口秀',
  '犯罪刑侦', '健康养生', '游戏动漫', '资讯热点', '文化读书'
];

const appConfig = {
  ver: 1,
  name: 'GetPodcast',
  message: '',
  warning: '',
  desc: 'GetPodcast.xyz 全站播客聚合解析',
  tabLibrary: {
    name: '探索',
    type: 'song',
    groups: [
      {
        name: '全站热门',
        type: 'song',
        showMore: true,
        ext: { gid: GID.CATEGORY_PODCASTS, kw: '热门' }
      },
      ...allCategories.map(kw => ({
        name: kw,
        type: 'song',
        showMore: true,
        ext: { gid: GID.CATEGORY_PODCASTS, kw: kw }
      }))
    ]
  },
  tabMe: {
    name: '我的',
    groups: [
      { name: '红心', type: 'song' },
      { name: '播客', type: 'album' }
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '播客', type: 'album', ext: { type: 'album' } },
      { name: '节目', type: 'song', ext: { type: 'track' } }
    ]
  }
}

function safeArgs(data) {
  return typeof data === 'string' ? argsify(data) : (data ?? {})
}

function toHttps(url) {
  if (!url) return ''
  let s = `${url}`
  if (s.startsWith('//')) return 'https:' + s
  return s
}

function cleanText(t) {
  return `${t ?? ''}`.replace(/\s+/g, ' ').trim()
}

function firstArray(...candidates) {
  for (const i of candidates) {
    if (Array.isArray(i) && i.length > 0) return i
  }
  return []
}

async function fetchJson(url, extraHeaders = {}) {
  try {
    const { data } = await $fetch.get(url, {
      headers: { ...headers, ...extraHeaders }
    })
    return safeArgs(data)
  } catch (e) {
    return {}
  }
}

// 映射播客专辑
function mapPodcast(item) {
  if (!item) return {};
  const id = `${item.id ?? item.feedId ?? Math.random().toString(36).slice(2)}`;
  return {
    id: id,
    name: cleanText(item.title || item.name || '未知播客'),
    cover: toHttps(item.cover || item.image || ''),
    artist: {
      id: `${item.authorId ?? 'podcaster'}`,
      name: cleanText(item.author || item.host || '主播')
    },
    ext: {
      gid: GID.PODCAST_EPISODES,
      id: id,
      source: PODCAST_SOURCE,
      type: 'podcast'
    }
  }
}

// 映射播客单集
function mapEpisode(item) {
  if (!item) return {};
  const trackId = `${item.id ?? item.episodeId ?? Math.random().toString(36).slice(2)}`;
  return {
    id: trackId,
    name: cleanText(item.title || item.episodeTitle || '未知节目'),
    cover: toHttps(item.cover || item.image || ''),
    duration: parseInt(item.duration || 0),
    artist: { 
      id: `${item.authorId ?? 'podcaster'}`, 
      name: cleanText(item.author || item.host || '主播') 
    },
    ext: {
      source: PODCAST_SOURCE,
      trackId: trackId,
      songName: cleanText(item.title || '未知节目')
    }
  }
}

// 获取分类播客列表
async function loadPodcastsByKeyword(keyword, page = 1) {
  try {
    // 模拟GetPodcast.xyz接口请求
    const res = await fetchJson(`https://getpodcast.xyz/api/podcasts?keyword=${encodeURIComponent(keyword)}&page=${page}`);
    return firstArray(res.data || res.podcasts || []);
  } catch (e) {
    return [];
  }
}

// 获取播客单集列表
async function loadPodcastEpisodes(podcastId) {
  if (!podcastId) return [];
  try {
    const data = await fetchJson(`https://getpodcast.xyz/api/podcast/${podcastId}/episodes`);
    return firstArray(data.episodes || data.data || []);
  } catch (e) {
    return [];
  }
}

// 获取配置
async function getConfig() {
  return jsonify(appConfig)
}

// 获取播客专辑列表
async function getAlbums(ext) {
  const { page = 1, gid, kw } = argsify(ext)
  if (gid == GID.CATEGORY_PODCASTS) {
    const list = await loadPodcastsByKeyword(kw, page)
    return jsonify({ 
        list: list.map(mapPodcast),
        isEnd: list.length < 20 
    })
  }
  return jsonify({ list: [] })
}

// 获取节目单集
async function getSongs(ext) {
  const { gid, id, kw, page = 1 } = argsify(ext)
  
  // 获取播客下的所有单集
  if (gid == GID.PODCAST_EPISODES && id) {
    const list = await loadPodcastEpisodes(id)
    return jsonify({ list: list.map(mapEpisode) })
  }
  
  // 分类页直接加载节目
  if (gid == GID.CATEGORY_PODCASTS && kw) {
    const list = await loadPodcastsByKeyword(kw, page)
    return jsonify({ 
        list: list.map(mapEpisode),
        isEnd: list.length < 20 
    })
  }
  
  return jsonify({ list: [] })
}

async function getArtists(ext) {
  return jsonify({ list: [] })
}

async function getPlaylists() {
  return jsonify({ list: [] })
}

// 搜索功能
async function search(ext) {
  const { text, page = 1, type } = argsify(ext)
  if (!text) return jsonify({})
  
  const list = await loadPodcastsByKeyword(text, page)
  
  if (type === 'album') {
    return jsonify({ list: list.map(mapPodcast), isEnd: list.length < 20 })
  } else if (type === 'track' || type === 'song') {
    return jsonify({ list: list.map(mapEpisode), isEnd: list.length < 20 })
  }
  
  return jsonify({})
}

// 获取播放地址
async function getSongInfo(ext) {
  const { trackId } = argsify(ext)
  if (!trackId) return jsonify({ urls: [] })
  
  try {
    const playData = await fetchJson(`https://getpodcast.xyz/api/episode/${trackId}/play`);
    let url = playData.url || playData.data?.url || '';
    return jsonify({ urls: url ? [toHttps(url)] : [] });
  } catch (e) {
    return jsonify({ urls: [] })
  }
}