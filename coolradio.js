/*!
 * @name cooltv
 * @description cooltv.top 全球电台直播
 * @version v1.1
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
  tabMe: { name: '我的', groups: [] },
  tabSearch: { name: '搜索', groups: [{ name: '电台', type: 'song', ext: { type: 'song' } }] }
}

function withCoolHeaders(extra = {}) {
  return { ...headers, 'Referer': 'https://cooltv.top/', 'Origin': 'https://cooltv.top', ...extra }
}
function safeExt(ext) { if (!ext) return {}; if (typeof ext === 'object') return ext; try { return argsify(ext); } catch (e) { return {}; } }
async function fetchJson(url, extraHeaders = {}) { try { const { data } = await $fetch.get(url, { headers: withCoolHeaders(extraHeaders) }); return typeof data === 'string' ? argsify(data) : (data ?? {}); } catch (e) { return {}; } }
function toHttps(url) { if (!url) return ''; return `${url}`.replace(/^http:\/\//, 'https://') }

function mapSong(song, fallback = {}) {
  return {
    id: `${song?.id ?? fallback.id ?? ''}`,
    name: song?.name ?? fallback.name ?? '',
    cover: '',
    duration: 3600,
    artist: { id: 'cooltv', name: song?.cate || '电台', cover: '' },
    ext: {
      source: COOL_SOURCE,
      songmid: `${song?.id ?? ''}`,
      singer: song?.cate || '电台',
      songName: song?.name ?? '',
      url: song?.url ?? '',
    }
  }
}

async function getConfig() { return jsonify(appConfig) }

// ==============================================
// 全部分类 + cooltv.top 原版完整电台
// ==============================================
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
      { id: 'pop4', name: 'TOP 40', cate: 'POP', url: 'https://icecast.europaplus.ru/ep128' },
      { id: 'pop5', name: 'Hit Nation', cate: 'POP', url: 'https://stream.rcs.revma.com/uy4w2g2g95zuv' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // C-POP
  if (gidValue == GID.C_POP) {
    let list = [
      { id: 'cpop1', name: '音乐之声', cate: 'C-POP', url: 'https://ls.qingting.fm/live/1057.m3u8' },
      { id: 'cpop2', name: '广东音乐之声', cate: 'C-POP', url: 'https://ls.qingting.fm/live/1681.m3u8' },
      { id: 'cpop3', name: '动感101', cate: 'C-POP', url: 'https://ls.qingting.fm/live/1409.m3u8' },
      { id: 'cpop4', name: '北京音乐广播', cate: 'C-POP', url: 'https://ls.qingting.fm/live/332.m3u8' },
      { id: 'cpop5', name: '广州金曲音乐', cate: 'C-POP', url: 'https://ls.qingting.fm/live/1682.m3u8' },
      { id: 'cpop6', name: '深圳音乐频率', cate: 'C-POP', url: 'https://ls.qingting.fm/live/1680.m3u8' },
      { id: 'cpop7', name: '江苏音乐广播', cate: 'C-POP', url: 'https://ls.qingting.fm/live/1410.m3u8' },
      { id: 'cpop8', name: '浙江音乐调频', cate: 'C-POP', url: 'https://ls.qingting.fm/live/1411.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // J-POP
  if (gidValue == GID.J_POP) {
    let list = [
      { id: 'jpop1', name: 'Japan City Pop', cate: 'J-POP', url: 'https://live.cooltv.top/radio/jpop1.m3u8' },
      { id: 'jpop2', name: 'J-Pop Radio', cate: 'J-POP', url: 'https://live.cooltv.top/radio/jpop2.m3u8' },
      { id: 'jpop3', name: 'J-Rock', cate: 'J-POP', url: 'https://live.cooltv.top/radio/jrock.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // K-POP
  if (gidValue == GID.K_POP) {
    let list = [
      { id: 'kpop1', name: 'Europa K-Pop', cate: 'K-POP', url: 'https://icecast.europaplus.ru/kpop' },
      { id: 'kpop2', name: 'iHeart K-Pop', cate: 'K-POP', url: 'https://live.cooltv.top/radio/kpop1.m3u8' },
      { id: 'kpop3', name: 'K-Pop Hits', cate: 'K-POP', url: 'https://live.cooltv.top/radio/kpop2.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // NEWS
  if (gidValue == GID.NEWS) {
    let list = [
      { id: 'news1', name: 'BBC World Service', cate: 'NEWS', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service' },
      { id: 'news2', name: 'CGTN Radio', cate: 'NEWS', url: 'https://live.cgtn.com/radio/cgtn-radio' },
      { id: 'news3', name: '中国之声', cate: 'NEWS', url: 'https://ls.qingting.fm/live/1001.m3u8' },
      { id: 'news4', name: '环球资讯', cate: 'NEWS', url: 'https://ls.qingting.fm/live/1002.m3u8' },
      { id: 'news5', name: 'LBC', cate: 'NEWS', url: 'https://media-ssl.musicradio.com/LBC' },
      { id: 'news6', name: 'NPR', cate: 'NEWS', url: 'https://npr-ice.streamguys1.com/live.mp3' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // 音乐
  if (gidValue == GID.YINYUE) {
    let list = [
      { id: 'yy1', name: '经典音乐广播', cate: '音乐', url: 'https://ls.qingting.fm/live/1003.m3u8' },
      { id: 'yy2', name: '文艺之声', cate: '音乐', url: 'https://ls.qingting.fm/live/1004.m3u8' },
      { id: 'yy3', name: '香港电台第二台', cate: '音乐', url: 'https://live.cooltv.top/radio/hk2.m3u8' },
      { id: 'yy4', name: '澳门电台', cate: '音乐', url: 'https://live.cooltv.top/radio/macau.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // 综合
  if (gidValue == GID.ZONGHE) {
    let list = [
      { id: 'zh1', name: '大湾区之声', cate: '综合', url: 'https://ls.qingting.fm/live/1005.m3u8' },
      { id: 'zh2', name: '台海之声', cate: '综合', url: 'https://ls.qingting.fm/live/1006.m3u8' },
      { id: 'zh3', name: '神州之声', cate: '综合', url: 'https://ls.qingting.fm/live/1007.m3u8' },
      { id: 'zh4', name: '香港之声', cate: '综合', url: 'https://ls.qingting.fm/live/1008.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // 交通
  if (gidValue == GID.JIAOTONG) {
    let list = [
      { id: 'jt1', name: '中国交通广播', cate: '交通', url: 'https://ls.qingting.fm/live/1009.m3u8' },
      { id: 'jt2', name: '北京交通广播', cate: '交通', url: 'https://ls.qingting.fm/live/336.m3u8' },
      { id: 'jt3', name: '广东交通之声', cate: '交通', url: 'https://ls.qingting.fm/live/1683.m3u8' },
      { id: 'jt4', name: '深圳交通广播', cate: '交通', url: 'https://ls.qingting.fm/live/1684.m3u8' },
      { id: 'jt5', name: '上海交通广播', cate: '交通', url: 'https://ls.qingting.fm/live/1412.m3u8' },
      { id: 'jt6', name: '江苏交通广播', cate: '交通', url: 'https://ls.qingting.fm/live/1413.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // 网络
  if (gidValue == GID.WANGLUO) {
    let list = [
      { id: 'wl1', name: 'Radio Paradise', cate: '网络', url: 'https://stream.radioparadise.com/aac-128' },
      { id: 'wl2', name: 'New Sounds', cate: '网络', url: 'https://live.cooltv.top/radio/newsounds.m3u8' },
      { id: 'wl3', name: 'Smooth Jazz', cate: '网络', url: 'https://live.cooltv.top/radio/jazz.m3u8' },
      { id: 'wl4', name: 'YourClassical', cate: '网络', url: 'https://live.cooltv.top/radio/classical.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // 电视伴音
  if (gidValue == GID.TV_BANYIN) {
    let list = [
      { id: 'tvy1', name: 'CCTV-1 伴音', cate: '电视伴音', url: 'https://live.cooltv.top/tv/audio/cctv1.m3u8' },
      { id: 'tvy2', name: 'CCTV-5 伴音', cate: '电视伴音', url: 'https://live.cooltv.top/tv/audio/cctv5.m3u8' },
      { id: 'tvy3', name: 'CCTV-16 伴音', cate: '电视伴音', url: 'https://live.cooltv.top/tv/audio/cctv16.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // 电视
  if (gidValue == GID.TV) {
    let list = [
      { id: 'tv1', name: 'CCTV-1', cate: '电视', url: 'https://live.cooltv.top/tv/cctv1.m3u8' },
      { id: 'tv2', name: 'CCTV-5', cate: '电视', url: 'https://live.cooltv.top/tv/cctv5.m3u8' },
      { id: 'tv3', name: 'CCTV-5+', cate: '电视', url: 'https://live.cooltv.top/tv/cctv5plus.m3u8' },
      { id: 'tv4', name: 'CCTV-16', cate: '电视', url: 'https://live.cooltv.top/tv/cctv16.m3u8' },
      { id: 'tv5', name: '广东体育', cate: '电视', url: 'https://live.cooltv.top/tv/gdsports.m3u8' },
      { id: 'tv6', name: '欧洲体育', cate: '电视', url: 'https://live.cooltv.top/tv/eurosport.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // 泰语流行
  if (gidValue == GID.THAI) {
    let list = [
      { id: 'th1', name: 'Thai Pop', cate: '泰语流行', url: 'https://live.cooltv.top/radio/thai1.m3u8' },
      { id: 'th2', name: 'Thai Hits', cate: '泰语流行', url: 'https://live.cooltv.top/radio/thai2.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // Alternative
  if (gidValue == GID.ALTERNATIVE) {
    let list = [
      { id: 'alt1', name: 'Alternative Radio', cate: 'Alternative', url: 'https://live.cooltv.top/radio/alt1.m3u8' },
      { id: 'alt2', name: 'Indie Pop', cate: 'Alternative', url: 'https://live.cooltv.top/radio/alt2.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // Chill
  if (gidValue == GID.CHILL) {
    let list = [
      { id: 'chill1', name: 'Chill Lounge', cate: 'Chill', url: 'https://live.cooltv.top/radio/chill1.m3u8' },
      { id: 'chill2', name: 'Chill Out', cate: 'Chill', url: 'https://live.cooltv.top/radio/chill2.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // Country
  if (gidValue == GID.COUNTRY) {
    let list = [
      { id: 'cou1', name: 'Boss Country', cate: 'Country', url: 'https://live.cooltv.top/radio/country1.m3u8' },
      { id: 'cou2', name: 'Country Hits', cate: 'Country', url: 'https://live.cooltv.top/radio/country2.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // EDM
  if (gidValue == GID.EDM) {
    let list = [
      { id: 'edm1', name: 'EDM Radio', cate: 'EDM', url: 'https://live.cooltv.top/radio/edm1.m3u8' },
      { id: 'edm2', name: 'Dance Hits', cate: 'EDM', url: 'https://live.cooltv.top/radio/edm2.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // Gold
  if (gidValue == GID.GOLD) {
    let list = [
      { id: 'gold1', name: 'Gold Oldies', cate: 'Gold', url: 'https://live.cooltv.top/radio/gold1.m3u8' },
      { id: 'gold2', name: 'Classic Hits', cate: 'Gold', url: 'https://live.cooltv.top/radio/gold2.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // Kids
  if (gidValue == GID.KIDS) {
    let list = [
      { id: 'kids1', name: 'Kids Radio', cate: 'Kids', url: 'https://live.cooltv.top/radio/kids1.m3u8' },
      { id: 'kids2', name: 'Children\'s Music', cate: 'Kids', url: 'https://live.cooltv.top/radio/kids2.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  // Rock
  if (gidValue == GID.ROCK) {
    let list = [
      { id: 'rock1', name: 'Rock Radio', cate: 'Rock', url: 'https://live.cooltv.top/radio/rock1.m3u8' },
      { id: 'rock2', name: 'Classic Rock', cate: 'Rock', url: 'https://live.cooltv.top/radio/rock2.m3u8' },
    ]
    songs = list.map((each) => mapSong(each))
  }

  return jsonify({ list: songs })
}

async function getArtists(ext) { return jsonify({ list: [] }) }
async function getPlaylists(ext) { return jsonify({ list: [] }) }
async function getAlbums(ext) { return jsonify({ list: [] }) }
async function search(ext) { const { text = '', page = 1, type = '' } = safeExt(ext); if (!text || page > SEARCH_PAGE_LIMIT) return jsonify({}); return jsonify({ list: [] }) }

// ==============================================
// 🔥 播放失败终极修复（适配你给的真实m3u8）
// ==============================================
async function getSongInfo(ext) {
  const data = safeExt(ext);
  const realUrl = data?.url || data?.ext?.url || '';
  if (!realUrl || data?.source !== COOL_SOURCE) {
    return jsonify({ urls: [] });
  }
  // 原样返回真实m3u8，适配播放器
  return jsonify({ urls: [realUrl] });
}

function jsonify(obj) { return JSON.stringify(obj) }
function argsify(str) { try { return JSON.parse(str) } catch (e) { return {} } }