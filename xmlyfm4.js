/*!
 * @name 4xmlyfm4 (完整限免标注版)
 * @description 喜马拉雅FM（探索页+搜索页显示所有专辑 + [限免]/[部分限免]标注 + 专辑内仅显示免费/限免条目 + 极速解析）
 * @version v1.6.6-mod
 * @author codex + Grok 修改
 * @key csp_4xmlyfm4
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

// ==================== 增强版限免/付费判断 ====================
function isCurrentlyLimitFree(item) {
  if (!item) return false
  const now = Date.now()

  return !!(
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

// 判断整张专辑的限免类型（用于标注）
function getAlbumLimitType(albumItem, tracks = []) {
  if (!albumItem) return 'normal'

  const albumFree = isCurrentlyLimitFree(albumItem)

  if (tracks.length === 0) {
    return albumFree ? 'full_limit' : 'normal'
  }

  const freeTracks = tracks.filter(t => !isPaidItem(t))
  const allFree = freeTracks.length === tracks.length
  const someFree = freeTracks.length > 0 && freeTracks.length < tracks.length

  if (allFree && (albumFree || freeTracks.length > 0)) return 'full_limit'
  if (someFree) return 'partial_limit'
  return 'normal'
}

function mapAlbum(item, tracks = []) {
  const id = `${item?.albumId ?? item?.id ?? item?.album_id ?? ''}`
  let name = item?.albumTitle ?? item?.title ?? item?.albumName ?? ''

  const limitType = getAlbumLimitType(item, tracks)
  if (limitType === 'full_limit') {
    name = `[限免] ${name}`
  } else if (limitType === 'partial_limit') {
    name = `[部分限免] ${name}`
  }

  const cover = toHttps(
    item?.coverLarge ?? item?.coverUrlLarge ?? item?.coverUrl ??
    item?.cover_path ?? item?.coverPath ?? item?.coverMiddle ??
    item?.picUrl ?? item?.albumCoverUrl290 ?? item?.albumCover ??
    item?.albumPic ?? item?.pic ?? item?.picPath ?? item?.imgPath ?? ''
  )
  const artistId = `${item?.uid ?? item?.anchorId ?? item?.anchorUid ?? item?.userId ?? ''}`
  const artistName = item?.nickname ?? item?.anchorNickname ?? item?.anchorName ?? '喜马拉雅'
  const artistCover = toHttps(
    item?.avatar ?? item?.anchorAvatar ?? item?.logoPic ?? item?.avatarPath ?? item?.avatar_path ?? ''
  )

  return {
    id,
    name: name, title: name,
    cover, artwork: cover, pic: cover, coverImg: cover,
    artist: {
      id: artistId, name: artistName, title: artistName,
      cover: artistCover, artwork: artistCover, pic: artistCover, avatar: artistCover
    },
    ext: { gid: GID.ALBUM_TRACKS, id, type: 'album' }
  }
}

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
  const artistCover = toHttps(
    item?.avatar ?? item?.anchorAvatar ?? item?.logoPic ?? item?.avatarPath ?? item?.avatar_path ?? ''
  )

  return {
    id,
    name: name, title: name,
    cover, artwork: cover, pic: cover, coverImg: cover,
    duration: parseInt(item?.duration ?? item?.interval ?? 0),
    artist: {
      id: artistId, name: artistName, title: artistName,
      cover: artistCover, artwork: artistCover, pic: artistCover, avatar: artistCover
    },
    ext: { source: XM_SOURCE, trackId: id, title: name, singer: artistName }
  }
}

async function fetchJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, { headers: { ...headers, ...extraHeaders } })
  return safeArgs(data)
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
  let allTracks = [];
  let currentPage = 1;
  const maxPage = 50;

  while (currentPage <= maxPage) {
    const urls = [
      `https://www.ximalaya.com/revision/album/v1/getTracksList?albumId=${albumId}&pageNum=${currentPage}&pageSize=100`,
      `https://mobile.ximalaya.com/mobile/v1/album/track/?albumId=${albumId}&pageSize=100&pageId=${currentPage}`
    ];

    let pageTracks = [];
    for (const url of urls) {
      try {
        const data = await fetchJson(url, {
          Referer: `https://www.ximalaya.com/album/${albumId}`
        });
        const list = firstArray(data?.data?.tracks, data?.data?.list, data?.tracks);
        if (list.length > 0) {
          pageTracks = list;
          break;
        }
      } catch (e) {}
    }

    if (pageTracks.length === 0) break;
    allTracks = allTracks.concat(pageTracks);
    if (pageTracks.length < 100) break; 
    currentPage++;
  }

  return allTracks;
}

async function loadArtistTracks(artistId, page = 1) {
  const urls = [
    `https://www.ximalaya.com/revision/user/track?page=${page}&pageSize=${PAGE_LIMIT}&uid=${artistId}`,
    `https://m.ximalaya.com/m-revision/common/user/track/page?uid=${artistId}&page=${page}&pageSize=${PAGE_LIMIT}`,
    `https://mobile.ximalaya.com/mobile/v1/anchor/track?anchorId=${artistId}&pageId=${page}&pageSize=${PAGE_LIMIT}`
  ]
  
  const mobileUA = 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36'

  for (const url of urls) {
    try {
      const isMobile = url.includes('mobile.') || url.includes('m.')
      const { data } = await $fetch.get(url, {
        headers: {
          'User-Agent': isMobile ? mobileUA : UA,
          'Referer': isMobile ? 'https://m.ximalaya.com/' : 'https://www.ximalaya.com/'
        }
      })
      const info = safeArgs(data)
      const list = firstArray(
        info?.data?.trackList, 
        info?.data?.tracks, 
        info?.data?.list, 
        info?.trackList, 
        info?.tracks
      )
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
  const kw = keyword || ''
  const urls = [
    `https://www.ximalaya.com/revision/search?core=user&kw=${encodeURIComponent(kw)}&page=${page}&rows=${PAGE_LIMIT}&spellchecker=true&condition=relation&device=web`,
    `https://mobile.ximalaya.com/mobile/search/result?query=${encodeURIComponent(kw)}&page=${page}&type=user`
  ]

  for (const url of urls) {
    try {
      const data = await fetchJson(url)
      const list = firstArray(
        data?.data?.result?.response?.docs, 
        data?.data?.user?.docs, 
        data?.data?.users, 
        data?.data?.docs
      )
      
      if (list.length > 0) {
        return list.map(item => {
          const artistId = `${item?.uid ?? item?.id ?? item?.userId ?? ''}`
          const artistName = item?.nickname ?? item?.name ?? item?.title ?? '创作者'
          const artistCover = toHttps(
            item?.logoPic ?? item?.avatarPath ?? item?.avatar_path ?? item?.avatar ?? 
            item?.anchorAvatar ?? item?.pic ?? item?.coverPath ?? ''
          )
          
          return {
            id: artistId, name: artistName, title: artistName,
            cover: artistCover, artwork: artistCover, avatar: artistCover,
            groups: [{
              name: '热门节目', type: 'song',
              ext: { gid: GID.ALBUM_TRACKS, id: artistId, type: 'artist' }
            }],
            ext: { gid: GID.ALBUM_TRACKS, id: artistId, type: 'artist' }
          }
        }).filter(i => i.id)
      }
    } catch (e) {}
  }
  return []
}

async function getConfig() { return jsonify(appConfig) }

async function getAlbums(ext) {
  const { page, gid, kw } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let rawList = []

  if (gidValue == GID.RECOMMENDED_ALBUMS) {
    rawList = await loadRecommendedAlbums(page)
  } else if (gidValue == GID.TAG_ALBUMS) {
    rawList = await loadAlbumsByKeyword(kw, page)
  }

  // 探索页全部显示专辑 + 标注（tracks为空，使用专辑本身字段判断）
  return jsonify({ list: rawList.map(item => mapAlbum(item)) })
}

async function getSongs(ext) {
  const { page, gid, id, text, type } = argsify(ext)
  let list = []

  if (`${gid ?? ''}` == GID.ALBUM_TRACKS) {
    if (type === 'artist') {
      list = await loadArtistTracks(id, page)
    } else if (text) {
      list = await loadTracksByKeyword(text, page)
    } else {
      list = await loadAlbumTracks(id, page)
    }
  }

  // 专辑内只显示当前免费/限免条目
  const freeList = list.filter(item => !isPaidItem(item))
  return jsonify({ list: freeList.map(mapTrack) })
}

async function getArtists(ext) {
  const { text, kw, page } = argsify(ext)
  const keyword = text || kw || ''
  if (!keyword) return jsonify({ list: [] })
  const list = await loadArtistsByKeyword(keyword, page || 1)
  return jsonify({ list })
}

async function getPlaylists(ext) { return jsonify({ list: [] }) }

async function search(ext) {
  const { text, page, type } = argsify(ext)
  if (!text || page > SEARCH_PAGE_LIMIT) return jsonify({})

  if (type == 'album') {
    const rawList = await loadAlbumsByKeyword(text, page)
    // 搜索专辑也添加 [限免]/[部分限免] 标注
    return jsonify({ list: rawList.map(item => mapAlbum(item)) })
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

// 极速解析播放链接（针对限免内容优化）
async function getSongInfo(ext) {
  let arg = safeArgs(ext);
  let trackId = arg?.trackId || arg?.id;
  
  if (!trackId && typeof ext === 'string') {
    try {
      const parsed = JSON.parse(ext);
      trackId = parsed.trackId || parsed.id;
    } catch (e) {
      trackId = ext; 
    }
  }
  if (!trackId) return jsonify({ urls: [] })

  const appUA = 'ting_6.7.9(SM-G981B,Android10)';
  const mobileUA = 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

  const urls = [
    { url: `https://mobile.ximalaya.com/mobile-playpage/track/v3/baseInfo/${Date.now()}?device=android&trackId=${trackId}&trackQualityLevel=2`, ua: appUA },
    { url: `https://mobile.ximalaya.com/mobile/v1/track/baseInfo?device=android&trackId=${trackId}`, ua: appUA },
    { url: `https://m.ximalaya.com/m-revision/common/track/getPlayUrlV4?trackId=${trackId}`, ua: mobileUA },
    { url: `https://mobile.ximalaya.com/v1/track/baseInfo?device=android&trackId=${trackId}`, ua: appUA }
  ]

  for (const item of urls) {
    try {
      const { data } = await $fetch.get(item.url, {
        headers: { 'User-Agent': item.ua }
      });
      
      const info = typeof data === 'string' ? JSON.parse(data) : data;
      const d = (info?.data && info?.data?.trackInfo) ? info.data.trackInfo : (info?.data || info?.trackInfo || info);

      let playUrl =
        d?.playUrl64 || d?.playUrl32 || d?.playUrl || d?.src || d?.url || 
        d?.playPathHq || d?.play_path_64 || d?.play_path_32 || d?.play_path ||
        d?.playPathAacv164 || d?.playPathAacv224 ||
        d?.audioUrl || d?.epPlayUrl || d?.ep_play_url ||
        d?.trackInfo?.playUrl || d?.trackInfo?.playUrl64;

      if (playUrl && playUrl.includes('http')) {
        if (playUrl.startsWith("//")) playUrl = "https:" + playUrl
        if (playUrl.startsWith("http://")) playUrl = playUrl.replace(/^http:\/\//, "https://")
        return jsonify({ urls: [playUrl] })
      }
    } catch (e) {
      // 容错继续尝试
    }
  }

  return jsonify({ urls: [] })
}