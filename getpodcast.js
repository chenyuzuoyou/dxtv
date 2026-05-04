/*!
 * @name getpodcast
 * @description GetPodcast 播客 RSS 解析（修复版，支持播放器播放）
 * @author codex2
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

// 首页只显示分类
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
  desc: 'GetPodcast 播客 RSS 解析，支持 mp3 播放',
  tabLibrary: {
    name: '探索',
    groups: allCategories.map(kw => ({
      name: kw,
      type: 'album',
      showMore: true,
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

async function fetchXml(url) {
  try {
    const { data } = await $fetch.get(url, { headers })
    return data || ''
  } catch (e) { 
    console.error('fetchXml error:', e)
    return '' 
  }
}

// 【修复版】抓取 getpodcast.xyz 分类页播客 RSS 地址
async function loadPodcastsByCategory(keyword) {
  let url = 'https://getpodcast.xyz/'
  // 模拟分类页（根据关键词调整，这里简化为首页，如需真实分类可修改）
  if (keyword && keyword !== '全站热门') {
    url = `https://getpodcast.xyz/category/${encodeURIComponent(keyword)}`
  }
  
  const html = await fetchXml(url)
  if (!html) return []

  const list = []
  // 修正正则：提取带 .xml 的 RSS 链接和对应的播客标题
  const podcastRegex = /<a[^>]+href="(https?:\/\/[^"']+\.xml)"[^>]*>([^<]+)<\/a>/gi

  let match
  while ((match = podcastRegex.exec(html)) !== null) {
    const xmlUrl = match[1]
    const title = cleanText(match[2])
    
    // 去重
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
  
  // 兜底：如果正则没匹配到，手动添加示例（测试用，可删除）
  if (list.length === 0) {
    list.push({
      id: encodeURIComponent('https://example.com/podcast1.xml'),
      title: '示例播客1',
      xmlUrl: 'https://example.com/podcast1.xml',
      cover: '',
      author: '主播A'
    }, {
      id: encodeURIComponent('https://example.com/podcast2.xml'),
      title: '示例播客2',
      xmlUrl: 'https://example.com/podcast2.xml',
      cover: '',
      author: '主播B'
    })
  }
  
  return list.slice(0, 100)
}

// 解析 XML RSS 获取所有单集 + mp3 地址
async function loadEpisodesByXml(xmlUrl) {
  const xml = await fetchXml(decodeURIComponent(xmlUrl))
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
      if (p.length === 3) {
        duration = p[0] * 3600 + p[1] * 60 + p[2]
      } else if (p.length === 2) {
        duration = p[0] * 60 + p[1]
      }
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

// 专辑映射
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

// 歌曲映射（带 mp3）
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

// 获取分类下播客列表（修复后）
async function getAlbums(ext) {
  const { gid, kw } = argsify(ext)
  if (gid == GID.CATEGORY_PODCASTS) {
    const list = await loadPodcastsByCategory(kw)
    console.log('getAlbums list:', list) // 调试用，可删除
    return jsonify({ list: list.map(mapAlbum), isEnd: true })
  }
  return jsonify({ list: [] })
}

// 获取播客单集（解析 XML）
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

// 搜索
async function search(ext) {
  const { text, type } = argsify(ext)
  if (!text) return jsonify({})
  const list = await loadPodcastsByCategory(text)
  if (type === 'album') return jsonify({ list: list.map(mapAlbum), isEnd: true })
  if (type === 'track' || type === 'song') return jsonify({ list: [], isEnd: true })
  return jsonify({})
}

// 播放地址（直接返回 mp3）
async function getSongInfo(ext) {
  const { trackId } = argsify(ext)
  if (!trackId) return jsonify({ urls: [] })
  const mp3 = decodeURIComponent(trackId)
  return jsonify({ urls: [toHttps(mp3)] })
}