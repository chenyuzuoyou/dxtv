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
const SEARCH_PAGE_LIMIT = 5
const SOURCE = 'apple'

const GID = {
  RECOMMENDED_ALBUMS: '1',
  TAG_ALBUMS: '2',
  ALBUM_TRACKS: '3',
}

// 苹果播客官方真实分类
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
  desc: 'Apple Podcasts 公开播客',
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
      { name: '红心', type: 'song' },
      { name: '专辑', type: 'album' }
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '专辑', type: 'album', ext: { type: 'album' } },
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

// 搜索专辑
async function loadAlbumsByKeyword(keyword, page = 1) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&media=podcast&limit=${PAGE_LIMIT}&country=cn`
  const res = await fetchJson(url)
  return firstArray(res?.results) || []
}

// 获取节目列表
async function loadTracksByFeed(feedUrl) {
  try {
    const res = await $fetch.get(feedUrl, { headers: { ...headers, 'Accept': 'application/xml' } })
    const xml = res.data
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items.map(item => ({
      title: item.match(/<title>(.*?)<\/title>/)?.[1] || '无标题',
      enclosure: item.match(/<enclosure url="(.*?)"/)?.[1] || '',
      duration: item.match(/<duration>(.*?)<\/duration>/)?.[1] || '0',
    })).filter(i => i.enclosure)
  } catch (e) {
    return []
  }
}

// 映射专辑
function mapAlbum(item) {
  return {
    id: item.collectionId || item.trackId || Math.random().toString(36),
    name: item.collectionName || item.trackName || '未知专辑',
    cover: item.artworkUrl600 || item.artworkUrl100 || '',
    artist: {
      name: item.artistName || '主播'
    },
    ext: {
      gid: GID.ALBUM_TRACKS,
      id: item.feedUrl || item.collectionId,
      feedUrl: item.feedUrl,
      type: 'album'
    }
  }
}

// 映射节目
function mapTrack(item) {
  return {
    id: item.enclosure || Math.random().toString(36),
    name: item.title || '未知节目',
    cover: '',
    duration: parseInt(item.duration) || 0,
    artist: { name: '播客' },
    ext: {
      source: SOURCE,
      trackId: item.enclosure,
      url: item.enclosure
    }
  }
}

// 出口
async function getConfig() {
  return jsonify(appConfig)
}

async function getAlbums(ext) {
  const { page = 1, gid, kw } = safeArgs(ext)
  if (gid === GID.TAG_ALBUMS) {
    const list = await loadAlbumsByKeyword(kw, page)
    return jsonify({ list: list.map(mapAlbum) })
  }
  return jsonify({ list: [] })
}

async function getSongs(ext) {
  const { page, gid, id, from, text } = argsify(ext)
  let songs = []
  const pn = page || 1

  // ======================
  // ✅ 推荐页 fix：直接用音乐分区接口，不爬主页，必加载
  // ======================
  if (gid == '1') {
    const { data } = await $fetch.get(`https://api.bilibili.com/x/web-interface/dynamic/region?ps=20&pn=${pn}&rid=130`, { headers })
    const res = argsify(data)
    const list = res?.data?.archives || []
    list.forEach(each => {
      songs.push({
        id: `${each.aid}_${each.cid}`,
        name: each.title,
        cover: each.pic,
        duration: each.duration,
        artist: {
          id: `${each.owner.mid}`,
          name: each.owner.name,
          cover: each.owner.face,
        },
        ext: { aid: each.aid, cid: each.cid, bvid: each.bvid }
      })
    })
    return jsonify({ list: songs })
  }

  // ======================
  // ✅ 分类页（支持加载更多）
  // ======================
  if (gid == '2') {
    const { rid } = argsify(ext)
    const { data } = await $fetch.get(`https://api.bilibili.com/x/web-interface/dynamic/region?ps=20&pn=${pn}&rid=${rid}`, { headers })
    const res = argsify(data)
    const list = res?.data?.archives || []
    list.forEach(each => {
      songs.push({
        id: `${each.aid}_${each.cid}`,
        name: each.title,
        cover: each.pic,
        duration: each.duration,
        artist: {
          id: `${each.owner.mid}`,
          name: each.owner.name,
          cover: each.owner.face,
        },
        ext: { aid: each.aid, cid: each.cid, bvid: each.bvid }
      })
    })
    return jsonify({ list: songs })
  }

  // ======================
  // ✅ 分P列表（全部可播放）
  // ======================
  if (gid === '99') {
    const { aid } = argsify(ext)
    let params = { aid: aid }
    const { data } = await $fetch.get(`https://api.bilibili.com/x/web-interface/view/detail?` + dictToURI(params), { headers })
    let view = argsify(data).data?.View

    view?.ugc_season?.sections[0]?.episodes?.forEach(each => {
      songs.push({
        id: `${each.aid}_${each.cid}`,
        name: each.title,
        cover: each.arc.pic,
        duration: each.arc.duration,
        artist: { id: `${view.owner.mid}`, name: view.owner.name, cover: view.owner.face },
        ext: { aid: each.aid, cid: each.cid, bvid: each.bvid }
      })
    })

    if (songs.length == 0) {
      view?.pages?.forEach(each => {
        songs.push({
          id: `${view.aid}_${each.cid}`,
          name: each.part,
          cover: each.first_frame || view.pic,
          duration: each.duration,
          artist: { id: `${view.owner.mid}`, name: view.owner.name, cover: view.owner.face },
          ext: { aid: view.aid, cid: each.cid, bvid: view.bvid }
        })
      })
    }
    return jsonify({ list: songs })
  }

  return jsonify({ list: [] })
}

async function search(ext) {
  const { text, page, type } = safeArgs(ext)
  if (!text) return jsonify({})
  const list = await loadAlbumsByKeyword(text, page)
  if (type === 'album') {
    return jsonify({ list: list.map(mapAlbum) })
  } else {
    return jsonify({ list: [] })
  }
}

async function getSongInfo(ext) {
  const { trackId } = safeArgs(ext)
  if (!trackId) return jsonify({ urls: [] })
  return jsonify({ urls: [trackId] })
}

async function getArtists() { return jsonify({ list: [] }) }
async function getPlaylists() { return jsonify({ list: [] }) }