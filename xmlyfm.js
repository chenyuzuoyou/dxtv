/*!
 * @name xmlyfm3
 * @description 喜马拉雅FM（终极修复：蜘蛛协议绕过xm-sign + 官方App底层API防拦截）
 * @version v1.6.1
 * @author codex
 * @key csp_xmlyfm
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
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
    name: item._limitFree ? `【限免】${name}` : name,
    title: item._limitFree ? `【限免】${name}` : name,
    cover, artwork: cover, pic: cover, coverImg: cover,
    artist: {
      id: artistId, name: artistName, title: artistName,
      cover: artistCover, artwork: artistCover, pic: artistCover, avatar: artistCover
    },
    ext: { gid: GID.ALBUM_TRACKS, id, type: 'album', isAlbumLimitFree: item._limitFree }
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

  return jsonify({ list: list.map(mapTrack) })
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

// ✅ 终极防屏蔽播放策略
async function getSongInfo(ext) {
  // 高容错参数解析，防止因入参是字符串而提取不到trackId
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

  // 伪造 xm-sign 格式兜底，供部分弱校验接口使用
  const now = Date.now();
  const fakeSign = `1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d(99)${now}(99)${now}`;

  // 1. 搜索引擎爬虫 UA（极高概率绕过 PC 端的 xm-sign 强校验与要求登录限制）
  const spiderUA = 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)';
  // 2. 喜马拉雅官方 App UA（获取最底层接口的播放地址，无视 H5 网关的各种下载 App 拦截）
  const appUA = 'ting_6.7.9(SM-G981B,Android10)';
  // 3. 通用移动端 UA
  const mobileUA = 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

  const urls = [
    // 权重1：PC端 API + 蜘蛛协议 (放行免费和限免最宽松)
    { url: `https://www.ximalaya.com/revision/play/v1/audio?id=${trackId}&ptype=1`, ua: spiderUA, ref: `https://www.ximalaya.com/sound/${trackId}` },
    // 权重2：移动App底层 API + 官方App UA (突破所有防抓取拦截网页)
    { url: `https://mobile.ximalaya.com/v1/track/baseInfo?device=android&trackId=${trackId}`, ua: appUA, ref: '' },
    // 权重3：H5端老牌免签名 API
    { url: `https://m.ximalaya.com/m-revision/common/track/getPlayUrlV4?trackId=${trackId}`, ua: mobileUA, ref: `https://m.ximalaya.com/sound/${trackId}` },
    // 权重4：PlayPage API
    { url: `https://mobile.ximalaya.com/mobile-playpage/track/v3/baseInfo/${now}?device=android&trackId=${trackId}&trackQualityLevel=2`, ua: appUA, ref: '' },
    // 权重5：老版本 JSON 接口
    { url: `https://m.ximalaya.com/tracks/${trackId}.json`, ua: mobileUA, ref: `https://m.ximalaya.com/` }
  ]

  for (const item of urls) {
    try {
      const { data } = await $fetch.get(item.url, {
        headers: {
          'User-Agent': item.ua,
          'Referer': item.ref,
          'xm-sign': fakeSign
        }
      })

      // 解析兼容：如果接口被拦截返回了 HTML，这里JSON解析会报错并跳转 catch，静默重试下一个 URL
      const info = typeof data === 'string' ? JSON.parse(data) : data;
      
      const d = (info?.data && info?.data?.trackInfo) ? info.data.trackInfo : (info?.data || info?.trackInfo || info)

      // 全方位覆盖所有可能的播放地址字段
      let playUrl =
        d?.src || d?.url || d?.playUrl || 
        d?.play_path_64 || d?.play_path_32 || d?.play_path ||
        d?.playUrl64 || d?.playUrl32 || d?.playPathHq ||
        d?.playPathAacv164 || d?.playPathAacv224 ||
        d?.audioUrl || d?.epPlayUrl || d?.ep_play_url ||
        d?.trackInfo?.playUrl || d?.trackInfo?.playUrl64;

      if (playUrl && playUrl.includes('http')) {
        if (playUrl.startsWith("//")) playUrl = "https:" + playUrl
        if (playUrl.startsWith("http://")) playUrl = playUrl.replace(/^http:\/\//, "https://")
        return jsonify({ urls: [playUrl] })
      }
    } catch (e) {
      // 被反爬策略拦截（如返回验证码页面、下载App引导页）时，忽略报错，继续尝试更高权限的请求链
    }
  }

  return jsonify({ urls: [] })
}
