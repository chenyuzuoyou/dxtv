/*!
 * @name cooltv
 * @description COOL Radio 终极流畅纯净版 (全局锁秒开+精准9台+纯净直链)
 * @version v1.1.3
 * @author AI
 * @key csp_cooltv
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const headers = { 'User-Agent': UA };
const PAGE_LIMIT = 60; // 专属页每页加载数量

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
      ui: 1,               // 采用歌单卡片UI
      showMore: true,      // 开启更多按钮与上滑加载
      ext: { type: key }
    }))
  },
  tabMe: { name: '我的', groups: [] },
  tabSearch: { name: '搜索', groups: [{ name: '电台', type: 'song', ext: { type: 'radio' } }] }
};

// ================= 全局锁与缓存 =================
let globalStationsCache = null;
let globalCacheTime = 0;
let fetchingPromise = null; // 并发锁：防止首页同时发起20个庞大请求导致严重卡顿

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

// ================= 核心：带并发锁的数据拉取引擎 =================
async function loadAllStations() {
    // 1. 命中内存缓存，直接返回
    if (globalStationsCache && (Date.now() - globalCacheTime < 3600000)) {
        return globalStationsCache;
    }
    // 2. 如果正在拉取中，其他 19 个分类的请求全部排队等待，不重复发网络请求
    if (fetchingPromise) {
        return await fetchingPromise;
    }
    // 3. 发起真实拉取
    fetchingPromise = (async () => {
        let allStations = [];
        let seenUrls = new Set();

        function addStation(name, rawUrl, cat, cover) {
            if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.length < 5 || rawUrl.includes('javascript:')) return;
            // 获取极致纯净的真实链接，不加时间戳破坏 CDN 签名
            let url = rawUrl.split(/[;,]/)[0].trim();
            if (!url.startsWith('http')) {
                if (url.match(/\.(m3u8|flv|mp3|aac|ts)/i)) url = `https://cooltv.top${url.startsWith('/') ? '' : '/'}${url}`;
                else return;
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
                name: String(name || '未命名').replace(/<[^>]+>/g, '').trim(),
                url: url,
                cat: String(cat || '未知').replace(/<[^>]+>/g, '').trim(),
                cover: cleanCover
            });
        }

        function extractObj(obj, fallbackCat = '未知') {
            if (!obj) return;
            if (Array.isArray(obj)) { obj.forEach(o => extractObj(o, fallbackCat)); return; }
            if (typeof obj === 'object') {
                let name = obj.name || obj.title || obj.channel || obj.n || obj.t || obj.name_zh;
                let url = obj.url || obj.stream || obj.streamUrl || obj.m3u8 || obj.live || obj.u || obj.src || obj.play_url;
                let cat = obj.category || obj.type || obj.group || obj.c || fallbackCat;
                let cover = obj.logo || obj.cover || obj.icon || obj.image || obj.pic || obj.img || obj.thumb;

                if (url && typeof url === 'string') addStation(name, url, cat, cover);

                for (let k in obj) {
                    let val = obj[k];
                    if (typeof val === 'string' && val.startsWith('http') && val.match(/\.(m3u8|flv|mp3|aac|ts)/i)) {
                        addStation(name || k, val, cat, cover);
                    } else if (typeof val === 'object') extractObj(val, cat);
                }
            }
        }

        const potentialDataUrls = ['https://cooltv.top/stations.json', 'https://cooltv.top/radio.json', 'https://cooltv.top/data.json'];
        const responses = await Promise.all(potentialDataUrls.map(url => fetchHtml(url).catch(e => '[ERROR]')));
        
        for (let jText of responses) {
            if (!jText.startsWith('[ERROR]') && jText.includes('{')) {
                try { extractObj(JSON.parse(jText)); } 
                catch (e) {
                    let r = /(?:["']?(?:url|stream|m3u8|live)["']?)\s*:\s*["'](http[^"']+)["']/gi;
                    let m;
                    while ((m = r.exec(jText)) !== null) addStation('提取流', m[1], '未知', '');
                }
            }
        }
        return allStations;
    })();

    try {
        globalStationsCache = await fetchingPromise;
        globalCacheTime = Date.now();
    } catch (e) {
        console.log("获取数据严重错误", e);
    } finally {
        fetchingPromise = null;
    }
    
    return globalStationsCache || [];
}

// ================= 输出展示 =================
async function getSongs(ext) {
  const { type = 'HQ', page = 1, from = '' } = safeExt(ext);
  let categoryName = CATEGORIES[type] || '高清专区';
  
  // 识别当前请求是否来自首页外层展示
  let isIndex = from === 'index';

  let stationsList = await loadAllStations();

  // 筛选分类
  let targetList = stationsList.filter(s => 
      s.cat === categoryName || s.cat.includes(categoryName) || categoryName.includes(s.cat) || s.cat === '未知'
  );

  // 防空载：如果分类里啥也没有，给它展示全部电台
  if (targetList.length === 0 && stationsList.length > 0) targetList = stationsList; 

  let pageList = [];
  
  if (isIndex) {
      // 如果是首页请求，严格截取前 9 个，绝不卡顿
      pageList = targetList.slice(0, 9);
  } else {
      // 如果是进入到分类专属页面内，按 60 个进行标准分页加载
      let offset = (page - 1) * PAGE_LIMIT;
      pageList = targetList.slice(offset, offset + PAGE_LIMIT);
  }

  let songs = [];
  for (let s of pageList) {
      let displayName = s.name === '未命名' ? `[${s.cat}] 频道` : s.name;
      if (targetList === stationsList && s.cat !== '未知') displayName = `[${s.cat}] ${displayName}`;
      
      songs.push({
          id: safeId(s.url + displayName),
          name: displayName,
          artist: { id: 'cooltv', name: s.cat !== '未知' ? s.cat : categoryName, cover: s.cover },
          cover: s.cover,
          ext: { streamUrl: s.url } 
      });
  }

  return jsonify({ list: songs });
}

// ================= 播放直连 =================
async function getSongInfo(ext) {
  const { streamUrl } = safeExt(ext);
  if (streamUrl) {
      // 返回极致纯净的第一条有效直链，不再混入分号或强制加时间戳
      return jsonify({ urls: [streamUrl] });
  }
  return jsonify({ urls: [] });
}
