/*!
 * @name cooltv
 * @description COOL Radio 引擎防死锁版 (彻底优化起播与切台假死)
 * @version v1.1.4
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
      ui: 1,               
      showMore: true,      
      ext: { type: key }
    }))
  },
  tabMe: { name: '我的', groups: [] },
  tabSearch: { name: '搜索', groups: [{ name: '电台', type: 'song', ext: { type: 'radio' } }] }
};

let globalStationsCache = null;
let globalCacheTime = 0;
let fetchingPromise = null; 

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

async function loadAllStations() {
    if (globalStationsCache && (Date.now() - globalCacheTime < 3600000)) {
        return globalStationsCache;
    }
    if (fetchingPromise) {
        return await fetchingPromise;
    }
    
    fetchingPromise = (async () => {
        let allStations = [];
        let seenUrls = new Set();

        function addStation(name, rawUrl, cat, cover) {
            if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.length < 5 || rawUrl.includes('javascript:')) return;
            
            let url = rawUrl.split(/[;,]/)[0].trim().replace(/\s/g, '');
            
            // 核心防死锁 1：强行过滤掉会让普通音乐播放器直接卡死崩溃的非 HTTP 协议
            if (url.startsWith('rtmp') || url.startsWith('rtsp') || url.startsWith('mms')) {
                return;
            }

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

async function getSongs(ext) {
  const { type = 'HQ', page = 1, from = '' } = safeExt(ext);
  let categoryName = CATEGORIES[type] || '高清专区';
  let isIndex = from === 'index';

  let stationsList = await loadAllStations();

  let targetList = stationsList.filter(s => 
      s.cat === categoryName || s.cat.includes(categoryName) || categoryName.includes(s.cat) || s.cat === '未知'
  );

  if (targetList.length === 0 && stationsList.length > 0) targetList = stationsList; 

  let pageList = [];
  
  if (isIndex) {
      pageList = targetList.slice(0, 9);
  } else {
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
          // 核心防死锁 2：补齐专辑字段防UI崩溃，加入 duration: 0 和 isLive 标志避免播放器死等文件大小探测
          artist: { id: 'cooltv', name: s.cat !== '未知' ? s.cat : categoryName, cover: s.cover },
          album: { id: 'live_radio', name: '网络电台频道' },
          cover: s.cover,
          duration: 0, 
          isLive: true,
          ext: { streamUrl: s.url, isLive: true } 
      });
  }

  return jsonify({ list: songs });
}

async function getSongInfo(ext) {
  try {
      const { streamUrl } = safeExt(ext);
      if (streamUrl) {
          return jsonify({ urls: [streamUrl] });
      }
  } catch(e) {}
  
  return jsonify({ urls: [] });
}
