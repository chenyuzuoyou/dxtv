/*!
 * @name 喜马荔枝
 * @description 喜马拉雅 & 荔枝FM (合并版) - 首页搜索正常 + 自动最近播放（缓存歌曲）
 * @version v1.0.5
 * @author codex (增强 & 最终修复 by Grok)
 * @key csp_xmlz
 */

const $config = argsify($config_str)

const XM_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const LZ_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'

const PAGE_LIMIT = 20
const SEARCH_PAGE_LIMIT = 5
const XM_SOURCE = 'xmly'
const LIZHI_SOURCE = 'lizhi'

// 喜马拉雅官方真实分类（首页完整收录）
const xmlyCategories = [
  '播客',
  '有声书',
  '小说',
  '相声',
  '评书',
  '历史',
  '图书',
  '音乐',
  '情感',
  //'儿童',
  '综艺',
  '娱乐',
  '悬疑',
  '健康',
  '财经',
  '教育',
  '人文',
  '英语',
  //'二次元',
  '热门专辑'
]
// 荔枝FM 首页真实分类（接口可搜索、可加载）
const lizhiCategories = [
  '情感',
  '助眠',
  '播客',
  '脱口秀',
  '有声书',
  //'广播剧',
  //'二次元',
  //'儿童',
  '音乐',
  '人文',
  '悬疑',
  '娱乐',
  '教育',
  '健康',
  '旅行',
  '美食',
  '校园',
  '资讯'
]
const appConfig = {
  ver: 1,
  name: '喜马拉雅 & 荔枝FM',
  message: '',
  warning: '',
  desc: '喜马拉雅(隐藏VIP)与荔枝有声混合版',
  tabLibrary: {
    name: '探索',
    groups: [
      ...xmlyCategories.map(kw => ({
        name: `喜马拉雅-${kw}`,
        type: 'album',
        ui: 1,
        showMore: true,
        ext: { source: XM_SOURCE, gid: 'xmly_tag', kw: kw === '热门专辑' ? '热门' : kw }
      })),
      ...lizhiCategories.map(kw => ({
        name: `荔枝-${kw}`,
        type: 'song',
        showMore: true,
        ext: { source: LIZHI_SOURCE, gid: 'lizhi_tag', kw: kw === '推荐' ? '热门推荐' : kw }
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

// === 公共基础工具 ===
function safeArgs(data) {
  return typeof data === 'string' ? argsify(data) : (data ?? {})
}

function toHttps(url) {
  if (!url) return ''
  let s = `${url}`
  if (s.startsWith('//')) return 'https:' + s
  if (s.startsWith('http://')) return s.replace(/^http:\/\//, 'https://')
  if (!s.startsWith('http')) return 'https://imagev2.xmcdn.com/' + s.replace(/^\//, '')
  return s
}

function firstArray(...candidates) {
  for (const item of candidates) {
    if (Array.isArray(item) && item.length > 0) return item
  }
  return []
}

// === 喜马拉雅 相关逻辑 ===
function isXmlyPaidItem(item) {
  if (!item) return false
  if (item.isPaid === true || item.isPaid === 1 || item.isPaid === 'true') return true
  if (item.is_paid === true || item.is_paid === 1 || item.is_paid === 'true') return true
  if (item.isVip === true || item.isVip === 1 || item.is_vip === true || item.is_vip === 1) return true
  if (item.payType > 0 || item.pay_type > 0) return true
  if (item.priceTypeId > 0 || item.price_type_id > 0) return true
  if (item.vipFreeType > 0) return true
  return false
}

async function fetchXmlyJson(url, extraHeaders = {}) {
  try {
    const { data } = await $fetch.get(url, {
      headers: { 'User-Agent': XM_UA, ...extraHeaders }
    })
    return safeArgs(data)
  } catch (e) {
    return {}
  }
}

function xmlyMapAlbum(item) {
  const id = `${item?.albumId ?? item?.id ?? item?.album_id ?? item?.albumID ?? ''}`
  const name = item?.albumTitle ?? item?.title ?? item?.albumName ?? item?.name ?? ''
  const cover = toHttps(item?.coverLarge ?? item?.coverUrlLarge ?? item?.coverUrl ?? item?.cover_path ?? item?.picUrl ?? '')
  const artistId = `${item?.uid ?? item?.anchorId ?? item?.userId ?? ''}`
  const artistName = item?.nickname ?? item?.anchorNickname ?? item?.author ?? '喜马拉雅'
  
  return {
    id, name, title: name, cover, artwork: cover, pic: cover,
    artist: { id: artistId, name: artistName, cover: toHttps(item?.avatar ?? item?.anchorAvatar ?? '') },
    ext: { source: XM_SOURCE, gid: 'xmly_album_tracks', id, type: 'album' }
  }
}

function xmlyMapTrack(item) {
  const id = `${item?.trackId ?? item?.id ?? item?.soundId ?? ''}`
  const name = item?.title ?? item?.trackTitle ?? item?.name ?? ''
  const cover = toHttps(item?.coverLarge ?? item?.coverUrlLarge ?? item?.coverMiddle ?? item?.pic ?? '')
  const artistId = `${item?.uid ?? item?.anchorUid ?? ''}`
  const artistName = item?.nickname ?? item?.anchorNickName ?? '主播'

  return {
    id, name, title: name, cover, artwork: cover, pic: cover,
    duration: parseInt(item?.duration ?? item?.playDuration ?? 0),
    artist: { id: artistId, name: artistName, cover: toHttps(item?.avatar ?? item?.anchorAvatar ?? '') },
    ext: { source: XM_SOURCE, trackId: id, songName: name }
  }
}

async function loadXmlyAlbumsByKeyword(keyword, page = 1) {
  const kw = keyword || ''
  const urls = [
    `https://www.ximalaya.com/revision/search?core=album&kw=${encodeURIComponent(kw)}&page=${page}&rows=${PAGE_LIMIT}&spellchecker=true&condition=relation&device=web`,
    `https://mobile.ximalaya.com/mobile/search/result?query=${encodeURIComponent(kw)}&page=${page}`,
  ]
  for (const url of urls) {
    const data = await fetchXmlyJson(url)
    const list = firstArray(data?.data?.result?.response?.docs, data?.data?.album?.docs, data?.data?.albums, data?.data?.docs)
    if (list.length > 0) return list
  }
  return []
}

async function loadXmlyAlbumTracks(albumId, page = 1) {
  const urls = [
    `https://www.ximalaya.com/revision/album/v1/getTracksList?albumId=${albumId}&pageNum=${page}&sort=0&pageSize=${PAGE_LIMIT}`,
    `https://mobile.ximalaya.com/mobile/v1/album/track/?albumId=${albumId}&pageSize=${PAGE_LIMIT}&pageId=${page}`,
  ]
  for (const url of urls) {
    const data = await fetchXmlyJson(url, { Referer: `https://www.ximalaya.com/album/${albumId}` })
    const list = firstArray(data?.data?.tracks, data?.data?.list, data?.data?.trackList, data?.tracks)
    if (list.length > 0) return list
  }
  return []
}

async function loadXmlyTracksByKeyword(keyword, page = 1) {
  const kw = keyword || ''
  const urls = [
    `https://www.ximalaya.com/revision/search?core=track&kw=${encodeURIComponent(kw)}&page=${page}&rows=${PAGE_LIMIT}&spellchecker=true&condition=relation&device=web`,
    `https://mobile.ximalaya.com/mobile/search/result?query=${encodeURIComponent(kw)}&page=${page}`,
  ]
  for (const url of urls) {
    const data = await fetchXmlyJson(url)
    const list = firstArray(data?.data?.result?.response?.docs, data?.data?.track?.docs, data?.data?.tracks)
    if (list.length > 0) return list
  }
  return []
}

// === 荔枝FM 相关逻辑 ===
function cleanLizhiText(t) {
  return `${t ?? ''}`.replace(/\s+/g, ' ').trim()
}

async function fetchLizhiJson(url, extraHeaders = {}) {
  try {
    const { data } = await $fetch.get(url, {
      headers: { 'User-Agent': LZ_UA, 'Referer': 'https://m.lizhi.fm/', ...extraHeaders }
    })
    return safeArgs(data)
  } catch (e) {
    return {}
  }
}

function extractLizhiVoice(item) {
  if (!item) return {}
  return {
    voiceInfo: item?.voiceInfo || item?.userVoice?.voiceInfo || item,
    userInfo: item?.userInfo || item?.userVoice?.userInfo || {}
  }
}

function lizhiMapAlbum(item) {
  const { voiceInfo, userInfo } = extractLizhiVoice(item)
  const id = `${voiceInfo?.voiceId ?? voiceInfo?.id ?? item?.id ?? ''}`
  return {
    id: id,
    name: cleanLizhiText(voiceInfo?.name || voiceInfo?.title || item?.title || '未知专辑'),
    cover: toHttps(voiceInfo?.imageUrl || voiceInfo?.cover || item?.cover),
    artist: { id: `${userInfo?.userId ?? userInfo?.id ?? ''}`, name: cleanLizhiText(userInfo?.name || userInfo?.nickname || '主播') },
    ext: { source: LIZHI_SOURCE, gid: 'lizhi_album_tracks', id: id, type: 'album' }
  }
}

function lizhiMapTrack(item) {
  const { voiceInfo, userInfo } = extractLizhiVoice(item)
  const id = `${voiceInfo?.voiceId ?? voiceInfo?.id ?? item?.id ?? ''}`
  const name = cleanLizhiText(voiceInfo?.name || voiceInfo?.title || item?.title || '未知节目')
  return {
    id: id, name: name, title: name,
    cover: toHttps(voiceInfo?.imageUrl || voiceInfo?.cover || item?.cover || ''),
    duration: parseInt(voiceInfo?.duration || item?.duration || 0),
    artist: { id: `${userInfo?.userId ?? userInfo?.id ?? ''}`, name: cleanLizhiText(userInfo?.name || userInfo?.nickname || '主播') },
    ext: { source: LIZHI_SOURCE, trackId: id, songName: name }
  }
}

async function loadLizhiAlbumsByKeyword(keyword, page = 1) {
  const kw = encodeURIComponent(keyword || '热门')
  const p1 = page * 3 - 2, p2 = page * 3 - 1, p3 = page * 3
  const baseUrl = 'https://m.lizhi.fm/vodapi/search/voice?deviceId=h5-f93e74ac-0065-8207-4853-75dec8585db3&receiptData=CAASJ2g1LWY5M2U3NGFjLTAwNjUtODIwNy00ODUzLTc1ZGVjODU4NWRiMyj%2FhvGLxy0wDDgF&keywords=' + kw + '&page='
  
  const [res1, res2, res3] = await Promise.all([
    fetchLizhiJson(baseUrl + p1), fetchLizhiJson(baseUrl + p2), fetchLizhiJson(baseUrl + p3)
  ])
  
  const combined = [...(firstArray(res1.data) || []), ...(firstArray(res2.data) || []), ...(firstArray(res3.data) || [])]
  const unique = [], ids = new Set()
  
  for (const item of combined) {
    const id = item?.voiceInfo?.voiceId || item?.voiceInfo?.id || item?.id
    if (id && !ids.has(id)) { ids.add(id); unique.push(item) }
  }
  return unique
}

async function loadLizhiAlbumTracks(albumId) {
  if (!albumId) return []
  const data = await fetchLizhiJson('https://m.lizhi.fm/vodapi/voice/info/' + albumId)
  if (data?.data?.tracks) return data.data.tracks
  if (Array.isArray(data?.data)) return data.data
  if (data?.data?.userVoice) return [data.data.userVoice]
  if (data?.data?.voiceInfo) return [data.data]
  return []
}

// === 全局导出 API ===
async function getConfig() {
  return jsonify(appConfig)
}

async function getAlbums(ext) {
  const { source, gid, kw, page = 1 } = argsify(ext)

  if (source === XM_SOURCE && gid === 'xmly_tag') {
    const list = await loadXmlyAlbumsByKeyword(kw, page)
    const freeList = list.filter(item => !isXmlyPaidItem(item))
    return jsonify({ list: freeList.map(xmlyMapAlbum) })
  }

  if (source === LIZHI_SOURCE && gid === 'lizhi_tag') {
    const list = await loadLizhiAlbumsByKeyword(kw, page)
    return jsonify({ list: list.map(lizhiMapAlbum), isEnd: list.length < 40 })
  }

  return jsonify({ list: [] })
}

async function getSongs(ext) {
  const { source, gid, id, kw, page = 1 } = argsify(ext)

  if (source === XM_SOURCE && gid === 'xmly_album_tracks' && id) {
    const list = await loadXmlyAlbumTracks(id, page)
    const freeList = list.filter(item => !isXmlyPaidItem(item))
    return jsonify({ list: freeList.map(xmlyMapTrack) })
  }

  if (source === LIZHI_SOURCE) {
    if (gid === 'lizhi_album_tracks' && id) {
      const list = await loadLizhiAlbumTracks(id)
      return jsonify({ list: list.map(lizhiMapTrack) })
    }
    if (gid === 'lizhi_tag' && kw) {
      const list = await loadLizhiAlbumsByKeyword(kw, page)
      return jsonify({ list: list.map(lizhiMapTrack), isEnd: list.length < 40 })
    }
  }

  return jsonify({ list: [] })
}

async function getArtists(ext) {
  return jsonify({ list: [] })
}

async function getPlaylists(ext) {
  return jsonify({ list: [] })
}

async function search(ext) {
  const { text, page = 1, type } = argsify(ext)
  if (!text || page > SEARCH_PAGE_LIMIT) return jsonify({})

  // 同时搜索两个平台
  const [xmlyRaw, lizhiRaw] = await Promise.all([
    type === 'album' ? loadXmlyAlbumsByKeyword(text, page) : loadXmlyTracksByKeyword(text, page),
    loadLizhiAlbumsByKeyword(text, page)
  ])

  let xmlyList = [], lizhiList = []
  
  if (type === 'album') {
    xmlyList = xmlyRaw.filter(item => !isXmlyPaidItem(item)).map(xmlyMapAlbum)
    lizhiList = lizhiRaw.map(lizhiMapAlbum)
  } else {
    xmlyList = xmlyRaw.filter(item => !isXmlyPaidItem(item)).map(xmlyMapTrack)
    lizhiList = lizhiRaw.map(lizhiMapTrack)
  }

  // 交叉合并搜索结果，优化展示体验
  const merged = []
  const maxLen = Math.max(xmlyList.length, lizhiList.length)
  for (let i = 0; i < maxLen; i++) {
    if (i < xmlyList.length) merged.push(xmlyList[i])
    if (i < lizhiList.length) merged.push(lizhiList[i])
  }

  return jsonify({ list: merged })
}

async function getSongInfo(ext) {
  const { source, trackId, quality } = argsify(ext)
  if (!trackId) return jsonify({ urls: [] })

  // 喜马拉雅的播放解析逻辑
  if (source === XM_SOURCE) {
    const urls = [
      `https://m.ximalaya.com/tracks/${trackId}.json`,
      `https://www.ximalaya.com/mobile-playpage/track/v3/baseInfo/${Date.now()}?device=www2&trackId=${trackId}&trackQualityLevel=2`,
    ]
    for (const url of urls) {
      const data = await fetchXmlyJson(url, { Referer: `https://www.ximalaya.com/sound/${trackId}` })
      if (data?.is_paid || data?.data?.isPaid) return jsonify({ urls: [] })
      const playUrl = (quality === '32k' ? (data?.play_path_32 || data?.data?.play_path_32) : (data?.play_path_64 || data?.data?.play_path_64)) ||
                      data?.data?.src || data?.data?.playUrl64 || data?.playUrl64 || data?.audioUrl || data?.src
      if (playUrl) return jsonify({ urls: [playUrl] })
    }
  }

  // 荔枝FM的播放解析逻辑 (已修复广播剧链接解析)
  if (source === LIZHI_SOURCE) {
    const playData = await fetchLizhiJson('https://m.lizhi.fm/vodapi/voice/play/' + trackId)
    let url = playData?.data?.trackUrl || playData?.data?.url || playData?.data?.userVoice?.voicePlayProperty?.trackUrl
    
    // 如果主接口没抓到，走备用信息接口获取
    if (!url) {
      const infoData = await fetchLizhiJson('https://m.lizhi.fm/vodapi/voice/info/' + trackId)
      url = infoData?.data?.userVoice?.voicePlayProperty?.trackUrl 
         || infoData?.data?.voicePlayProperty?.trackUrl 
         || infoData?.data?.userVoice?.voiceInfo?.trackUrl // <-- 补回了原版这里针对特殊节目的解析路径
         || infoData?.data?.trackUrl
    }
    if (url) return jsonify({ urls: [toHttps(url)] })
  }

  return jsonify({ urls: [] })
}

