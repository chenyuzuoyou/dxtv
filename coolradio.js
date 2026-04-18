/*!
 * @name cooltv
 * @description COOL Radio 流畅播放版 (分页防卡顿+多线路备用)
 * @version v1.1.0
 * @author AI
 * @key csp_cooltv
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const headers = { 'User-Agent': UA };
const PAGE_LIMIT = 60; // 每次分页加载的数量，彻底解决滑动卡顿

const CATEGORIES = {
  HQ: '高清专区', Pop: 'Pop', CPop: 'C-Pop', JPop: 'J-Pop', KPop: 'K-Pop',
  News: 'News', Music: '音乐', Comprehensive: '综合', Traffic: '交通', Net: '网络',
  TVAudio: '电视伴音', TV: '电视', Thai: '泰语流行', Alternative: 'Alternative',
  Chill: 'Chill', Country: 'Country', EDM: 'EDM', Gold: 'Gold', Kids: 'Kids', Rock: 'Rock'
};

const appConfig = {
  ver: 1,
  name: 'cooltv',
  message: '欢迎使用COOL Radio',
  warning: '',
  desc: '提供高质量的全球电台与电视频道伴音',
  tabLibrary: {
    name: '探索',
    groups: Object.keys(CATEGORIES).map(key => ({
      name: CATEGORIES[key], type: 'song', ui: 0, showMore: false, ext: { type: key }
    }))
  },
  tabMe: { name: '我的', groups: [] },
  tabSearch: { name: '搜索', groups: [{ name: '电台', type: 'song', ext: { type: 'radio' } }] }
};

// 全局缓存，避免切换分类或翻页时重复发请求
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

// 分页与格式化输出模块
function filterAndPaginate(stationsList, categoryName, page) {
    let targetList = stationsList.filter(s => 
        s.cat === categoryName || 
        s.cat.includes(categoryName) || 
        categoryName.includes(s.cat) || 
        s.cat === '未知'
    );

    if (targetList.length === 0 && stationsList.length > 0) {
        targetList = stationsList; // 防空载
    }

    // 核心优化：分页截取，防止内存爆炸
    let offset = (page - 1) * PAGE_LIMIT;
    let pageList = targetList.slice(offset, offset + PAGE_LIMIT);

    let songs = [];
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
            ext: { streamUrl: s.url } // 这里存入的是包含备用线路的完整原始 URL 字符串
        });
    }
    return songs;
}

async function getSongs(ext) {
  const { type = 'HQ', page = 1 } = safeExt(ext);
  let categoryName = CATEGORIES[type] || '高清专区';
  
  // 如果内存有缓存且正在翻页或切分类，直接走内存秒切
  if (globalStationsCache && (Date.now() - globalCacheTime < 3600000)) {
      return jsonify({ list: filterAndPaginate(globalStationsCache, categoryName, page) });
  }

  let allStations = [];
  let seenUrls = new Set();

  function addStation(name, rawUrl, cat, cover) {
    if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.length < 5) return;
    if (rawUrl.includes('javascript:')) return;
    
    // 关键优化：不再切除备用线路，而是保留整个带有分号的原始字符串供 getSongInfo 拆分
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

  return jsonify({ list: filterAndPaginate(globalStationsCache || allStations, categoryName, page) });
}

// 核心优化：多线路防跳过机制
async function getSongInfo(ext) {
  const { streamUrl } = safeExt(ext);
  if (streamUrl) {
      // 网站的数据常以分号或逗号分隔多条备用源，我们将其拆分为数组
      // 播放器在接收到数组后，如果第一条播放失败，会自动尝试下一条
      let urls = streamUrl.split(/[;,]/)
                          .map(u => u.trim())
                          .filter(u => u.startsWith('http'));
      
      if (urls.length > 0) {
          return jsonify({ urls: urls });
      }
  }
  return jsonify({ urls: [] });
}
