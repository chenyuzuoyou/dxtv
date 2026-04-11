/*!
 * @name lanren
 * @description 懒人听书 插件版
 * @author AI
 * @key csp_lanren
 */
const $config = typeof $config_str !== 'undefined' ? argsify($config_str) : {};
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';
const headers = { 'User-Agent': UA, 'Referer': 'http://m.lrts.me/' };
const PAGE_LIMIT = 20;
const LR_SOURCE = 'lr';

const appConfig = {
  ver: 1, name: '懒人听书', tabLibrary: {
    name: '探索', groups: [
      { name: '玄幻武侠', type: 'album', showMore: true, ext: { kw: '玄幻' } },
      { name: '都市言情', type: 'album', showMore: true, ext: { kw: '言情' } }
    ]
  },
  tabSearch: { name: '搜索', groups: [{ name: '专辑', type: 'album' }, { name: '节目', type: 'song' }] }
};

function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}); }
function toHttps(url) { if (!url) return ''; let s = `${url}`; return s.replace(/^http:\/\//, 'https://'); }
async function fetchJson(url, extra = {}) { try { const { data } = await $fetch.get(url, { headers: { ...headers, ...extra } }); return safeArgs(data); } catch (e) { return {}; } }

function mapAlbum(item) {
  const id = `${item?.id ?? item?.bookId ?? ''}`;
  return {
    id, name: item?.name ?? item?.bookName ?? '未知', cover: toHttps(item?.cover ?? item?.bookCover ?? ''),
    artist: { id: `${item?.announcerId ?? ''}`, name: item?.announcer ?? '懒人主播' }, ext: { source: LR_SOURCE, id, type: 'album' }
  };
}

function mapTrack(item) {
  const id = `${item?.id ?? item?.sectionId ?? ''}`;
  return {
    id, name: item?.name ?? item?.sectionName ?? '未知章节', cover: '', duration: 0,
    artist: { id: 'lr', name: '懒人主播' }, ext: { source: LR_SOURCE, trackId: id, path: item?.path ?? '' }
  };
}

async function getConfig() { return jsonify(appConfig); }

async function getAlbums(ext) {
  const { page = 1, kw } = argsify(ext);
  const data = await fetchJson(`http://m.lrts.me/ajax/search?word=${encodeURIComponent(kw)}&type=book&page=${page}`);
  return jsonify({ list: (data?.list ?? []).map(mapAlbum) });
}

async function getSongs(ext) {
  const { id, page = 1 } = argsify(ext);
  const data = await fetchJson(`http://m.lrts.me/ajax/playlist/2/${id}/${page}`);
  return jsonify({ list: (data?.list ?? []).map(mapTrack) });
}

async function search(ext) {
  const { text, page = 1, type } = argsify(ext);
  const data = await fetchJson(`http://m.lrts.me/ajax/search?word=${encodeURIComponent(text)}&type=${type === 'album' ? 'book' : 'section'}&page=${page}`);
  return jsonify({ list: (data?.list ?? []).map(type === 'album' ? mapAlbum : mapTrack) });
}

async function getSongInfo(ext) {
  const { path } = argsify(ext);
  if (path) return jsonify({ urls: [toHttps(path)] });
  return jsonify({ urls: [] });
}
