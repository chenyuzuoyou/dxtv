/*!
 * @name cooltv
 * @description COOL Radio 稳定防死锁版 (破除播放器直播流缓存)
 * @version v1.1.2
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

// ================== 格式化与分页截断逻辑 ==================
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
    
    // 首页限流展示9个，进入分类页后正常分页加载
    if (isIndex || (page === 1 && !globalStationsCache)) {
        pageList = targetList.slice(0, 9);
    } else {
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

  return jsonify({ list: filterAndPaginate(globalStationsCache || allStations, categoryName, page, isIndex) });
}

// ================== 核心播放伪装处理 ==================
async function getSongInfo(ext) {
  const { streamUrl } = safeExt(ext);
  
  if (streamUrl) {
      // 1. 切分多条备用线路
      let urls = streamUrl.split(/[;,]/)
                          .map(u => u.trim())
                          .filter(u => u.startsWith('http'));
      
      if (urls.length > 0) {
          // 2. 防死锁机制：为所有的直播流链接强行追加毫秒级时间戳
          // 这会让播放器每次请求都认为这是一个全新且未缓存的文件，防止切台时卡死
          let finalUrls = urls.map(u => {
              // 为了避免破坏某些本身自带复杂参数的推流链接
              if (u.includes('.m3u8') || u.includes('.flv') || u.includes('live')) {
                  return u + (u.includes('?') ? '&' : '?') + '_t=' + Date.now();
              }
              return u;
          });

          return jsonify({ urls: finalUrls });
      }
  }
  return jsonify({ urls: [] });
}
