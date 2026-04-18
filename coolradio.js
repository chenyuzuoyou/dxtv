/*!
 * @name cooltv
 * @description COOL Radio 分页展开+稳定播放版
 * @version v1.1.1
 * @author AI
 * @key csp_cooltv
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const headers = { 'User-Agent': UA };
const PAGE_LIMIT = 60; 

const CATEGORIES = {
  HQ: '高清专区', Pop: 'Pop', CPop: 'C-Pop', JPop: 'J-Pop', KPop: 'K-Pop',
  News: 'News', Music: '音乐', Comprehensive: '综合', Traffic: '交通', Net: '网络',
  TVAudio: '电视伴音', TV: '电视', Thai: '泰语流行', Alternative: 'Alternative',
  Chill: 'Chill', Country: 'Country', EDM: 'EDM', Gold: 'Gold', Kids: 'Kids', Rock: 'Rock'
};

// ================== 核心配置改动 ==================
// 修改 UI 样式：首页采用 ui: 1 (歌单卡片/列表模式) 
// 结合 showMore: true 让点击分类名称或 "更多" 时进入新页面
const appConfig = {
  ver: 1,
  name: 'cooltv',
  message: '欢迎使用COOL Radio',
  warning: '',
  desc: '提供高质量的全球电台与电视频道伴音',
  tabLibrary: {
    name: '探索',
    groups: Object.keys(CATEGORIES).map(key => ({
      name: CATEGORIES[key], 
      type: 'song', 
      ui: 1,               // 1: 歌单模式展示，适合配合首页限流
      showMore: true,      // true: 开启上滑加载及分类专属页
      ext: { type: key }
    }))
  },
  tabMe: { name: '我的', groups: [] },
  tabSearch: { name: '搜索', groups: [{ name: '电台', type: 'song', ext: { type: 'radio' } }] }
};

let globalStationsCache = null;
let globalCacheTime = 0;

function withHeaders(extra = {}) {
  return { 
    ...headers, 
    'Accept': '*/*',
    'Referer': 'https://cooltv.top/', 
    'Origin': 'https://cooltv.top', 
    ...extra 
  };
}

function safeExt(ext) {
  if (!ext) return {};
  if (typeof ext === 'object') return ext;
  try { return argsify(ext); } catch (e) { return {}; }
}

function safeId(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `ctv_${Math.abs(hash)}`;
}

async function fetchHtml(url) {
  try {
    const res = await $fetch.get(url, { headers: withHeaders() });
    const data = res?.data ?? res;
    return typeof data === 'object' ? JSON.stringify(data) : data;
  } catch (e) {
    return `[ERROR] ${e.message}`;
  }
}

async function getConfig() { return jsonify(appConfig); }
async function search(ext) { return jsonify({ list: [] }); }

// ================== 格式化与截断逻辑 ==================
function filterAndPaginate(stationsList, categoryName, page, isIndex) {
    let targetList = stationsList.filter(s => 
        s.cat === categoryName || 
        s.cat.includes(categoryName) || 
        categoryName.includes(s.cat) || 
        s.cat === '未知'
    );

    if (targetList.length === 0 && stationsList.length > 0) {
        targetList = stationsList; 
    }

    let songs = [];
    let pageList = [];
    
    // 如果是从首页请求 (通常带有特殊标识或 page 强制归 1)，只提取前 9 个
    if (isIndex || (page === 1 && !globalStationsCache)) {
        // 部分框架根据 ui 和 from 字段判定，这里统一做安全策略
        // 为确保首页只显 9 个，点击更多进去再展示完整分页
        pageList = targetList.slice(0, 9);
    } else {
        // 在分类专属页内正常滑动加载
        let offset = (page - 1) * PAGE_LIMIT;
        pageList = targetList.slice(offset, offset + PAGE_LIMIT);
    }

    for (let s of pageList) {
        let displayName = s.name === '未命名频道' ? `[${s.cat}] 频道` : s.name;
        if (targetList === stationsList && s.cat !== '未知') {
            displayName = `[${s.cat}] ${displayName}`;
        }
        songs.push({
            id: safeId(s.url + displayName),
            name: displayName,
            artist: { id: 'cooltv', name: s.cat !== '未知' ? s.cat : categoryName, cover: s.cover },
            cover: s.cover,
            ext: { streamUrl: s.url } 
        });
    }
    return songs;
}

async function getSongs(ext) {
  const { type = 'HQ', page = 1, from = '' } = safeExt(ext);
  let categoryName = CATEGORIES[type] || '高清专区';
  
  // 判断当前是否处于首页加载环境 (如果是，只返回9个)
  let isIndex = from === 'index' || page === 1;

  if (globalStationsCache && (Date.now() - globalCacheTime < 3600000)) {
      return jsonify({ list: filterAndPaginate(globalStationsCache, categoryName, page, isIndex) });
  }

  let allStations = [];
  let seenUrls = new Set();

  function addStation(name, rawUrl, cat, cover) {
    if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.length < 5) return;
    if (rawUrl.includes('javascript:')) return;
    
    if (seenUrls.has(rawUrl)) return;
    seenUrls.add(rawUrl);
    
    let cleanCover = cover;
    if (cleanCover && !cleanCover.startsWith('http') && !cleanCover.startsWith('data:')) {
        cleanCover = `https://cooltv.top${cleanCover.startsWith('/') ? '' : '/'}${cleanCover}`;
    } else if (!cleanCover || cleanCover === 'undefined' || cleanCover === 'null') {
        cleanCover = 'https://cooltv.top/favicon.ico';
    }

    allStations.push({
        name: String(name || '未命名频道').replace(/<[^>]+>/g, '').trim(),
        url: rawUrl, 
        cat: String(cat || '未知').replace(/<[^>]+>/g, '').trim(),
        cover: cleanCover
    });
  }

  function extractFromObj(obj, fallbackCat = '未知') {
    if (!obj) return;
    if (Array.isArray(obj)) {
        obj.forEach(o => extractFromObj(o, fallbackCat));
        return;
    }
    if (typeof obj === 'object') {
        let name = obj.name || obj.title || obj.channel || obj.n || obj.t || obj.name_zh;
        let url = obj.url || obj.stream || obj.streamUrl || obj.m3u8 || obj.live || obj.u || obj.src || obj.play_url;
        let cat = obj.category || obj.type || obj.group || obj.c || fallbackCat;
        let cover = obj.logo || obj.cover || obj.icon || obj.image || obj.pic || obj.img || obj.thumb;

        if (url && typeof url === 'string') {
            addStation(name, url, cat, cover);
        }
        for (let k in obj) {
            let val = obj[k];
            if (typeof val === 'string' && val.startsWith('http') && val.match(/\.(m3u8|flv|mp3|aac|ts)/i)) {
                addStation(name || k, val, cat, cover);
            } else if (typeof val === 'object') {
                extractFromObj(val, cat);
            }
        }
    }
  }

  try {
    const potentialDataUrls = [
      'https://cooltv.top/stations.json',
      'https://cooltv.top/radio.json',
      'https://cooltv.top/data.json'
    ];

    const responses = await Promise.all(
        potentialDataUrls.map(url => fetchHtml(url).catch(e => '[ERROR]'))
    );

    for (let jText of responses) {
      if (!jText.startsWith('[ERROR]') && jText.includes('{')) {
        try {
          extractFromObj(JSON.parse(jText));
        } catch (e) {
          let r = /(?:["']?(?:url|stream|m3u8|live)["']?)\s*:\s*["'](http[^"']+)["']/gi;
          let m;
          while ((m = r.exec(jText)) !== null) addStation('提取流', m[1], '未知', '');
        }
      }
    }

    if (allStations.length > 0) {
        globalStationsCache = allStations;
        globalCacheTime = Date.now();
    }

  } catch (err) {
    console.log("获取失败", err);
  }

  // 这里的 isIndex == true 会将结果截断为 9 个
  return jsonify({ list: filterAndPaginate(globalStationsCache || allStations, categoryName, page, isIndex) });
}

// ================== 播放增强提取 ==================
async function getSongInfo(ext) {
  const { streamUrl } = safeExt(ext);
  
  if (streamUrl) {
      // 分解备用路线
      let urls = streamUrl.split(/[;,]/)
                          .map(u => u.trim())
                          .filter(u => u.startsWith('http'));
      
      if (urls.length > 0) {
          // 选择第一条地址，如果地址自身没有媒体后缀，尝试拼接或让底层播放器自己处理重定向
          let primaryUrl = urls[0];
          
          // 对于少数特殊的流媒体处理
          if (!primaryUrl.includes('.m3u8') && !primaryUrl.includes('.mp3') && !primaryUrl.includes('.flv')) {
              // 某些电台返回的可能是个 HTML 页面包裹播放器，或者是302重定向跳转。
              // 这里我们直接把它作为直链送出，绝大多数情况下播放器能够顺着重定向找到真正的媒体流。
          }

          // 既然很多播放器不能兼容数组备用，我们退回保证绝对给出一个单独的干净字符串
          return jsonify({ urls: [primaryUrl] });
      }
  }
  return jsonify({ urls: [] });
}
