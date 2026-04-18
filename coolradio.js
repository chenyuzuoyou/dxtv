/*!
 * @name cooltv
 * @description COOL Radio 终极修复版 (恢复数据仓库+智能音频优选+首页9格)
 * @version v1.1.7
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
  warning: '提示：遇到死链请点击暂停再切换，切忌连续快速切台。',
  desc: '提供高质量的全球电台与电视频道伴音',
  tabLibrary: {
    name: '探索',
    groups: Object.keys(CATEGORIES).map(key => ({
      name: CATEGORIES[key], 
      type: 'song', 
      ui: 0,               // 0 为原生歌曲列表模式，完美兼容
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

// 核心拉取与解壳引擎 (已恢复 JSON 数据仓库抓取)
async function loadAllStations() {
    if (globalStationsCache) return globalStationsCache;
    if (fetchingPromise) return await fetchingPromise;

    fetchingPromise = (async () => {
        let allStations = [];
        let seenUrls = new Set();

        function addStation(name, rawUrl, cat, cover) {
            if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.length < 5 || rawUrl.includes('javascript:')) return;
            
            // 将包含多个备用地址的字符串拆分
            let urls = rawUrl.split(/[;,]/).map(u => u.trim().replace(/\s/g, '')).filter(u => u.startsWith('http'));
            if (urls.length === 0) return;

            // 🛡️ 智能防卡死优选策略：
            // 优先选 mp3/aac 原生音频流，其次选无后缀直链，只有在没得选时才用 m3u8 (容易卡死)
            let bestUrl = urls.find(u => /\.(mp3|aac)$/i.test(u)) || urls.find(u => !/\.(m3u8|flv)$/i.test(u)) || urls[0];

            // 过滤必定崩溃的链接
            if (bestUrl.match(/\.(png|jpg|jpeg|gif|js|css|html|php|json)$/i)) return;
            if (bestUrl.startsWith('rtmp') || bestUrl.startsWith('rtsp') || bestUrl.startsWith('mms')) return; 

            if (seenUrls.has(bestUrl)) return;
            seenUrls.add(bestUrl);
            
            let cleanCover = cover;
            if (cleanCover && !cleanCover.startsWith('http') && !cleanCover.startsWith('data:')) {
                cleanCover = `https://cooltv.top${cleanCover.startsWith('/') ? '' : '/'}${cleanCover}`;
            } else if (!cleanCover || cleanCover === 'undefined' || cleanCover === 'null') {
                cleanCover = 'https://cooltv.top/favicon.ico';
            }

            allStations.push({
                name: String(name || '未命名').replace(/<[^>]+>/g, '').trim(),
                url: bestUrl,
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
    } catch (e) {
        console.log("获取数据错误", e);
    } finally {
        fetchingPromise = null;
    }
    return globalStationsCache || [];
}

// 格式化输出与截取
async function getSongs(ext) {
    const { type = 'HQ', page = 1, from = '' } = safeExt(ext);
    let catName = CATEGORIES[type] || '高清专区';
    
    // 如果 from 字段是 index，说明是首页，强制只显示 9 个
    let isIndex = from === 'index';

    let list = await loadAllStations();
    let targetList = list.filter(s => s.cat.includes(catName) || catName.includes(s.cat));
    
    if (targetList.length === 0 && list.length > 0) targetList = list;

    let pageList = [];
    if (isIndex) {
        pageList = targetList.slice(0, 9);
    } else {
        let offset = (page - 1) * PAGE_LIMIT;
        pageList = targetList.slice(offset, offset + PAGE_LIMIT);
    }

    let songs = [];
    for (let s of pageList) {
        songs.push({
            id: safeId(s.url),
            name: s.name,
            artist: { id: 'cooltv', name: s.cat, cover: s.cover },
            cover: s.cover,
            duration: 0, // 核心：告诉播放器不要探测文件大小
            ext: { streamUrl: s.url }
        });
    }
    return jsonify({ list: songs });
}

// 额外福利：加上了电台搜索功能
async function search(ext) {
    const { text = '', page = 1 } = safeExt(ext);
    if (!text || page > 1) return jsonify({ list: [] });
    
    let list = await loadAllStations();
    let matched = list.filter(s => s.name.toLowerCase().includes(text.toLowerCase()) || s.cat.toLowerCase().includes(text.toLowerCase()));
    
    let songs = matched.slice(0, 50).map(s => ({
        id: safeId(s.url),
        name: s.name,
        artist: { id: 'cooltv', name: s.cat, cover: s.cover },
        cover: s.cover,
        duration: 0,
        ext: { streamUrl: s.url }
    }));
    return jsonify({ list: songs });
}

// 返回纯净直链
async function getSongInfo(ext) {
    const { streamUrl } = safeExt(ext);
    if (streamUrl) {
        return jsonify({ 
            urls: [streamUrl],
            headers: { 'User-Agent': UA, 'Referer': 'https://cooltv.top/' }
        });
    }
    return jsonify({ urls: [] });
}
