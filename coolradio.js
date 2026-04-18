/*!
 * @name cooltv电台📻
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

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const headers = { 'User-Agent': UA };
const PAGE_LIMIT = 100;
const SEARCH_PAGE_LIMIT = 5;
const COOL_SOURCE = 'cooltv';

const GID = {
  CNR_RADIO: '1',
  CCTV_TV: '2',
  MUSIC_RADIO: '3',
  TRAFFIC_RADIO: '4',
  LOCAL_RADIO: '5',
  OVERSEA_RADIO: '6',
  SPECIAL_RADIO: '7',
  SEARCH_CHANNEL: '8',
  MY_FAVORITE: '9',
  MY_CREATED_PLAYLISTS: '11',
  MY_FAVORITE_PLAYLISTS: '12',
};

const appConfig = {
  ver: 1,
  name: 'cooltv',
  message: '',
  warning: '',
  desc: 'cooltv.top 电视电台直播',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: '央广广播', type: 'radio', ui: 0, showMore: true, ext: { gid: GID.CNR_RADIO } },
      { name: '央视直播', type: 'tv', ui: 0, showMore: true, ext: { gid: GID.CCTV_TV } },
      { name: '音乐广播', type: 'radio', ui: 0, showMore: true, ext: { gid: GID.MUSIC_RADIO } },
      { name: '交通广播', type: 'radio', ui: 0, showMore: true, ext: { gid: GID.TRAFFIC_RADIO } },
      { name: '境外电台', type: 'radio', ui: 0, showMore: true, ext: { gid: GID.OVERSEA_RADIO } },
      { name: '特色频道', type: 'radio', ui: 0, showMore: true, ext: { gid: GID.SPECIAL_RADIO } },
    ]
  },
  tabMe: {
    name: '我的',
    groups: [
      { name: '我的收藏', type: 'radio', ext: { gid: GID.MY_FAVORITE } },
      { name: '创建的频道', type: 'playlist', ext: { gid: GID.MY_CREATED_PLAYLISTS } },
      { name: '收藏的频道', type: 'playlist', ext: { gid: GID.MY_FAVORITE_PLAYLISTS } },
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '电台', type: 'radio', ext: { type: 'radio' } },
      { name: '电视台', type: 'tv', ext: { type: 'tv' } },
    ]
  }
};

function withCoolHeaders(extra = {}) {
  return {
    ...headers,
    'Referer': 'https://cooltv.top/',
    'Origin': 'https://cooltv.top',
    ...extra,
  };
}

function safeExt(ext) {
  if (!ext) return {};
  if (typeof ext === 'object') return ext;
  try { return argsify(ext); } catch (e) { return {}; }
}

async function fetchJson(url, extraHeaders = {}) {
  try {
    const { data } = await $fetch.get(url, { headers: withCoolHeaders(extraHeaders) });
    return typeof data === 'string' ? argsify(data) : (data ?? {});
  } catch (e) {
    console.log('接口请求失败：', url, e);
    return {};
  }
}

function toHttps(url) {
  if (!url) return '';
  return `${url}`.replace(/^http:\/\//, 'https://');
}

// 完全对齐原版 mapRadio
function mapRadio(channel, fallback = {}) {
  return {
    id: `${channel.id ?? fallback.id ?? ''}`,
    name: channel.name ?? fallback.name ?? '',
    cover: toHttps(channel.cover ?? fallback.cover ?? ''),
    artist: {
      id: `${channel.category ?? 'cooltv'}`,
      name: channel.category ?? '电台直播',
      cover: '',
    },
    ext: {
      source: COOL_SOURCE,
      songmid: `${channel.id ?? ''}`,
      singer: channel.category ?? '直播',
      songName: channel.name ?? '',
      url: channel.url ?? '',
    }
  };
}

function mapChannelCard(channel, gid) {
  return {
    id: `${channel.id ?? ''}`,
    name: channel.name ?? '',
    cover: toHttps(channel.cover ?? ''),
    artist: {
      id: 'cooltv',
      name: channel.category ?? '直播频道',
      cover: '',
    },
    ext: { gid: `${gid}`, id: `${channel.id ?? ''}`, type: 'radio' }
  };
}

// 完全保留原版函数结构：getConfig / getSongs / getPlaylists / getAlbums / getArtists / search / getSongInfo

async function getConfig() {
  return jsonify(appConfig);
}

async function getSongs(ext) {
  const { page = 1, gid = '', id = '' } = safeExt(ext);
  const gidValue = `${gid}`;
  let list = [];

  // 央广
  if (gidValue === GID.CNR_RADIO) {
    list = [
      { id: 'cnr1', name: '中国之声', category: '央广', url: 'https://cooltv.top/radio/cnr1' },
      { id: 'cnr2', name: '经济之声', category: '央广', url: 'https://cooltv.top/radio/cnr2' },
      { id: 'cnr3', name: '音乐之声', category: '央广', url: 'https://cooltv.top/radio/cnr3' },
      { id: 'cnr4', name: '大湾区之声', category: '央广', url: 'https://cooltv.top/radio/cnr4' },
      { id: 'cnr5', name: '台海之声', category: '央广', url: 'https://cooltv.top/radio/cnr5' },
      { id: 'cnr6', name: '神州之声', category: '央广', url: 'https://cooltv.top/radio/cnr6' },
      { id: 'cnr7', name: '香港之声', category: '央广', url: 'https://cooltv.top/radio/cnr7' },
      { id: 'cnr8', name: '民族之声', category: '央广', url: 'https://cooltv.top/radio/cnr8' },
      { id: 'cnr9', name: '老年之声', category: '央广', url: 'https://cooltv.top/radio/cnr9' },
      { id: 'cnr10', name: '藏语广播', category: '央广', url: 'https://cooltv.top/radio/cnr10' },
      { id: 'cnr11', name: '维吾尔语广播', category: '央广', url: 'https://cooltv.top/radio/cnr11' },
      { id: 'cnr12', name: '中国乡村之声', category: '央广', url: 'https://cooltv.top/radio/cnr12' },
      { id: 'cnr13', name: '哈萨克语广播', category: '央广', url: 'https://cooltv.top/radio/cnr13' },
      { id: 'cnr14', name: '南海之声', category: '央广', url: 'https://cooltv.top/radio/cnr14' },
    ];
  }

  // 央视
  if (gidValue === GID.CCTV_TV) {
    list = [
      { id: 'cctv1', name: 'CCTV-1 综合', category: '央视', url: 'https://cooltv.top/tv/cctv1' },
      { id: 'cctv5', name: 'CCTV-5 体育', category: '央视', url: 'https://cooltv.top/tv/cctv5' },
      { id: 'cctv5+', name: 'CCTV-5+ 体育赛事', category: '央视', url: 'https://cooltv.top/tv/cctv5plus' },
      { id: 'cctv6', name: 'CCTV-6 电影', category: '央视', url: 'https://cooltv.top/tv/cctv6' },
      { id: 'cctv13', name: 'CCTV-13 新闻', category: '央视', url: 'https://cooltv.top/tv/cctv13' },
      { id: 'cctv16', name: 'CCTV-16 奥林匹克', category: '央视', url: 'https://cooltv.top/tv/cctv16' },
    ];
  }

  // 音乐广播
  if (gidValue === GID.MUSIC_RADIO) {
    list = [
      { id: 'm1', name: '广东音乐之声', category: '音乐', url: 'https://cooltv.top/radio/gdmusic' },
      { id: 'm2', name: '广州金曲音乐广播', category: '音乐', url: 'https://cooltv.top/radio/gzjinqu' },
      { id: 'm3', name: '深圳音乐频率', category: '音乐', url: 'https://cooltv.top/radio/szmusic' },
      { id: 'm4', name: '北京音乐广播', category: '音乐', url: 'https://cooltv.top/radio/bjmusic' },
      { id: 'm5', name: '上海动感101', category: '音乐', url: 'https://cooltv.top/radio/dg101' },
    ];
  }

  // 交通广播
  if (gidValue === GID.TRAFFIC_RADIO) {
    list = [
      { id: 't1', name: '中国交通广播', category: '交通', url: 'https://cooltv.top/radio/cnjt' },
      { id: 't2', name: '北京交通广播', category: '交通', url: 'https://cooltv.top/radio/bjjt' },
      { id: 't3', name: '广东交通之声', category: '交通', url: 'https://cooltv.top/radio/gdjt' },
      { id: 't4', name: '深圳交通广播', category: '交通', url: 'https://cooltv.top/radio/szjt' },
    ];
  }

  // 境外
  if (gidValue === GID.OVERSEA_RADIO) {
    list = [
      { id: 'o1', name: 'BBC World Service', category: '境外', url: 'https://cooltv.top/radio/bbc' },
      { id: 'o2', name: 'CGTN Radio', category: '境外', url: 'https://cooltv.top/radio/cgtn' },
      { id: 'o3', name: 'CBC Music', category: '境外', url: 'https://cooltv.top/radio/cbc' },
      { id: 'o4', name: 'Apple Music 1', category: '境外', url: 'https://cooltv.top/radio/apple1' },
      { id: 'o5', name: 'NPR', category: '境外', url: 'https://cooltv.top/radio/npr' },
    ];
  }

  // 特色
  if (gidValue === GID.SPECIAL_RADIO) {
    list = [
      { id: 's1', name: '经典音乐广播', category: '特色', url: 'https://cooltv.top/radio/jingdian' },
      { id: 's2', name: '文艺之声', category: '特色', url: 'https://cooltv.top/radio/wenyi' },
      { id: 's3', name: '环球资讯广播', category: '特色', url: 'https://cooltv.top/radio/huanqiu' },
    ];
  }

  const songs = list.map(item => mapRadio(item));
  return jsonify({ list: songs });
}

async function getPlaylists(ext) {
  const { page = 1, gid = '' } = safeExt(ext);
  return jsonify({ list: [] });
}

async function getAlbums(ext) {
  return jsonify({ list: [] });
}

async function getArtists(ext) {
  return jsonify({ list: [] });
}

async function search(ext) {
  const { text = '', page = 1, type = '' } = safeExt(ext);
  if (!text || page > SEARCH_PAGE_LIMIT) return jsonify({ list: [] });
  return jsonify({ list: [] });
}

async function getSongInfo(ext) {
  const { source, songmid, url } = safeExt(ext);
  if (!url || source !== COOL_SOURCE) return jsonify({ urls: [] });
  return jsonify({ urls: [url] });
}

// 兼容原版 jsonify / argsify（必须保留）
function jsonify(obj) {
  return JSON.stringify(obj);
}

function argsify(str) {
  try { return JSON.parse(str); } catch (e) { return {}; }
}