/*!
 * @name 4xmlyfm4 (限免专辑加载修复版)
 * @description 喜马拉雅FM（探索+搜索显示限免专辑 + [限免]标注 + 专辑内仅免费条目 + 限免专辑加载修复）
 * @version v1.6.7-mod
 * @author codex + Grok 修改
 * @key csp_xmlyfm
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const headers = { 'User-Agent': UA }
const PAGE_LIMIT = 20
const SEARCH_PAGE_LIMIT = 5
const XM_SOURCE = 'xmly'
const GID = {
  RECOMMENDED_ALBUMS: '1',
  TAG_ALBUMS: '2',
  ALBUM_TRACKS: '3',
}

const appConfig = {
  ver: 1, name: 'xmlyfm4', message: '', warning: '', desc: '',
  tabLibrary: {
    name: '探索',
    groups: [
      {name: '播客', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'播客'}},
      {name: '历史', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'历史'}},
      {name: '图书', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'图书'}},
      {name: '热门专辑', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'热门'}},
      {name: '小说', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'小说'}},
      {name: '相声', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'相声'}},
      {name: '音乐', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'音乐'}},
      {name: '有声书', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'有声书'}},
      {name: '评书', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'评书'}},
      {name: '情感', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'情感'}},
      {name: '儿童', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'儿童'}},
      {name: '综艺', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'综艺'}},
      {name: '娱乐', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'娱乐'}},
      {name: '悬疑', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'悬疑'}},
      {name: '健康', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'健康'}},
      {name: '财经', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'财经'}},
      {name: '教育', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'教育'}},
      {name: '人文', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'人文'}},
      {name: '英语', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'英语'}},
      {name: '二次元', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'二次元'}}
    ]
  },
  tabMe: {
    name: '我的',
    groups: [
      {name: '红心', type: 'song'},
      {name: '歌单', type: 'playlist'},
      {name: '专辑', type: 'album'},
      {name: '创作者', type: 'artist'}
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      {name: '专辑', type: 'album', ext:{type:'album'}},
      {name: '节目', type: 'song', ext:{type:'track'}},
      {name: '创作者', type: 'artist', ext:{type:'artist'}}
    ]
  }
}

function safeArgs(data) {
  try {
    return typeof data === 'string' ? argsify(data) : (data ?? {})
  } catch (e) {
    return typeof data === 'string' ? JSON.parse(data) : {}
  }
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

// ==================== 限免判断（保持不变） ====================
function isCurrentlyLimitFree(item) {
  if (!item) return false
  const now = Date.now()
  return !!(
    item.is_limit_free === true || item.limit_free === true || item.limitFree === true ||
    item.limit_free_status === 1 || item.albumTimeLimited === true ||
    item.isSample === true || item.isVipFree === true ||
    item.freeType === 1 || item.limitFreeType === 1 || item.vipFreeType === 1 ||
    (item.free_end_time && new Date(item.free_end_time).getTime() > now) ||
    (item.freeEndTime && new Date(item.freeEndTime).getTime() > now) ||
    (item.limitFreeEndTime && new Date(item.limitFreeEndTime).getTime() > now)
  )
}

function isPaidItem(item) {
  if (!item) return true
  const paid = !!(
    item.isPaid === true || item.isPaid === 1 ||
    item.is_paid === true || item.is_paid === 1 ||
    item.payType > 0 || item.pay_type > 0 ||
    item.priceTypeId > 0 || item.price_type_id > 0 ||
    item.isBuy === true || item.needPay === true
  )
  return paid && !isCurrentlyLimitFree(item)
}

function getAlbumLimitType(albumItem, tracks = []) {
  if (!albumItem) return 'normal'
  const albumFree = isCurrentlyLimitFree(albumItem)
  if (tracks.length === 0) return albumFree ? 'full_limit' : 'normal'

  const freeTracks = tracks.filter(t => !isPaidItem(t))
  const allFree = freeTracks.length === tracks.length
  const someFree = freeTracks.length > 0 && freeTracks.length < tracks.length

  if (allFree) return 'full_limit'
  if (someFree) return 'partial_limit'
  return 'normal'
}

function mapAlbum(item, tracks = []) {
  const id = `${item?.albumId ?? item?.id ?? item?.album_id ?? ''}`
  let name = item?.albumTitle ?? item?.title ?? item?.albumName ?? ''

  const limitType = getAlbumLimitType(item, tracks)
  if (limitType === 'full_limit') name = `[限免] ${name}`
  else if (limitType === 'partial_limit') name = `[部分限免] ${name}`

  const cover = toHttps(item?.coverLarge ?? item?.coverUrlLarge ?? item?.coverUrl ?? item?.cover_path ?? item?.coverPath ?? item?.coverMiddle ?? '')
  const artistName = item?.nickname ?? item?.anchorNickname ?? item?.anchorName ?? '喜马拉雅'

  return {
    id, name, title: name,
    cover, artwork: cover, pic: cover, coverImg: cover,
    artist: { id: `${item?.uid ?? item?.anchorId ?? ''}`, name: artistName, title: artistName }
  }
}

function mapTrack(item) {
  const id = `${item?.trackId ?? item?.id ?? item?.soundId ?? ''}`
  const name = item?.title ?? item?.trackTitle ?? item?.name ?? ''
  const cover = toHttps(item?.coverLarge ?? item?.coverUrlLarge ?? item?.coverMiddle ?? item?.coverUrlMiddle ?? item?.albumCover ?? '')
  const artistName = item?.nickname ?? item?.anchorNickName ?? item?.anchorName ?? '主播'

  return {
    id, name, title: name,
    cover, artwork: cover, pic: cover, coverImg: cover,
    duration: parseInt(item?.duration ?? item?.interval ?? 0),
    artist: { id: `${item?.uid ?? item?.anchorUid ?? ''}`, name: artistName, title: artistName },
    ext: { source: XM_SOURCE, trackId: id, title: name, singer: artistName }
  }
}

async function fetchJson(url, extraHeaders = {}) {
  try {
    const { data } = await $fetch.get(url, { headers: { ...headers, ...extraHeaders } })
    return safeArgs(data)
  } catch (e) {
    return {}
  }
}

// ==================== 修复重点：loadAlbumTracks ====================
async function loadAlbumTracks(albumId, page = 1) {
  let allTracks = []
  let currentPage = 1
  const maxPage = 50

  while (currentPage <= maxPage) {
    const urls = [
      // 优先使用最稳定的移动端接口（限免专辑常用）
      `https://mobile.ximalaya.com/mobile/v1/album/track/?albumId=${albumId}&pageSize=100&pageId=${currentPage}&isAsc=true&sort=0`,
      `https://mobile.ximalaya.com/mobile/v1/album/track/?albumId=${albumId}&pageSize=100&pageId=${currentPage}`,
      `https://www.ximalaya.com/revision/album/v1/getTracksList?albumId=${albumId}&pageNum=${currentPage}&pageSize=100`,
      `https://mobile.ximalaya.com/mobile/others/album/trackList?albumId=${albumId}&pageSize=100&pageId=${currentPage}`,
      `https://m.ximalaya.com/m-revision/common/album/queryAlbumTrackList?albumId=${albumId}&pageNum=${currentPage}&pageSize=100`
    ]

    let pageTracks = []
    for (const url of urls) {
      try {
        const referer = `https://www.ximalaya.com/album/${albumId}`
        const data = await fetchJson(url, { Referer: referer })

        const list = firstArray(
          data?.data?.tracks,
          data?.data?.list,
          data?.tracks,
          data?.data?.trackList,
          data?.list
        )

        if (list && list.length > 0) {
          pageTracks = list
          break
        }
      } catch (e) {}
    }

    if (pageTracks.length === 0) break

    allTracks = allTracks.concat(pageTracks)
    if (pageTracks.length < 50) break  // 最后一页通常少于100
    currentPage++
  }

  return allTracks
}

// 其他 load 函数保持原样（简略版，只列关键）
async function loadRecommendedAlbums(page = 1) { /* 原代码不变 */ 
  const urls = [ /* ... */ ]
  // ...（使用你之前提供的完整实现）
}

async function loadAlbumsByKeyword(keyword, page = 1) { /* 原代码不变 */ }
async function loadArtistTracks(artistId, page = 1) { /* 原代码不变 */ }
async function loadTracksByKeyword(keyword, page = 1) { /* 原代码不变 */ }
async function loadArtistsByKeyword(keyword, page = 1) { /* 原代码不变 */ }

async function getConfig() { return jsonify(appConfig) }

async function getAlbums(ext) {
  const { page, gid, kw } = argsify(ext)
  let rawList = []
  if (`${gid}` == GID.RECOMMENDED_ALBUMS) rawList = await loadRecommendedAlbums(page)
  else if (`${gid}` == GID.TAG_ALBUMS) rawList = await loadAlbumsByKeyword(kw, page)

  return jsonify({ list: rawList.map(item => mapAlbum(item)) })
}

async function getSongs(ext) {
  const { gid, id, text, type } = argsify(ext)
  let list = []

  if (`${gid}` == GID.ALBUM_TRACKS) {
    if (type === 'artist') {
      list = await loadArtistTracks(id)
    } else if (text) {
      list = await loadTracksByKeyword(text)
    } else {
      list = await loadAlbumTracks(id)   // 使用修复后的函数
    }
  }

  const freeList = list.filter(item => !isPaidItem(item))
  return jsonify({ list: freeList.map(mapTrack) })
}

async function search(ext) {
  const { text, page, type } = argsify(ext)
  if (!text || page > SEARCH_PAGE_LIMIT) return jsonify({})

  if (type == 'album') {
    const rawList = await loadAlbumsByKeyword(text, page)
    return jsonify({ list: rawList.map(item => mapAlbum(item)) })
  }
  if (type == 'track' || type == 'song') {
    const list = await loadTracksByKeyword(text, page)
    return jsonify({ list: list.filter(item => !isPaidItem(item)).map(mapTrack) })
  }
  if (type == 'artist') {
    return jsonify({ list: await loadArtistsByKeyword(text, page) })
  }
  return jsonify({})
}

// getSongInfo 保持之前优化版本（多接口）
async function getSongInfo(ext) {
  let arg = safeArgs(ext)
  let trackId = arg?.trackId || arg?.id
  if (!trackId && typeof ext === 'string') {
    try { const p = JSON.parse(ext); trackId = p.trackId || p.id } catch(e) { trackId = ext }
  }
  if (!trackId) return jsonify({ urls: [] })

  const appUA = 'ting_6.7.9(SM-G981B,Android10)'
  const mobileUA = 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'

  const playUrls = [
    `https://mobile.ximalaya.com/mobile-playpage/track/v3/baseInfo/${Date.now()}?device=android&trackId=${trackId}&trackQualityLevel=2`,
    `https://mobile.ximalaya.com/mobile/v1/track/baseInfo?device=android&trackId=${trackId}`,
    `https://m.ximalaya.com/m-revision/common/track/getPlayUrlV4?trackId=${trackId}`,
    `https://mobile.ximalaya.com/v1/track/baseInfo?device=android&trackId=${trackId}`
  ]

  for (const u of playUrls) {
    try {
      const { data } = await $fetch.get(u, { headers: { 'User-Agent': u.includes('mobile-playpage') ? appUA : mobileUA } })
      const info = safeArgs(data)
      const d = info?.data?.trackInfo || info?.data || info?.trackInfo || info
      let playUrl = d?.playUrl64 || d?.playUrl32 || d?.playUrl || d?.src || d?.url || d?.playPathHq || d?.play_path_64 || d?.audioUrl

      if (playUrl && playUrl.includes('http')) {
        if (playUrl.startsWith('//')) playUrl = 'https:' + playUrl
        if (playUrl.startsWith('http://')) playUrl = playUrl.replace(/^http:\/\//, 'https://')
        return jsonify({ urls: [playUrl] })
      }
    } catch (e) {}
  }
  return jsonify({ urls: [] })
}