/*!
 * @name cooltv
 * @description COOL Radio 极速秒开版 (内存缓存+并发请求)
 * @version v1.0.9
 * @author AI
 * @key csp_cooltv
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const headers = { 'User-Agent': UA };

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

// 全局缓存变量，用于实现“秒开”
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

async function getSongs(ext) {
  const { type = 'HQ' } = safeExt(ext);
  let categoryName = CATEGORIES[type] || '高清专区';
  
  // ================= 1. 缓存命中逻辑 =================
  // 如果内存中有缓存且缓存时间不超过 1 小时，直接走缓存，实现 0 延迟秒开
  if (globalStationsCache && (Date.now() - globalCacheTime < 3600000)) {
      return jsonify({ list: filterAndFormat(globalStationsCache, categoryName) });
  }

  // ================= 2. 并发拉取逻辑 =================
  let allStations = [];
  let seenUrls = new Set();

  function addStation(name, rawUrl, cat, cover) {
    if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.length < 5) return;
    if (rawUrl.includes('javascript:')) return;
    
    let url = rawUrl.split(/[;,]/)[0].trim();
    if (!url.startsWith('http')) {
        if (url.match(/\.(m3u8|flv|mp3|aac|ts)/i)) {
            url = `https://cooltv.top${url.startsWith('/') ? '' : '/'}${url}`;
        } else {
            return;
        }
    }
    
    if (seenUrls.has(url)) return;
    seenUrls.add(url);
    
    let cleanCover = cover;
    if (cleanCover && !cleanCover.startsWith('http') && !cleanCover.startsWith('data:')) {
        cleanCover = `https://cooltv.top${cleanCover.startsWith('/') ? '' : '/'}${cleanCover}`;
    } else if (!cleanCover || cleanCover === 'undefined' || cleanCover === 'null') {
        cleanCover = 'https://cooltv.top/favicon.ico';
    }

    allStations.push({
        name: String(name || '未命名频道').replace(/<[^>]+>/g, '').trim(),
        url: url,
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
    // 并发直接请求已知的核心 JSON 数据接口（跳过臃肿的 HTML）
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

    // 存入全局缓存
    if (allStations.length > 0) {
        globalStationsCache = allStations;
        globalCacheTime = Date.now();
    }

  } catch (err) {
    console.log("获取失败", err);
  }

  return jsonify({ list: filterAndFormat(globalStationsCache || allStations, categoryName) });
}

// 格式化输出函数
function filterAndFormat(stationsList, categoryName) {
    let songs = [];
    let targetList = stationsList.filter(s => 
        s.cat === categoryName || 
        s.cat.includes(categoryName) || 
        categoryName.includes(s.cat) || 
        s.cat === '未知'
    );

    if (targetList.length === 0 && stationsList.length > 0) {
        targetList = stationsList; // 防空载兜底
    }

    for (let s of targetList) {
        let displayName = s.name === '未命名频道' ? `[${s.cat}] 频道` : s.name;
        if (targetList === stationsList && s.cat !== '未知') {
            displayName = `[${s.cat}] ${displayName}`;
        }
        songs.push({
            id: safeId(s.url),
            name: displayName,
            artist: { id: 'cooltv', name: s.cat !== '未知' ? s.cat : categoryName, cover: s.cover },
            cover: s.cover,
            ext: { streamUrl: s.url }
        });
    }
    return songs;
}

async function getSongInfo(ext) {
  const { streamUrl } = safeExt(ext);
  if (streamUrl) return jsonify({ urls: [streamUrl] });
  return jsonify({ urls: [] });
}
