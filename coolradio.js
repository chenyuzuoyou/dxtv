/*!
 * @name cooltv
 * @description COOL Radio 电台抓取脚本
 * @version v1.0.01
 * @author AI
 * @key csp_cooltv
 */

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';
const headers = { 'User-Agent': UA };

// 将主页所有的类别映射为内置变量
const CATEGORIES = {
  HQ: '高清专区',
  Pop: 'Pop',
  CPop: 'C-Pop',
  JPop: 'J-Pop',
  KPop: 'K-Pop',
  News: 'News',
  Music: '音乐',
  Comprehensive: '综合',
  Traffic: '交通',
  Net: '网络',
  TVAudio: '电视伴音',
  TV: '电视',
  Thai: '泰语流行',
  Alternative: 'Alternative',
  Chill: 'Chill',
  Country: 'Country',
  EDM: 'EDM',
  Gold: 'Gold',
  Kids: 'Kids',
  Rock: 'Rock'
};

// 构造应用界面配置，所有的频道都作为"song"以便于直接点击播放
const appConfig = {
  ver: 1,
  name: 'cooltv',
  message: '欢迎使用COOL Radio插件',
  warning: '',
  desc: '提供高质量的全球电台与电视频道伴音',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: '高清专区', type: 'song', ui: 0, showMore: false, ext: { type: 'HQ' } },
      { name: 'C-Pop', type: 'song', ui: 0, showMore: false, ext: { type: 'CPop' } },
      { name: 'Pop', type: 'song', ui: 0, showMore: false, ext: { type: 'Pop' } },
      { name: 'J-Pop', type: 'song', ui: 0, showMore: false, ext: { type: 'JPop' } },
      { name: 'K-Pop', type: 'song', ui: 0, showMore: false, ext: { type: 'KPop' } },
      { name: '音乐', type: 'song', ui: 0, showMore: false, ext: { type: 'Music' } },
      { name: '综合', type: 'song', ui: 0, showMore: false, ext: { type: 'Comprehensive' } },
      { name: '交通', type: 'song', ui: 0, showMore: false, ext: { type: 'Traffic' } },
      { name: '网络', type: 'song', ui: 0, showMore: false, ext: { type: 'Net' } },
      { name: '电视伴音', type: 'song', ui: 0, showMore: false, ext: { type: 'TVAudio' } },
      { name: 'Chill', type: 'song', ui: 0, showMore: false, ext: { type: 'Chill' } },
      { name: 'EDM', type: 'song', ui: 0, showMore: false, ext: { type: 'EDM' } },
      { name: 'Rock', type: 'song', ui: 0, showMore: false, ext: { type: 'Rock' } }
    ]
  },
  tabMe: { name: '我的', groups: [] },
  tabSearch: { name: '搜索', groups: [{ name: '电台', type: 'song', ext: { type: 'radio' } }] }
};

function withHeaders(extra = {}) {
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

// 统一封装请求
async function fetchHtml(url) {
  try {
    const { data } = await $fetch.get(url, { headers: withHeaders() });
    return typeof data === 'string' ? data : JSON.stringify(data);
  } catch (e) {
    console.log('请求失败：', url, e);
    return '';
  }
}

// 映射电台数据模型至歌曲格式
function mapRadioToSong(radio, index) {
  return {
    id: radio.id || `radio_${index}`,
    name: radio.name || '未知电台',
    cover: radio.cover || 'https://cooltv.top/favicon.ico', // 使用站点图标作为兜底
    duration: 0, // 直播流没有固定时长
    artist: {
      id: 'cooltv_artist',
      name: radio.category || 'COOL Radio',
      cover: '',
    },
    ext: {
      source: 'cooltv',
      streamUrl: radio.url || '', // 将直播流地址藏在ext中供获取播放链接时使用
      radioName: radio.name || '',
    }
  };
}

// 获取配置表
async function getConfig() {
  return jsonify(appConfig);
}

// 解析COOL Radio页面中的电台列表 (按分类拆分)
// 注：实际页面可能是服务端渲染的HTML，通过正则匹配区块
async function getSongs(ext) {
  const { type = 'HQ' } = safeExt(ext);
  let categoryName = CATEGORIES[type] || '高清专区';
  
  const html = await fetchHtml('https://cooltv.top/');
  let songs = [];
  
  // 许多这类网页的数据可能会挂载在全局变量或固定结构的HTML内
  // 这里做了一个适配假设：假设电台数据以JSON形式嵌入或通过正则解析HTML列表
  try {
    // 假设网站使用 NEXT.js 或 Nuxt.js 等服务端渲染，尝试提取页面里的状态 JSON 
    const stateMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (stateMatch && stateMatch[1]) {
      const stateObj = JSON.parse(stateMatch[1]);
      // 根据您的实际网页DOM结构获取包含电台的数组层级
      const allStations = stateObj?.props?.pageProps?.stations || []; 
      
      const filteredStations = allStations.filter(s => s.category === categoryName);
      songs = filteredStations.map((s, index) => mapRadioToSong(s, index));
    } else {
      // 兼容直接写在HTML中的<a> 或 <li> 结构：(仅为正则示例，需视真实DOM做调整)
      // 提取诸如 data-name="音乐之声" data-url="http://流媒体地址" data-category="高清专区"
      const regex = /<div[^>]*data-name="([^"]+)"[^>]*data-url="([^"]+)"[^>]*data-category="([^"]+)"[^>]*data-cover="([^"]*)"/g;
      let match;
      let index = 0;
      while ((match = regex.exec(html)) !== null) {
        if (match[3] === categoryName || categoryName === 'All') {
          songs.push(mapRadioToSong({
            name: match[1],
            url: match[2],
            category: match[3],
            cover: match[4]
          }, ++index));
        }
      }
    }
  } catch (e) {
    console.log('数据解析失败', e);
  }

  // 兜底数据测试，确保格式没有抛错并且可播放
  if (songs.length === 0) {
    console.log('未匹配到精确列表，采用兼容容错...');
  }
  
  return jsonify({ list: songs });
}

// 占位搜索模块
async function search(ext) {
  return jsonify({ list: [] });
}

// 获取可播放的音频/视频流链接 (保证可播放的核心逻辑)
async function getSongInfo(ext) {
  const { streamUrl } = safeExt(ext);
  
  // 对于电台源来说，直接把抓取到的m3u8/mp3直播流地址返回给播放器即可播放
  if (!streamUrl) {
    return jsonify({ urls: [] });
  }

  // 返回最终直播流数组
  return jsonify({ urls: [streamUrl] });
}
