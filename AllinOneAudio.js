/*!
 * @name fm_union
 * @description 喜马拉雅+荔枝FM 二合一听书脚本
 * @version v1.0
 * @author codex
 * @key csp_fmunion
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
const headers = { 'User-Agent': UA }

const PAGE_LIMIT = 20
const SEARCH_PAGE_LIMIT = 5
const SOURCE_XM = 'xmly'
const SOURCE_LZ = 'lizhi'

const GID = {
  RECOMMENDED: '1',
  TAG: '2',
  ALBUM_TRACKS: '3',
}

// 超丰富首页分类（喜马拉雅真实全分类）
const ALL_CATEGORIES = [
  { name: '推荐', kw: '推荐', source: SOURCE_XM },
  { name: '有声书', kw: '有声书', source: SOURCE_XM },
  { name: '小说', kw: '小说', source: SOURCE_XM },
  { name: '玄幻', kw: '玄幻', source: SOURCE_XM },
  { name: '都市', kw: '都市', source: SOURCE_XM },
  { name: '悬疑', kw: '悬疑', source: SOURCE_XM },
  { name: '历史', kw: '历史', source: SOURCE_XM },
  { name: '相声', kw: '相声', source: SOURCE_XM },
  { name: '评书', kw: '评书', source: SOURCE_XM },
  { name: '情感', kw: '情感', source: SOURCE_XM },
  { name: '助眠', kw: '助眠', source: SOURCE_LZ },
  { name: '儿童', kw: '儿童', source: SOURCE_XM },
  { name: '综艺', kw: '综艺', source: SOURCE_XM },
  { name: '教育', kw: '教育', source: SOURCE_XM },
  { name: '播客', kw: '播客', source: SOURCE_LZ },
  { name: '脱口秀', kw: '脱口秀', source: SOURCE_LZ },
  { name: '人文', kw: '人文', source: SOURCE_LZ },
  { name: '健康', kw: '健康', source: SOURCE_XM },
  { name: '财经', kw: '财经', source: SOURCE_XM },
  { name: '英语', kw: '英语', source: SOURCE_LZ },
]

const appConfig = {
  ver: 1,
  name: 'FM合集',
  message: '喜马拉雅+荔枝FM 二合一',
  warning: '',
  desc: '双平台免费有声书、播客、电台',
  tabLibrary: {
    name: '探索',
    groups: ALL_CATEGORIES.map(cat => ({
      name: cat.name,
      type: 'song',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG,
        kw: cat.kw,
        source: cat.source
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
  if (s.startsWith('http://')) return s.replace(/^http:\//, 'https://')
  return s
}

function cleanText(t) {
  return `${t ?? ''}`.replace(/\s+/g, ' ').trim()
}

function firstArray(...candidates) {
  for (const i of candidates) if (Array.isArray(i) && i.length > 0) return i
  return []
}

function isPaidItem(item) {
  if (!item) return false
  return !!(
    item.isPaid || item.is_paid || item.isVip || item.is_vip ||
    item.payType > 0 || item.needPay || item.need_paid || item.price > 0
  )
}

async function fetch(url) {
  try {
    const { data } = await $fetch.get(url, { headers })
    return safeArgs(data)
  } catch (e) {
    return {}
  }
}

// ------------------------------
// 喜马拉雅
// ------------------------------
async function xm_search(keyword, page = 1) {
  const url = `https://www.ximalaya.com/revision/search?core=track&kw=${encodeURIComponent(keyword)}&page=${page}&rows=${PAGE_LIMIT}`
  const d = await fetch(url)
  return firstArray(d?.data?.result?.response?.docs, d?.data?.list, d?.list)
}

async function xm_tracks(albumId, page = 1) {
  const url = `https://www.ximalaya.com/revision/album/v1/getTracksList?albumId=${albumId}&pageNum=${page}`
  const d = await fetch(url)
  return firstArray(d?.data?.tracks, d?.data?.list)
}

async function xm_play(trackId) {
  const url = `https://www.ximalaya.com/revision/play/v1/audio?id=${trackId}&ptype=1`
  const d = await fetch(url)
  return d?.data?.src || d?.src || ''
}

// ------------------------------
// 荔枝FM
// ------------------------------
async function lz_search(keyword, page = 1) {
  const url = `https://m.lizhi.fm/vodapi/search/voice?keywords=${encodeURIComponent(keyword)}&page=${page}`
  const d = await fetch(url)
  return firstArray(d?.data)
}

async function lz_play(trackId) {
  const d = await fetch(`https://m.lizhi.fm/vodapi/voice/play/${trackId}`)
  return d?.data?.trackUrl || ''
}

// ------------------------------
// 数据映射
// ------------------------------
function mapTrack(item, source) {
  const id = `${item?.trackId || item?.id || item?.voiceInfo?.voiceId || ''}`
  const name = cleanText(item?.title || item?.name || item?.voiceInfo?.name || '未知节目')
  const cover = toHttps(item?.coverUrl || item?.cover || item?.voiceInfo?.imageUrl || '')
  const duration = parseInt(item?.duration || 0)
  return { id, name, cover, duration, source, ext: { source, trackId: id } }
}

// ------------------------------
// 出口函数
// ------------------------------
async function getConfig() {
  return jsonify(appConfig)
}

async function getSongs(ext) {
  const { gid, kw, source, page = 1 } = argsify(ext)
  let list = []

  if (gid == GID.TAG) {
    if (source === SOURCE_XM) list = await xm_search(kw, page)
    if (source === SOURCE_LZ) list = await lz_search(kw, page)
  }

  const freeList = list.filter(i => !isPaidItem(i))
  return jsonify({ list: freeList.map(i => mapTrack(i, source)) })
}

async function search(ext) {
  const { text, page, type } = argsify(ext)
  if (!text || type !== 'track') return jsonify({})

  const xmList = await xm_search(text, page)
  const lzList = await lz_search(text, page)
  const combined = [...xmList, ...lzList].filter(i => !isPaidItem(i))

  return jsonify({ list: combined.map(i => mapTrack(i, i.trackId ? SOURCE_XM : SOURCE_LZ)) })
}

async function getSongInfo(ext) {
  const { trackId, source } = argsify(ext)
  if (!trackId) return jsonify({ urls: [] })

  let url = ''
  if (source === SOURCE_XM) url = await xm_play(trackId)
  if (source === SOURCE_LZ) url = await lz_play(trackId)

  return jsonify({ urls: url ? [toHttps(url)] : [] })
}

// 兼容旧接口
async function getAlbums() { return jsonify({ list: [] }) }
async function getArtists() { return jsonify({ list: [] }) }
async function getPlaylists() { return jsonify({ list: [] }) }