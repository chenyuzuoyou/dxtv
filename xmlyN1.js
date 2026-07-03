/*!
 * @name xmlyfmN
 * @description xmlyfm3.4 喜马拉雅FM 终极修复版 V3 突破音乐/有声书专栏列表拦截
 * @version v1.8.0 FULLFIX
 * @author codex
 * @key csp_xmlyfm
 */
const $config = argsify($config_str)
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const UA_MOBILE = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
const UA_APP = 'ting_7.3.0(SM-S918B,Android14)'

const BASE_HEADERS = {
  'User-Agent': UA_PC,
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9',
  'Cache-Control': 'no-cache',
  'Origin': 'https://www.ximalaya.com',
  'X-Requested-With': 'XMLHttpRequest'
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
      {name: '热门推荐', type: 'album', ui:1, showMore:true, ext:{gid:GID.RECOMMENDED_ALBUMS}},
      {name: '音乐', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'音乐'}},
      {name: '播客', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'播客'}},
      {name: '历史', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'历史'}},
      {name: '图书', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'图书'}},
      {name: '小说', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'小说'}},
      {name: '相声', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'相声'}},
      {name: '有声书', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'有声书'}},
      {name: '评书', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'评书'}},
      {name: '情感', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'情感'}},
      {name: '儿童', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'儿童'}},
      {name: '悬疑', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'悬疑'}},
      {name: '财经', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'财经'}},
      {name: '教育', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'教育'}},
      {name: '人文', type: 'album', ui:1, showMore:true, ext:{gid:GID.TAG_ALBUMS, kw:'人文'}},
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
    try { return JSON.parse(data) } catch { return {} }
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

function isPaidItem(item) {
  if (!item) return false
  const now = new Date()
  const fullPay = !!(
    item.isPaid === true || item.isPaid === 1 ||
    item.is_paid === true || item.is_paid === 1 ||
    item.payType === 2 || item.pay_type === 2 ||
    item.priceTypeId > 1
  )
  const vipOnlyNoSample = !!(item.vipOnly === true && !item.isSample)
  let freeExpired = false
  if (item.free_end_time) {
    const end = new Date(item.free_end_time)
    if (end < now) freeExpired = true
  }
  return fullPay || vipOnlyNoSample || freeExpired
}

async function fetchJson(url, extraHeaders = {}, retry = 1) {
  let err = null
  for (let i = 0; i <= retry; i++) {
    try {
      const reqHeaders = { ...BASE_HEADERS, ...extraHeaders }
      const { data } = await $fetch.get(url, { headers: reqHeaders })
      return safeArgs(data)
    } catch (e) {
      err = e
      await new Promise(res => setTimeout(res, 300))
    }
  }
  throw err
}

// 简易生成喜马拉雅 H5 签名兜底逻辑
function generateXmSign() {
  const now = Date.now();
  return `${now}(${Math.floor(Math.random() * 100)})` + now + `(${Math.floor(Math.random() * 100)})${now}`;
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
    id, name, title: name, cover, artwork: cover, pic: cover, coverImg: cover,
    artist: { id: artistId, name: artistName, title: artistName, cover: artistCover, artwork: artistCover, pic: artistCover, avatar: artistCover },
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
    id, name, title: name, cover, artwork: cover, pic: cover, coverImg: cover,
    duration: parseInt(item?.duration ?? item?.interval ?? item?.track_duration ?? 0),
    artist: { id: artistId, name: artistName, title: artistName, cover: artistCover, artwork: artistCover, pic: artistCover, avatar: artistCover },
    ext: { source: XM_SOURCE, trackId: id, title: name, singer: artistName }
  }
}

async function loadRecommendedAlbums(page = 1) {
  const urls = [
    `https://mobile.ximalaya.com/mobile/discovery/v3/recommend/album?pageId=${page}&pageSize=${PAGE_LIMIT}&device=android`,
    `https://mobile.ximalaya.com/discovery-category/v2/category/recommend/albums?pageId=${page}&pageSize=${PAGE_LIMIT}&categoryId=0&device=android`
  ]
  for (const url of urls) {
    try {
      const data = await fetchJson(url, { 'User-Agent': UA_APP })
      const list = firstArray(data?.data?.list, data?.data?.albums)
      if (list.length > 0) return list
    } catch (e) {}
  }
  return []
}

async function loadAlbumsByKeyword(keyword, page = 1) {
  const kw = keyword || '热门'
  const urls = [
    `https://www.ximalaya.com/revision/search?core=album&kw=${encodeURIComponent(kw)}&page=${page}&rows=${PAGE_LIMIT}&spellchecker=true&condition=relation&device=web`,
    `https://mobile.ximalaya.com/mobile/search/result?query=${encodeURIComponent(kw)}&page=${page}&device=android`
  ]
  for (const url of urls) {
    try {
      const xmSign = generateXmSign();
      const data = await fetchJson(url, { 'xm-sign': xmSign })
      const list = firstArray(data?.data?.result?.response?.docs, data?.data?.album?.docs, data?.data?.albums)
      if (list.length > 0) return list
    } catch (e) {}
  }
  return []
}

// 核心修复逻辑：攻克音乐相关专辑列表空白
async function loadAlbumTracks(albumId, page = 1) {
  let allTracks = [];
  let currentPage = page || 1; 
  const randomDeviceId = '88' + Math.random().toString().substring(2, 16);
  const xmSign = generateXmSign();

  // 将请求大小降低为 30，高度模拟真实客户端行为，防音乐类别触发现流
  const apiList = [
    // 1. 全新精简高频 H5 网关（音乐专栏首选）
    {
      url: `https://www.ximalaya.com/revision/album/v1/getTracksList?albumId=${albumId}&pageNum=${currentPage}&pageSize=30`,
      ua: UA_PC,
      headers: { 'xm-sign': xmSign, 'Referer': `https://www.ximalaya.com/album/${albumId}` }
    },
    // 2. 移动端轻量接口
    {
      url: `https://mobile.ximalaya.com/mobile/v1/album/track/ts-${Date.now()}?albumId=${albumId}&device=android&pageId=${currentPage}&pageSize=30&isAsc=true&deviceId=${randomDeviceId}&version=7.3.0`,
      ua: UA_APP,
      headers: { 'Referer': 'https://servicewechat.com/wx70eeac35bc23a1a4/devtools/page-frame.html' }
    },
    // 3. 公开的移动查询网关
    {
      url: `https://m.ximalaya.com/m-revision/common/album/queryAlbumTrackRecordsPage?albumId=${albumId}&pageId=${currentPage}&pageSize=30`,
      ua: UA_MOBILE,
      headers: { 'Referer': `https://m.ximalaya.com/album/${albumId}` }
    },
    // 4. 经典全参数网关
    {
      url: `https://www.ximalaya.com/revision/play/v1/show?id=${albumId}&sort=0&size=30&pageNum=${currentPage}&ptype=1`,
      ua: UA_PC,
      headers: { 'xm-sign': xmSign, 'Referer': `https://www.ximalaya.com/album/${albumId}` }
    }
  ];

  for (const api of apiList) {
    try {
      const extraHeader = {
        'User-Agent': api.ua,
        ...api.headers
      }
      const data = await fetchJson(api.url, extraHeader, 1);
      
      const list = firstArray(
        data?.data?.list, data?.data?.tracks, data?.data?.trackList,
        data?.data?.trackShowPage?.list, data?.list, data?.tracks, 
        data?.trackList, data?.data?.audioList
      );
      
      if (list.length > 0) {
        allTracks = list;
        break;
      }
    } catch (err) {
      continue;
    }
  }
  return allTracks;
}

async function loadArtistTracks(artistId, page = 1) {
  const urls = [
    `https://www.ximalaya.com/revision/user/track?page=${page}&pageSize=${PAGE_LIMIT}&uid=${artistId}`,
    `https://m.ximalaya.com/m-revision/common/user/track/page?uid=${artistId}&page=${page}&pageSize=${PAGE_LIMIT}`
  ]
  for (const url of urls) {
    try {
      const xmSign = generateXmSign();
      const isMobile = url.includes('m.');
      const headers = {
        'User-Agent': isMobile ? UA_MOBILE : UA_PC,
        'xm-sign': xmSign,
        'Referer': isMobile ? 'https://m.ximalaya.com/' : 'https://www.ximalaya.com/'
      }
      const data = await fetchJson(url, headers)
      const list = firstArray(data?.data?.trackList, data?.data?.tracks, data?.data?.list)
      if (list.length > 0) return list
    } catch (e) {}
  }
  return []
}

async function loadTracksByKeyword(keyword, page = 1) {
  const kw = keyword || ''
  const urls = [
    `https://www.ximalaya.com/revision/search?core=track&kw=${encodeURIComponent(kw)}&page=${page}&rows=${PAGE_LIMIT}&spellchecker=true&condition=relation&device=web`
  ]
  for (const url of urls) {
    try {
      const xmSign = generateXmSign();
      const data = await fetchJson(url, { 'xm-sign': xmSign })
      const list = firstArray(data?.data?.result?.response?.docs, data?.data?.track?.docs, data?.data?.tracks)
      if (list.length > 0) return list
    } catch (e) {}
  }
  return []
}

async function loadArtistsByKeyword(keyword, page = 1) {
  const kw = keyword || ''
  const urls = [
    `https://www.ximalaya.com/revision/search?core=user&kw=${encodeURIComponent(kw)}&page=${page}&rows=${PAGE_LIMIT}&spellchecker=true&condition=relation&device=web`
  ]
  for (const url of urls) {
    try {
      const xmSign = generateXmSign();
      const data = await fetchJson(url, { 'xm-sign': xmSign })
      const list = firstArray(data?.data?.result?.response?.docs, data?.data?.user?.docs, data?.data?.users)
      if (list.length > 0) {
        return list.map(item => {
          const artistId = `${item?.uid ?? item?.id ?? item?.userId ?? ''}`
          const artistName = item?.nickname ?? item?.name ?? item?.title ?? '创作者'
          const artistCover = toHttps(item?.logoPic ?? item?.avatarPath ?? item?.avatar ?? item?.anchorAvatar ?? item?.pic ?? '')
          return {
            id: artistId, name: artistName, title: artistName, cover: artistCover, artwork: artistCover, avatar: artistCover,
            groups: [{name: '热门节目', type: 'song', ext: { gid: GID.ALBUM_TRACKS, id: artistId, type: 'artist' }}],
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
  if (gidValue == GID.RECOMMENDED_ALBUMS || !gidValue) {
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
  if (gidValue == GID.ALBUM_TRACKS || id) {
    if (type === 'artist') list = await loadArtistTracks(id, page)
    else if (text) list = await loadTracksByKeyword(text, page)
    else list = await loadAlbumTracks(id, page)
  }
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

async function getSongInfo(ext) {
  let arg = safeArgs(ext);
  let trackId = arg?.trackId || arg?.id;
  if (!trackId && typeof ext === 'string') {
    try { const parsed = JSON.parse(ext); trackId = parsed.trackId || parsed.id; } catch { trackId = ext; }
  }
  if (!trackId) return jsonify({ urls: [] })
  const urls = [
    { url: `https://mobile.ximalaya.com/mobile-playpage/track/v3/baseInfo/${Date.now()}?device=android&trackId=${trackId}&trackQualityLevel=2`, ua: UA_APP },
    { url: `https://m.ximalaya.com/m-revision/common/track/getPlayUrlV4?trackId=${trackId}`, ua: UA_MOBILE }
  ]
  for (const item of urls) {
    try {
      const data = await fetchJson(item.url, { 'User-Agent': item.ua }, 1)
      const d = data?.data?.trackInfo || data?.data || data?.trackInfo || data;
      let playUrl =
        d?.playUrl64 || d?.playUrl32 || d?.playUrl || d?.src || d?.url ||
        d?.playPathHq || d?.play_path_64 || d?.play_path_32 || d?.play_path ||
        d?.audioUrl || d?.epPlayUrl || d?.resource?.url;
      if (playUrl && playUrl.startsWith('http')) {
        playUrl = playUrl.replace(/^http:\/\//, 'https://')
        return jsonify({ urls: [playUrl] })
      }
    } catch (e) { continue; }
  }
  return jsonify({ urls: [] })
}
