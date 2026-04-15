/*!
 * @name xmlyfm3
 * @description 喜马拉雅FM（纯净版）专辑分页加载 = netcodeS.js 网易云歌单逻辑
 * @version v1.6.7
 * @author codex
 * @key csp_xmly
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const headers = { 'User-Agent': UA }
const PAGE_SIZE = 50
const XM_SOURCE = 'xmly'
const GID = {
  RECOMMENDED_ALBUMS: '1',
  TAG_ALBUMS: '2',
  ALBUM_TRACKS: '3',
}

const appConfig = {
  ver: 1, name: 'xmlyfm3', message: '', warning: '', desc: '',
  tabLibrary: {
    name: '探索',
    groups: [
      {name: '热门专辑', type: 'album', ui:1, showMore:true, ext:{gid:GID.RECOMMENDED_ALBUMS}},
      {name: '播客', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'播客'}},
      {name: '历史', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'历史'}},
      {name: '图书', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'图书'}},
      {name: '小说', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'小说'}},
      {name: '相声', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'相声'}},
      {name: '音乐', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'音乐'}},
      {name: '有声书', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'有声书'}},
      {name: '评书', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'评书'}},
      {name: '儿童', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'儿童'}}
    ]
  },
  tabMe: { name: '我的', groups: [{name: '红心', type: 'song'},{name: '歌单', type: 'playlist'},{name: '专辑', type: 'album'},{name: '创作者', type: 'artist'}] },
  tabSearch: { name: '搜索', groups: [{name: '专辑', type: 'album', ext:{type:'album'}},{name: '节目', type: 'song', ext:{type:'track'}},{name: '创作者', type: 'artist', ext:{type:'artist'}}]}
}

function safeArgs(data) {
  try { return typeof data === 'string' ? argsify(data) : (data ?? {}) }
  catch (e) { return typeof data === 'string' ? JSON.parse(data) : {} }
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
  for (const item of candidates) { if (Array.isArray(item) && item.length > 0) return item }
  return []
}

function isPaidItem(item) {
  if (!item) return false
  const now = new Date()
  const isLimitFree = !!(
    item.is_limit_free === true || item.limit_free === true || item.limitFree === true ||
    item.limit_free_status === 1 || item.albumTimeLimited === true || item.isSample === true ||
    item.isVipFree === true || item.freeType === 1 || item.limitFreeType === 1 || item.vipFreeType === 1 ||
    (item.free_end_time && new Date(item.free_end_time) > now)
  )
  const isPaid = !!(
    item.isPaid === true || item.isPaid === 1 || item.is_paid === true || item.is_paid === 1 ||
    item.payType > 0 || item.pay_type > 0 || item.priceTypeId > 0 || item.price_type_id > 0
  )
  return isLimitFree || isPaid
}

async function fetchJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, { headers: { ...headers, ...extraHeaders } })
  return safeArgs(data)
}

function mapAlbum(item) {
  const id = `${item?.albumId ?? item?.id ?? item?.album_id ?? ''}`
  const name = item?.albumTitle ?? item?.title ?? item?.albumName ?? ''
  const cover = toHttps(item?.coverLarge ?? item?.coverUrlLarge ?? item?.coverUrl ?? item?.cover_path ?? item?.coverPath ?? item?.picUrl ?? '')
  const artistId = `${item?.uid ?? item?.anchorId ?? item?.anchorUid ?? ''}`
  const artistName = item?.nickname ?? item?.anchorNickname ?? '喜马拉雅'
  const artistCover = toHttps(item?.avatar ?? item?.anchorAvatar ?? '')
  return {
    id, name, title: name, cover, artwork: cover, pic: cover,
    artist: { id: artistId, name: artistName, cover: artistCover, avatar: artistCover },
    ext: { gid: GID.ALBUM_TRACKS, id, type: 'album' }
  }
}

function mapTrack(item) {
  const id = `${item?.trackId ?? item?.id ?? item?.soundId ?? ''}`
  const name = item?.title ?? item?.trackTitle ?? ''
  const cover = toHttps(item?.coverLarge ?? item?.coverUrlLarge ?? item?.albumCover ?? '')
  const artistId = `${item?.uid ?? item?.anchorUid ?? ''}`
  const artistName = item?.nickname ?? item?.anchorNickName ?? '主播'
  const artistCover = toHttps(item?.avatar ?? item?.anchorAvatar ?? '')
  return {
    id, name, title: name, cover, artwork: cover,
    duration: parseInt(item?.duration ?? item?.interval ?? 0),
    artist: { id: artistId, name: artistName, cover: artistCover, avatar: artistCover },
    ext: { source: XM_SOURCE, trackId: id, title: name, singer: artistName }
  }
}

async function loadRecommendedAlbums(page) {
  const url = `https://mobile.ximalaya.com/mobile/discovery/v3/recommend/album?pageId=${page}&pageSize=${PAGE_SIZE}`
  const data = await fetchJson(url)
  return firstArray(data?.data?.list, data?.data?.albums)
}

async function loadAlbumsByKeyword(keyword, page) {
  const url = `https://mobile.ximalaya.com/mobile/search/result?query=${encodeURIComponent(keyword)}&page=${page}`
  const data = await fetchJson(url)
  return firstArray(data?.data?.album?.docs, data?.data?.albums)
}

// ====================== 核心：完全按照 netcodeS.js 歌单逻辑编写 ======================
async function loadAlbumTracks(albumId, page) {
  const url = `https://mobile.ximalaya.com/mobile/v1/album/track/?albumId=${albumId}&pageId=${page}&pageSize=${PAGE_SIZE}`
  const data = await fetchJson(url, { Referer: `https://www.ximalaya.com/album/${albumId}` })
  return firstArray(data?.data?.list, data?.data?.tracks, data?.tracks)
}

async function loadArtistTracks(artistId, page) {
  const url = `https://mobile.ximalaya.com/mobile/v1/anchor/track?anchorId=${artistId}&pageId=${page}&pageSize=${PAGE_SIZE}`
  const data = await fetchJson(url)
  return firstArray(data?.data?.list, data?.data?.tracks)
}

async function loadTracksByKeyword(keyword, page) {
  const url = `https://mobile.ximalaya.com/mobile/search/result?query=${encodeURIComponent(keyword)}&page=${page}`
  const data = await fetchJson(url)
  return firstArray(data?.data?.track?.docs, data?.data?.tracks)
}

async function loadArtistsByKeyword(keyword, page) {
  const url = `https://mobile.ximalaya.com/mobile/search/result?query=${encodeURIComponent(keyword)}&page=${page}&type=user`
  const data = await fetchJson(url)
  const list = firstArray(data?.data?.user?.docs, data?.data?.users)
  return list.map(item => {
    const id = `${item?.uid ?? item?.id ?? ''}`
    return {
      id, name: item?.nickname ?? '主播', cover: toHttps(item?.avatar ?? item?.anchorAvatar ?? ''),
      ext: { gid: GID.ALBUM_TRACKS, id, type: 'artist' }
    }
  }).filter(i => i.id)
}

async function getConfig() { return jsonify(appConfig) }

async function getAlbums(ext) {
  const { page = 1, gid, kw } = argsify(ext)
  const v = `${gid}`
  let list = []
  if (v == GID.RECOMMENDED_ALBUMS) list = await loadRecommendedAlbums(page)
  if (v == GID.TAG_ALBUMS) list = await loadAlbumsByKeyword(kw, page)
  return jsonify({ list: list.filter(i => !isPaidItem(i)).map(mapAlbum) })
}

// ====================== 完全复刻 netcodeS.js 歌单加载格式 ======================
async function getSongs(ext) {
  const params = argsify(ext)
  const page = params.page || 1
  const { gid, id, text, type } = params

  let list = []
  if (gid == GID.ALBUM_TRACKS) {
    if (type === 'artist') list = await loadArtistTracks(id, page)
    else if (text) list = await loadTracksByKeyword(text, page)
    else list = await loadAlbumTracks(id, page)
  }

  const songs = list.filter(i => !isPaidItem(i)).map(mapTrack)
  return jsonify({
    list: songs,
    hasMore: list.length >= PAGE_SIZE  // 网易云标准判断
  })
}

async function getArtists(ext) {
  const { text, kw, page = 1 } = argsify(ext)
  const list = await loadArtistsByKeyword(text || kw, page)
  return jsonify({ list })
}

async function getPlaylists(ext) { return jsonify({ list: [] }) }

async function search(ext) {
  const { text, page, type } = argsify(ext)
  if (!text) return jsonify({})
  if (type == 'album') {
    const list = await loadAlbumsByKeyword(text, page)
    return jsonify({ list: list.filter(i => !isPaidItem(i)).map(mapAlbum) })
  }
  if (type == 'track') {
    const list = await loadTracksByKeyword(text, page)
    return jsonify({ list: list.filter(i => !isPaidItem(i)).map(mapTrack) })
  }
  if (type == 'artist') {
    const list = await loadArtistsByKeyword(text, page)
    return jsonify({ list })
  }
  return jsonify({})
}

async function getSongInfo(ext) {
  let arg = safeArgs(ext)
  let trackId = arg?.trackId || arg?.id
  if (!trackId) return jsonify({ urls: [] })

  const urls = [
    `https://mobile.ximalaya.com/mobile-playpage/track/v3/baseInfo/${Date.now()}?device=android&trackId=${trackId}&trackQualityLevel=2`
  ]
  for (const u of urls) {
    try {
      const { data } = await $fetch.get(u, { headers: { 'User-Agent': 'ting_6.7.9(Android)' } })
      const d = safeArgs(data)
      const info = d?.data?.trackInfo || d?.data || d
      const playUrl = info?.playUrl64 || info?.playUrl32 || info?.playUrl
      if (playUrl) return jsonify({ urls: [toHttps(playUrl)] })
    } catch (e) {}
  }
  return jsonify({ urls: [] })
}
