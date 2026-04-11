/*!
 * @name lanren
 * @description 懒人极速版/懒人听书 (修复探索页)
 * @author AI1
 * @key csp_lanren
 */
const $config = typeof $config_str !== 'undefined' ? argsify($config_str) : {};
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
const headers = { 'User-Agent': UA, 'Referer': 'https://m.lrts.me/' };

const appConfig = {
  ver: 1, name: '懒人听书', tabLibrary: {
    name: '探索', groups: [
      { name: '玄幻武侠', type: 'album', ui: 1, showMore: true, ext: { kw: '玄幻' } },
      { name: '都市言情', type: 'album', ui: 1, showMore: true, ext: { kw: '言情' } },
      { name: '悬疑恐怖', type: 'album', ui: 1, showMore: true, ext: { kw: '悬疑' } }
    ]
  },
  tabSearch: { name: '搜索', groups: [{ name: '专辑', type: 'album' }] }
};

function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}); }
function toHttps(url) { if (!url) return ''; let s = `${url}`; return s.replace(/^http:\/\//, 'https://'); }
function firstArray(...c) { for (const i of c) if (Array.isArray(i) && i.length > 0) return i; return []; }
async function fetchJson(url) { try { const { data } = await $fetch.get(url, { headers }); return typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return {}; } }

function mapAlbum(item) {
  const id = `${item?.id ?? item?.bookId ?? ''}`;
  return { id, name: item?.name ?? item?.bookName ?? '未知', cover: toHttps(item?.cover ?? item?.bookCover ?? ''), artist: { id: 'lr', name: item?.announcer ?? '懒人主播' }, ext: { source: 'lr', id, type: 'album' } };
}
function mapTrack(item) {
  const id = `${item?.id ?? item?.sectionId ?? ''}`;
  return { id, name: item?.name ?? item?.sectionName ?? '未知章节', cover: '', duration: 0, artist: { id: 'lr', name: '主播' }, ext: { source: 'lr', trackId: id, path: item?.path ?? '' } };
}

async function getConfig() { return jsonify(appConfig); }

async function getAlbums(ext) {
  try {
    const { page = 1, kw } = safeArgs(ext);
    const data = await fetchJson(`https://m.lrts.me/ajax/search?word=${encodeURIComponent(kw)}&type=book&page=${page}`);
    const list = firstArray(data?.data?.list, data?.list);
    return jsonify({ list: list.map(mapAlbum) });
  } catch(e) { return jsonify({ list: [] }); }
}

async function getSongs(ext) {
  try {
    const { id, page = 1 } = safeArgs(ext);
    const data = await fetchJson(`https://m.lrts.me/ajax/playlist/2/${id}/${page}`);
    return jsonify({ list: firstArray(data?.data?.list, data?.list).map(mapTrack) });
  } catch(e) { return jsonify({ list: [] }); }
}

async function search(ext) { return await getAlbums(ext); }
async function getSongInfo(ext) {
  const { path } = safeArgs(ext);
  return jsonify({ urls: path ? [toHttps(path)] : [] });
}
