/*!
 * @name xmlyfmN
 * @description xmlyfm3.4 喜马拉雅FM（纯净版修复：解决专辑列表空白、修正付费误过滤、新增官方H5兜底接口）
 * @version v1.6.5 FIX
 * @author codex
 * @key csp_xmlyfm
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
const APP_UA = 'ting_7.2.0(Pixel7,Android13)'
const headers = {
  'User-Agent': UA,
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9',
  'Cache-Control': 'no-cache',
  'Origin': 'https://www.ximalaya.com'
}
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
  try {
    return typeof data === 'string' ? argsify(data) : (data ?? {})
  } catch (e) {
    try {
      return typeof data === 'string' ? JSON.parse(data) : {}
    } catch (err) {
      return {}
    }
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
// ========== 修复：重写付费过滤逻辑，解决免费内容被误清空 ==========
// 仅过滤【完全付费不可听】，免费、限免可听、试听单集全部保留
function isPaidItem(item) {
  if (!item) return false
  const now = new Date()
  // 1. 真正永久付费、购买才能听的条目
  const realPay = !!(
    item.isPaid === true || item.isPaid === 1 ||
    item.is_paid === true || item.is_paid === 1 ||
    item.payType === 2 || item.pay_type === 2 ||
    item.priceTypeId > 1 || item.price_type_id > 1
  )
  // 2. 仅付费VIP专属、无免费试听
  const onlyVip = !!(
    item.vipOnly === true || item.isVipOnly === true
  )
  // 3. 限时付费且当前不在免费期
  let timeLimitExpired = false
  if (item.free_end_time) {
    const freeEnd = new Date(item.free_end_time)
    if (freeEnd < now) timeLimitExpired = true
  }
  // 仅满足【永久付费】或【纯VIP无试听】或【限时免费已过期】才过滤
  return realPay || onlyVip || timeLimitExpired
}
async function fetchJson(url, extraHeaders = {}) {
  const reqHeaders = { ...headers, ...extraHeaders }
  const { data } = await $fetch.get(url, { headers: reqHeaders })
  return safeArgs(data)
}
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
  const id = `${item?.trackId ?? item?.id ?? item?.soundId ?? item?.track_id ?? ''}`
  const name = item?.title ?? item?.trackTitle ?? item?.name ?? ''
  const cover = toHttps(
    item?.coverLarge ?? item?.coverUrlLarge ?? item?.coverMiddle ??
    item?.coverUrlMiddle ?? item?.albumCover ?? item?.coverPath ??
    item?.cover_path ?? item?.coverUrl ?? item?.pic ?? ''
  )
  const artistId = `${item?.uid ?? item?.anchorUid ?? item?.anchorId ?? item?.anchor_uid ?? ''}`
  const artistName = item?.nickname ?? item?.anchorNickName ?? item?.anchorName ?? '主播'
  const artistCover = toHttps(
    item?.avatar ?? item?.anchorAvatar ?? item?.logoPic ?? item?.avatarPath ?? item?.avatar_path ?? ''
  )
  return {
    id,
    name: name, title: name,
    cover, artwork: cover, pic: cover, coverImg: cover,
    duration: parseInt(item?.duration ?? item?.interval ?? item?.track_duration ?? 0),
    artist: {
      id: artistId, name: artistName, title: artistName,
      cover: artistCover, artwork: artistCover, pic: artistCover, avatar: artistCover
    },
    ext: { source: XM_SOURCE, trackId: id, title: name, singer: artistName }
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
// ========== 核心修复：重写专辑曲目加载函数，新增官方H5兜底接口 ==========
async function loadAlbumTracks(albumId, page = 1) {
  let allTracks = [];
  let currentPage = 1;
  const maxPage = 50;
  while (currentPage <= maxPage) {
    // 接口优先级：1.H5网关官方接口（网页原生）> 2.mobile v1 > 3.旧revision web接口
    const urlList = [
      {
        url: `https://www.ximalaya.com/gatekeeper/h5-listen-list?albumId=${albumId}&pageNum=${currentPage}&pageSize=100`,
        ua: MOBILE_UA,
        referer: `https://www.ximalaya.com/album/${albumId}`
      },
      {
        url: `https://mobile.ximalaya.com/mobile/v1/album/track/?albumId=${albumId}&pageSize=100&pageId=${currentPage}`,
        ua: APP_UA,
        referer: `https://mobile.ximalaya.com/album/${albumId}`
      },
      {
        url: `https://www.ximalaya.com/revision/album/v1/getTracksList?albumId=${albumId}&pageNum=${currentPage}&pageSize=100`,
        ua: UA,
        referer: `https://www.ximalaya.com/album/${albumId}`
      }
    ];
    let pageTracks = [];
    // 遍历接口依次尝试，拿到数据立即跳出
    for (const api of urlList) {
      try {
        const resHeaders = {
          'User-Agent': api.ua,
          'Referer': api.referer,
          'Accept': 'application/json'
        }
        const data = await fetchJson(api.url, resHeaders);
        // 兼容多版本返回结构
        const list = firstArray(
          data?.data?.tracks,
          data?.data?.list,
          data?.data?.trackList,
          data?.tracks,
          data?.list,
          data?.trackList
        );
        if (list.length > 0) {
          pageTracks = list;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    // 当前页无数据，终止循环
    if (pageTracks.length === 0) break;
    allTracks = allTracks.concat(pageTracks);
    // 不足100条代表无下一页，终止
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
  const mobileUA = MOBILE_UA
  for (const url of urls) {
    try {
      const isMobile = url.includes('mobile.') || url.includes('m.')
      const { data } = await $fetch.get(url, {
        headers: {
          'User-Agent': isMobile ? mobileUA : UA,
          'Referer': isMobile ? 'https://m.ximalaya.com/' : 'https://www.ximalaya.com/',
          'Accept': 'application/json'
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
  // 过滤真实付费内容，免费试听全部保留
  return jsonify({ list: list.filter(item => !isPaidItem(item)).map(mapTrack) })
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
// 播放地址解析保持兼容，补充新播放节点提取
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
  const urls = [
    { url: `https://mobile.ximalaya.com/mobile-playpage/track/v3/baseInfo/${Date.now()}?device=android&trackId=${trackId}&trackQualityLevel=2`, ua: APP_UA },
    { url: `https://m.ximalaya.com/m-revision/common/track/getPlayUrlV4?trackId=${trackId}`, ua: MOBILE_UA },
    { url: `https://mobile.ximalaya.com/v1/track/baseInfo?device=android&trackId=${trackId}`, ua: APP_UA }
  ]
  for (const item of urls) {
    try {
      const { data } = await $fetch.get(item.url, {
        headers: { 'User-Agent': item.ua, 'Accept': 'application/json' }
      });
      const info = typeof data === 'string' ? JSON.parse(data) : data;
      const d = (info?.data && info?.data?.trackInfo) ? info.data.trackInfo : (info?.data || info?.trackInfo || info);
      let playUrl =
        d?.playUrl64 || d?.playUrl32 || d?.playUrl || d?.src || d?.url ||
        d?.playPathHq || d?.play_path_64 || d?.play_path_32 || d?.play_path ||
        d?.playPathAacv164 || d?.playPathAacv224 ||
        d?.audioUrl || d?.epPlayUrl || d?.ep_play_url ||
        d?.trackInfo?.playUrl || d?.trackInfo?.playUrl64 || d?.resource?.url;
      if (playUrl && playUrl.includes('http')) {
        if (playUrl.startsWith("//")) playUrl = "https:" + playUrl
        if (playUrl.startsWith("http://")) playUrl = playUrl.replace(/^http:\/\//, "https://")
        return jsonify({ urls: [playUrl] })
      }
    } catch (e) {
      continue;
    }
  }
  return jsonify({ urls: [] })
}
