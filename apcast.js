/*!
 * @name apple_podcast
 * @description 苹果播客 公开接口版 (修复版)
 * @author codex66
 * @key csp_applepodcast
 */
const $config = typeof $config_str !== 'undefined' ? argsify($config_str) : {}
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const headers = { 'User-Agent': UA }

const PAGE_LIMIT = 20
const SOURCE = 'apple'

const GID = {
  RECOMMENDED: '1',
  CATEGORY: '2',
  ALBUM_DETAIL: '3',
}

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
  name: "苹果播客",
  desc: "Apple Podcasts 公开播客",
  tabLibrary: {
    name: "探索",
    groups: [
      {
        name: "推荐播客",
        type: "album",
        ui: 1,
        showMore: true,
        ext: { gid: GID.RECOMMENDED }
      },
      ...podcastCategories.map(c => ({
        name: c.name,
        type: "album",
        ui: 1,
        showMore: true,
        ext: {
          gid: GID.CATEGORY,
          kw: c.kw
        }
      }))
    ]
  },
  tabSearch: {
    name: "搜索",
    groups: [
      { name: "播客", type: "album", ext: { type: "album" } }
    ]
  },
  tabMe: {
    name: "我的",
    groups: [
      { name: "收藏", type: "song" },
      { name: "订阅", type: "album" }
    ]
  }
}

function safeArgs(d) {
  if (!d) return {}
  try {
    return typeof d === "string" ? argsify(d) : d
  } catch (e) {
    return {}
  }
}

function firstArray(...arrays) {
  for (const a of arrays) {
    if (Array.isArray(a) && a.length > 0) return a
  }
  return []
}

async function fetchJson(url) {
  try {
    const res = await $fetch.get(url, { headers })
    // 兼容不同的 HTTP 客户端返回格式 (判断是否有 data 字段，防止解构出 undefined)
    const body = (res && res.data !== undefined) ? res.data : res
    return safeArgs(body)
  } catch (e) {
    return {}
  }
}

// 统一加载播客接口 (增加了 offset 分页计算)
async function loadPodcasts(keyword, page = 1) {
  const offset = (page - 1) * PAGE_LIMIT
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&media=podcast&limit=${PAGE_LIMIT}&offset=${offset}&country=cn`
  const res = await fetchJson(url)
  return firstArray(res.results)
}

// 解析 RSS 单集
async function loadEpisodes(feedUrl) {
  try {
    const res = await $fetch.get(feedUrl, {
      headers: { ...headers, Accept: "application/xml" }
    })
    const xml = (res && res.data !== undefined ? res.data : res) || ""
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
    
    return items.map(item => {
      // 处理标题可能含有的 CDATA 标签
      let title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "无标题"
      title = title.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim()
      
      const url = item.match(/<enclosure[^>]*url="([^"]+)"/i)?.[1] || ""
      
      // 兼容标准播客用的 itunes:duration 标签
      const durMatch = item.match(/<itunes:duration>([\s\S]*?)<\/itunes:duration>/i) || item.match(/<duration>([\s\S]*?)<\/duration>/i)
      let dur = durMatch ? durMatch[1].trim() : "0"
      
      // 将 "HH:MM:SS" 或 "MM:SS" 格式转换为秒数整数
      let durationSec = 0
      if (dur.includes(':')) {
        const parts = dur.split(':').map(Number)
        if (parts.length === 3) durationSec = parts[0] * 3600 + parts[1] * 60 + parts[2]
        if (parts.length === 2) durationSec = parts[0] * 60 + parts[1]
      } else {
        durationSec = parseInt(dur) || 0
      }

      return { title, url, duration: durationSec }
    }).filter(i => i.url)
  } catch (e) {
    return []
  }
}

// 专辑格式化
function mapAlbum(i) {
  return {
    // 强制转换为 String：许多前端框架接收 Number 类型的 ID 会导致列表渲染彻底崩溃
    id: String(i.collectionId || Math.random().toString(36).slice(2)),
    name: i.collectionName || i.trackName || "未知播客",
    cover: i.artworkUrl600 || i.artworkUrl100 || "",
    artist: { name: i.artistName || "主播" },
    ext: {
      gid: GID.ALBUM_DETAIL,
      feedUrl: i.feedUrl
    }
  }
}

// ==============================
// 标准出口方法
// ==============================

async function getConfig() {
  return jsonify(appConfig)
}

// 首页列表、分类列表 都走这里
async function getAlbums(ext) {
  const args = safeArgs(ext)
  // 兼容部分框架会将 ext 包装在 { ext: {...}, page: 1 } 中的情况
  const actualExt = args.ext || args
  const gid = actualExt.gid
  const kw = actualExt.kw
  const page = args.page || actualExt.page || 1

  let list = []

  if (gid === GID.RECOMMENDED) {
    list = await loadPodcasts("podcast", page)
  } else if (gid === GID.CATEGORY && kw) {
    list = await loadPodcasts(kw, page)
  }

  return jsonify({
    list: list.map(mapAlbum)
  })
}

// 播客详情单集
async function getSongs(ext) {
  const args = safeArgs(ext)
  const actualExt = args.ext || args
  
  if (actualExt.gid !== GID.ALBUM_DETAIL || !actualExt.feedUrl) {
    return jsonify({ list: [] })
  }

  const eps = await loadEpisodes(actualExt.feedUrl)
  return jsonify({
    list: eps.map(e => ({
      id: String(e.url), // 同样强制 String 防止奔溃
      name: e.title,
      duration: e.duration,
      artist: { name: "播客主播" },
      ext: { url: e.url }
    }))
  })
}

// 搜索
async function search(ext) {
  const args = safeArgs(ext)
  const actualExt = args.ext || args
  const text = args.text || actualExt.text
  const page = args.page || actualExt.page || 1
  
  if (!text) {
    return jsonify({ list: [] })
  }
  
  const list = await loadPodcasts(text, page)
  return jsonify({ list: list.map(mapAlbum) })
}

// 播放地址
async function getSongInfo(ext) {
  const args = safeArgs(ext)
  const actualExt = args.ext || args
  return jsonify({ urls: actualExt.url ? [actualExt.url] : [] })
}

async function getArtists() { return jsonify({ list: [] }) }
async function getPlaylists() { return jsonify({ list: [] }) }
