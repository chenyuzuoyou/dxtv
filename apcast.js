/*!
 * @name apple_podcast
 * @description 苹果播客 公开接口版
 * @author codex4
 * @key csp_applepodcast
 */
const $config = argsify($config_str)
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
      // 分类：这里格式必须标准，才能自然加载
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
  return typeof d === "string" ? argsify(d) : (d || {})
}

function firstArray(...arrays) {
  for (const a of arrays) {
    if (Array.isArray(a) && a.length > 0) return a
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

// 统一加载播客接口
async function loadPodcasts(keyword, page = 1) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&media=podcast&limit=${PAGE_LIMIT}&country=cn`
  const res = await fetchJson(url)
  return firstArray(res.results)
}

// 解析 RSS 单集
async function loadEpisodes(feedUrl) {
  try {
    const res = await $fetch.get(feedUrl, {
      headers: { ...headers, Accept: "application/xml" }
    })
    const xml = res.data || ""
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items.map(item => {
      const title = item.match(/<title>(.*?)<\/title>/)?.[1] || "无标题"
      const url = item.match(/<enclosure.*?url="(.*?)"/)?.[1] || ""
      const dur = item.match(/<duration>(.*?)<\/duration>/)?.[1] || "0"
      return { title, url, duration: dur }
    }).filter(i => i.url)
  } catch (e) {
    return []
  }
}

// 专辑格式化
function mapAlbum(i) {
  return {
    id: i.collectionId || Math.random().toString(36).slice(2),
    name: i.collectionName || "未知播客",
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
  const gid = args.gid
  const kw = args.kw
  const page = args.page || 1

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
  if (args.gid !== GID.ALBUM_DETAIL || !args.feedUrl) {
    return jsonify({ list: [] })
  }

  const eps = await loadEpisodes(args.feedUrl)
  return jsonify({
    list: eps.map(e => ({
      id: e.url,
      name: e.title,
      duration: parseInt(e.duration) || 0,
      artist: { name: "播客主播" },
      ext: { url: e.url }
    }))
  })
}

// 搜索
async function search(ext) {
  const args = safeArgs(ext)
  if (!args.text || args.type !== "album") {
    return jsonify({ list: [] })
  }
  const list = await loadPodcasts(args.text, args.page || 1)
  return jsonify({ list: list.map(mapAlbum) })
}

// 播放地址
async function getSongInfo(ext) {
  const args = safeArgs(ext)
  return jsonify({ urls: args.url ? [args.url] : [] })
}

async function getArtists() { return jsonify({ list: [] }) }
async function getPlaylists() { return jsonify({ list: [] }) }