/*!
 * @name cooltv
 * @description COOL Radio 终极修正版 (修复首页空白+智能线路优选)
 * @version v1.1.6
 * @author AI
 * @key csp_cooltv
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const headers = { 'User-Agent': UA };
const PAGE_LIMIT = 60; // 展开更多后的每页加载量

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
  warning: '提示：由于聚合电台特性，部分源站可能失效。连续遇到死链时请稍等，切忌疯狂切台以免软件卡死。',
  desc: '提供高质量的全球电台与电视频道伴音',
  tabLibrary: {
    name: '探索',
    groups: Object.keys(CATEGORIES).map(key => ({
      name: CATEGORIES[key], 
      type: 'song', 
      ui: 0,               // 修复点1：必须设为 0 才能在首页正常渲染歌曲列表
      showMore: true,      // 开启“更多”按钮及上滑加载
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

// 核心拉取与解壳引擎
async function loadAllStations() {
    if (globalStationsCache) return globalStationsCache;
    if (fetchingPromise) return await fetchingPromise;

    fetchingPromise = (async () => {
        let stations = [];
        try {
            let html = await fetchHtml('https://cooltv.top/');
            // 剥离出真实的底层 JSON 数据仓库
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
            // 切割多线路，进行智能优选 (防卡死机制核心)
            let urls = s.url.split(/[;,]/).map(u => u.trim().replace(/\s/g, '')).filter(u => u.startsWith('http'));
            if (urls.length === 0) continue;

            // 优先选取 mp3 或 aac 等原生音频流（桌面端兼容性最好，秒开）
            let bestUrl = urls.find(u => /\.(mp3|aac)$/i.test(u));
            // 其次选取无后缀的直链（可能是隐藏的mp3）
            if (!bestUrl) bestUrl = urls.find(u => !/\.(m3u8|flv)$/i.test(u));
            // 只有当服务器仅提供 m3u8 时才使用它（电脑版部分播放器可能会放不出来）
            if (!bestUrl) bestUrl = urls[0];
            
            // 彻底过滤必定导致普通播放器崩溃的源
            if (bestUrl.match(/\.(png|jpg|jpeg|gif|js|css|html|php|json)$/i)) continue;
            if (bestUrl.startsWith('rtmp') || bestUrl.startsWith('rtsp') || bestUrl.startsWith('mms')) continue; 
            
            if (!seen.has(bestUrl)) {
                seen.add(bestUrl);
                valid.push({
                    name: s.name.replace(/<[^>]+>/g, '').trim(),
                    url: bestUrl,
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
    
    if (targetList.length === 0 && list.length > 0) targetList = list;

    // 修复点2：精准管控加载数量，首页只截取 9 个，展示完整的九宫格/列表
    let pageList = isIndex ? targetList.slice(0, 9) : targetList.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

    let songs = [];
    for (let s of pageList) {
        songs.push({
            id: safeId(s.url),
            name: s.name,
            artist: { id: 'cooltv', name: s.cat, cover: s.cover },
            album: { id: 'cooltv_album', name: '网络电台' }, 
            cover: s.cover,
            ext: { streamUrl: s.url }
        });
    }
    return jsonify({ list: songs });
}

// 返回纯净直链
async function getSongInfo(ext) {
    const { streamUrl } = safeExt(ext);
    if (streamUrl) {
        return jsonify({ urls: [streamUrl] });
    }
    return jsonify({ urls: [] });
}
