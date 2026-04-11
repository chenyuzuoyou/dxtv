/*!
 * @name qingtingfm
 * @description 蜻蜓FM 参照荔枝FM模板 首页直连版
 * @author codex
 * @key csp_qingtingfm
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
const headers = {
  'User-Agent': UA,
  'Referer': 'https://m.qingting.fm/'
}
const PAGE_LIMIT = 999
const SEARCH_PAGE_LIMIT = 5
const QT_SOURCE = 'qingting'
const GID = {
  RECOMMENDED_ALBUMS: '1',
  TAG_ALBUMS: '2',
  ALBUM_TRACKS: '3',
}

// 全分类，和荔枝一样丰富
const allCategories = [
  '有声书', '播客', '小说', '相声', '评书',
  '历史', '助眠', '音乐', '儿童', '情感',
  '脱口秀', '人文', '科技', '娱乐', '教育',
  '广播剧', '资讯', '戏曲', '悬疑', '健康'
];

const appConfig = {
  ver: 1,
  name: '蜻蜓FM',
  message: '',
  warning: '',
  desc: '蜻蜓FM有声书、电台、节目直连播放',
  tabLibrary: {
    name: '探索',
    // 完全照荔枝：type = song，点击直接播，无层级空白
    groups: [
      {
        name: '我的推荐',
        type: 'song',
        showMore: true,
        ext: { gid: GID.TAG_ALBUMS, kw: '热门推荐' }
      },
      ...allCategories.map(kw => ({
        name: kw,
        type: 'song',
        showMore: true,
        ext: { gid: GID.TAG_ALBUMS, kw: kw }
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

// ==================== 映射完全照荔枝 ====================
function mapAlbum(item) {
  const id = `${item?.id ?? item?.channel_id ?? ''}`
  return {
    id: id,
    name: cleanText(item?.title ?? item?.name ?? '未知专辑'),
    cover: toHttps(item?.cover ?? item?.cover_url ?? item?.pic ?? ''),
    artist: {
      id: `${item?.uid ?? ''}`,
      name: cleanText(item?.nickname ?? '主播')
    },
    ext: {
      gid: GID.ALBUM_TRACKS,
      id: id,
      source: QT_SOURCE,
      type: 'album'
    }
  }
}

function mapTrack(item) {
  const trackId = `${item?.id ?? item?.program_id ?? ''}`
  const trackName = cleanText(item?.title ?? item?.name ?? '未知节目')
  return {
    id: trackId,
    name: trackName,
    cover: toHttps(item?.cover ?? item?.cover_url ?? ''),
    duration: parseInt(item?.duration ?? 0),
    artist: {
      id: `${item?.uid ?? ''}`,
      name: cleanText(item?.nickname ?? '主播')
    },
    ext: {
      source: QT_SOURCE,
      trackId: trackId,
      songName: trackName
    }
  }
}

// ==================== 加载逻辑完全照荔枝 ====================
async function loadAlbumsByKeyword(keyword, page = 1) {
  const kw = encodeURIComponent(keyword || '热门')
  const url = `https://i.qingting.fm/capi/v3/search/programs?q=${kw}&page=${page}&pagesize=50`
  const res = await fetchJson(url)
  const list = firstArray(res?.data, res?.list) || []
  return list
}

async function loadAlbumTracks(albumId) {
  if (!albumId) return []
  const url = `https://i.qingting.fm/capi/v3/channels/${albumId}/programs?page=1&pagesize=200`
  const data = await fetchJson(url)
  return firstArray(data?.data, data?.list, data?.programs) || []
}

// ==================== 出口函数 1:1 复刻荔枝 ====================
async function getConfig() {
  return jsonify(appConfig)
}

async function getAlbums(ext) {
  const { page = 1, gid, kw } = argsify(ext)
  if (gid == GID.TAG_ALBUMS) {
    const list = await loadAlbumsByKeyword(kw, page)
    return jsonify({
      list: list.map(mapAlbum),
      isEnd: list.length < 40
    })
  }
  return jsonify({ list: [] })
}

async function getSongs(ext) {
  const { gid, id, kw, page = 1 } = argsify(ext)

  if (gid == GID.ALBUM_TRACKS && id) {
    const list = await loadAlbumTracks(id)
    return jsonify({ list: list.map(mapTrack) })
  }

  if (gid == GID.TAG_ALBUMS && kw) {
    const list = await loadAlbumsByKeyword(kw, page)
    return jsonify({
      list: list.map(mapTrack),
      isEnd: list.length < 40
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

async function search(ext) {
  const { text, page = 1, type } = argsify(ext)
  if (!text) return jsonify({})
  const list = await loadAlbumsByKeyword(text, page)

  if (type === 'album') {
    return jsonify({ list: list.map(mapAlbum), isEnd: list.length < 40 })
  } else if (type === 'track' || type === 'song') {
    return jsonify({ list: list.map(mapTrack), isEnd: list.length < 40 })
  }

  return jsonify({})
}

async function getSongInfo(ext) {
  const { trackId } = argsify(ext)
  if (!trackId) return jsonify({ urls: [] })

  const url1 = `https://i.qingting.fm/capi/v3/programs/${trackId}/play`
  const data = await fetchJson(url1)
  const playUrl = data?.data?.url || data?.url || ''

  return jsonify({ urls: playUrl ? [toHttps(playUrl)] : [] })
}