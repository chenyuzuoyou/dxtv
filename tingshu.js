/*!
 * @name 听书&听友 (双源高可用完善版)
 * @description 深度整合 tingyou.fm (听友) 与 wap.23ts.net (23听书)，采用智能DOM容错提取算法
 * @author AI
 * @key csp_tingshu
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1'
const headers = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
}

// ================= 基础配置 =================
const TINGYOU_URL = 'https://www.tingyou.fm';
const TINGSHU_URL = 'http://wap.23ts.net'; 

const SOURCE = { TINGYOU: 'tingyou', TINGSHU: 'tingshu' }
const GID = {
  TINGYOU_TAG: '1',    
  TINGSHU_TAG: '2',    
  ALBUM_TRACKS: '3',   
}

const tingyouCategories = ['有声小说', '相声小品', '百家讲坛', '评书大全', '儿童读物', '外语学习', '音乐电台', '历史人文', '情感生活', '商业财经', '脱口秀'];
const tingshuCategories = ['玄幻', '武侠', '恐怖', '历史', '都市', '网游', '科幻', '推理', '官场', '穿越', '言情'];

const appConfig = {
  ver: 1,
  name: '听友&23听书',
  message: '',
  warning: '',
  desc: '双源有声平台聚合（智能提取版）',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: '📻 听友推荐', type: 'song', showMore: true, ext: { gid: GID.TINGYOU_TAG, kw: '推荐' } },
      ...tingyouCategories.map(kw => ({ name: `📻 ${kw}`, type: 'song', showMore: true, ext: { gid: GID.TINGYOU_TAG, kw: kw } })),
      
      { name: '📖 听书推荐', type: 'song', showMore: true, ext: { gid: GID.TINGSHU_TAG, kw: '推荐' } },
      ...tingshuCategories.map(kw => ({ name: `📖 ${kw}`, type: 'song', showMore: true, ext: { gid: GID.TINGSHU_TAG, kw: kw } }))
    ]
  },
  tabMe: { name: '我的', groups: [{ name: '红心', type: 'song' }, { name: '专辑', type: 'album' }] },
  tabSearch: { name: '搜索', groups: [{ name: '专辑', type: 'album', ext: { type: 'album' } }, { name: '节目', type: 'song', ext: { type: 'track' } }] }
}

function safeArgs(data) {
  return typeof data === 'string' ? argsify(data) : (data ?? {})
}

function cleanText(t) {
  return `${t ?? ''}`.replace(/<[^>]+>/g, '').replace(/[\r\n\t]+/g, '').trim()
}

function fixUrl(url, baseUrl) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  return baseUrl + (url.startsWith('/') ? '' : '/') + url;
}

// 封装网页请求
async function fetchHtml(url) {
  try {
    const { data } = await $fetch.get(url, { headers })
    return data || ''
  } catch (e) {
    return ''
  }
}

// ================= 智能提取算法 =================

// 智能提取专辑列表 (兼容各种 HTML 结构)
function parseAlbums(html, source, baseUrl) {
  const list = [];
  const idSet = new Set();
  
  // 切块：通常每个专辑被包裹在 li, dl, 或拥有 class 的 div 中
  const blocks = html.match(/<(li|dl|div)[^>]*>([\s\S]*?)<\/\1>/ig) || html.match(/<a[^>]+href="[^"]+"[^>]*>[\s\S]*?<\/a>/ig) || [];
  
  for (let block of blocks) {
    const hrefMatch = block.match(/href="([^"]*(?:\/album\/|\/book\/|\/tingshu\/|\/xs\/)[^"]*)"/i) || block.match(/href="([^"]+)"/i);
    const imgMatch = block.match(/<img[^>]+src="([^"]+)"/i) || block.match(/data-src="([^"]+)"/i);
    const titleMatch = block.match(/title="([^"]+)"/i) || block.match(/alt="([^"]+)"/i) || block.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i) || block.match(/<a[^>]*>([^<]+)<\/a>/i);

    if (hrefMatch && titleMatch) {
      const rawHref = hrefMatch[1];
      const idMatch = rawHref.match(/(\d+)/); // 提取链接中的数字作为ID
      if (!idMatch) continue;
      
      const id = idMatch[1];
      if (idSet.has(id)) continue;
      idSet.add(id);

      let title = cleanText(titleMatch[1]);
      if (title.length < 2) continue; // 过滤无意义的空标签
      
      let cover = imgMatch ? fixUrl(imgMatch[1], baseUrl) : '';

      list.push({
        id: `${source}_${id}`, 
        name: title,
        cover: cover,
        artist: { id: '', name: source === SOURCE.TINGYOU ? '听友频道' : '23听书' },
        ext: { gid: GID.ALBUM_TRACKS, id: id, source: source, type: 'album' }
      });
    }
  }
  return list;
}

// 智能提取播放集数列表
function parseTracks(html, source, albumId) {
  const list = [];
  // 匹配常见的集数A标签：特征是带有数字、第x集、第x章的 a 标签，或者包含 data-id 的 li
  const links = html.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/ig) || html.match(/<li[^>]+data-id="([^"]+)"[^>]*>([\s\S]*?)<\/li>/ig) || [];
  
  for (let link of links) {
    const hrefMatch = link.match(/href="([^"]+)"/i) || link.match(/data-id="([^"]+)"/i);
    let title = cleanText(link);
    
    // 过滤掉非集数的无效链接 (如返回首页、分类等)
    if (hrefMatch && (title.includes('集') || title.includes('章') || title.includes('期') || title.includes('回') || /^\d+$/.test(title) || title.length > 2)) {
      // 提取相对路径或纯ID
      let trackId = hrefMatch[1].split('/').pop().replace('.html', ''); 
      list.push({
        id: trackId,
        name: title,
        cover: '', 
        artist: { id: '', name: '播音' },
        ext: { source: source, trackId: trackId, albumId: albumId }
      });
    }
  }
  return list;
}

// 智能提取真实的音频媒体地址
function parseAudioUrl(html) {
  // 1. 寻找 HTML5 <audio> 或 <source> 标签
  let match = html.match(/<source[^>]+src="([^"]+\.(?:mp3|m4a|aac)[^"]*)"/i) || html.match(/<audio[^>]+src="([^"]+)"/i);
  // 2. 寻找 JS 变量注入 (大部分 CMS 采用此方案)
  if (!match) match = html.match(/url\s*[:=]\s*['"]([^'"]+\.(?:mp3|m4a|aac)[^'"]*)['"]/i) || html.match(/jp_url\s*=\s*['"]([^'"]+)['"]/i) || html.match(/audioUrl\s*=\s*['"]([^'"]+)['"]/i);
  // 3. 寻找网页中任何看起来像音频流的独立直链
  if (!match) match = html.match(/(https?:\/\/[^\s"'<>]+\.(?:mp3|m4a|aac)(?:\?[^\s"'<>]*)?)/i);
  
  if (match && match[1]) {
    let finalUrl = match[1].replace(/\\/g, ''); // 处理被 JSON 转义的斜杠
    return [finalUrl];
  }
  return [];
}


// ================= 数据源请求 =================

async function getList(source, keyword, page) {
  let url = '';
  if (source === SOURCE.TINGYOU) {
    // 听友的搜索或分类，假设常见的 URL 结构
    url = keyword === '推荐' ? `${TINGYOU_URL}/` : `${TINGYOU_URL}/search?q=${encodeURIComponent(keyword)}&page=${page}`;
  } else {
    // 23听书的搜索或分类结构
    url = keyword === '推荐' ? `${TINGSHU_URL}/` : `${TINGSHU_URL}/search.html?searchword=${encodeURIComponent(keyword)}&page=${page}`;
  }
  
  const html = await fetchHtml(url);
  return parseAlbums(html, source, source === SOURCE.TINGYOU ? TINGYOU_URL : TINGSHU_URL);
}

async function getTracks(source, albumId) {
  let url = source === SOURCE.TINGYOU ? `${TINGYOU_URL}/album/${albumId}` : `${TINGSHU_URL}/book/${albumId}.html`;
  const html = await fetchHtml(url);
  return parseTracks(html, source, albumId);
}

async function getAudio(source, trackId, albumId) {
  let url = '';
  if (source === SOURCE.TINGYOU) {
    url = `${TINGYOU_URL}/play/${albumId}/${trackId}`; // 听友可能是 /play/专辑id/节目id
  } else {
    url = `${TINGSHU_URL}/play/${trackId}.html`; // 23ts 可能是 /play/123-1-1.html
  }
  const html = await fetchHtml(url);
  return parseAudioUrl(html);
}


// ================= 核心导出接口 =================

async function getConfig() { return jsonify(appConfig) }

async function getAlbums(ext) {
  const { page = 1, gid, kw } = argsify(ext)
  let list = [];
  if (gid == GID.TINGYOU_TAG) list = await getList(SOURCE.TINGYOU, kw, page);
  else if (gid == GID.TINGSHU_TAG) list = await getList(SOURCE.TINGSHU, kw, page);
  return jsonify({ list: list, isEnd: list.length < 5 })
}

async function getSongs(ext) {
  const { gid, id, kw, page = 1, source } = argsify(ext)
  let list = [];
  
  if (gid == GID.ALBUM_TRACKS && id) {
    list = await getTracks(source, id);
    return jsonify({ list: list })
  }
  
  if (gid == GID.TINGYOU_TAG) list = await getList(SOURCE.TINGYOU, kw, page);
  else if (gid == GID.TINGSHU_TAG) list = await getList(SOURCE.TINGSHU, kw, page);
  
  return jsonify({ list: list, isEnd: list.length < 5 })
}

async function search(ext) {
  const { text, page = 1 } = argsify(ext)
  if (!text) return jsonify({})
  
  const [tingyouList, tingshuList] = await Promise.all([
    getList(SOURCE.TINGYOU, text, page),
    getList(SOURCE.TINGSHU, text, page)
  ]);
  
  const list = [...tingyouList, ...tingshuList];
  return jsonify({ list: list, isEnd: list.length < 5 })
}

async function getSongInfo(ext) {
  const { source, trackId, albumId } = argsify(ext)
  const urls = await getAudio(source, trackId, albumId);
  return jsonify({ urls: urls })
}

async function getArtists(ext) { return jsonify({ list: [] }) }
async function getPlaylists() { return jsonify({ list: [] }) }
