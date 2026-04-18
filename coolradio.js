/*!
 * @name cooltv
 * @description COOL Radio 强力解析防空载版
 * @version v1.0.3
 * @author AI
 * @key csp_cooltv
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
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
  return { ...headers, 'Referer': 'https://cooltv.top/', 'Origin': 'https://cooltv.top', ...extra };
}

function safeExt(ext) {
  if (!ext) return {};
  if (typeof ext === 'object') return ext;
  try { return argsify(ext); } catch (e) { return {}; }
}

// 简单Hash函数，替代可能不支持的 Buffer
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
    return typeof data === 'string' ? data : JSON.stringify(data);
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

async function getConfig() {
  return jsonify(appConfig);
}

// 核心：暴力提取与自我诊断
async function getSongs(ext) {
  const { type = 'HQ' } = safeExt(ext);
  let categoryName = CATEGORIES[type] || '高清专区';
  let songs = [];

  try {
    // 1. 先拉取首页
    let html = await fetchHtml('https://cooltv.top/');
    
    // 诊断拦截
    if (html.startsWith('ERROR:')) {
      return jsonify({ list: [{ id: 'err', name: '网络请求失败，请检查代理或网络', artist: { id: '', name: html.substring(0, 30) } }] });
    }
    if (html.includes('Cloudflare') || html.includes('Just a moment')) {
      return jsonify({ list: [{ id: 'cf', name: '被站点安全防护(Cloudflare)拦截', artist: { id: '', name: '访问拒绝' } }] });
    }

    let targetHtml = html;
    let allLinks = [];
    const aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    // 获取首页所有链接
    while ((match = aRegex.exec(html)) !== null) {
      allLinks.push({ link: match[1], text: match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() });
    }

    // 2. 尝试寻找当前分类的专属页面（例如点击 Pop 跳转到 /category/pop）
    let catUrl = null;
    for (let item of allLinks) {
      if (item.text.includes(categoryName) && item.text.includes('个电台')) {
        catUrl = item.link;
        break;
      }
    }

    if (catUrl && !catUrl.startsWith('javascript')) {
      let fullCatUrl = catUrl.startsWith('http') ? catUrl : `https://cooltv.top${catUrl.startsWith('/') ? '' : '/'}${catUrl}`;
      targetHtml = await fetchHtml(fullCatUrl);
      
      // 重新提取分类页的链接
      allLinks = [];
      while ((match = aRegex.exec(targetHtml)) !== null) {
        allLinks.push({ link: match[1], text: match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() });
      }
    }

    // 3. 暴力清洗并提取电台
    let seen = new Set();
    for (let item of allLinks) {
      let name = item.text.replace(/📻|HQ|🎵|⭐|📺|✅/g, '').trim();
      let link = item.link;

      // 过滤掉无关导航和空链接
      if (name.length < 2 || name.length > 50) continue;
      if (/^(主页|分类|搜索|类型|地区|关于|提交|公告|最近播放|国家台|省份|类型)$/.test(name)) continue;
      if (name.includes('个电台')) continue; 
      if (link.length <= 1 || link.startsWith('#') || link.startsWith('javascript:')) continue;
      if (link.includes('/category/') || link.includes('/type/') || link.includes('/region/')) continue;

      if (!seen.has(name)) {
        seen.add(name);
        let fullPageUrl = link.startsWith('http') ? link : `https://cooltv.top${link.startsWith('/') ? '' : '/'}${link}`;
        
        songs.push({
          id: safeId(fullPageUrl),
          name: name,
          artist: { id: 'cooltv', name: categoryName, cover: '' },
          cover: 'https://cooltv.top/favicon.ico',
          ext: { pageUrl: fullPageUrl }
        });
      }
    }

    // 4. 极致兜底：如果 HTML 里连 a 标签都没有，盲抓 JSON
    if (songs.length === 0) {
      let blindJsonRegex = /"name"\s*:\s*"([^"]+)".*?"url"\s*:\s*"([^"]+)"/gi;
      let bMatch;
      while ((bMatch = blindJsonRegex.exec(targetHtml)) !== null) {
        if (!seen.has(bMatch[1])) {
          seen.add(bMatch[1]);
          songs.push({
            id: safeId(bMatch[2]), name: bMatch[1], artist: { id: 'ctv', name: 'JSON解析', cover: '' }, ext: { streamUrl: bMatch[2] }
          });
        }
      }
    }

    // 5. 诊断输出
    if (songs.length === 0) {
      songs.push({
        id: 'debug', 
        name: `[获取失败] 提取到 ${allLinks.length} 个锚点，无匹配条目`, 
        artist: { id: 'err', name: '网页结构不兼容', cover: '' },
        ext: {}
      });
    }

  } catch (err) {
    songs.push({ id: 'err_catch', name: `脚本崩溃: ${err.message}`, artist: { id: '', name: 'Error' }, ext: {} });
  }

  return jsonify({ list: songs });
}

// 占位模块
async function search(ext) { return jsonify({ list: [] }); }

// 核心：强力媒体源嗅探
async function getSongInfo(ext) {
  const { streamUrl, pageUrl } = safeExt(ext);
  if (streamUrl) return jsonify({ urls: [streamUrl] });

  if (pageUrl) {
    try {
      const html = await fetchHtml(pageUrl);
      
      // 嗅探 A: HTML5 标准标签
      let streamMatch = html.match(/<source[^>]+src=["']([^"']+)["']/i) 
                     || html.match(/<audio[^>]+src=["']([^"']+)["']/i) 
                     || html.match(/<video[^>]+src=["']([^"']+)["']/i);
      
      // 嗅探 B: 正则盲狙直链
      if (!streamMatch) {
        streamMatch = html.match(/(https?:\/\/[^"'\s<>]+?\.(?:m3u8|mp3|flv|aac|ts)(?:\?[^"'\s<>]*)?)/i);
      }
      
      // 嗅探 C: JS 配置项
      if (!streamMatch) {
        streamMatch = html.match(/(?:url|source|file|stream)\s*:\s*["'](https?:\/\/[^"']+)["']/i);
      }

      if (streamMatch && streamMatch[1]) {
        let finalUrl = streamMatch[1];
        if (!finalUrl.startsWith('http')) finalUrl = `https://cooltv.top${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
        return jsonify({ urls: [finalUrl] });
      }
    } catch (e) {
      console.log("嗅探失败", e);
    }
  }

  return jsonify({ urls: [] });
}
