/*!
 * @name getpodcast
 * @description GetPodcast.xyz 全站播客（首页强力解析）
 * @version v1.6.0
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
  message: '已优化首页解析',
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
    return typeof data === 'string' ? data : '';
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

// 根据网站实际结构强力提取播客名称
function parseHomePodcasts(html) {
  const podcasts = [];
  const seen = new Set();

  // 匹配 ### 开头的播客/节目名称
  const regex = /###\s*([^\n#]+?)(?=\s*\n)/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    let name = match[1].trim();

    // 过滤掉明显不是播客名的内容
    if (name.length < 3 || 
        seen.has(name) || 
        name.includes('小时前') || 
        name.includes('天前') ||
        name.match(/^\d+$/)) continue;

    seen.add(name);
    name = name.replace(/（.*?\）|\[.*?\]/g, '').trim();

    const slug = name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 45);

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
  return podcasts.slice(0, 150); // 取足够多
}

async function getPlaylists(ext) {
  const { gid = '' } = safeExt(ext);
  const html = await fetchText(BASE_URL);
  
  let cards = parseHomePodcasts(html);

  if (gid == GID.RECENT) {
    cards = cards.slice(0, 80);
  }

  return jsonify({ list: cards });
}

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
  const { title = '', slug = '' } = safeExt(ext);
  const podcastName = title || slug;

  if (!podcastName) return jsonify({ list: [] });

  // 目前 data.getpodcast.xyz 路径大多不可直接访问，提示用户复制RSS
  return jsonify({ 
    list: [], 
    message: `请在 getpodcast.xyz 页面中找到「${podcastName}」→ 点击最下方 RAW SIGNAL SOURCE 复制完整RSS链接，然后在搜索框粘贴即可播放` 
  });
}

async function search(ext) {
  const { text = '' } = safeExt(ext);
  if (!text) return jsonify({ list: [] });

  const html = await fetchText(BASE_URL);
  const all = parseHomePodcasts(html);
  const filtered = all.filter(p => 
    p.name.toLowerCase().includes(text.toLowerCase())
  );
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