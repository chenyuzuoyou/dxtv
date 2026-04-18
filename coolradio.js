/*!
 * @name cooltv
 * @description COOL Radio 终极数据提取版 (解析底层JSON)
 * @version v1.0.7
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
  let songs = [];
  
  let allStations = [];
  let seenUrls = new Set();

  // 添加电台的核心函数（带过滤去重）
  function addStation(name, url, cat) {
    if (!url || typeof url !== 'string' || url.length < 5) return;
    if (url.includes('javascript:')) return;
    
    // 补全相对路径流媒体
    if (!url.startsWith('http')) {
        if (url.endsWith('.m3u8') || url.endsWith('.flv') || url.endsWith('.mp3') || url.endsWith('.aac') || url.endsWith('.ts')) {
            url = `https://cooltv.top${url.startsWith('/') ? '' : '/'}${url}`;
        } else {
            return;
        }
    }
    
    if (seenUrls.has(url)) return;
    seenUrls.add(url);
    
    allStations.push({
        name: String(name || '未命名频道').replace(/<[^>]+>/g, '').trim(),
        url: url,
        cat: String(cat || '未知').replace(/<[^>]+>/g, '').trim()
    });
  }

  // 深度遍历任意未知 JSON 结构的函数
  function extractFromObj(obj, fallbackCat = '未知') {
    if (!obj) return;
    if (Array.isArray(obj)) {
        obj.forEach(o => extractFromObj(o, fallbackCat));
        return;
    }
    if (typeof obj === 'object') {
        // 尝试抓取各种千奇百怪的键名
        let name = obj.name || obj.title || obj.channel || obj.n || obj.t || obj.name_zh;
        let url = obj.url || obj.stream || obj.streamUrl || obj.m3u8 || obj.live || obj.u || obj.src || obj.play_url;
        let cat = obj.category || obj.type || obj.group || obj.c || fallbackCat;

        if (url && typeof url === 'string') {
            addStation(name, url, cat);
        }

        // 如果上述标准键名都没中，暴力扫描所有字符串值
        for (let k in obj) {
            let val = obj[k];
            if (typeof val === 'string' && val.startsWith('http') && (val.includes('.m3u8') || val.includes('.flv') || val.includes('.mp3') || val.includes('live'))) {
                addStation(name || k, val, cat);
            } else if (typeof val === 'object') {
                extractFromObj(val, cat);
            }
        }
    }
  }

  try {
    let html = await fetchHtml('https://cooltv.top/');

    // 之前诊断发现的确存在的 JSON 接口
    let potentialDataUrls = [
      'https://cooltv.top/radio.json',
      'https://cooltv.top/stations.json',
      'https://cooltv.top/data.json'
    ];

    // 动态提取源码里可能新增的其它 .json
    let jsonMatches = html.match(/(?:["'])([^"']+\.json)(?:["'])/gi);
    if (jsonMatches) {
      for (let j of jsonMatches) {
        let cleanJ = j.replace(/["']/g, '');
        if (!cleanJ.startsWith('http')) cleanJ = `https://cooltv.top${cleanJ.startsWith('/') ? '' : '/'}${cleanJ}`;
        if (!potentialDataUrls.includes(cleanJ)) potentialDataUrls.push(cleanJ);
      }
    }

    let fetchedAny = false;
    let lastRawText = "";

    // 逐个拉取宝库数据并解构
    for (let jUrl of potentialDataUrls) {
      let jText = await fetchHtml(jUrl);
      if (!jText.startsWith('[ERROR]') && jText.includes('{')) {
        fetchedAny = true;
        lastRawText = jText;
        try {
          let jObj = JSON.parse(jText);
          extractFromObj(jObj);
        } catch (e) {
          // 如果 JSON 解析失败，用正则生抠 URL
          let r = /(?:["']?(?:url|stream|m3u8|live)["']?)\s*:\s*["'](http[^"']+)["']/gi;
          let m;
          while ((m = r.exec(jText)) !== null) addStation('提取流', m[1], '未知');
        }
      }
    }

    // ========== 核心分类与防空载逻辑 ==========
    // 1. 尝试按当前分类匹配
    let targetList = allStations.filter(s => 
        s.cat === categoryName || 
        s.cat.includes(categoryName) || 
        categoryName.includes(s.cat) || 
        s.cat === '未知'
    );

    // 2. 如果当前分类下没有数据，但是总库抓到了数据
    // 直接取消分类限制，把所有频道列出来！(防空载机制)
    if (targetList.length === 0 && allStations.length > 0) {
        targetList = allStations;
    }

    // 渲染输出
    for (let s of targetList) {
        let displayName = s.name === '未命名频道' ? `[${s.cat}] 频道` : s.name;
        // 如果触发了全列表防空载，在名字前面加上它真实的分类名，方便你辨认
        if (targetList === allStations && s.cat !== '未知') {
            displayName = `[${s.cat}] ${displayName}`;
        }
        
        songs.push({
            id: safeId(s.url),
            name: displayName,
            artist: { id: 'cooltv', name: s.cat !== '未知' ? s.cat : categoryName, cover: '' },
            cover: 'https://cooltv.top/favicon.ico',
            ext: { streamUrl: s.url }
        });
    }

    // 如果上面一顿操作猛如虎，结果还是 0，那就把它的 JSON 开头输出给你看
    if (songs.length === 0) {
        songs.push({ id: 'err1', name: `成功请求数据，但未剥离出链接`, artist: { id: '', name: '诊断' } });
        if (fetchedAny) {
            let safeText = lastRawText.replace(/\s+/g, ' ');
            songs.push({ id: 'err2', name: `数据A: ${safeText.substring(0, 45)}`, artist: { id: '', name: '截图' } });
            songs.push({ id: 'err3', name: `数据B: ${safeText.substring(45, 90)}`, artist: { id: '', name: '截图' } });
            songs.push({ id: 'err4', name: `数据C: ${safeText.substring(90, 135)}`, artist: { id: '', name: '截图' } });
        }
    }

  } catch (err) {
    songs.push({ id: 'err_catch', name: `异常: ${err.message}`, artist: { id: '', name: 'Error' }, ext: {} });
  }

  return jsonify({ list: songs });
}

// 既然直接从 JSON 拿到了底层播放源，播放时直接透传直链即可
async function getSongInfo(ext) {
  const { streamUrl } = safeExt(ext);
  if (streamUrl) return jsonify({ urls: [streamUrl] });
  return jsonify({ urls: [] });
}
