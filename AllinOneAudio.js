/*!
 * @name fm_union
 * @description 喜马拉雅+荔枝FM 无损合并
 * @version v1.0
 * @author codex
 * @key csp_fmunion
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = { 'User-Agent': UA }
const PAGE_LIMIT = 20
const SEARCH_PAGE_LIMIT = 5
const SOURCE_XM = 'xmly'
const SOURCE_LZ = 'lizhi'

const GID = {
  RECOMMENDED_ALBUMS: '1',
  TAG_ALBUMS: '2',
  ALBUM_TRACKS: '3',
}

// 喜马拉雅原版完整分类 + 荔枝补充分类
const appConfig = {
  ver: 1,
  name: 'fm_union',
  message: '',
  warning: '',
  desc: '',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: '推荐', type: 'song', ui: 1, showMore: true, ext: { gid: GID.RECOMMENDED_ALBUMS, source: SOURCE_XM } },
      { name: '有声书', type: 'song', ui: 1, showMore: true, ext: { gid: GID.TAG_ALBUMS, kw: '有声书', source: SOURCE_XM } },
      { name: '播客', type: 'song', ui: 1, showMore: true, ext: { gid: GID.TAG_ALBUMS, kw: '播客', source: SOURCE_XM } },
      { name: '历史', type: 'song', ui: 1, showMore: true, ext: { gid: GID.TAG_ALBUMS, kw: '历史', source: SOURCE_XM } },
      { name: '图书', type: 'song', ui: 1, showMore: true, ext: { gid: GID.TAG_ALBUMS, kw: '图书', source: SOURCE_XM } },
      { name: '热门', type: 'song', ui: 1, showMore: true, ext: { gid: GID.TAG_ALBUMS, kw: '热门', source: SOURCE_XM } },
      { name: '小说', type: 'song', ui: 1, showMore: true, ext: { gid: GID.TAG_ALBUMS, kw: '小说', source: SOURCE_XM } },
      { name: '相声', type: 'song', ui: 1, showMore: true, ext: { gid: GID.TAG_ALBUMS, kw: '相声', source: SOURCE_XM } },
      { name: '音乐', type: 'song', ui: 1, showMore: true, ext: { gid: GID.TAG_ALBUMS, kw: '音乐', source: SOURCE_XM } },
      { name: '悬疑', type: 'song', ui: 1, showMore: true, ext: { gid: GID.TAG_ALBUMS, kw: '悬疑', source: SOURCE_XM } },
      { name: '情感', type: 'song', ui: 1, showMore: true, ext: { gid: GID.TAG_ALBUMS, kw: '情感', source: SOURCE_LZ } },
      { name: '助眠', type: 'song', ui: 1, showMore: true, ext: { gid: GID.TAG_ALBUMS, kw: '助眠', source: SOURCE_LZ } },
      { name: '儿童', type: 'song', ui: 1, showMore: true, ext: { gid: GID.TAG_ALBUMS, kw: '儿童', source: SOURCE_LZ } },
      { name: '脱口秀', type: 'song', ui: 1, showMore: true, ext: { gid: GID.TAG_ALBUMS, kw: '脱口秀', source: SOURCE_LZ } },
    ]
  },
  tabMe: { name: '我的', groups: [{ name: '红心', type: 'song' }] },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '节目', type: 'song', ext: { type: 'track' } },
    ]
  }
}

function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}) }
function toHttps(url) {
  if (!url) return ''
  let s = `${url}`
  if (s.startsWith('//')) return 'https:' + s
  if (s.startsWith('http://')) return s.replace(/^http:\//, 'https://')
  if (!s.startsWith('http')) return 'https://imagev2.xmcdn.com/' + s.replace(/^\//, '')
  return s
}
function firstArray(...candidates) { for (const i of candidates) if (Array.isArray(i) && i.length > 0) return i; return [] }
function isPaidItem(item) {
  if (!item) return false
  return !!(item.isPaid || item.is_paid || item.isVip || item.is_vip || item.payType > 0 || item.needPay || item.need_pay)
}
async function fetchJson(url, extraHeaders = {}) {
  try {
    const { data } = await $fetch.get(url, { headers: { ...headers, ...extraHeaders } })
    return safeArgs(data)
  } catch (e) { return {} }
}

// ==================== 喜马拉雅原版逻辑 ====================
async function xm_loadRecommended(page = 1) {
  const urls = [
    `https://mobile.ximalaya.com/mobile/discovery/v3/recommend/album?pageId=${page}&pageSize=${PAGE_LIMIT}`,
    `https://www.ximalaya.com/revision/search?core=album&kw=&page=${page}&rows=${PAGE_LIMIT}`
  ]
  for (const url of urls) { try { const d = await fetchJson(url); const l = firstArray(d.data?.list, d.data?.albums, d.list, d.albums); if (l.length) return l } catch {} }
  return []
}
async function xm_searchTrack(keyword, page = 1) {
  const url = `https://www.ximalaya.com/revision/search?core=track&kw=${encodeURIComponent(keyword)}&page=${page}&rows=${PAGE_LIMIT}`
  const d = await fetchJson(url)
  return firstArray(d.data?.result?.response?.docs, d.data?.list, d.list)
}
async function xm_getPlayUrl(trackId) {
  const url = `https://www.ximalaya.com/revision/play/v1/audio?id=${trackId}&ptype=1`
  const d = await fetchJson(url)
  return d?.data?.src || ''
}
function xm_mapTrack(item) {
  return {
    id: `${item?.trackId ?? item?.id ?? ''}`,
    name: item?.title ?? item?.trackTitle ?? '',
    cover: toHttps(item?.coverLarge ?? item?.coverUrl ?? item?.albumCover ?? ''),
    duration: parseInt(item?.duration ?? 0),
    artist: { name: item?.nickname ?? item?.anchorName ?? '主播' },
    ext: { source: SOURCE_XM, trackId: `${item?.trackId ?? item?.id ?? ''}` }
  }
}

// ==================== 荔枝原版逻辑 ====================
async function lz_search(keyword, page = 1) {
  const url = `https://m.lizhi.fm/vodapi/search/voice?keywords=${encodeURIComponent(keyword)}&page=${page}`
  const d = await fetchJson(url)
  return firstArray(d.data) || []
}
async function lz_getPlayUrl(trackId) {
  const d = await fetchJson(`https://m.lizhi.fm/vodapi/voice/play/${trackId}`)
  return d?.data?.trackUrl || ''
}
function lz_mapTrack(item) {
  const v = item?.voiceInfo || item
  const u = item?.userInfo || item
  return {
    id: `${v?.voiceId ?? v?.id ?? ''}`,
    name: v?.name ?? v?.title ?? '未知',
    cover: toHttps(v?.imageUrl ?? v?.cover ?? ''),
    duration: parseInt(v?.duration ?? 0),
    artist: { name: u?.name ?? u?.nickname ?? '主播' },
    ext: { source: SOURCE_LZ, trackId: `${v?.voiceId ?? v?.id ?? ''}` }
  }
}

// ==================== 统一出口 ====================
async function getConfig() { return jsonify(appConfig) }

async function getSongs(ext) {
  const { gid, kw, source, page = 1 } = safeArgs(ext)
  let list = [], mapped = []

  if (source === SOURCE_XM) {
    if (gid == GID.RECOMMENDED_ALBUMS) list = await xm_loadRecommended(page)
    if (gid == GID.TAG_ALBUMS) list = await xm_searchTrack(kw, page)
    mapped = list.filter(i => !isPaidItem(i)).map(xm_mapTrack)
  }

  if (source === SOURCE_LZ) {
    list = await lz_search(kw, page)
    mapped = list.map(lz_mapTrack)
  }

  return jsonify({ list: mapped })
}

async function search(ext) {
  const { text, page } = safeArgs(ext)
  if (!text) return jsonify({ list: [] })
  const xm = (await xm_searchTrack(text, page)).filter(i => !isPaidItem(i)).map(xm_mapTrack)
  const lz = (await lz_search(text, page)).map(lz_mapTrack)
  return jsonify({ list: [...xm, ...lz] })
}

async function getSongInfo(ext) {
  const { trackId, source } = safeArgs(ext)
  if (!trackId) return jsonify({ urls: [] })
  const url = source === SOURCE_XM ? await xm_getPlayUrl(trackId) : await lz_getPlayUrl(trackId)
  return jsonify({ urls: url ? [toHttps(url)] : [] })
}

// 兼容占位
async function getAlbums() { return jsonify({ list: [] }) }
async function getArtists() { return jsonify({ list: [] }) }
async function getPlaylists() { return jsonify({ list: [] }) }