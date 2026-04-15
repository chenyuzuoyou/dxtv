/*!
 * @name xmlyfm3
 * @description 喜马拉雅FM（显示限免+修复专辑/创作者/封面）
 * @version v1.4
 * @author codex
 * @key csp_xmlyfm
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
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
  ver: 1, name: 'xmlyfm3', message: '', warning: '', desc: '',
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

// ✅ 核心：限免正确识别，不误杀
function isPaidItem(item) {
  if (!item) return false
  const now = new Date()
  const isLimitFree = !!(
    item.is_limit_free === true ||
    item.limit_free === true ||
    item.limitFree === true ||
    item.limit_free_status === 1 ||
    item.albumTimeLimited === true ||
    item.isSample === true ||
    item.isVipFree === true ||
    item.freeType === 1 ||
    item.limitFreeType === 1 ||
    item.vipFreeType === 1 ||
    (item.free_end_time && new Date(item.free_end_time) > now)
  )
  if (isLimitFree) {
    item._limitFree = true
    return false
  }
  return !!(
    item.isPaid === true || item.isPaid === 1 ||
    item.is_paid === true || item.is_paid === 1 ||
    item.payType > 0 || item.pay_type > 0 ||
    item.priceTypeId > 0 || item.price_type_id > 0
  )
}

async function fetchJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, { headers: { ...headers, ...extraHeaders } })
  return safeArgs(data)
}

// ✅ 修复：完整封面字段，全部还原
function mapAlbum(item) {
  const id = `${item?.albumId ?? item?.id ?? item?.album_id ?? ''}`
  const name = item?.albumTitle ?? item?.title ?? item?.albumName ?? ''
  const cover = toHttps(
    item?.coverLarge ?? item?.coverUrlLarge ?? item?.coverUrl ??
    item?.cover_path ?? item?.coverPath ?? item?.coverMiddle ??
    item?.picUrl ?? item?.albumCoverUrl290 ?? item?.albumCover ??
    item?.albumPic ?? item?.pic ?? item?.picPath ?? item?.imgPath ?? ''
  )
  const artistId = `${item?.uid ?? item?.anchorId ?? item?.anchorUid ?? item?.userId ?? ''}`
  const artistName = item?.nickname ?? item?.anchorNickname ?? item?.anchorName ?? '喜马拉雅'
  const artistCover = toHttps(item?.avatar ?? item?.anchorAvatar ?? '')

  return {
    id,
    name: item._limitFree ? `【限免】${name}` : name,
    title: item._limitFree ? `【限免】${name}` : name,
    cover, artwork: cover, pic: cover, coverImg: cover,
    artist: {
      id: artistId, name: artistName, title: artistName,
      cover: artistCover, artwork: artistCover, pic: artistCover, avatar: artistCover
    },
    ext: { gid: GID.ALBUM_TRACKS, id, type: 'album' }
  }
}

// ✅ 修复：完整封面字段
function mapTrack(item) {
  const id = `${item?.trackId ?? item?.id ?? item?.soundId ?? ''}`
  const name = item?.title ?? item?.trackTitle ?? item?.name ?? ''
  const cover = toHttps(
    item?.coverLarge ?? item?.coverUrlLarge ?? item?.coverMiddle ??
    item?.coverUrlMiddle ?? item?.albumCover ?? item?.coverPath ??
    item?.cover_path ?? item?.coverUrl ?? item?.pic ?? ''
  )
  const artistId = `${item?.uid ?? item?.anchorUid ?? item?.anchorId ?? ''}`
  const artistName = item?.nickname ?? item?.anchorNickName ?? item?.anchorName ?? '主播'
  const artistCover = toHttps(item?.avatar ?? item?.anchorAvatar ?? '')

  return {
    id,
    name: item._limitFree ? `【限免】${name}` : name,
    title: item._limitFree ? `【限免】${name}` : name,
    cover, artwork: cover, pic: cover, coverImg: cover,
    duration: parseInt(item?.duration ?? item?.interval ?? 0),
    artist: {
      id: artistId, name: artistName, title: artistName,
      cover: artistCover, artwork: artistCover, pic: artistCover, avatar: artistCover
    },
    ext: { source: XM_SOURCE, trackId: id, title: name, singer: artistName }
  }
}

function mapArtistCard(item) {
  const artistId = `${item?.uid ?? item?.anchorId ?? ''}`
  const artistName = item?.nickname ?? item?.anchorNickname ?? '创作者'
  const artistCover = toHttps(item?.avatar ?? item?.anchorAvatar ?? '')
  return {
    id: artistId, name: artistName, title: artistName,
    cover: artistCover, artwork: artistCover, avatar: artistCover,
    groups: [{
      name: '热门节目', type: 'song',
      ext: { gid: GID.ALBUM_TRACKS, id: artistId, type: 'artist' }
    }],
    ext: { gid: GID.ALBUM_TRACKS, id: artistId, type: 'artist' }
  }
}

async function loadRecommendedAlbums(page = 1) {
  const urls = [
    `https://www.ximalaya.com/revision/search?core=album&kw=&page=${page}&rows=${PAGE_LIMIT}&spellchecker=true&condition=relation&device=web`,
    `https://mobile.ximalaya.com/mobile/discovery/v3/recommend/album?pageId=${page}&pageSize=${PAGE_LIMIT}`
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url)
      const list = firstArray(data?.data?.result?.response?.docs, data?.data?.list, data?.data?.albums)
      if (list.length > 0) return list
    } catch (e) {}
  }
  return []
}

async function loadAlbumsByKeyword(keyword, page = 1) {
  const kw = keyword || ''
  const urls = [
    `https://www.ximalaya.com/revision/search?core=album&kw=${encodeURIComponent(kw)}&page=${page}&rows=${PAGE_LIMIT}&spellchecker=true&condition=relation&device=web`,
    `https://mobile.ximalaya.com/mobile/search/result?query=${encodeURIComponent(kw)}&page=${page}`
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url)
      const list = firstArray(data?.data?.result?.response?.docs, data?.data?.album?.docs, data?.data?.albums)
      if (list.length > 0) return list
    } catch (e) {}
  }
  return []
}

async function loadAlbumTracks(albumId, page = 1) {
  const urls = [
    `https://www.ximalaya.com/revision/album/v1/getTracksList?albumId=${albumId}&pageNum=${page}&pageSize=${PAGE_LIMIT}`,
    `https://mobile.ximalaya.com/mobile/v1/album/track/?albumId=${albumId}&pageSize=${PAGE_LIMIT}&pageId=${page}`
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url, { Referer: `https://www.ximalaya.com/album/${albumId}` })
      const list = firstArray(data?.data?.tracks, data?.data?.list, data?.tracks)
      if (list.length > 0) return list
    } catch (e) {}
  }
  return []
}

// ✅ 修复：创作者曲目接口
async function loadArtistTracks(artistId, page = 1) {
  const urls = [
    `https://mobile.ximalaya.com/mobile/v1/anchor/track?anchorId=${artistId}&pageId=${page}&pageSize=${PAGE_LIMIT}`,
    `https://www.ximalaya.com/revision/anchor/v1/tracks?anchorId=${artistId}&page=${page}&rows=${PAGE_LIMIT}`
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url)
      const list = firstArray(data?.data?.tracks, data?.data?.list)
      if (list.length > 0) return list
    } catch (e) {}
  }
  return []
}

async function loadTracksByKeyword(keyword, page = 1) {
  const kw = keyword || ''
  const urls = [
    `https://www.ximalaya.com/revision/search?core=track&kw=${encodeURIComponent(kw)}&page=${page}&rows=${PAGE_LIMIT}&spellchecker=true&condition=relation&device=web`,
    `https://mobile.ximalaya.com/mobile/search/result?query=${encodeURIComponent(kw)}&page=${page}`
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url)
      const list = firstArray(data?.data?.result?.response?.docs, data?.data?.track?.docs, data?.data?.tracks)
      if (list.length > 0) return list
    } catch (e) {}
  }
  return []
}

async function loadArtistsByKeyword(keyword, page = 1) {
  if (page > 1) return []
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

async function getConfig() { return jsonify(appConfig) }

async function getAlbums(ext) {
  const { page, gid, kw } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  if (gidValue == GID.RECOMMENDED_ALBUMS) {
    const list = await loadRecommendedAlbums(page)
    return jsonify({ list: list.filter(item => !isPaidItem(item)).map(mapAlbum) })
  }
  if (gidValue == GID.TAG_ALBUMS) {
    const list = await loadAlbumsByKeyword(kw, page)
    return jsonify({ list: list.filter(item => !isPaidItem(item)).map(mapAlbum) })
  }
  return jsonify({ list: [] })
}

// ✅ 修复：支持专辑、搜索、创作者三种来源
async function getSongs(ext) {
  const { page, gid, id, text, type } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let list = []
  if (gidValue == GID.ALBUM_TRACKS) {
    if (type === 'artist') {
      list = await loadArtistTracks(id, page)
    } else if (text) {
      list = await loadTracksByKeyword(text, page)
    } else {
      list = await loadAlbumTracks(id, page)
    }
  }
  const freeList = list.filter(item => !isPaidItem(item))
  return jsonify({ list: freeList.map(mapTrack) })
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
    return jsonify({ list: list.filter(item => !isPaidItem(item)).map(mapAlbum) })
  }
  if (type == 'track' || type == 'song') {
    const list = await loadTracksByKeyword(text, page)
    return jsonify({ list: list.filter(item => !isPaidItem(item)).map(mapTrack) })
  }
  if (type == 'artist') {
    const list = await loadArtistsByKeyword(text, page)
    return jsonify({ list })
  }
  return jsonify({})
}

async function getSongInfo(ext) {
  const { trackId, quality } = argsify(ext)
  if (!trackId) return jsonify({ urls: [] })
  const urls = [
    `https://m.ximalaya.com/tracks/${trackId}.json`,
    `https://www.ximalaya.com/revision/play/v1/audio?id=${trackId}&ptype=1`
  ]
  for (const url of urls) {
    try {
      const { data } = await $fetch.get(url, {
        headers: { 'User-Agent': UA, Referer: `https://www.ximalaya.com/sound/${trackId}` }
      })
      const info = safeArgs(data)
      const now = new Date()
      const isLimitFree = !!(
        info.is_limit_free || info.limit_free || info.limitFree ||
        info.albumTimeLimited || info.isSample || info.isVipFree ||
        info.vipFreeType === 1 ||
        (info.free_end_time && new Date(info.free_end_time) > now)
      )
      if ((info?.is_paid || info?.data?.isPaid) && !isLimitFree) {
        return jsonify({ urls: [] })
      }
      const playUrl = (quality == '32k'
        ? (info?.play_path_32 || info?.data?.play_path_32 || info?.src)
        : (info?.play_path_64 || info?.data?.play_path_64 || info?.src || info?.play_path_32)) ||
        info?.data?.playUrl64 || info?.data?.playUrl32 || info?.playUrl || info?.audioUrl
      if (playUrl) return jsonify({ urls: [playUrl] })
    } catch (e) {}
  }
  return jsonify({ urls: [] })
}
