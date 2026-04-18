/*!
 * @name cooltv
 * @description cooltv.top 电台电视直播
 * @version v1.0.0
 * @author codex
 * @key csp_cooltv
 */
// 直接解析填入的配置文本作为 UID，增加兜底默认值
let userUid = 'cooltv';
try {
  if (typeof $config_str !== 'undefined' && $config_str) {
    if (typeof $config_str === 'string') {
      if ($config_str.trim().startsWith('{')) {
        const parsed = argsify($config_str);
        userUid = parsed?.uid || parsed?.cookie || parsed?.ext || 'cooltv';
      } else {
        userUid = $config_str.trim() || 'cooltv';
      }
    }
  }
} catch (e) {
  console.log('配置解析失败，使用默认UID', e);
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = { 'User-Agent': UA }
const PAGE_LIMIT = 100
const SEARCH_PAGE_LIMIT = 5
const COOL_SOURCE = 'cooltv'

const GID = {
  CNR_RADIO: '1',
  CCTV_TV: '2',
  MUSIC_RADIO: '3',
  TRAFFIC_RADIO: '4',
  OVERSEA_RADIO: '5',
  SPECIAL_RADIO: '6',
  SEARCH_CHANNEL: '9',
  MY_FAVORITE_SONGS: '10',
  MY_CREATED_PLAYLISTS: '11',
  MY_FAVORITE_PLAYLISTS: '12',
}

const appConfig = {
  ver: 1,
  name: 'cooltv',
  message: '',
  warning: '',
  desc: 'cooltv.top 电视电台直播',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: '央广广播', type: 'song', ui: 0, showMore: false, ext: { gid: GID.CNR_RADIO } },
      { name: '央视直播', type: 'song', ui: 0, showMore: false, ext: { gid: GID.CCTV_TV } },
      { name: '音乐广播', type: 'song', ui: 0, showMore: false, ext: { gid: GID.MUSIC_RADIO } },
      { name: '交通广播', type: 'song', ui: 0, showMore: false, ext: { gid: GID.TRAFFIC_RADIO } },
      { name: '境外电台', type: 'song', ui: 0, showMore: false, ext: { gid: GID.OVERSEA_RADIO } },
      { name: '特色频道', type: 'song', ui: 0, showMore: false, ext: { gid: GID.SPECIAL_RADIO } },
    ]
  },
  tabMe: {
    name: '我的',
    groups: [
      { name: '我的收藏', type: 'song', ext: { gid: GID.MY_FAVORITE_SONGS } },
      { name: '创建的频道', type: 'playlist', ext: { gid: GID.MY_CREATED_PLAYLISTS } },
      { name: '收藏的频道', type: 'playlist', ext: { gid: GID.MY_FAVORITE_PLAYLISTS } },
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '电台', type: 'song', ext: { type: 'song' } },
      { name: '电视台', type: 'playlist', ext: { type: 'playlist' } },
    ]
  }
}

function withCoolHeaders(extra = {}) {
  return {
    ...headers,
    'Referer': 'https://cooltv.top/',
    'Origin': 'https://cooltv.top',
    ...extra,
  }
}

function safeExt(ext) {
  if (!ext) return {};
  if (typeof ext === 'object') return ext;
  try { return argsify(ext); } catch (e) { return {}; }
}

async function fetchJson(url, extraHeaders = {}) {
  try {
    const { data } = await $fetch.get(url, { headers: withCoolHeaders(extraHeaders) })
    return typeof data === 'string' ? argsify(data) : (data ?? {})
  } catch (e) {
    console.log('接口请求失败：', url, e);
    return {}
  }
}

function toHttps(url) {
  if (!url) return ''
  return `${url}`.replace(/^http:\/\//, 'https://')
}

// 完全和你原版 mapSong 结构一致
function mapSong(song, fallback = {}) {
  return {
    id: `${song?.id ?? fallback.id ?? ''}`,
    name: song?.name ?? fallback.name ?? '',
    cover: toHttps(song?.cover ?? fallback.cover ?? ''),
    duration: 3600,
    artist: {
      id: `${song?.cate ?? 'cooltv'}`,
      name: song?.cate ?? '直播频道',
      cover: '',
    },
    ext: {
      source: COOL_SOURCE,
      songmid: `${song?.id ?? ''}`,
      singer: song?.cate ?? '直播',
      songName: song?.name ?? '',
      url: song?.url ?? '',
    }
  }
}

function mapPlaylistCard(playlist, gid) {
  return {
    id: `${playlist?.id ?? ''}`,
    name: playlist?.name ?? '',
    cover: toHttps(playlist?.cover ?? ''),
    artist: { id: 'cooltv', name: '电台', cover: '' },
    ext: { gid: `${gid}`, id: `${playlist?.id ?? ''}`, type: 'playlist' }
  }
}

async function getConfig() {
  return jsonify(appConfig)
}

// 核心：完全用你原版 getSongs 结构，主页必显示
async function getSongs(ext) {
  const { page = 1, gid = '', id = '' } = safeExt(ext)
  const gidValue = `${gid}`
  let songs = []

  if (gidValue == GID.CNR_RADIO) {
    let list = [
      { id: 'cnr1', name: '中国之声', cate: '央广', url: 'https://cooltv.top/radio/cnr1' },
      { id: 'cnr2', name: '经济之声', cate: '央广', url: 'https://cooltv.top/radio/cnr2' },
      { id: 'cnr3', name: '音乐之声', cate: '央广', url: 'https://cooltv.top/radio/cnr3' },
      { id: 'cnr4', name: '大湾区之声', cate: '央广', url: 'https://cooltv.top/radio/cnr4' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  if (gidValue == GID.CCTV_TV) {
    let list = [
      { id: 'cctv1', name: 'CCTV-1 综合', cate: '央视', url: 'https://cooltv.top/tv/cctv1' },
      { id: 'cctv5', name: 'CCTV-5 体育', cate: '央视', url: 'https://cooltv.top/tv/cctv5' },
      { id: 'cctv5+', name: 'CCTV-5+ 体育赛事', cate: '央视', url: 'https://cooltv.top/tv/cctv5plus' },
      { id: 'cctv16', name: 'CCTV-16 奥林匹克', cate: '央视', url: 'https://cooltv.top/tv/cctv16' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  if (gidValue == GID.MUSIC_RADIO) {
    let list = [
      { id: 'm1', name: '广东音乐之声', cate: '音乐', url: 'https://cooltv.top/radio/gdmusic' },
      { id: 'm2', name: '广州金曲音乐广播', cate: '音乐', url: 'https://cooltv.top/radio/gzjinqu' },
      { id: 'm3', name: '深圳音乐频率', cate: '音乐', url: 'https://cooltv.top/radio/szmusic' },
      { id: 'm4', name: '北京音乐广播', cate: '音乐', url: 'https://cooltv.top/radio/bjmusic' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  if (gidValue == GID.TRAFFIC_RADIO) {
    let list = [
      { id: 't1', name: '中国交通广播', cate: '交通', url: 'https://cooltv.top/radio/cnjt' },
      { id: 't2', name: '北京交通广播', cate: '交通', url: 'https://cooltv.top/radio/bjjt' },
      { id: 't3', name: '广东交通之声', cate: '交通', url: 'https://cooltv.top/radio/gdjt' },
      { id: 't4', name: '深圳交通广播', cate: '交通', url: 'https://cooltv.top/radio/szjt' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  if (gidValue == GID.OVERSEA_RADIO) {
    let list = [
      { id: 'o1', name: 'BBC World Service', cate: '境外', url: 'https://cooltv.top/radio/bbc' },
      { id: 'o2', name: 'CGTN Radio', cate: '境外', url: 'https://cooltv.top/radio/cgtn' },
      { id: 'o3', name: 'CBC Music', cate: '境外', url: 'https://cooltv.top/radio/cbc' },
      { id: 'o4', name: 'Apple Music 1', cate: '境外', url: 'https://cooltv.top/radio/apple1' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  if (gidValue == GID.SPECIAL_RADIO) {
    let list = [
      { id: 's1', name: '经典音乐广播', cate: '特色', url: 'https://cooltv.top/radio/jingdian' },
      { id: 's2', name: '文艺之声', cate: '特色', url: 'https://cooltv.top/radio/wenyi' },
      { id: 's3', name: '环球资讯广播', cate: '特色', url: 'https://cooltv.top/radio/huanqiu' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  return jsonify({ list: songs })
}

async function getArtists(ext) {
  return jsonify({ list: [] })
}

async function getPlaylists(ext) {
  return jsonify({ list: [] })
}

async function getAlbums(ext) {
  return jsonify({ list: [] })
}

async function search(ext) {
  const { text = '', page = 1, type = '' } = safeExt(ext)
  if (!text || page > SEARCH_PAGE_LIMIT) return jsonify({})
  return jsonify({ list: [] })
}

// 播放地址：完全兼容原版
async function getSongInfo(ext) {
  const { source, songmid, url } = safeExt(ext)
  if (songmid == undefined || source == undefined) return jsonify({ urls: [] })
  return jsonify({ urls: [url] })
}

// 必须保留，原版依赖
function jsonify(obj) {
  return JSON.stringify(obj)
}

function argsify(str) {
  try { return JSON.parse(str) } catch (e) { return {} }
}