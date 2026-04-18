/*!
 * @name cooltv
 * @description COOL Radio 诊断透视版
 * @version v1.0.4
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
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
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
    // 如果返回的已经是对象，说明被直接解析成 JSON 了
    if (typeof data === 'object') return JSON.stringify(data);
    return data;
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

  try {
    let html = await fetchHtml('https://cooltv.top/');
    
    // 基础拦截判断
    if (html.includes('Cloudflare') || html.includes('Just a moment') || html.includes('Attention Required')) {
      return jsonify({ list: [{ id: 'cf', name: '被Cloudflare防火墙拦截 (通常需浏览器验证)', artist: { id: '', name: '访问拒绝' } }] });
    }

    let allLinks = [];
    const aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = aRegex.exec(html)) !== null) {
      allLinks.push({ link: match[1], text: match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() });
    }

    let catUrl = null;
    for (let item of allLinks) {
      if (item.text.includes(categoryName) && item.text.includes('个电台')) {
        catUrl = item.link;
        break;
      }
    }

    let targetHtml = html;
    if (catUrl && !catUrl.startsWith('javascript')) {
      let fullCatUrl = catUrl.startsWith('http') ? catUrl : `https://cooltv.top${catUrl.startsWith('/') ? '' : '/'}${catUrl}`;
      targetHtml = await fetchHtml(fullCatUrl);
      
      allLinks = [];
      while ((match = aRegex.exec(targetHtml)) !== null) {
        allLinks.push({ link: match[1], text: match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() });
      }
    }

    let seen = new Set();
    for (let item of allLinks) {
      let name = item.text.replace(/📻|HQ|🎵|⭐|📺|✅/g, '').trim();
      let link = item.link;

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

    // 重点：透视诊断输出
    if (songs.length === 0) {
      // 把收到的网页源码里的换行符去掉，取最前面的字符
      let safeHtml = html.replace(/\s+/g, ' ').replace(/</g, '＜').replace(/>/g, '＞');
      
      songs.push({
        id: 'debug0', name: `[诊断] 链接数为 ${allLinks.length}，源码总长度: ${html.length}`, artist: { id: 'err', name: '请截图发我' }
      });
      songs.push({
        id: 'debug1', name: `源码A: ${safeHtml.substring(0, 50)}`, artist: { id: 'err', name: '请截图发我' }
      });
      songs.push({
        id: 'debug2', name: `源码B: ${safeHtml.substring(50, 100)}`, artist: { id: 'err', name: '请截图发我' }
      });
      songs.push({
        id: 'debug3', name: `源码C: ${safeHtml.substring(100, 150)}`, artist: { id: 'err', name: '请截图发我' }
      });
    }

  } catch (err) {
    songs.push({ id: 'err_catch', name: `脚本崩溃: ${err.message}`, artist: { id: '', name: 'Error' }, ext: {} });
  }

  return jsonify({ list: songs });
}

async function search(ext) { return jsonify({ list: [] }); }

async function getSongInfo(ext) {
  const { streamUrl, pageUrl } = safeExt(ext);
  if (streamUrl) return jsonify({ urls: [streamUrl] });

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
    } catch (e) {
      console.log("嗅探失败", e);
    }
  }
  return jsonify({ urls: [] });
}
