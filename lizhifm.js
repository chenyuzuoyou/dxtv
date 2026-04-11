/*!
 * @name lizhi
 * @description 荔枝有声 首页单曲直连版
 * @author codex
 * @key csp_lizhi
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
const headers = {
  'User-Agent': UA,
  'Referer': 'https://m.lizhi.fm/'
}
const PAGE_LIMIT = 999
const SEARCH_PAGE_LIMIT = 5
const LIZHI_SOURCE = 'lizhi'
const GID = {
  RECOMMENDED_ALBUMS: '1',
  TAG_ALBUMS: '2',
  ALBUM_TRACKS: '3',
}

// 尽可能多地扩充所有常见的有声/电台分类
const allCategories = [
  '情感',
  '助眠',
  '播客',
  '脱口秀',
  '有声书',
  '广播剧',
  '二次元',
  '儿童',
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
];

const appConfig = {
  ver: 1,
  name: '荔枝有声',
  message: '',
  warning: '',
  desc: '荔枝FM有声书、播客、有声节目',
  tabLibrary: {
    name: '探索',
    // 将 type 从 album 改为 song，去掉多余的点击列表层级，点击直接播放
    groups: [
      {
        name: '我的推荐',
        type: 'song',
        showMore: true,
        ext: { gid: GID.TAG_ALBUMS, kw: '热门推荐' }
      },
      ...allCategories.map(kw => ({
        name: kw,
        type: 'song',
        showMore: true,
        ext: { gid: GID.TAG_ALBUMS, kw: kw }
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

function safeArgs(data) {
  return typeof data === 'string' ? argsify(data) : (data ?? {})
}

function toHttps(url) {
  if (!url) return ''
  let s = `${url}`
  if (s.startsWith('//')) return 'https:' + s
  return s
}

function cleanText(t) {
  return `${t ?? ''}`.replace(/\s+/g, ' ').trim()
}

function firstArray(...candidates) {
  for (const i of candidates) {
    if (Array.isArray(i) && i.length > 0) return i
  }
  return []
}

async function fetchJson(url, extraHeaders = {}) {
  try {
    const { data } = await $fetch.get(url, {
      headers: { ...headers, ...extraHeaders }
    })
    return safeArgs(data)
  } catch (e) {
    return {}
  }
}

function extractVoice(item) {
  if (!item) return {};
  const voiceInfo = item?.voiceInfo || item?.userVoice?.voiceInfo || item;
  const userInfo = item?.userInfo || item?.userVoice?.userInfo || {};
  return { voiceInfo, userInfo };
}

function mapAlbum(item) {
  const { voiceInfo, userInfo } = extractVoice(item);
  
  const id = `${voiceInfo?.voiceId ?? voiceInfo?.id ?? item?.id ?? ''}`
  return {
    id: id,
    name: cleanText(voiceInfo?.name || voiceInfo?.title || item?.title || item?.name || '未知专辑'),
    cover: toHttps(voiceInfo?.imageUrl || voiceInfo?.cover || item?.cover),
    artist: {
      id: `${userInfo?.userId ?? userInfo?.id ?? ''}`,
      name: cleanText(userInfo?.name || userInfo?.nickname || '主播')
    },
    ext: {
      gid: GID.ALBUM_TRACKS,
      id: id,
      source: LIZHI_SOURCE,
      type: 'album'
    }
  }
}

function mapTrack(item) {
  const { voiceInfo, userInfo } = extractVoice(item);
  
  const trackId = `${voiceInfo?.voiceId ?? voiceInfo?.id ?? item?.id ?? ''}`;
  const trackName = cleanText(voiceInfo?.name || voiceInfo?.title || item?.title || item?.name || '未知节目');
  
  return {
    id: trackId,
    name: trackName,
    cover: toHttps(voiceInfo?.imageUrl || voiceInfo?.cover || item?.cover || ''),
    duration: parseInt(voiceInfo?.duration || item?.duration || 0),
    artist: { 
      id: `${userInfo?.userId ?? userInfo?.id ?? ''}`, 
      name: cleanText(userInfo?.name || userInfo?.nickname || '主播') 
    },
    ext: {
      source: LIZHI_SOURCE,
      trackId: trackId,
      songName: trackName
    }
  }
}

async function loadAlbumsByKeyword(keyword, page = 1) {
  const kw = encodeURIComponent(keyword || '热门')
  
  const p1 = page * 3 - 2;
  const p2 = page * 3 - 1;
  const p3 = page * 3;
  
  const baseUrl = 'https://m.lizhi.fm/vodapi/search/voice?deviceId=h5-f93e74ac-0065-8207-4853-75dec8585db3&receiptData=CAASJ2g1LWY5M2U3NGFjLTAwNjUtODIwNy00ODUzLTc1ZGVjODU4NWRiMyj%2FhvGLxy0wDDgF&keywords=' + kw + '&page=';
  
  const [res1, res2, res3] = await Promise.all([
    fetchJson(baseUrl + p1),
    fetchJson(baseUrl + p2),
    fetchJson(baseUrl + p3)
  ]);
  
  const list1 = firstArray(res1.data) || [];
  const list2 = firstArray(res2.data) || [];
  const list3 = firstArray(res3.data) || [];
  
  const combined = [...list1, ...list2, ...list3];
  const unique = [];
  const ids = new Set();
  
  for (const item of combined) {
    const id = item?.voiceInfo?.voiceId || item?.voiceInfo?.id || item?.id;
    if (id && !ids.has(id)) {
      ids.add(id);
      unique.push(item);
    }
  }
  
  return unique;
}

async function loadAlbumTracks(albumId) {
  if (!albumId) return []
  const data = await fetchJson('https://m.lizhi.fm/vodapi/voice/info/' + albumId)
  
  if (data?.data?.tracks) return data.data.tracks;
  if (Array.isArray(data?.data)) return data.data;
  
  if (data?.data?.userVoice) return [data.data.userVoice];
  if (data?.data?.voiceInfo) return [data.data];
  if (data?.data && typeof data.data === 'object') return [data.data];
  
  return []
}

async function getConfig() {
  return jsonify(appConfig)
}

async function getAlbums(ext) {
  const { page = 1, gid, kw } = argsify(ext)
  // 如果搜索等其他地方还在调用专辑列表
  if (gid == GID.TAG_ALBUMS) {
    const list = await loadAlbumsByKeyword(kw, page)
    return jsonify({ 
        list: list.map(mapAlbum),
        isEnd: list.length < 40 
    })
  }
  return jsonify({ list: [] })
}

async function getSongs(ext) {
  const { gid, id, kw, page = 1 } = argsify(ext)
  
  // 1. 如果是从旧的专辑结构点进来的（获取专辑下的单曲）
  if (gid == GID.ALBUM_TRACKS && id) {
    const list = await loadAlbumTracks(id)
    return jsonify({ list: list.map(mapTrack) })
  }
  
  // 2. 如果是从首页直接加载分类（新增逻辑）
  if (gid == GID.TAG_ALBUMS && kw) {
    const list = await loadAlbumsByKeyword(kw, page)
    return jsonify({ 
        list: list.map(mapTrack),
        isEnd: list.length < 40 
    })
  }
  
  return jsonify({ list: [] })
}

async function getArtists(ext) {
  return jsonify({ list: [] })
}

async function getPlaylists() {
  return jsonify({ list: [] })
}

async function search(ext) {
  const { text, page = 1, type } = argsify(ext)
  if (!text) return jsonify({})
  
  const list = await loadAlbumsByKeyword(text, page)
  
  if (type === 'album') {
    return jsonify({ list: list.map(mapAlbum), isEnd: list.length < 40 })
  } else if (type === 'track' || type === 'song') {
    return jsonify({ list: list.map(mapTrack), isEnd: list.length < 40 })
  }
  
  return jsonify({})
}

async function getSongInfo(ext) {
  const { trackId } = argsify(ext)
  if (!trackId) return jsonify({ urls: [] })
  
  const playData = await fetchJson('https://m.lizhi.fm/vodapi/voice/play/' + trackId)
  let url = playData?.data?.trackUrl || playData?.data?.url || playData?.data?.userVoice?.voicePlayProperty?.trackUrl;
  
  if (!url) {
    const infoData = await fetchJson('https://m.lizhi.fm/vodapi/voice/info/' + trackId)
    url = infoData?.data?.userVoice?.voicePlayProperty?.trackUrl 
       || infoData?.data?.voicePlayProperty?.trackUrl 
       || infoData?.data?.userVoice?.voiceInfo?.trackUrl
       || infoData?.data?.trackUrl;
  }
  
  return jsonify({ urls: url ? [toHttps(url)] : [] })
}
