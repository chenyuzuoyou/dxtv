/*!
 * @name qingtingfm
 * @description 蜻蜓FM (隐藏VIP和付费内容)
 * @version v1.0.5
 * @author codex
 * @key csp_qingtingfm
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
const headers = {
  'User-Agent': UA,
}
const PAGE_LIMIT = 20
const SEARCH_PAGE_LIMIT = 5
const QT_SOURCE = 'qingting'
const GID = {
  RECOMMENDED_ALBUMS: '1',
  TAG_ALBUMS: '2',
  ALBUM_TRACKS: '3',
}
const appConfig = {
  ver: 1,
  name: 'qingtingfm',
  message: '',
  warning: '',
  desc: '',
  tabLibrary: {
    name: '探索',
    groups: [{
      name: '有声书',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: { gid: GID.TAG_ALBUMS, kw: '有声书' }
    }, {
      name: '相声评书',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: { gid: GID.TAG_ALBUMS, kw: '相声评书' }
    }, {
      name: '新闻',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: { gid: GID.TAG_ALBUMS, kw: '新闻' }
    }, {
      name: '历史',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: { gid: GID.TAG_ALBUMS, kw: '历史' }
    }, {
      name: '情感',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: { gid: GID.TAG_ALBUMS, kw: '情感' }
    }, {
      name: '儿童',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: { gid: GID.TAG_ALBUMS, kw: '儿童' }
    }, {
      name: '热门',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: { gid: GID.TAG_ALBUMS, kw: '热门' }
    }]
  },
  tabMe: {
    name: '我的',
    groups: [
      { name: '红心', type: 'song' },
      { name: '歌单', type: 'playlist' },
      { name: '专辑', type: 'album' },
      { name: '创作者', type: 'artist' }
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '专辑', type: 'album', ext: { type: 'album' } },
      { name: '节目', type: 'song', ext: { type: 'track' } },
      { name: '创作者', type: 'artist', ext: { type: 'artist' } }
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
  if (!s.startsWith('http')) return 'https://img.qingting.fm/' + s.replace(/^\//, '')
  return s
}

function firstArray(...candidates) {
  for (const item of candidates) {
    if (Array.isArray(item) && item.length > 0) return item
  }
  return []
}

function isPaidItem(item) {
  if (!item) return false
  if (item.isPaid === true || item.isPaid === 1 || item.isPaid === 'true') return true
  if (item.is_paid === true || item.is_paid === 1 || item.is_paid === 'true') return true
  if (item.isVip === true || item.isVip === 1 || item.is_vip === 1) return true
  if (item.payType > 0 || item.pay_type > 0) return true
  if (item.needPay === true || item.needPay === 1) return true
  if (item.need_pay === true || item.need_pay === 1) return true
  return false
}

async function fetchJson(url, extraHeaders = {}) {
  try {
    const { data } = await $fetch.get(url, {
      headers: { ...headers, ...extraHeaders },
    })
    return safeArgs(data)
  } catch (e) {
    return {}
  }
}

function mapAlbum(item) {
  const id = `${item?.albumId ?? item?.id ?? item?.channel_id ?? ''}`
  const name = item?.title ?? item?.name ?? item?.albumName ?? ''
  const cover = toHttps(item?.cover ?? item?.coverUrl ?? item?.pic ?? '')
  const artistId = `${item?.uid ?? item?.anchorId ?? ''}`
  const artistName = item?.nickname ?? item?.author ?? '蜻蜓FM'
  const artistCover = toHttps(item?.avatar ?? '')
  return {
    id, name, title: name, cover, artwork: cover, pic: cover, coverImg: cover,
    artist: { id: artistId, name: artistName, title: artistName, cover: artistCover, artwork: artistCover, pic: artistCover, avatar: artistCover },
    ext: { gid: GID.ALBUM_TRACKS, id, type: 'album' }
  }
}

function mapTrack(item) {
  const id = `${item?.id ?? item?.trackId ?? item?.program_id ?? ''}`
  const name = item?.title ?? item?.name ?? ''
  const cover = toHttps(item?.cover ?? item?.coverUrl ?? '')
  const artistId = `${item?.uid ?? ''}`
  const artistName = item?.nickname ?? '主播'
  const artistCover = toHttps(item?.avatar ?? '')
  return {
    id, name, title: name, cover, artwork: cover, pic: cover, coverImg: cover,
    duration: parseInt(item?.duration ?? 0),
    artist: { id: artistId, name: artistName, title: artistName, cover: artistCover, artwork: artistCover, pic: artistCover, avatar: artistCover },
    ext: { source: QT_SOURCE, trackId: id, title: name, singer: artistName, songName: name }
  }
}

function mapArtistCard(item) {
  const artistId = `${item?.uid ?? ''}`
  const artistName = item?.nickname ?? '创作者'
  const artistCover = toHttps(item?.avatar ?? '')
  return {
    id: artistId, name: artistName, title: artistName, cover: artistCover, artwork: artistCover, pic: artistCover, avatar: artistCover, coverImg: artistCover,
    groups: [{ name: '热门节目', type: 'song', ext: { gid: GID.ALBUM_TRACKS, id: artistId, type: 'artist', text: artistName } }],
    ext: { gid: GID.ALBUM_TRACKS, id: artistId, type: 'artist', text: artistName }
  }
}

// ==================== 蜻蜓FM 官方移动接口（必加载）====================
async function loadRecommendedAlbums(page = 1) {
  const urls = [
    `https://i.qingting.fm/capi/v3/channels/recommend?page=${page}&pagesize=${PAGE_LIMIT}`,
    `https://i.qingting.fm/capi/v3/channels/hot?page=${page}&pagesize=${PAGE_LIMIT}`,
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url)
      const list = firstArray(data?.data, data?.list, data?.data?.list)
      if (list.length > 0) return list
    } catch (e) {}
  }
  return []
}

async function loadAlbumsByKeyword(keyword, page = 1) {
  const urls = [
    `https://i.qingting.fm/capi/v3/search/channels?q=${encodeURIComponent(keyword)}&page=${page}&pagesize=${PAGE_LIMIT}`,
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url)
      const list = firstArray(data?.data, data?.list, data?.data?.list)
      if (list.length > 0) return list
    } catch (e) {}
  }
  return []
}

async function loadAlbumTracks(albumId, page = 1) {
  const urls = [
    `https://i.qingting.fm/capi/v3/channels/${albumId}/programs?page=${page}&pagesize=${PAGE_LIMIT}`,
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url)
      const list = firstArray(data?.data, data?.list, data?.programs)
      if (list.length > 0) return list
    } catch (e) {}
  }
  return []
}

async function loadTracksByKeyword(keyword, page = 1) {
  const urls = [
    `https://i.qingting.fm/capi/v3/search/programs?q=${encodeURIComponent(keyword)}&page=${page}&pagesize=${PAGE_LIMIT}`,
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url)
      const list = firstArray(data?.data, data?.list)
      if (list.length > 0) return list
    } catch (e) {}
  }
  return []
}

async function loadArtistsByKeyword(keyword, page = 1) {
  const list = await loadTracksByKeyword(keyword, 1)
  const seen = new Set()
  const artists = []
  for (const item of list) {
    const artist = mapArtistCard(item)
    if (!artist.id || seen.has(artist.id)) continue
    seen.add(artist.id)
    artists.push(artist)
    if (artists.length >= PAGE_LIMIT) break
  }
  return artists
}

// ==================== 标准出口 ====================
async function getConfig() { return jsonify(appConfig) }

async function getAlbums(ext) {
  const { page, gid, kw } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  if (gidValue == GID.RECOMMENDED_ALBUMS) {
    const list = await loadRecommendedAlbums(page)
    const freeList = list.filter(item => !isPaidItem(item))
    return jsonify({ list: freeList.map(mapAlbum) })
  }
  if (gidValue == GID.TAG_ALBUMS) {
    const list = await loadAlbumsByKeyword(kw, page)
    const freeList = list.filter(item => !isPaidItem(item))
    return jsonify({ list: freeList.map(mapAlbum) })
  }
  return jsonify({ list: [] })
}

async function getSongs(ext) {
  const { page, gid, id, text } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  if (gidValue == GID.ALBUM_TRACKS) {
    if (text) {
      const list = await loadTracksByKeyword(text, page)
      const freeList = list.filter(item => !isPaidItem(item))
      return jsonify({ list: freeList.map(mapTrack) })
    }
    const list = await loadAlbumTracks(id, page)
    const freeList = list.filter(item => !isPaidItem(item))
    return jsonify({ list: freeList.map(mapTrack) })
  }
  return jsonify({ list: [] })
}

async function getArtists(ext) {
  const { text, kw } = argsify(ext)
  const keyword = text || kw || ''
  if (!keyword) return jsonify({ list: [] })
  const list = await loadArtistsByKeyword(keyword, 1)
  return jsonify({ list })
}

async function getPlaylists(ext) { return jsonify({ list: [] }) }

async function search(ext) {
  const { text, page, type } = argsify(ext)
  if (!text || page > SEARCH_PAGE_LIMIT) return jsonify({})
  if (type == 'album') {
    const list = await loadAlbumsByKeyword(text, page)
    const freeList = list.filter(item => !isPaidItem(item))
    return jsonify({ list: freeList.map(mapAlbum) })
  }
  if (type == 'track' || type == 'song') {
    const list = await loadTracksByKeyword(text, page)
    const freeList = list.filter(item => !isPaidItem(item))
    return jsonify({ list: freeList.map(mapTrack) })
  }
  if (type == 'artist') {
    const list = await loadArtistsByKeyword(text, page)
    return jsonify({ list })
  }
  return jsonify({})
}

async function getSongInfo(ext) {
  const { trackId } = argsify(ext)
  if (!trackId) return jsonify({ urls: [] })
  const urls = [
    `https://i.qingting.fm/capi/v3/programs/${trackId}/play`,
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url)
      if (data?.is_paid || data?.data?.isPaid) return jsonify({ urls: [] })
      const playUrl = data?.data?.url || data?.url || ''
      if (playUrl) return jsonify({ urls: [playUrl] })
    } catch (e) {}
  }
  return jsonify({ urls: [] })
}