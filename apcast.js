/*!
 * @name apple_podcast
 * @description 苹果播客 公开接口版
 * @author codex2
 * @key csp_applepodcast
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const headers = { 'User-Agent': UA }

const PAGE_LIMIT = 20
const SOURCE = 'apple'

const GID = {
  RECOMMENDED_ALBUMS: '1',
  TAG_ALBUMS: '2',
  ALBUM_TRACKS: '3',
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
  name: '苹果播客',
  message: '',
  warning: '',
  desc: 'Apple Podcasts 公开接口',
  tabLibrary: {
    name: '探索',
    groups: [
      {
        name: '推荐播客',
        type: 'album',
        ui: 1,
        showMore: true,
        ext: { gid: GID.RECOMMENDED_ALBUMS }
      },
      ...podcastCategories.map(item => ({
        name: item.name,
        type: 'album',
        ui: 1,
        showMore: true,
        ext: {
          gid: GID.TAG_ALBUMS,
          kw: item.kw,
        }
      }))
    ]
  },
  tabMe: {
    name: '我的',
    groups: [
      { name: '红心', type: 'song' },
      { name: '专辑', type: 'album' }
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '专辑', type: 'album', ext: { type: 'album' } },
    ]
  }
}

function safeArgs(data) {
  return typeof data === 'string' ? argsify(data) : (data ?? {})
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

// 核心：加载播客列表（推荐、分类、搜索都用它）
async function loadPodcasts(keyword, page = 1) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&media=podcast&limit=${PAGE_LIMIT}&country=cn`
  const res = await fetchJson(url)
  return firstArray(res?.results) || []
}

// 解析 RSS 播客单集
async function loadTracksFromFeed(feedUrl) {
  try {
    const res = await $fetch.get(feedUrl, {
      headers: { ...headers, Accept: 'application/xml' }
    })
    const xml = res.data || ''
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items.map(item => {
      const title = item.match(/<title>(.*?)<\/title>/)?.[1] || '无标题'
      const url = item.match(/<enclosure.*?url="(.*?)"/)?.[1] || ''
      const dur = item.match(/<duration>(.*?)<\/duration>/)?.[1] || '0'
      return { title, url, duration: dur }
    }).filter(i => i.url)
  } catch (e) {
    return []
  }
}

// 专辑格式化
function mapAlbum(item) {
  return {
    id: item.collectionId || Math.random().toString(36),
    name: item.collectionName || '未知专辑',
    cover: item.artworkUrl600 || item.artworkUrl100 || '',
    artist: { name: item.artistName || '主播' },
    ext: {
      gid: GID.ALBUM_TRACKS,
      feedUrl: item.feedUrl,
    }
  }
}

// ==========================
// 接口实现
// ==========================
async function getConfig() {
  return jsonify(appConfig)
}

// 首页 + 分类（这里是你之前坏的地方，我修好了）
async function getAlbums(ext) {
  const args = safeArgs(ext)
  const gid = args.gid
  const kw = args.kw
  const page = args.page || 1

  let list = []

  if (gid === GID.RECOMMENDED_ALBUMS) {
    list = await loadPodcasts('podcast', page)
  } else if (gid === GID.TAG_ALBUMS && kw) {
    list = await loadPodcasts(kw, page)
  }

  return jsonify({
    list: list.map(mapAlbum)
  })
}

// 点开专辑看单集
async function getSongs(ext) {
  const args = safeArgs(ext)
  if (args.gid !== GID.ALBUM_TRACKS || !args.feedUrl) {
    return jsonify({ list: [] })
  }

  const tracks = await loadTracksFromFeed(args.feedUrl)
  return jsonify({
    list: tracks.map(t => ({
      id: t.url,
      name: t.title,
      duration: parseInt(t.duration) || 0,
      artist: { name: '播客主播' },
      ext: { url: t.url }
    }))
  })
}

// 搜索
async function search(ext) {
  const args = safeArgs(ext)
  if (!args.text || args.type !== 'album') {
    return jsonify({ list: [] })
  }
  const list = await loadPodcasts(args.text, args.page || 1)
  return jsonify({ list: list.map(mapAlbum) })
}

// 播放
async function getSongInfo(ext) {
  const { url } = safeArgs(ext)
  return jsonify({ urls: url ? [url] : [] })
}

async function getArtists() { return jsonify({ list: [] }) }
async function getPlaylists() { return jsonify({ list: [] }) }