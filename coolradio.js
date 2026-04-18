/*!
 * @name cooltv_radio电台📻
 * @description cooltv.top 电台直播脚本
 * @version v1.0.0
 * @author codex
 * @key csp_cooltv
 */
let userUid = 'cooltv';
try {
  if (typeof $config_str !== 'undefined' && $config_str) {
    userUid = $config_str.trim() || 'cooltv';
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
};

const appConfig = {
  ver: 1,
  name: 'cooltv_radio',
  message: '',
  warning: '',
  desc: 'cooltv.top 全网电台直播',
  tabLibrary: {
    name: '电台',
    groups: [
      { name: '央广总台', type: 'radio', ui: 0, showMore: true, ext: { gid: GID.CNR_RADIO } },
      { name: '央视直播', type: 'tv', ui: 0, showMore: true, ext: { gid: GID.CCTV_TV } },
      { name: '音乐广播', type: 'radio', ui: 0, showMore: true, ext: { gid: GID.MUSIC_RADIO } },
      { name: '交通广播', type: 'radio', ui: 0, showMore: true, ext: { gid: GID.TRAFFIC_RADIO } },
      { name: '地方电台', type: 'radio', ui: 0, showMore: true, ext: { gid: GID.LOCAL_RADIO } },
      { name: '境外电台', type: 'radio', ui: 0, showMore: true, ext: { gid: GID.OVERSEA_RADIO } },
      { name: '特色频道', type: 'radio', ui: 0, showMore: true, ext: { gid: GID.SPECIAL_RADIO } },
    ]
  },
  tabMe: {
    name: '我的',
    groups: [
      { name: '我的收藏', type: 'radio', ext: { gid: GID.MY_FAVORITE } }
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
  try { return JSON.parse(ext); } catch (e) { return {}; }
}

async function fetchJson(url, extraHeaders = {}) {
  try {
    const { data } = await $fetch.get(url, { headers: withCoolHeaders(extraHeaders) });
    return typeof data === 'string' ? JSON.parse(data) : (data ?? {});
  } catch (e) {
    console.log('接口请求失败：', url, e);
    return {};
  }
}

function toHttps(url) {
  if (!url) return '';
  return `${url}`.replace(/^http:\/\//, 'https://');
}

function mapChannel(channel, type = 'radio', gid) {
  return {
    id: `${channel.id || channel.name || Date.now()}`,
    name: channel.name || '',
    cover: toHttps(channel.cover || ''),
    artist: { id: 'cooltv', name: channel.category || 'cooltv', cover: '' },
    ext: {
      source: COOL_SOURCE,
      gid: gid,
      type: type,
      url: channel.url || '',
    }
  };
}

async function getConfig() {
  return JSON.stringify(appConfig);
}

async function getChannels(ext) {
  const { page = 1, gid = '' } = safeExt(ext);
  const list = [];
  const offset = (page - 1) * PAGE_LIMIT;

  if (gid === GID.CNR_RADIO) {
    list.push(
      { id: 'cnr1', name: '中国之声', cover: '', category: '央广', url: 'https://cooltv.top/radio/cnr1' },
      { id: 'cnr2', name: '经济之声', cover: '', category: '央广', url: 'https://cooltv.top/radio/cnr2' },
      { id: 'cnr3', name: '音乐之声', cover: '', category: '央广', url: 'https://cooltv.top/radio/cnr3' },
      { id: 'cnr4', name: '大湾区之声', cover: '', category: '央广', url: 'https://cooltv.top/radio/cnr4' },
      { id: 'cnr5', name: '台海之声', cover: '', category: '央广', url: 'https://cooltv.top/radio/cnr5' },
      { id: 'cnr6', name: '神州之声', cover: '', category: '央广', url: 'https://cooltv.top/radio/cnr6' },
      { id: 'cnr7', name: '香港之声', cover: '', category: '央广', url: 'https://cooltv.top/radio/cnr7' },
      { id: 'cnr8', name: '民族之声', cover: '', category: '央广', url: 'https://cooltv.top/radio/cnr8' },
      { id: 'cnr9', name: '老年之声', cover: '', category: '央广', url: 'https://cooltv.top/radio/cnr9' },
      { id: 'cnr10', name: '藏语广播', cover: '', category: '央广', url: 'https://cooltv.top/radio/cnr10' },
      { id: 'cnr11', name: '维吾尔语广播', cover: '', category: '央广', url: 'https://cooltv.top/radio/cnr11' },
      { id: 'cnr12', name: '中国乡村之声', cover: '', category: '央广', url: 'https://cooltv.top/radio/cnr12' },
      { id: 'cnr13', name: '哈萨克语广播', cover: '', category: '央广', url: 'https://cooltv.top/radio/cnr13' },
      { id: 'cnr14', name: '南海之声', cover: '', category: '央广', url: 'https://cooltv.top/radio/cnr14' },
    );
  }

  if (gid === GID.CCTV_TV) {
    list.push(
      { id: 'cctv1', name: 'CCTV-1 综合', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv1' },
      { id: 'cctv2', name: 'CCTV-2 财经', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv2' },
      { id: 'cctv3', name: 'CCTV-3 综艺', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv3' },
      { id: 'cctv4', name: 'CCTV-4 中文国际', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv4' },
      { id: 'cctv5', name: 'CCTV-5 体育', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv5' },
      { id: 'cctv5+', name: 'CCTV-5+ 体育赛事', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv5plus' },
      { id: 'cctv6', name: 'CCTV-6 电影', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv6' },
      { id: 'cctv7', name: 'CCTV-7 国防军事', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv7' },
      { id: 'cctv8', name: 'CCTV-8 电视剧', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv8' },
      { id: 'cctv9', name: 'CCTV-9 纪录', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv9' },
      { id: 'cctv10', name: 'CCTV-10 科教', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv10' },
      { id: 'cctv11', name: 'CCTV-11 戏曲', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv11' },
      { id: 'cctv12', name: 'CCTV-12 社会与法', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv12' },
      { id: 'cctv13', name: 'CCTV-13 新闻', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv13' },
      { id: 'cctv14', name: 'CCTV-14 少儿', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv14' },
      { id: 'cctv15', name: 'CCTV-15 音乐', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv15' },
      { id: 'cctv16', name: 'CCTV-16 奥林匹克', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv16' },
      { id: 'cctv17', name: 'CCTV-17 农业农村', cover: '', category: '央视', url: 'https://cooltv.top/tv/cctv17' },
    );
  }

  if (gid === GID.MUSIC_RADIO) {
    list.push(
      { id: 'music1', name: '广东音乐之声', cover: '', category: '音乐', url: 'https://cooltv.top/radio/gdmusic' },
      { id: 'music2', name: '广州金曲音乐广播', cover: '', category: '音乐', url: 'https://cooltv.top/radio/gzjinqu' },
      { id: 'music3', name: '深圳音乐频率', cover: '', category: '音乐', url: 'https://cooltv.top/radio/szmusic' },
      { id: 'music4', name: '江苏音乐广播', cover: '', category: '音乐', url: 'https://cooltv.top/radio/jsmusic' },
      { id: 'music5', name: '浙江音乐调频', cover: '', category: '音乐', url: 'https://cooltv.top/radio/zjmusic' },
      { id: 'music6', name: '上海动感101', cover: '', category: '音乐', url: 'https://cooltv.top/radio/dg101' },
      { id: 'music7', name: '北京音乐广播', cover: '', category: '音乐', url: 'https://cooltv.top/radio/bjmusic' },
    );
  }

  if (gid === GID.TRAFFIC_RADIO) {
    list.push(
      { id: 'traffic1', name: '中国交通广播', cover: '', category: '交通', url: 'https://cooltv.top/radio/cnjt' },
      { id: 'traffic2', name: '北京交通广播', cover: '', category: '交通', url: 'https://cooltv.top/radio/bjjt' },
      { id: 'traffic3', name: '广东交通之声', cover: '', category: '交通', url: 'https://cooltv.top/radio/gdjt' },
      { id: 'traffic4', name: '深圳交通广播', cover: '', category: '交通', url: 'https://cooltv.top/radio/szjt' },
      { id: 'traffic5', name: '江苏交通广播', cover: '', category: '交通', url: 'https://cooltv.top/radio/jsjt' },
      { id: 'traffic6', name: '上海交通广播', cover: '', category: '交通', url: 'https://cooltv.top/radio/shjt' },
    );
  }

  if (gid === GID.OVERSEA_RADIO) {
    list.push(
      { id: 'oversea1', name: 'BBC World Service', cover: '', category: '境外', url: 'https://cooltv.top/radio/bbc' },
      { id: 'oversea2', name: 'CGTN Radio', cover: '', category: '境外', url: 'https://cooltv.top/radio/cgtn' },
      { id: 'oversea3', name: 'CBC Music', cover: '', category: '境外', url: 'https://cooltv.top/radio/cbc' },
      { id: 'oversea4', name: 'Apple Music 1', cover: '', category: '境外', url: 'https://cooltv.top/radio/apple1' },
      { id: 'oversea5', name: 'NPR', cover: '', category: '境外', url: 'https://cooltv.top/radio/npr' },
    );
  }

  const pageList = list.slice(offset, offset + PAGE_LIMIT).map(item => mapChannel(item, 'radio', gid));
  return JSON.stringify({ list: pageList });
}

async function search(ext) {
  const { text = '', page = 1, type = '' } = safeExt(ext);
  if (!text || page > SEARCH_PAGE_LIMIT) return JSON.stringify({ list: [] });
  return JSON.stringify({ list: [] });
}

async function getSongInfo(ext) {
  const { source, url } = safeExt(ext);
  if (!url || source !== COOL_SOURCE) return JSON.stringify({ urls: [] });
  return JSON.stringify({ urls: [url] });
}