/*!
 * @name apple_podcast
 * @description 苹果播客 公开接口版
 * @author codex
 * @key csp_applepodcast
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const headers = { 'User-Agent': UA }

const PAGE_LIMIT = 20
const SOURCE = 'apple'

const GID = {
  TAG_ALBUMS: '2',
  ALBUM_TRACKS: '3',
}

// 苹果播客官方分类
const podcastCategories = [
  { name: '新闻', kw: 'News' },
  { name: '历史', kw: 'History' },
  { name: '喜剧', kw: 'Comedy' },
  { name: '真实犯罪', kw: 'True Crime' },
  { name: '商业', kw: 'Business' },
  { name: '教育', kw: 'Education' },
  { name: '健康', kw: 'Health' },
  { name: '社会文化', kw: 'Society & Culture' },
  { name: '科技', kw: 'Technology' },
  { name: '体育', kw: 'Sports' },
  { name: '哲学', kw: 'Philosophy' },
  { name: '有声书', kw: 'Audiobooks' },
  { name: '脱口秀', kw: 'Talk Shows' },
  { name: '儿童', kw: 'Kids' },
  { name: '音乐', kw: 'Music' },
]

const appConfig = {
  ver: 1,
  name: '苹果播客',
  message: '',
  warning: '',
  desc: 'Apple Podcasts 公开播客源',
  tabLibrary: {
    name: '探索',
    groups: podcastCategories.map(item => ({
      name: item.name,
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_ALBUMS,
        kw: item.kw,
      }
    }))
  },
  tabMe: {
    name: '我的',
    groups: [
      { name: '收藏', type: 'song' },
      { name: '订阅播客', type: 'album' }
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '播客专辑', type: 'album', ext: { type: 'album' } },
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

function firstArray(...candidates) {
  for (const i of candidates) {
    if (Array.isArray(i) && i.length > 0) return i
  }
  return []
}

async function fetchJson(url) {
  try {
    const { data } = await $fetch.get(url, { headers })
    return safeArgs(data)
  } catch (e) {
    return {}
  }
}

// 搜索播客专辑
async function loadAlbumsByKeyword(keyword, page = 1) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&media=podcast&limit=${PAGE_LIMIT}&country=cn`
  const res = await fetchJson(url)
  return firstArray(res?.results) || []
}

// 解析 RSS 获取节目单
async function loadTracksByFeed(feedUrl) {
  try {
    const res = await $fetch.get(feedUrl, {
      headers: { ...headers, 'Accept': 'application/xml' }
    })
    const xml = res.data
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items.map(item => {
      const title = item.match(/<title>(.*?)<\/title>/)?.[1] || '无标题'
      const enclosure = item.match(/<enclosure.*?url="(.*?)"/)?.[1] || ''
      const duration = item.match(/<duration>(.*?)<\/duration>/)?.[1] || '0'
      return { title, enclosure, duration }
    }).filter(i => i.enclosure)
  } catch (e) {
    return []
  }
}

// 专辑映射
function mapAlbum(item) {
  return {
    id: item.collectionId || Math.random().toString(36),
    name: item.collectionName || '未知播客',
    cover: item.artworkUrl600 || item.artworkUrl100 || '',
    artist: {
      name: item.artistName || '主播'
    },
    ext: {
      gid: GID.ALBUM_TRACKS,
      feedUrl: item.feedUrl,
    }
  }
}

// 节目映射
function mapTrack(item) {
  return {
    id: item.enclosure || Math.random().toString(36),
    name: item.title || '无标题节目',
    duration: parseInt(item.duration) || 0,
    artist: { name: '播客主播' },
    ext: {
      source: SOURCE,
      url: item.enclosure
    }
  }
}

// 导出配置
async function getConfig() {
  return jsonify(appConfig)
}

// 获取分类播客列表
async function getAlbums(ext) {
  const { page = 1, gid, kw } = safeArgs(ext)
  if (gid === GID.TAG_ALBUMS) {
    const list = await loadAlbumsByKeyword(kw, page)
    return jsonify({ list: list.map(mapAlbum) })
  }
  return jsonify({ list: [] })
}

// 获取播客内节目单
async function getSongs(ext) {
  const { gid, feedUrl } = safeArgs(ext)
  if (gid !== GID.ALBUM_TRACKS || !feedUrl) {
    return jsonify({ list: [] })
  }

  const tracks = await loadTracksByFeed(feedUrl)
  return jsonify({ list: tracks.map(mapTrack) })
}

// 搜索
async function search(ext) {
  const { text, page, type } = safeArgs(ext)
  if (!text) return jsonify({})

  const list = await loadAlbumsByKeyword(text, page)
  if (type === 'album') {
    return jsonify { list: list.map(mapAlbum) }
  }

  return jsonify({ list: [] })
}

// 播放地址
async function getSongInfo(ext) {
  const { url } = safeArgs(ext)
  if (!url) return jsonify({ urls: [] })
  return jsonify({ urls: [url] })
}

// 空实现（不需要）
async function getArtists() { return jsonify({ list: [] }) }
async function getPlaylists() { return jsonify({ list: [] }) }