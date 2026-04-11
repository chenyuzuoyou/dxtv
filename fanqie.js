/*!
 * @name fanqiefm
 * @description 鐣寗鐣呭惉 (闅愯棌VIP鍜屼粯璐瑰唴瀹�)
 * @version v1.0.0
 * @author codex
 * @key csp_fanqiefm
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = {
  'User-Agent': UA,
}
const PAGE_LIMIT = 20
const SEARCH_PAGE_LIMIT = 5
const FANQIE_SOURCE = 'fanqie'
const GID = {
  RECOMMENDED_ALBUMS: '1',
  TAG_ALBUMS: '2',
  ALBUM_TRACKS: '3',
}
const appConfig = {
  ver: 1,
  name: 'fanqiefm',
  message: '',
  warning: '',
  desc: '',
  tabLibrary: {
    name: '鎺㈢储',
    groups: [{
      name: '鏈夊０涔�',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_ALBUMS,
        kw: '鏈夊０涔�',
      }
    }, {
      name: '鐩稿０璇勪功',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_ALBUMS,
        kw: '鐩稿０璇勪功',
      }
    }, {
      name: '鎯呮劅鐢熸椿',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_ALBUMS,
        kw: '鎯呮劅鐢熸椿',
      }
    }, {
      name: '鐑棬涓撹緫',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_ALBUMS,
        kw: '鐑棬',
      }
    }, {
      name: '鍘嗗彶鍐涗簨',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_ALBUMS,
        kw: '鍘嗗彶鍐涗簨',
      }
    }, {
      name: '缁艰壓濞变箰',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_ALBUMS,
        kw: '缁艰壓濞变箰',
      }
    }, {
      name: '鍎跨',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_ALBUMS,
        kw: '鍎跨',
      }
    }]
  },
  tabMe: {
    name: '鎴戠殑',
    groups: [{
      name: '绾㈠績',
      type: 'song'
    }, {
      name: '姝屽崟',
      type: 'playlist'
    }, {
      name: '涓撹緫',
      type: 'album'
    }, {
      name: '鍒涗綔鑰�',
      type: 'artist'
    }]
  },
  tabSearch: {
    name: '鎼滅储',
    groups: [{
      name: '涓撹緫',
      type: 'album',
      ext: {
        type: 'album',
      }
    }, {
      name: '鑺傜洰',
      type: 'song',
      ext: {
        type: 'track',
      }
    }, {
      name: '鍒涗綔鑰�',
      type: 'artist',
      ext: {
        type: 'artist',
      }
    }]
  }
}
function safeArgs(data) {
  return typeof data === 'string' ? argsify(data) : (data ?? {})
}
function toHttps(url) {
  if (!url) {
    return ''
  }
  let s = `${url}`;
  if (s.startsWith('//')) {
    return 'https:' + s;
  }
  if (s.startsWith('http://')) {
    return s.replace(/^http:\/\//, 'https://');
  }
  if (!s.startsWith('http')) {
    return 'https://lf-cn-beijing-resource.coze-web.cn/' + s.replace(/^\//, '');
  }
  return s;
}
function firstArray(...candidates) {
  for (const item of candidates) {
    if (Array.isArray(item) && item.length > 0) {
      return item
    }
  }
  return []
}
// 鏍稿績淇锛氬垽鏂槸鍚︿负VIP鎴栦粯璐瑰唴瀹�
function isPaidItem(item) {
  if (!item) return false;
  // 鐣寗鐣呭惉浠樿垂瀛楁鏍囪瘑
  if (item.isPaid === true || item.isPaid === 1 || item.isPaid === 'true') return true;
  if (item.is_paid === true || item.is_paid === 1 || item.is_paid === 'true') return true;
  if (item.isVip === true || item.isVip === 1 || item.is_vip === true || item.is_vip === 1) return true;
  if (item.payType > 0 || item.pay_type > 0) return true;
  if (item.priceTypeId > 0 || item.price_type_id > 0) return true;
  if (item.vipFreeType > 0 || item.needPay === true) return true;
  return false;
}
async function fetchJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, {
    headers: {
      ...headers,
      ...extraHeaders,
    },
  })
  return safeArgs(data)
}
function mapAlbum(item) {
  const id = `${item?.albumId ?? item?.id ?? item?.album_id ?? item?.albumID ?? ''}`
  const name = item?.albumTitle ?? item?.title ?? item?.albumName ?? item?.name ?? ''
  
  const cover = toHttps(
    item?.coverLarge
    ?? item?.coverUrlLarge
    ?? item?.coverUrl
    ?? item?.cover_path
    ?? item?.coverPath
    ?? item?.coverMiddle
    ?? item?.picUrl
    ?? item?.albumCoverUrl
    ?? item?.albumCover
    ?? item?.albumPic
    ?? item?.pic
    ?? item?.picPath
    ?? item?.imgPath
    ?? ''
  )
  const artistId = `${item?.uid ?? item?.anchorId ?? item?.anchorUid ?? item?.userId ?? item?.creatorId ?? ''}`
  const artistName = item?.nickname ?? item?.anchorNickname ?? item?.anchorName ?? item?.author ?? item?.creatorNickname ?? '鐣寗鐣呭惉'
  const artistCover = toHttps(item?.avatar ?? item?.anchorAvatar ?? item?.creatorAvatar ?? '')
  return {
    id,
    name,
    title: name,
    cover,
    artwork: cover,     
    pic: cover,         
    coverImg: cover,    
    artist: {
      id: artistId,
      name: artistName,
      title: artistName,
      cover: artistCover,
      artwork: artistCover,
      pic: artistCover,
      avatar: artistCover, 
    },
    ext: {
      gid: GID.ALBUM_TRACKS,
      id,
      type: 'album',
    }
  }
}
function mapTrack(item) {
  const id = `${item?.trackId ?? item?.id ?? item?.soundId ?? item?.audioId ?? ''}`
  const name = item?.title ?? item?.trackTitle ?? item?.name ?? item?.soundTitle ?? ''
  
  const cover = toHttps(
    item?.coverLarge
    ?? item?.coverUrlLarge
    ?? item?.coverMiddle
    ?? item?.coverUrlMiddle
    ?? item?.albumCover
    ?? item?.coverPath
    ?? item?.cover_path
    ?? item?.coverUrl
    ?? item?.pic
    ?? ''
  )
  const artistId = `${item?.uid ?? item?.anchorUid ?? item?.anchorId ?? ''}`
  const artistName = item?.nickname ?? item?.anchorNickName ?? item?.anchorName ?? item?.userName ?? '涓绘挱'
  const artistCover = toHttps(item?.avatar ?? item?.anchorAvatar ?? '')
  return {
    id,
    name,
    title: name,
    cover,
    artwork: cover,     
    pic: cover,
    coverImg: cover,
    duration: parseInt(item?.duration ?? item?.interval ?? item?.playDuration ?? 0),
    artist: {
      id: artistId,
      name: artistName,
      title: artistName,
      cover: artistCover,
      artwork: artistCover,
      pic: artistCover,
      avatar: artistCover,
    },
    ext: {
      source: FANQIE_SOURCE,
      trackId: id,
      title: name,
      singer: artistName,
      songName: name,
    }
  }
}
function mapArtistCard(item) {
  const artistId = `${item?.uid ?? item?.anchorId ?? item?.anchorUid ?? item?.creatorId ?? ''}`
  const artistName = item?.nickname ?? item?.anchorNickname ?? item?.anchorName ?? item?.name ?? '鍒涗綔鑰�'
  const artistCover = toHttps(item?.avatar ?? item?.anchorAvatar ?? item?.pic ?? '')
  return {
    id: artistId,
    name: artistName,
    title: artistName,
    cover: artistCover,
    artwork: artistCover,
    pic: artistCover,
    avatar: artistCover,    
    coverImg: artistCover,  
    groups: [{
      name: '鐑棬鑺傜洰',
      type: 'song',
      ext: {
        gid: GID.ALBUM_TRACKS,
        id: artistId,
        type: 'artist',
        text: artistName,
      }
    }],
    ext: {
      gid: GID.ALBUM_TRACKS,
      id: artistId,
      type: 'artist',
      text: artistName,
    }
  }
}
// 鐣寗鐣呭惉鎺ㄨ崘涓撹緫鎺ュ彛
async function loadRecommendedAlbums(page = 1) {
  const urls = [
    `https://api.toutiao.com/api/radio/album/recommend?page=${page}&count=${PAGE_LIMIT}`,
    `https://radio.toutiao.com/api/v1/album/recommend?page_id=${page}&page_size=${PAGE_LIMIT}`,
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url)
      const list = firstArray(
        data?.data?.list,
        data?.data?.albums,
        data?.list,
        data?.albums
      )
      if (list.length > 0) {
        return list
      }
    } catch (e) {}
  }
  return []
}
// 鍏抽敭璇嶆悳绱笓杈�
async function loadAlbumsByKeyword(keyword, page = 1) {
  const kw = keyword || ''
  const urls = [
    `https://api.toutiao.com/api/radio/search/album?keyword=${encodeURIComponent(kw)}&page=${page}&count=${PAGE_LIMIT}`,
    `https://radio.toutiao.com/api/v1/search/album?query=${encodeURIComponent(kw)}&page_id=${page}&page_size=${PAGE_LIMIT}`,
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url)
      const list = firstArray(
        data?.data?.list,
        data?.data?.albums,
        data?.list,
        data?.albums
      )
      if (list.length > 0) {
        return list
      }
    } catch (e) {}
  }
  return []
}
// 鑾峰彇涓撹緫鑺傜洰鍒楄〃
async function loadAlbumTracks(albumId, page = 1) {
  const urls = [
    `https://api.toutiao.com/api/radio/album/tracks?album_id=${albumId}&page=${page}&count=${PAGE_LIMIT}`,
    `https://radio.toutiao.com/api/v1/album/track?album_id=${albumId}&page_id=${page}&page_size=${PAGE_LIMIT}`,
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url, {
        Referer: `https://radio.toutiao.com/album/${albumId}`,
      })
      const list = firstArray(
        data?.data?.tracks,
        data?.data?.list,
        data?.tracks,
        data?.list
      )
      if (list.length > 0) {
        return list
      }
    } catch (e) {}
  }
  return []
}
// 鍏抽敭璇嶆悳绱㈣妭鐩�
async function loadTracksByKeyword(keyword, page = 1) {
  const kw = keyword || ''
  const urls = [
    `https://api.toutiao.com/api/radio/search/track?keyword=${encodeURIComponent(kw)}&page=${page}&count=${PAGE_LIMIT}`,
    `https://radio.toutiao.com/api/v1/search/track?query=${encodeURIComponent(kw)}&page_id=${page}&page_size=${PAGE_LIMIT}`,
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url)
      const list = firstArray(
        data?.data?.list,
        data?.data?.tracks,
        data?.list,
        data?.tracks
      )
      if (list.length > 0) {
        return list
      }
    } catch (e) {}
  }
  return []
}
// 鎼滅储涓绘挱
async function loadArtistsByKeyword(keyword, page = 1) {
  if (page > 1) {
    return []
  }
  const list = await loadTracksByKeyword(keyword, 1)
  const seen = new Set()
  const artists = []
  for (const item of list) {
    const artist = mapArtistCard(item)
    if (!artist.id || seen.has(artist.id)) {
      continue
    }
    seen.add(artist.id)
    artists.push(artist)
    if (artists.length >= PAGE_LIMIT) {
      break
    }
  }
  return artists
}
async function getConfig() {
  return jsonify(appConfig)
}
async function getAlbums(ext) {
  const { page, gid, kw } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  if (gidValue == GID.RECOMMENDED_ALBUMS) {
    const list = await loadRecommendedAlbums(page)
    const freeList = list.filter(item => !isPaidItem(item));
    return jsonify({
      list: freeList.map(mapAlbum),
    })
  }
  if (gidValue == GID.TAG_ALBUMS) {
    const list = await loadAlbumsByKeyword(kw, page)
    const freeList = list.filter(item => !isPaidItem(item));
    return jsonify({
      list: freeList.map(mapAlbum),
    })
  }
  return jsonify({
    list: [],
  })
}
async function getSongs(ext) {
  const { page, gid, id, text } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  if (gidValue == GID.ALBUM_TRACKS) {
    if (text) {
      const list = await loadTracksByKeyword(text, page)
      const freeList = list.filter(item => !isPaidItem(item));
      return jsonify({
        list: freeList.map(mapTrack),
      })
    }
    const list = await loadAlbumTracks(id, page)
    const freeList = list.filter(item => !isPaidItem(item));
    return jsonify({
      list: freeList.map(mapTrack),
    })
  }
  return jsonify({
    list: [],
  })
}
async function getArtists(ext) {
  const { page, text, kw } = argsify(ext)
  const keyword = text || kw || ''
  if (!keyword) {
    return jsonify({
      list: [],
    })
  }
  const list = await loadArtistsByKeyword(keyword, page)
  return jsonify({
    list,
  })
}
async function getPlaylists(ext) {
  return jsonify({
    list: [],
  })
}
async function search(ext) {
  const { text, page, type } = argsify(ext)
  if (!text || page > SEARCH_PAGE_LIMIT) {
    return jsonify({})
  }
  if (type == 'album') {
    const list = await loadAlbumsByKeyword(text, page)
    const freeList = list.filter(item => !isPaidItem(item));
    return jsonify({
      list: freeList.map(mapAlbum),
    })
  }
  if (type == 'track' || type == 'song') {
    const list = await loadTracksByKeyword(text, page)
    const freeList = list.filter(item => !isPaidItem(item));
    return jsonify({
      list: freeList.map(mapTrack),
    })
  }
  if (type == 'artist') {
    const list = await loadArtistsByKeyword(text, page)
    return jsonify({
      list,
    })
  }
  return jsonify({})
}
// 鑾峰彇鎾斁鍦板潃
async function getSongInfo(ext) {
  const { trackId, quality } = argsify(ext)
  if (!trackId) {
    return jsonify({
      urls: [],
    })
  }
  const urls = [
    `https://api.toutiao.com/api/radio/track/play?track_id=${trackId}`,
    `https://radio.toutiao.com/api/v1/track/url?track_id=${trackId}`,
  ]
  for (const url of urls) {
    try {
      const { data } = await $fetch.get(url, {
        headers: {
          'User-Agent': UA,
          Referer: `https://radio.toutiao.com/track/${trackId}`,
        },
      })
      const info = safeArgs(data)
      if (info?.is_paid || info?.data?.isPaid || info?.needPay) {
        return jsonify({
          urls: [],
        })
      }
      const playUrl =
        (quality == '32k'
          ? (info?.play_path_32 || info?.data?.play_path_32 || info?.audio_url)
          : (info?.play_path_64 || info?.data?.play_path_64 || info?.audio_url || info?.play_path_32)) ||
        info?.data?.src ||
        info?.data?.audioUrl ||
        info?.audioUrl
      if (playUrl) {
        return jsonify({
          urls: [playUrl],
        })
      }
    } catch (e) {}
  }
  return jsonify({urls: [],})