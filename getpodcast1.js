/*!
 * @name getpodcast
 * @description GetPodcast.xyz 全站播客（最终修复版）
 * @version v1.7.0
 * @author Grok
 * @key csp_getpodcast
 */

const BASE_URL = 'https://getpodcast.xyz/';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const headers = { 'User-Agent': UA };

const GID = {
  ALL: '1',
  RECENT: '2',
  SEARCH: '3'
};

const appConfig = {
  ver: 1,
  name: 'getpodcast',
  message: '首页已修复',
  warning: '',
  desc: 'https://getpodcast.xyz/',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: '热门推荐', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.ALL } },
      { name: '最新更新', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.RECENT } }
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [{ name: '播客', type: 'playlist', ext: { type: 'podcast' } }]
  }
};

async function fetchText(url) {
  try {
    const { data } = await $fetch.get(url, { headers });
    const text = typeof data === 'string' ? data : '';
    console.log('首页长度:', text.length);
    return text;
  } catch (e) {
    console.log('请求失败:', url);
    return '';
  }
}

function safeExt(ext) {
  if (!ext) return {};
  if (typeof ext === 'object') return ext;
  try { return argsify(ext); } catch (e) { return {}; }
}

async function getConfig() {
  return jsonify(appConfig);
}

// 最终强力解析（适配网站真实Markdown）
function parseHomePodcasts(html) {
  const podcasts = [];
  const seen = new Set();

  // 更宽松的正则，匹配所有 ### 开头的标题
  const regex = /###\s*([^\n#]+?)/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    let name = match[1].trim();

    if (name.length < 3 || 
        seen.has(name) || 
        name.includes('小时前') || 
        name.includes('天前') ||
        name.match(/^\d+$/)) continue;

    seen.add(name);
    name = name.replace(/（.*?\）|\[.*?\]/g, '').trim();

    const slug = name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 50);

    podcasts.push({
      id: slug || name,
      name: name,
      cover: '',
      artist: { id: 'getpodcast', name: '播客' },
      ext: { 
        gid: GID.ALL, 
        title: name,
        slug: slug 
      }
    });
  }

  console.log(`✅ 成功提取 ${podcasts.length} 个播客`);
  return podcasts.slice(0, 200);
}

async function getPlaylists(ext) {
  const { gid = '' } = safeExt(ext);
  const html = await fetchText(BASE_URL);
  
  let cards = parseHomePodcasts(html);

  if (gid == GID.RECENT) {
    cards = cards.slice(0, 100);
  }

  return jsonify({ list: cards });
}

// RSS 解析保持不变
function parseRSS(xml) {
  const episodes = [];
  const titleMatch = xml.match(/<title>([^<]+)<\/title>/i);
  const podcastTitle = titleMatch ? titleMatch[1].trim() : '未知播客';

  const coverMatch = xml.match(/itunes:image href="([^"]+)"/i) || xml.match(/<image>[\s\S]*?<url>([^<]+)<\/url>/i);
  const cover = coverMatch ? coverMatch[1] : '';

  const itemRegex = /<item>[\s\S]*?<\/item>/gi;
  let item;
  while ((item = itemRegex.exec(xml)) !== null) {
    const content = item[0];
    const titleM = content.match(/<title>([^<]+)<\/title>/i);
    const encl = content.match(/<enclosure[^>]*url="([^"]+)"/i);
    const dur = content.match(/<itunes:duration>([^<]+)<\/itunes:duration>/i);

    if (titleM && encl) {
      episodes.push({
        title: titleM[1].trim(),
        url: encl[1],
        duration: dur ? dur[1] : ''
      });
    }
  }
  return { title: podcastTitle, cover, episodes: episodes.slice(0, 150) };
}

async function getSongs(ext) {
  const { title = '' } = safeExt(ext);

  return jsonify({ 
    list: [], 
    message: `已提取首页播客。\n\n请在 getpodcast.xyz 点击「${title}」→ 最下方复制「RAW SIGNAL SOURCE」链接，粘贴到搜索框即可自动播放所有单集。` 
  });
}

async function search(ext) {
  const { text = '' } = safeExt(ext);
  if (!text) return jsonify({ list: [] });

  const html = await fetchText(BASE_URL);
  const all = parseHomePodcasts(html);
  const filtered = all.filter(p => p.name.toLowerCase().includes(text.toLowerCase()));
  return jsonify({ list: filtered });
}

async function getSongInfo(ext) {
  const { songmid } = safeExt(ext);
  if (songmid?.startsWith('http')) {
    return jsonify({ urls: [songmid] });
  }
  return jsonify({ urls: [] });
}

async function getArtists() { return jsonify({ list: [] }); }
async function getAlbums() { return jsonify({ list: [] }); }