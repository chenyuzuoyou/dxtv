/*!
 * @name cooltv
 * @description COOL Radio 终极捕捞版 (破除动态渲染空壳)
 * @version v1.0.5
 * @author AI
 * @key csp_cooltv
 */

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
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
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Referer': 'https://cooltv.top/', 
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

// 深度遍历 JSON 对象寻找电台节点
function findStationsInJson(obj) {
  let results = [];
  if (Array.isArray(obj)) {
    for (let item of obj) results = results.concat(findStationsInJson(item));
  } else if (obj !== null && typeof obj === 'object') {
    let name = obj.name || obj.title || obj.channel;
    let url = obj.url || obj.streamUrl || obj.m3u8 || obj.src || obj.stream || obj.href || obj.path;
    
    if (name && url && typeof name === 'string' && typeof url === 'string') {
      results.push({ name, url });
    } else {
      for (let key in obj) results = results.concat(findStationsInJson(obj[key]));
    }
  }
  return results;
}

async function getSongs(ext) {
  const { type = 'HQ' } = safeExt(ext);
  let categoryName = CATEGORIES[type] || '高清专区';
  let songs = [];
  let seen = new Set();

  function addSong(name, url) {
    let cleanName = name.replace(/📻|HQ|🎵|⭐|📺|✅/g, '').trim();
    if (cleanName.length < 2 || cleanName.length > 50) return;
    if (/^(主页|分类|搜索|关于|公告|提交|类型|最近播放|国家台|省份)$/.test(cleanName)) return;
    if (cleanName.includes('个电台')) return;
    if (url.includes('javascript:') || url.startsWith('#')) return;
    if (url.includes('/category/') || url.includes('/type/')) return;

    let fullUrl = url.startsWith('http') ? url : `https://cooltv.top${url.startsWith('/') ? '' : '/'}${url}`;
    
    if (!seen.has(cleanName) && !seen.has(fullUrl)) {
      seen.add(cleanName);
      seen.add(fullUrl);
      songs.push({
        id: safeId(fullUrl),
        name: cleanName,
        artist: { id: 'cooltv', name: categoryName, cover: '' },
        cover: 'https://cooltv.top/favicon.ico',
        ext: { pageUrl: fullUrl }
      });
    }
  }

  try {
    let html = await fetchHtml('https://cooltv.top/');
    if (html.startsWith('[ERROR]')) throw new Error(html);

    // 引擎 1: 精准拦截 Next.js 或 Nuxt.js 的底层 JSON 数据
    let nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
    if (nextMatch) {
      try {
        let data = JSON.parse(nextMatch[1]);
        let stations = findStationsInJson(data);
        stations.forEach(s => addSong(s.name, s.url));
      } catch (e) {}
    }

    let nuxtMatch = html.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*?\});/i);
    if (nuxtMatch) {
      try {
         let stations = findStationsInJson(JSON.parse(nuxtMatch[1]));
         stations.forEach(s => addSong(s.name, s.url));
      } catch(e) {}
    }

    // 引擎 2: 无视格式，暴力正则撕裂网页寻找 name 和 url 键值对
    let rawJsonRegex = /(?:["']?(?:name|title|channel)["']?)\s*:\s*["']([^"'\\]+)["'][^}]*?(?:["']?(?:url|streamUrl|m3u8|src|href|path)["']?)\s*:\s*["']([^"'\\]+)["']/gi;
    let rMatch;
    while ((rMatch = rawJsonRegex.exec(html)) !== null) {
      addSong(rMatch[1], rMatch[2]);
    }

    let rawJsonRegexRev = /(?:["']?(?:url|streamUrl|m3u8|src|href|path)["']?)\s*:\s*["']([^"'\\]+)["'][^}]*?(?:["']?(?:name|title|channel)["']?)\s*:\s*["']([^"'\\]+)["']/gi;
    while ((rMatch = rawJsonRegexRev.exec(html)) !== null) {
      addSong(rMatch[2], rMatch[1]);
    }

    // 引擎 3: 以防万一的超强容错 <a> 标签解析（只看头尾不看结构）
    if (songs.length === 0) {
      let aTags = html.match(/<a[^>]+>[\s\S]*?<\/a>/gi) || [];
      for (let a of aTags) {
        let hrefMatch = a.match(/href\s*=\s*["']?([^"'>\s]+)["']?/i);
        let href = hrefMatch ? hrefMatch[1] : '';
        let text = a.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (href && text) addSong(text, href);
      }
    }

    // 诊断层：如果还是 0 个，输出 Body 的纯文本，看看网页到底返回了什么鬼东西
    if (songs.length === 0) {
      let bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      let bodyText = (bodyMatch ? bodyMatch[1] : html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      
      songs.push({ id: 'err1', name: `解析失败，未找到电台。Body文本如下:`, artist: { id: '', name: '诊断' } });
      songs.push({ id: 'err2', name: bodyText.substring(0, 50), artist: { id: '', name: '请截图' } });
      songs.push({ id: 'err3', name: bodyText.substring(50, 100), artist: { id: '', name: '请截图' } });
      songs.push({ id: 'err4', name: bodyText.substring(100, 150), artist: { id: '', name: '请截图' } });
    }

  } catch (err) {
    songs.push({ id: 'err_catch', name: `异常: ${err.message.substring(0, 50)}`, artist: { id: '', name: 'Error' }, ext: {} });
  }

  return jsonify({ list: songs });
}

// 播放源嗅探
async function getSongInfo(ext) {
  const { pageUrl } = safeExt(ext);
  
  if (pageUrl && pageUrl.match(/\.(m3u8|mp3|flv|aac|ts)/i)) {
    return jsonify({ urls: [pageUrl] });
  }

  if (pageUrl) {
    try {
      const html = await fetchHtml(pageUrl);
      let streamMatch = html.match(/<source[^>]+src=["']([^"']+)["']/i) 
                     || html.match(/<audio[^>]+src=["']([^"']+)["']/i) 
                     || html.match(/<video[^>]+src=["']([^"']+)["']/i)
                     || html.match(/(https?:\/\/[^"'\s<>]+?\.(?:m3u8|mp3|flv|aac|ts)(?:\?[^"'\s<>]*)?)/i)
                     || html.match(/(?:url|source|file|stream)\s*:\s*["'](https?:\/\/[^"']+)["']/i);

      if (streamMatch && streamMatch[1]) {
        let finalUrl = streamMatch[1];
        if (!finalUrl.startsWith('http')) finalUrl = `https://cooltv.top${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
        return jsonify({ urls: [finalUrl] });
      }
    } catch (e) {}
  }
  return jsonify({ urls: [] });
}
