/*!
 * @name cooltv
 * @description COOL Radio 纯净守护版 (防卡死+严格过滤)
 * @version v1.1.5
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
  warning: '提示：聚合电台存在大量原始死链，若无法播放请耐心尝试其他台。',
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

// 核心拉取引擎
async function loadAllStations() {
    if (globalStationsCache) return globalStationsCache;
    if (fetchingPromise) return await fetchingPromise;

    fetchingPromise = (async () => {
        let stations = [];
        try {
            let html = await fetchHtml('https://cooltv.top/');
            // 精准定位底层真实数据
            let nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
            if (nextMatch) {
                let data = JSON.parse(nextMatch[1]);
                function extract(obj) {
                    if (!obj) return;
                    if (Array.isArray(obj)) { obj.forEach(extract); return; }
                    if (typeof obj === 'object') {
                        if (obj.name && obj.url && typeof obj.url === 'string') {
                            stations.push({
                                name: obj.name,
                                url: obj.url,
                                cat: obj.category || '综合',
                                cover: obj.logo || obj.cover || ''
                            });
                        }
                        for (let k in obj) extract(obj[k]);
                    }
                }
                extract(data);
            }
        } catch (e) {
            console.log("数据解析失败", e);
        }
        
        let valid = [];
        let seen = new Set();
        for (let s of stations) {
            // 切割出第一条有效源
            let url = s.url.split(/[;,]/)[0].trim().replace(/\s/g, '');
            
            // 🛡️ 终极杀手拦截：彻底过滤掉会导致软件播放器卡死崩溃的链接
            if (!url.startsWith('http')) continue;
            if (url.match(/\.(png|jpg|jpeg|gif|js|css|html|php|json)$/i)) continue;
            if (url.startsWith('rtmp') || url.startsWith('rtsp') || url.startsWith('mms')) continue; 
            
            if (!seen.has(url)) {
                seen.add(url);
                valid.push({
                    name: s.name.replace(/<[^>]+>/g, '').trim(),
                    url: url,
                    cat: s.cat,
                    cover: s.cover || 'https://cooltv.top/favicon.ico'
                });
            }
        }
        return valid;
    })();

    globalStationsCache = await fetchingPromise;
    fetchingPromise = null;
    return globalStationsCache;
}

// 格式化输出
async function getSongs(ext) {
    const { type = 'HQ', page = 1, from = '' } = safeExt(ext);
    let catName = CATEGORIES[type] || '高清专区';
    let isIndex = from === 'index';

    let list = await loadAllStations();
    let targetList = list.filter(s => s.cat.includes(catName) || catName.includes(s.cat));
    
    // 如果分类匹配不到，防止空载
    if (targetList.length === 0 && list.length > 0) targetList = list;

    let pageList = isIndex ? targetList.slice(0, 9) : targetList.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

    let songs = [];
    for (let s of pageList) {
        songs.push({
            id: safeId(s.url),
            name: s.name,
            artist: { id: 'cooltv', name: s.cat, cover: s.cover },
            album: { id: 'cooltv_album', name: '网络电台频道' }, // 补齐必填属性防止 UI 渲染报错
            cover: s.cover,
            duration: 0, // 声明0，告知引擎此为直播不要探测
            ext: { streamUrl: s.url }
        });
    }
    return jsonify({ list: songs });
}

// 播放增强
async function getSongInfo(ext) {
    const { streamUrl } = safeExt(ext);
    if (streamUrl) {
        return jsonify({ 
            urls: [streamUrl],
            // 伪装请求头，欺骗服务器防火墙
            headers: { 
                'User-Agent': UA,
                'Referer': 'https://cooltv.top/'
            }
        });
    }
    return jsonify({ urls: [] });
}
