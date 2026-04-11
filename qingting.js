/*!
 * @name qingting
 * @description 蜻蜓FM 插件版 (修复探索页加载)
 * @author AI.1
 * @key csp_qingting
 */
const $config = typeof $config_str !== 'undefined' ? argsify($config_str) : {};
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
const headers = { 'User-Agent': UA, 'Referer': 'https://m.qingting.fm/' };
const PAGE_LIMIT = 20;

const appConfig = {
  ver: 1, name: '蜻蜓FM', tabLibrary: {
    name: '探索', groups: [
      { name: '有声书', type: 'album', ui: 1, showMore: true, ext: { kw: '有声书' } },
      { name: '相声评书', type: 'album', ui: 1, showMore: true, ext: { kw: '相声评书' } },
      { name: '历史', type: 'album', ui: 1, showMore: true, ext: { kw: '历史' } }
    ]
  },
  tabSearch: { name: '搜索', groups: [{ name: '专辑', type: 'album' }, { name: '节目', type: 'song' }] }
};

function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}); }
function toHttps(url) { if (!url) return ''; let s = `${url}`; return s.startsWith('//') ? 'https:' + s : s.replace(/^http:\/\//, 'https://'); }
function firstArray(...c) { for (const i of c) if (Array.isArray(i) && i.length > 0) return i; return []; }
async function fetchJson(url) { try { const { data } = await $fetch.get(url, { headers }); return typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return {}; } }

function mapAlbum(item) {
  const id = `${item?.id ?? ''}`;
  return { id, name: item?.title ?? item?.name ?? '未知专辑', cover: toHttps(item?.cover ?? item?.thumb ?? ''), artist: { id: 'qt', name: item?.podcasters?.[0]?.name ?? '蜻蜓FM' }, ext: { source: 'qt', id, type: 'album' } };
}
function mapTrack(item) {
  const id = `${item?.id ?? ''}`;
  return { id, name: item?.title ?? item?.name ?? '未知节目', cover: toHttps(item?.cover ?? ''), duration: parseInt(item?.duration ?? 0), artist: { id: 'qt', name: '主播' }, ext: { source: 'qt', trackId: id, file_path: item?.file_path ?? '' } };
}

async function getConfig() { return jsonify(appConfig); }

async function getAlbums(ext) {
  try {
    const { page = 1, kw } = safeArgs(ext);
    const data = await fetchJson(`https://i.qingting.fm/wapi/search?k=${encodeURIComponent(kw)}&page=${page}&pagesize=${PAGE_LIMIT}`);
    const list = firstArray(data?.data?.data?.docs, data?.data?.docs, data?.docs);
    return jsonify({ list: list.map(mapAlbum) });
  } catch(e) { return jsonify({ list: [] }); }
}

async function getSongs(ext) {
  try {
    const { id, page = 1 } = safeArgs(ext);
    const data = await fetchJson(`https://i.qingting.fm/wapi/channels/${id}/programs/page/${page}/pagesize/${PAGE_LIMIT}`);
    return jsonify({ list: firstArray(data?.data).map(mapTrack) });
  } catch(e) { return jsonify({ list: [] }); }
}

async function search(ext) {
  const { text, page = 1, type } = safeArgs(ext);
  const data = await fetchJson(`https://i.qingting.fm/wapi/search?k=${encodeURIComponent(text)}&page=${page}&pagesize=${PAGE_LIMIT}`);
  const list = firstArray(data?.data?.data?.docs, data?.data?.docs, data?.docs);
  return jsonify({ list: list.map(type === 'album' ? mapAlbum : mapTrack) });
}

async function getSongInfo(ext) {
  const { file_path } = safeArgs(ext);
  return jsonify({ urls: file_path ? [`https://lcache.qingting.fm/cache/${file_path}`] : [] });
}
