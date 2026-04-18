/*!
 * @name cooltv
 * @description COOL Radio 动态自适应抓取脚本
 * @version v1.0.2
 * @author AI
 * @key csp_cooltv
 */

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';
const headers = { 'User-Agent': UA };

// 映射分类名称（必须与网站上显示的分类文字尽量吻合）
const CATEGORIES = {
  HQ: '高清专区',
  Pop: 'Pop',
  CPop: 'C-Pop',
  JPop: 'J-Pop',
  KPop: 'K-Pop',
  News: 'News',
  Music: '音乐',
  Comprehensive: '综合',
  Traffic: '交通',
  Net: '网络',
  TVAudio: '电视伴音',
  TV: '电视',
  Thai: '泰语流行',
  Alternative: 'Alternative',
  Chill: 'Chill',
  Country: 'Country',
  EDM: 'EDM',
  Gold: 'Gold',
  Kids: 'Kids',
  Rock: 'Rock'
};

const appConfig = {
  ver: 1,
  name: 'cooltv',
  message: '欢迎使用COOL Radio插件',
  warning: '',
  desc: '提供高质量的全球电台与电视频道伴音',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: '高清专区', type: 'song', ui: 0, showMore: false, ext: { type: 'HQ' } },
      { name: 'C-Pop', type: 'song', ui: 0, showMore: false, ext: { type: 'CPop' } },
      { name: 'Pop', type: 'song', ui: 0, showMore: false, ext: { type: 'Pop' } },
      { name: 'J-Pop', type: 'song', ui: 0, showMore: false, ext: { type: 'JPop' } },
      { name: 'K-Pop', type: 'song', ui: 0, showMore: false, ext: { type: 'KPop' } },
      { name: 'News', type: 'song', ui: 0, showMore: false, ext: { type: 'News' } },
      { name: '音乐', type: 'song', ui: 0, showMore: false, ext: { type: 'Music' } },
      { name: '综合', type: 'song', ui: 0, showMore: false, ext: { type: 'Comprehensive' } },
      { name: '交通', type: 'song', ui: 0, showMore: false, ext: { type: 'Traffic' } },
      { name: '网络', type: 'song', ui: 0, showMore: false, ext: { type: 'Net' } },
      { name: '电视伴音', type: 'song', ui: 0, showMore: false, ext: { type: 'TVAudio' } },
      { name: 'Chill', type: 'song', ui: 0, showMore: false, ext: { type: 'Chill' } },
      { name: 'EDM', type: 'song', ui: 0, showMore: false, ext: { type: 'EDM' } },
      { name: 'Rock', type: 'song', ui: 0, showMore: false, ext: { type: 'Rock' } }
    ]
  },
  tabMe: { name: '我的', groups: [] },
  tabSearch: { name: '搜索', groups: [{ name: '电台', type: 'song', ext: { type: 'radio' } }] }
};

function withHeaders(extra = {}) {
  return {
    ...headers,
    'Referer': 'https://cooltv.top/',
    'Origin': 'https://cooltv.top',
    ...extra,
  };
}

function safeExt(ext) {
  if (!ext) return {};
  if (typeof ext === 'object') return ext;
  try { return argsify(ext); } catch (e) { return {}; }
}

async function fetchHtml(url) {
  try {
    const res = await $fetch.get(url, { headers: withHeaders() });
    const data = res.data || res;
    return typeof data === 'string' ? data : JSON.stringify(data);
  } catch (e) {
    console.log('网络请求失败：', url, e);
    return '';
  }
}

async function getConfig() {
  return jsonify(appConfig);
}

// 核心自适应列表抓取模块
async function getSongs(ext) {
  const { type = 'HQ' } = safeExt(ext);
  let categoryName = CATEGORIES[type] || '高清专区';
  
  // 1. 获取主页 HTML
  let html = await fetchHtml('https://cooltv.top/');
  let targetHtml = html;
  
  // 2. 提取页面上所有的 <a> 标签
  const aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let allLinks = [];
  let match;
  while ((match = aRegex.exec(html)) !== null) {
      allLinks.push({ 
          link: match[1], 
          text: match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() 
      });
  }

  // 3. 智能寻找分类页面的链接（比如寻找 "Pop 23 个电台" 这样的入口）
  let catUrl = null;
  for (let item of allLinks) {
      if (item.text.includes(categoryName) && item.text.includes('电台')) {
          catUrl = item.link;
          break;
      }
  }
  if (!catUrl) {
      for (let item of allLinks) {
          if (item.text === categoryName) {
              catUrl = item.link;
              break;
          }
      }
  }

  // 4. 如果找到了专属分类页面，就跳转过去拉取新页面的 HTML
  if (catUrl && catUrl !== '/' && !catUrl.startsWith('#')) {
      let fullCatUrl = catUrl.startsWith('http') ? catUrl : `https://cooltv.top${catUrl.startsWith('/') ? '' : '/'}${catUrl}`;
      targetHtml = await fetchHtml(fullCatUrl);
      
      // 重新从分类页提取标签
      allLinks = [];
      let tm;
      while ((tm = aRegex.exec(targetHtml)) !== null) {
          allLinks.push({ 
              link: tm[1], 
              text: tm[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() 
          });
      }
  }

  // 5. 遍历链接，智能清洗并提取真正的电台条目
  let songs = [];
  let seen = new Set();
  
  for (let item of allLinks) {
      // 过滤干扰符（Emoji、HQ标记等）
      let name = item.text.replace(/📻|HQ|🎵|⭐|📺|✅/g, '').trim();
      let link = item.link;
      
      // 黑名单过滤：排除导航栏、控制台等无关链接
      if (name.length < 2 || name.length > 40) continue;
      if (/^(主页|分类|搜索|类型|地区|关于|提交|公告|最近播放|国家台|省份)$/.test(name)) continue;
      if (/\d+\s*个电台/.test(name)) continue; // 排除分类聚合本身的文字
      if (link === '/' || link.startsWith('#') || link.startsWith('javascript:')) continue;
      
      // 组装结果
      if (!seen.has(link) && !seen.has(name)) {
          seen.add(link);
          seen.add(name);
          
          let isStream = /\.(m3u8|mp3|flv|aac|ts)($|\?)/i.test(link);
          let fullPageUrl = link.startsWith('http') ? link : `https://cooltv.top${link.startsWith('/') ? '' : '/'}${link}`;

          songs.push({
              id: `ctv_${Buffer.from(link).toString('base64').slice(0, 10)}`, // 简单生成个唯一ID
              name: name,
              artist: { id: 'cooltv', name: categoryName, cover: '' },
              cover: 'https://cooltv.top/favicon.ico', 
              ext: {
                  streamUrl: isStream ? fullPageUrl : '',
                  pageUrl: !isStream ? fullPageUrl : ''
              }
          });
      }
  }

  // 兜底保护提示
  if (songs.length === 0) {
      songs.push({
          id: 'error_empty',
          name: `[未解析到数据] 尝试刷新或检查网络`,
          artist: { id: 'err', name: categoryName, cover: '' },
          ext: {}
      });
  }

  return jsonify({ list: songs });
}

// 占位搜索
async function search(ext) {
  return jsonify({ list: [] });
}

// 核心播放嗅探模块
async function getSongInfo(ext) {
  const { streamUrl, pageUrl } = safeExt(ext);
  
  // 情况 1: 如果直接拿到了 .m3u8 等直链，直接播放
  if (streamUrl) {
    return jsonify({ urls: [streamUrl] });
  }

  // 情况 2: 如果拿到的是电台播放详情页，进入该页嗅探媒体源
  if (pageUrl) {
    try {
        const html = await fetchHtml(pageUrl);
        
        // 嗅探 A: HTML 中明文的媒体直链
        const streamMatch = html.match(/(https?:\/\/[^"'\s<>]+\.(?:m3u8|mp3|flv|aac|ts)(?:\?[^"'\s<>]*)?)/i);
        if (streamMatch) return jsonify({ urls: [streamMatch[1]] });
        
        // 嗅探 B: HTML 播放器标签里的 src
        const mediaMatch = html.match(/<(?:source|audio|video)[^>]+src=["']([^"']+)["']/i);
        if (mediaMatch) {
             let finalUrl = mediaMatch[1];
             if(!finalUrl.startsWith('http')) finalUrl = `https://cooltv.top${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
             return jsonify({ urls: [finalUrl] });
        }

        // 嗅探 C: JS 配置对象中隐式挂载的 URL
        const configMatch = html.match(/(?:url|stream|source|file)["']?\s*:\s*["'](https?:\/\/[^"']+)["']/i);
        if (configMatch) return jsonify({ urls: [configMatch[1]] });

    } catch (e) {
        console.log("详情页流媒体解析失败", e);
    }
  }

  return jsonify({ urls: [] });
}
