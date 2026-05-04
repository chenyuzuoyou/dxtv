/*!
 * @name getpodcast
 * @description GetPodcast 播客 RSS 解析（最终修复版）
 * @author codex
 * @key csp_getpodcast
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
const headers = {
  'User-Agent': UA,
  'Referer': 'https://getpodcast.xyz/'
}
const PODCAST_SOURCE = 'getpodcast'
const GID = {
  CATEGORY_PODCASTS: '2',
  PODCAST_EPISODES: '3',
}

// 首页纯分类入口
const allCategories = [
  '全站热门', '悬疑灵异', '商业财经', '科技数码', '历史人文',
  '情感生活', '影视评论', '英语学习', '儿童启蒙', '脱口秀',
  '犯罪刑侦', '健康养生', '游戏动漫', '资讯热点", "文化读书'
];

const appConfig = {
  ver: 1,
  name: 'GetPodcast',
  message: '',
  warning: '',
  desc: 'GetPodcast 播客 RSS 解析，支持 mp3 播放',
  tabLibrary: {
    name: '探索',
    // 关键修改：首页只放分类入口，不渲染任何播客
    groups: allCategories.map(kw => ({
      name: kw,
      // 用 playlist 类型，强制播放器只显示为“可点击的列表项”，不直接渲染内容
      type: 'playlist',
      showMore: false,
      ext: { gid: GID.CATEGORY_PODCASTS, kw: kw }
    }))
  },
  tabMe: { name: '我的', groups: [{ name: '红心', type: 'song' }, { name: '播客', type: 'album' }] },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '播客', type: 'album', ext: { type: 'album' } },
      { name: '节目', type: 'song', ext: { type: 'track' } }
    ]
  }
}

function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}) }
function toHttps(url) { if (!url) return ''; let s = `${url}`; if (s.startsWith('//')) return 'https:' + s; return s }
function cleanText(t) { return `${t ?? ''}`.replace(/\s+/g, ' ').trim() }
function firstArray(...candidates) { for (const i of candidates) { if (Array.isArray(i) && i.length > 0) return i } return [] }

async function fetchHtml(url) {
  try {
    const { data } = await $fetch.get(url, { headers })
    return data || ''
  } catch (e) { 
    return '' 
  }
}

// 【真实爬取】getpodcast.xyz 播客 RSS 地址（去掉了兜底示例）
async function loadPodcastsByCategory(keyword) {
  let url = 'https://getpodcast.xyz/'
  if (keyword && keyword !== '全站热门') {
    url = `https://getpodcast.xyz/category/${encodeURIComponent(keyword)}`
  }
  
  const html = await fetchHtml(url)
  if (!html) return []

  const list = []
  const podcastRegex = /<a[^>]+href="(https?:\/\/[^"']+\.xml)"[^>]*>([^<]+)<\/a>/gi

  let match
  while ((match = podcastRegex.exec(html)) !== null) {
    const xmlUrl = match[1]
    const title = cleanText(match[2])
    
    if (!list.some(p => p.xmlUrl === xmlUrl)) {
      list.push({
        id: encodeURIComponent(xmlUrl),
        title: title || '未知播客',
        xmlUrl: xmlUrl,
        cover: '',
        author: '播客主播'
      })
    }
  }
  
  return list.slice(0, 100)
}

// 解析 XML RSS 获取单集 + mp3
async function loadEpisodesByXml(xmlUrl) {
  const xml = await fetchHtml(decodeURIComponent(xmlUrl))
  if (!xml) return []

  const items = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  const titleRegex = /<title>([\s\S]*?)<\/title>/i
  const enclosureRegex = /<enclosure[^>]+url="([^"]+)"/i
  const coverRegex = /<itunes:image[^>]+href="([^"]+)"/i
  const durationRegex = /<itunes:duration>([\d:]+)<\/itunes:duration>/i

  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1]
    const title = (titleRegex.exec(content)?.[1] || '未知节目').trim()
    const mp3 = enclosureRegex.exec(content)?.[1] || ''
    const cover = coverRegex.exec(content)?.[1] || ''
    const durStr = durationRegex.exec(content)?.[1] || '0'

    let duration = 0
    if (durStr.includes(':')) {
      const p = durStr.split(':').map(Number)
      duration = p.length === 3 ? p[0]*3600+p[1]*60+p[2] : p[0]*60+(p[1]||0)
    } else {
      duration = Number(durStr) || 0
    }

    if (mp3) {
      items.push({
        id: encodeURIComponent(mp3),
        title,
        cover,
        duration,
        mp3,
        author: '主播'
      })
    }
  }
  return items
}

function mapAlbum(item) {
  return {
    id: item.id,
    name: item.title,
    cover: toHttps(item.cover),
    artist: { id: '0', name: item.author },
    ext: {
      gid: GID.PODCAST_EPISODES,
      id: item.id,
      xmlUrl: item.xmlUrl,
      source: PODCAST_SOURCE
    }
  }
}

function mapSong(item) {
  return {
    id: item.id,
    name: item.title,
    cover: toHttps(item.cover),
    duration: item.duration,
    artist: { id: '0', name: item.author },
    ext: {
      source: PODCAST_SOURCE,
      trackId: item.id,
      mp3: item.mp3
    }
  }
}

async function getConfig() { return jsonify(appConfig) }

// 关键：点击分类后才加载播客列表
async function getAlbums(ext) {
  const { gid, kw } = argsify(ext)
  if (gid == GID.CATEGORY_PODCASTS) {
    const list = await loadPodcastsByCategory(kw)
    return jsonify({ list: list.map(mapAlbum), isEnd: true })
  }
  return jsonify({ list: [] })
}

async function getSongs(ext) {
  const { gid, id } = argsify(ext)
  if (gid == GID.PODCAST_EPISODES && id) {
    const xmlUrl = decodeURIComponent(id)
    const list = await loadEpisodesByXml(xmlUrl)
    return jsonify({ list: list.map(mapSong) })
  }
  return jsonify({ list: [] })
}

async function getArtists() { return jsonify({ list: [] }) }
async function getPlaylists() { return jsonify({ list: [] }) }

async function search(ext) {
  const { text, type } = argsify(ext)
  if (!text) return jsonify({})
  const list = await loadPodcastsByCategory(text)
  if (type === 'album') return jsonify({ list: list.map(mapAlbum), isEnd: true })
  return jsonify({})
}

async function getSongInfo(ext) {
  const { trackId } = argsify(ext)
  if (!trackId) return jsonify({ urls: [] })
  const mp3 = decodeURIComponent(trackId)
  return jsonify({ urls: [toHttps(mp3)] })
}