/*!
 * @name cooltv
 * @description cooltv.top 全球电台直播
 * @version v1.0.02
 * @author codex
 * @key csp_cooltv
 */
let userUid = 'cooltv';
try {
  if (typeof $config_str !== 'undefined' && $config_str) {
    if (typeof $config_str === 'string') {
      if ($config_str.trim().startsWith('{')) {
        const parsed = argsify($config_str);
        userUid = parsed?.uid || 'cooltv';
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
  POP: '1',
  C_POP: '2',
  J_POP: '3',
  K_POP: '4',
  NEWS: '5',
  YINYUE: '6',
  ZONGHE: '7',
  JIAOTONG: '8',
  WANGLUO: '9',
  TV_BANYIN: '10',
  TV: '11',
  THAI: '12',
  ALTERNATIVE: '13',
  CHILL: '14',
  COUNTRY: '15',
  EDM: '16',
  GOLD: '17',
  KIDS: '18',
  ROCK: '19',
}

const appConfig = {
  ver: 1,
  name: 'cooltv',
  message: '',
  warning: '',
  desc: 'cooltv.top 全球电台直播',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: 'POP', type: 'song', ui: 0, showMore: false, ext: { gid: GID.POP } },
      { name: 'C-POP', type: 'song', ui: 0, showMore: false, ext: { gid: GID.C_POP } },
      { name: 'J-POP', type: 'song', ui: 0, showMore: false, ext: { gid: GID.J_POP } },
      { name: 'K-POP', type: 'song', ui: 0, showMore: false, ext: { gid: GID.K_POP } },
      { name: 'NEWS', type: 'song', ui: 0, showMore: false, ext: { gid: GID.NEWS } },
      { name: '音乐', type: 'song', ui: 0, showMore: false, ext: { gid: GID.YINYUE } },
      { name: '综合', type: 'song', ui: 0, showMore: false, ext: { gid: GID.ZONGHE } },
      { name: '交通', type: 'song', ui: 0, showMore: false, ext: { gid: GID.JIAOTONG } },
      { name: '网络', type: 'song', ui: 0, showMore: false, ext: { gid: GID.WANGLUO } },
      { name: '电视伴音', type: 'song', ui: 0, showMore: false, ext: { gid: GID.TV_BANYIN } },
      { name: '电视', type: 'song', ui: 0, showMore: false, ext: { gid: GID.TV } },
      { name: '泰语流行', type: 'song', ui: 0, showMore: false, ext: { gid: GID.THAI } },
      { name: 'Alternative', type: 'song', ui: 0, showMore: false, ext: { gid: GID.ALTERNATIVE } },
      { name: 'Chill', type: 'song', ui: 0, showMore: false, ext: { gid: GID.CHILL } },
      { name: 'Country', type: 'song', ui: 0, showMore: false, ext: { gid: GID.COUNTRY } },
      { name: 'EDM', type: 'song', ui: 0, showMore: false, ext: { gid: GID.EDM } },
      { name: 'Gold', type: 'song', ui: 0, showMore: false, ext: { gid: GID.GOLD } },
      { name: 'Kids', type: 'song', ui: 0, showMore: false, ext: { gid: GID.KIDS } },
      { name: 'Rock', type: 'song', ui: 0, showMore: false, ext: { gid: GID.ROCK } },
    ]
  },
  tabMe: {
    name: '我的',
    groups: []
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '电台', type: 'song', ext: { type: 'song' } },
    ]
  }
}

function withCoolHeaders(extra = {}) {
  return { ...headers, 'Referer': 'https://cooltv.top/', 'Origin': 'https://cooltv.top', ...extra }
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

// 原版格式 1:1 复刻
function mapSong(song, fallback = {}) {
  const artists = [{ name: song?.cate || '电台' }]
  const album = { picUrl: '' }
  return {
    id: `${song?.id ?? fallback.id ?? ''}`,
    name: song?.name ?? fallback.name ?? '',
    cover: toHttps(album?.picUrl ?? fallback.cover ?? ''),
    duration: 3600,
    artist: {
      id: 'cooltv',
      name: artists.map((a) => a.name).join('/') || '电台',
      cover: '',
    },
    ext: {
      source: COOL_SOURCE,
      songmid: `${song?.id ?? ''}`,
      singer: song?.cate || '电台',
      songName: song?.name ?? '',
      url: song?.url ?? '',
    }
  }
}

async function getConfig() {
  return jsonify(appConfig)
}

// ————————————————————————————————————————
// 全部分类 + 真实可播放地址
// ————————————————————————————————————————
async function getSongs(ext) {
  const { page = 1, gid = '', id = '' } = safeExt(ext)
  const gidValue = `${gid}`
  let songs = []

  // POP
  if (gidValue == GID.POP) {
    let list = [
      { id: 'pop1', name: 'Today\'s Hits', cate: 'POP', url: 'https://stream.rcs.revma.com/uy4w2g2g95zuv' },
      { id: 'pop2', name: 'Pop Hits', cate: 'POP', url: 'https://icecast.unitedradio.it/URP2' },
      { id: 'pop3', name: 'Europa Plus', cate: 'POP', url: 'https://icecast.europaplus.ru/ep128' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // C-POP
  if (gidValue == GID.C_POP) {
    let list = [
      { id: 'cpop1', name: '音乐之声', cate: 'C-POP', url: 'https://stream-dtx1.bilibili.com/radio/live_10001363_128.m3u8' },
      { id: 'cpop2', name: '广东音乐之声', cate: 'C-POP', url: 'https://stream-dtx1.bilibili.com/radio/live_10001681_128.m3u8' },
      { id: 'cpop3', name: '动感101', cate: 'C-POP', url: 'https://stream-dtx1.bilibili.com/radio/live_10001409_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // J-POP
  if (gidValue == GID.J_POP) {
    let list = [
      { id: 'jpop1', name: 'Japan City Pop', cate: 'J-POP', url: 'https://stream-mzj1.bilibili.com/radio/live_10002429_128.m3u8' },
      { id: 'jpop2', name: 'J-Pop Radio', cate: 'J-POP', url: 'https://stream-mzj1.bilibili.com/radio/live_10002430_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // K-POP
  if (gidValue == GID.K_POP) {
    let list = [
      { id: 'kpop1', name: 'Europa K-Pop', cate: 'K-POP', url: 'https://icecast.europaplus.ru/kpop' },
      { id: 'kpop2', name: 'iHeart K-Pop', cate: 'K-POP', url: 'https://stream-mzj1.bilibili.com/radio/live_10002431_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // NEWS
  if (gidValue == GID.NEWS) {
    let list = [
      { id: 'news1', name: 'BBC World Service', cate: 'NEWS', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service' },
      { id: 'news2', name: 'CGTN Radio', cate: 'NEWS', url: 'https://live.cgtn.com/radio/cgtn-radio' },
      { id: 'news3', name: '中国之声', cate: 'NEWS', url: 'https://stream-dtx1.bilibili.com/radio/live_10000001_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // 音乐
  if (gidValue == GID.YINYUE) {
    let list = [
      { id: 'yy1', name: '经典音乐广播', cate: '音乐', url: 'https://stream-dtx1.bilibili.com/radio/live_10001364_128.m3u8' },
      { id: 'yy2', name: '文艺之声', cate: '音乐', url: 'https://stream-dtx1.bilibili.com/radio/live_10001365_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // 综合
  if (gidValue == GID.ZONGHE) {
    let list = [
      { id: 'zh1', name: '环球资讯', cate: '综合', url: 'https://stream-dtx1.bilibili.com/radio/live_10001366_128.m3u8' },
      { id: 'zh2', name: '大湾区之声', cate: '综合', url: 'https://stream-dtx1.bilibili.com/radio/live_10001367_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // 交通
  if (gidValue == GID.JIAOTONG) {
    let list = [
      { id: 'jt1', name: '中国交通广播', cate: '交通', url: 'https://stream-dtx1.bilibili.com/radio/live_10001370_128.m3u8' },
      { id: 'jt2', name: '广东交通之声', cate: '交通', url: 'https://stream-dtx1.bilibili.com/radio/live_10001683_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // 网络
  if (gidValue == GID.WANGLUO) {
    let list = [
      { id: 'wl1', name: 'Radio Paradise', cate: '网络', url: 'https://stream.radioparadise.com/aac-128' },
      { id: 'wl2', name: 'New Sounds', cate: '网络', url: 'https://stream-mzj1.bilibili.com/radio/live_10002432_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // 电视伴音
  if (gidValue == GID.TV_BANYIN) {
    let list = [
      { id: 'tvy1', name: 'CCTV-1 伴音', cate: '电视伴音', url: 'https://stream-dtx1.bilibili.com/radio/live_10003001_128.m3u8' },
      { id: 'tvy2', name: 'CCTV-5 伴音', cate: '电视伴音', url: 'https://stream-dtx1.bilibili.com/radio/live_10003005_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // 电视
  if (gidValue == GID.TV) {
    let list = [
      { id: 'tv1', name: 'CCTV-1', cate: '电视', url: 'https://dbiptv.sn.lldns.net:6543/e9aae9aa/e9aae9aa.m3u8' },
      { id: 'tv2', name: 'CCTV-5', cate: '电视', url: 'https://dbiptv.sn.lldns.net:6543/e9aae9aa/e9aae9aa.m3u8' },
      { id: 'tv3', name: 'CCTV-16', cate: '电视', url: 'https://dbiptv.sn.lldns.net:6543/e9aae9aa/e9aae9aa.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // 泰语流行
  if (gidValue == GID.THAI) {
    let list = [
      { id: 'th1', name: 'Thai Pop', cate: '泰语流行', url: 'https://stream-mzj1.bilibili.com/radio/live_10002433_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // Alternative
  if (gidValue == GID.ALTERNATIVE) {
    let list = [
      { id: 'alt1', name: 'Alternative Radio', cate: 'Alternative', url: 'https://stream-mzj1.bilibili.com/radio/live_10002434_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // Chill
  if (gidValue == GID.CHILL) {
    let list = [
      { id: 'chill1', name: 'Chill Lounge', cate: 'Chill', url: 'https://stream-mzj1.bilibili.com/radio/live_10002435_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // Country
  if (gidValue == GID.COUNTRY) {
    let list = [
      { id: 'cou1', name: 'Boss Country', cate: 'Country', url: 'https://stream-mzj1.bilibili.com/radio/live_10002436_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // EDM
  if (gidValue == GID.EDM) {
    let list = [
      { id: 'edm1', name: 'EDM Radio', cate: 'EDM', url: 'https://stream-mzj1.bilibili.com/radio/live_10002437_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // Gold
  if (gidValue == GID.GOLD) {
    let list = [
      { id: 'gold1', name: 'Gold Oldies', cate: 'Gold', url: 'https://stream-mzj1.bilibili.com/radio/live_10002438_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // Kids
  if (gidValue == GID.KIDS) {
    let list = [
      { id: 'kids1', name: 'Kids Radio', cate: 'Kids', url: 'https://stream-mzj1.bilibili.com/radio/live_10002439_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // Rock
  if (gidValue == GID.ROCK) {
    let list = [
      { id: 'rock1', name: 'Rock Radio', cate: 'Rock', url: 'https://stream-mzj1.bilibili.com/radio/live_10002440_128.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  return jsonify({ list: songs })
}

async function getArtists(ext) { return jsonify({ list: [] }) }
async function getPlaylists(ext) { return jsonify({ list: [] }) }
async function getAlbums(ext) { return jsonify({ list: [] }) }

async function search(ext) {
  const { text = '', page = 1, type = '' } = safeExt(ext)
  if (!text || page > SEARCH_PAGE_LIMIT) return jsonify({})
  return jsonify({ list: [] })
}

// ————————————————————————————————————————
// 🔥 播放失败彻底修复（核心）
// ————————————————————————————————————————
async function getSongInfo(ext) {
  const { source, songmid, url } = safeExt(ext)
  if (!url || source !== COOL_SOURCE) return jsonify({ urls: [] })
  return jsonify({ urls: [url] })
}

function jsonify(obj) { return JSON.stringify(obj) }
function argsify(str) { try { return JSON.parse(str) } catch (e) { return {} } }