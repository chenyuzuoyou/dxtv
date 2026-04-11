/*!
 * @name qingting
 * @description 蜻蜓FM 插件版
 * @author AI
 * @key csp_qingting
 */
const $config = typeof $config_str !== 'undefined' ? argsify($config_str) : {};
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
const headers = { 'User-Agent': UA, 'Referer': 'https://m.qingting.fm/' };
const PAGE_LIMIT = 20;
const QT_SOURCE = 'qt';

const appConfig = {
  ver: 1, name: '蜻蜓FM', tabLibrary: {
    name: '探索', groups: [
      { name: '热门有声书', type: 'album', showMore: true, ext: { gid: 'tags', kw: '有声书' } },
      { name: '相声评书', type: 'album', showMore: true, ext: { gid: 'tags', kw: '相声评书' } }
    ]
  },
  tabSearch: { name: '搜索', groups: [{ name: '专辑', type: 'album' }, { name: '节目', type: 'song' }] }
};

function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}); }
function toHttps(url) { if (!url) return ''; let s = `${url}`; return s.startsWith('//') ? 'https:' + s : s.replace(/^http:\/\//, 'https://'); }
async function fetchJson(url, extra = {}) { try { const { data } = await $fetch.get(url, { headers: { ...headers, ...extra } }); return safeArgs(data); } catch (e) { return {}; } }

function mapAlbum(item) {
  const id = `${item?.id ?? ''}`;
  return {
    id, name: item?.title ?? item?.name ?? '未知专辑', cover: toHttps(item?.cover ?? item?.thumb ?? ''),
    artist: { id: `${item?.podcasters?.[0]?.id ?? ''}`, name: item?.podcasters?.[0]?.name ?? '蜻蜓FM' },
    ext: { source: QT_SOURCE, gid: 'album_tracks', id, type: 'album' }
  };
}

function mapTrack(item, albumId = '') {
  const trackId = `${item?.id ?? ''}`;
  return {
    id: trackId, name: item?.title ?? item?.name ?? '未知节目', cover: toHttps(item?.cover ?? ''), duration: parseInt(item?.duration ?? 0),
    artist: { id: 'qt', name: '主播' }, ext: { source: QT_SOURCE, trackId, file_path: item?.file_path ?? '' }
  };
}

async function getConfig() { return jsonify(appConfig); }

async function getAlbums(ext) {
  const { page = 1, kw } = argsify(ext);
  const data = await fetchJson(`https://i.qingting.fm/wapi/search?k=${encodeURIComponent(kw)}&page=${page}&pagesize=${PAGE_LIMIT}&include=channel_m`);
  return jsonify({ list: (data?.data?.data?.docs ?? []).map(mapAlbum) });
}

async function getSongs(ext) {
  const { id, page = 1 } = argsify(ext);
  const data = await fetchJson(`https://i.qingting.fm/wapi/channels/${id}/programs/page/${page}/pagesize/${PAGE_LIMIT}`);
  return jsonify({ list: (data?.data ?? []).map(e => mapTrack(e, id)) });
}

async function search(ext) {
  const { text, page = 1, type } = argsify(ext);
  const data = await fetchJson(`https://i.qingting.fm/wapi/search?k=${encodeURIComponent(text)}&page=${page}&pagesize=${PAGE_LIMIT}`);
  if (type === 'album') return jsonify({ list: (data?.data?.data?.docs ?? []).map(mapAlbum) });
  if (type === 'song') return jsonify({ list: (data?.data?.data?.docs ?? []).map(mapTrack) });
  return jsonify({});
}

async function getSongInfo(ext) {
  const { trackId, file_path } = argsify(ext);
  if (file_path) return jsonify({ urls: [`https://lcache.qingting.fm/cache/${file_path}`] });
  return jsonify({ urls: [] });
}
