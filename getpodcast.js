/*!
 * @name getpodcast
 * @description GetPodcast 播客 RSS 解析（终极可用版）
 * @author codex0
 * @key csp_getpodcast
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
const headers = {
  'User-Agent': UA,
  'Referer': 'https://getpodcast.xyz/',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}
const PODCAST_SOURCE = 'getpodcast'
const GID = {
  CATEGORY_PODCASTS: '2',
  PODCAST_EPISODES: '3',
}

const allCategories = [
  '全站热门', '悬疑灵异', '商业财经', '科技数码', '历史人文',
  '情感生活', '影视评论', '英语学习', '儿童启蒙', '脱口秀',
  '犯罪刑侦', '健康养生', '游戏动漫', '资讯热点', '文化读书'
];

const appConfig = {
  ver: 1,
  name: 'GetPodcast',
  message: '',
  warning: '',
  desc: 'GetPodcast 播客 RSS 解析，修复爬取逻辑',
  tabLibrary: {
    name: '探索',
    groups: allCategories.map(kw => ({
      name: kw,
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
function log(msg) { console.log(`[GetPodcast] ${msg}`) }

async function fetchHtml(url) {
  try {
    log(`请求页面: ${url}`)
    const { data, status } = await $fetch.get(url, { headers })
    log(`请求结果: 状态码 ${status}, 数据长度 ${data?.length || 0}`)
    return data || ''
  } catch (e) {
    log(`请求失败: ${e.message}`)
    return ''
  }
}

// 【终极修复】爬取播客 RSS 地址，用更通用的正则
async function loadPodcastsByCategory(keyword) {
  let url = 'https://getpodcast.xyz/'
  if (keyword && keyword !== '全站热门') {
    url = `https://getpodcast.xyz/category/${encodeURIComponent(keyword)}`
  }
  
  const html = await fetchHtml(url)
  if (!html) return []

  const list = []
  const rssUrls = new Set()
  const podcastData = []

  // 1. 先提取所有 .xml 链接
  const rssRegex = /(https?:\/\/[^"'\s]+\.xml)/gi
  let rssMatch
  while ((rssMatch = rssRegex.exec(html)) !== null) {
    rssUrls.add(rssMatch[1])
  }
  log(`找到 ${rssUrls.size} 个 RSS 链接`)

  // 2. 提取播客标题（和 RSS 链接关联）
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi
  let linkMatch
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1]
    const title = cleanText(linkMatch[2])
    if (href.endsWith('.xml') && !rssUrls.has(href)) {
      rssUrls.add(href)
    }
    // 关联标题和 RSS 链接（如果 href 是 .xml）
    if (href.endsWith('.xml')) {
      podcastData.push({ href, title })
    }
  }

  // 3. 合并数据，构建列表
  rssUrls.forEach(xmlUrl => {
    const match = podcastData.find(p => p.href === xmlUrl)
    const title = match?.title || xmlUrl.split('/').pop() || '未知播客'
    if (!list.some(p => p.xmlUrl === xmlUrl)) {
      list.push({
        id: encodeURIComponent(xmlUrl),
        title,
        xmlUrl,
        cover: '',
        author: '播客主播'
      })
    }
  })

  log(`最终解析出 ${list.length} 个播客`)
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
  log(`解析到 ${items.length} 个单集`)
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

async function getAlbums(ext) {
  const { gid, kw } = argsify(ext)
  if (gid == GID.CATEGORY_PODCASTS) {
    log(`点击分类: ${kw}`)
    const list = await loadPodcastsByCategory(kw)
    return jsonify({ list: list.map(mapAlbum), isEnd: true })
  }
  return jsonify({ list: [] })
}

async function getSongs(ext) {
  const { gid, id } = argsify(ext)
  if (gid == GID.PODCAST_EPISODES && id) {
    const xmlUrl = decodeURIComponent(id)
    log(`解析播客: ${xmlUrl}`)
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
  log(`获取播放地址: ${mp3}`)
  return jsonify({ urls: [toHttps(mp3)] })
}