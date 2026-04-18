/*!
 * @name cooltv
 * @description COOL Radio 电台抓取脚本 (增强兼容版)
 * @version v1.0.1
 * @author AI
 * @key csp_cooltv
 */

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';
const headers = { 'User-Agent': UA };

// 对应网站的分类名称
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
    const { data } = await $fetch.get(url, { headers: withHeaders() });
    return typeof data === 'string' ? data : JSON.stringify(data);
  } catch (e) {
    console.log('请求失败：', url, e);
    return '';
  }
}

async function getConfig() {
  return jsonify(appConfig);
}

// 核心改动：使用双重解析策略保证列表输出
async function getSongs(ext) {
  const { type = 'HQ' } = safeExt(ext);
  let categoryName = CATEGORIES[type] || '高清专区';
  
  const html = await fetchHtml('https://cooltv.top/');
  let songs = [];
  
  // 策略 1: 尝试解析网页隐藏的 JSON 框架数据
  try {
    const jsonMatches = [
      /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
      /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/,
      /const\s+stations\s*=\s*(\[[\s\S]*?\]);/
    ];
    for (let reg of jsonMatches) {
      const match = html.match(reg);
      if (match) {
        const data = JSON.parse(match[1]);
        // 简单递归查找包含 url 或 m3u8 的数组
        let extracted = [];
        JSON.stringify(data, (key, value) => {
          if (Array.isArray(value) && value.length > 0 && (value[0].url || value[0].streamUrl || value[0].m3u8)) {
            extracted = value;
          }
          return value;
        });
        
        if (extracted.length > 0) {
           songs = extracted.map((s, i) => ({
             id: s.id || `rad_js_${i}`,
             name: s.name || s.title,
             cover: s.cover || s.logo || s.pic || '',
             artist: { id: 'ctv', name: s.category || categoryName, cover: '' },
             ext: { streamUrl: s.url || s.streamUrl || s.m3u8 || '' }
           })).filter(s => !s.category || s.category === categoryName);
        }
      }
    }
  } catch(e) {
    console.log("JSON 解析失败，转用 DOM 匹配");
  }

  // 策略 2: 暴力匹配 HTML 中的标签（如果策略 1 失败）
  if (songs.length === 0) {
    // 根据分类名称对整个 HTML 切块，防止抓到其他分类的电台
    // 用其他分类的名字作为结束锚点
    const otherCategories = Object.values(CATEGORIES).filter(c => c !== categoryName).join('|');
    const blockRegex = new RegExp(`${categoryName}[\\s\\S]*?(?=<h[1-6]|class="category|按地区浏览|${otherCategories})`, 'i');
    let blockMatch = html.match(blockRegex);
    let searchArea = blockMatch ? blockMatch[0] : html;

    // 匹配所有的 a 标签
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    let index = 0;
    
    while ((match = linkRegex.exec(searchArea)) !== null) {
        let link = match[1];
        // 去除 HTML 标签，只保留电台名称文本
        let text = match[2].replace(/<[^>]+>/g, '').trim();
        
        // 过滤掉无关导航（如主页、搜索、类型等）
        if (text && text.length > 1 && text.length < 30 && !link.includes('javascript:') && !link.startsWith('#') && !['主页', '分类', '搜索', '类型'].includes(text)) {
            
            // 判断链接本身是不是就是流媒体
            let isStream = /\.(m3u8|mp3|flv|aac|ts)($|\?)/i.test(link);
            
            // 组装播放页面的完整链接
            let fullPageUrl = link;
            if (!isStream && !link.startsWith('http')) {
                fullPageUrl = link.startsWith('/') ? `https://cooltv.top${link}` : `https://cooltv.top/${link}`;
            }

            songs.push({
                id: `rad_dom_${categoryName}_${index++}`,
                name: text,
                cover: '', 
                artist: { id: 'ctv', name: categoryName, cover: '' },
                ext: { 
                    streamUrl: isStream ? link : '',
                    pageUrl: !isStream ? fullPageUrl : ''
                }
            });
        }
    }
  }

  // 列表数据去重
  let uniqueSongs = [];
  let seen = new Set();
  for (let s of songs) {
      if (!seen.has(s.name)) {
          seen.add(s.name);
          uniqueSongs.push(s);
      }
  }

  // 兜底提示：如果该分类真的完全空了，给用户一个明确的指示条目
  if (uniqueSongs.length === 0) {
      uniqueSongs.push({
          id: 'error_empty',
          name: `[未解析到数据] - 请检查网站结构是否改变`,
          artist: { id: 'err', name: categoryName, cover: '' },
          ext: {}
      });
  }

  return jsonify({ list: uniqueSongs });
}

// 占位模块
async function search(ext) {
  return jsonify({ list: [] });
}

// 获取播放链接模块
async function getSongInfo(ext) {
  const { streamUrl, pageUrl } = safeExt(ext);
  
  // 如果在列表页已经抓取到了后缀为 m3u8 等的直链，直接返回
  if (streamUrl) {
    return jsonify({ urls: [streamUrl] });
  }

  // 否则进入该电台的播放页面，抓取里面的流媒体链接
  if (pageUrl) {
    try {
        const html = await fetchHtml(pageUrl);
        // 尝试匹配标准的流媒体播放链接
        const streamMatch = html.match(/(https?:\/\/[^\s"'<>]+\.(?:m3u8|mp3|flv|aac|ts)(?:\?[^\s"'<>]*)?)/i);
        if (streamMatch) {
            return jsonify({ urls: [streamMatch[1]] });
        }
        
        // 尝试匹配 source 或者 video/audio 标签里的 src
        const mediaMatch = html.match(/<(?:source|audio|video)[^>]+src="([^"]+)"/i);
        if (mediaMatch) {
             // 检查是否是相对路径
             let finalUrl = mediaMatch[1];
             if(!finalUrl.startsWith('http')) finalUrl = `https://cooltv.top${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
             return jsonify({ urls: [finalUrl] });
        }
    } catch (e) {
        console.log("详情页解析失败", e);
    }
  }

  return jsonify({ urls: [] });
}
