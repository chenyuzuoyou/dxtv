/*!
 * @name cooltv
 * @description COOL Radio 动态脱壳版 (破解前端渲染)
 * @version v1.0.6
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

async function getConfig() {
  return jsonify(appConfig);
}

async function getSongs(ext) {
  const { type = 'HQ' } = safeExt(ext);
  let categoryName = CATEGORIES[type] || '高清专区';
  let songs = [];
  let debugInfo = [];

  try {
    let html = await fetchHtml('https://cooltv.top/');
    if (html.startsWith('[ERROR]')) throw new Error(html);

    // 1. 查找所有注入的 JS 核心文件
    let jsLinks = [];
    let scriptRegex = /<script[^>]+src=["']([^"']+\.js)["']/gi;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      let src = match[1];
      if (!src.startsWith('http')) src = `https://cooltv.top${src.startsWith('/') ? '' : '/'}${src}`;
      jsLinks.push(src);
    }
    debugInfo.push(`找到 ${jsLinks.length} 个JS文件`);

    // 预埋常见的动态数据接口
    let potentialDataUrls = [
      'https://cooltv.top/tv.json', 
      'https://cooltv.top/data.json',
      'https://cooltv.top/stations.json',
      'https://cooltv.top/api/stations'
    ];

    let allStations = [];
    let seenUrls = {}; // 兼容旧版 JS 引擎字典去重

    function extractFromText(text) {
      // 嗅探并提取包含 json 的接口链接
      let jsonMatches = text.match(/(?:["'])([^"']+\.json)(?:["'])/gi);
      if (jsonMatches) {
        for (let j of jsonMatches) {
          let cleanJ = j.replace(/["']/g, '');
          if (!cleanJ.startsWith('http')) cleanJ = `https://cooltv.top${cleanJ.startsWith('/') ? '' : '/'}${cleanJ}`;
          if (potentialDataUrls.indexOf(cleanJ) === -1) potentialDataUrls.push(cleanJ);
        }
      }

      // 正则暴力匹配 JS 代码库里的 {name: "xxx", url: "http..."}
      let r1 = /name\s*:\s*["']([^"']+)["'][^}]*?url\s*:\s*["'](https?:\/\/[^"']+)["']/gi;
      let m;
      while ((m = r1.exec(text)) !== null) {
        if (!seenUrls[m[2]]) {
          seenUrls[m[2]] = true;
          allStations.push({ name: m[1], url: m[2], cat: '匹配' });
        }
      }
    }

    // 2. 拉取所有 JS 核心文件进行逆向解析
    for (let jsUrl of jsLinks) {
      let jsText = await fetchHtml(jsUrl);
      if (!jsText.startsWith('[ERROR]')) {
        extractFromText(jsText);
      }
    }

    // 3. 拉取所有嗅探到的 JSON 数据接口
    for (let jUrl of potentialDataUrls) {
      let jText = await fetchHtml(jUrl);
      if (!jText.startsWith('[ERROR]') && jText.includes('{')) {
        debugInfo.push(`成功抓取: ${jUrl.split('/').pop()}`);
        try {
          let jObj = JSON.parse(jText);
          let list = Array.isArray(jObj) ? jObj : (jObj.data || jObj.list || jObj.stations || jObj.channels || []);
          if (Array.isArray(list)) {
            for (let item of list) {
              let name = item.name || item.title || item.channel;
              let url = item.url || item.stream || item.m3u8 || item.src;
              let cat = item.category || item.type || item.group || '未知';
              if (name && url && !seenUrls[url]) {
                seenUrls[url] = true;
                allStations.push({ name, url, cat });
              }
            }
          }
        } catch (e) {
          extractFromText(jText);
        }
      }
    }

    debugInfo.push(`共提取到 ${allStations.length} 个流媒体`);

    // 4. 组装到指定分类
    for (let s of allStations) {
      // 分类清洗：由于暴力脱壳可能丢失分类层级结构，对于'匹配'和'未知'的数据直接全部放出保证不断供
      if (s.cat !== '匹配' && s.cat !== '未知') {
        if (s.cat !== categoryName && s.cat.indexOf(categoryName) === -1) continue;
      }

      let cleanName = s.name.replace(/📻|HQ|🎵|⭐/g, '').trim();
      songs.push({
        id: safeId(s.url),
        name: cleanName,
        artist: { id: 'cooltv', name: s.cat === '匹配' ? categoryName : s.cat, cover: '' },
        cover: 'https://cooltv.top/favicon.ico',
        ext: { streamUrl: s.url }
      });
    }

    // 5. 诊断兜底
    if (songs.length === 0) {
      for (let i = 0; i < debugInfo.length; i++) {
        songs.push({ id: `dbg${i}`, name: debugInfo[i], artist: { id: '', name: '请截图' } });
      }
      for (let i = 0; i < jsLinks.length; i++) {
        let name = jsLinks[i].split('/').pop();
        songs.push({ id: `dbg_js${i}`, name: `JS: ${name.substring(0, 30)}`, artist: { id: '', name: 'JS' } });
      }
    }

  } catch (err) {
    songs.push({ id: 'err_catch', name: `异常: ${err.message}`, artist: { id: '', name: 'Error' }, ext: {} });
  }

  return jsonify({ list: songs });
}

async function search(ext) { return jsonify({ list: [] }); }

// 动态脱壳后，直播链接已经在 ext.streamUrl 里，直接放行即可给播放器播放
async function getSongInfo(ext) {
  const { streamUrl } = safeExt(ext);
  if (streamUrl) return jsonify({ urls: [streamUrl] });
  return jsonify({ urls: [] });
}
