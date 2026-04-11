/*!
 * @name fanqie
 * @description 番茄畅听 修复版
 * @author AI
 * @key csp_fanqie
 */
const $config = typeof $config_str !== 'undefined' ? argsify($config_str) : {};
const headers = { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) AppleWebKit/605.1.15' };
const FQ_COMMON = 'aid=1967&device_platform=android&version_code=1000';

const appConfig = {
  ver: 1, name: '番茄畅听', tabLibrary: {
    name: '探索', groups: [{ name: '热门小说', type: 'album', ui: 1, showMore: true, ext: { kw: '热门' } }]
  },
  tabSearch: { name: '搜索', groups: [{ name: '专辑', type: 'album' }] }
}

async function fetchJson(url) { try { const { data } = await $fetch.get(url, { headers }); return typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return {}; } }

async function getConfig() { return jsonify(appConfig); }
async function getAlbums(ext) {
  const { page = 1, kw } = argsify(ext);
  const d = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/search/page/v/?query=${encodeURIComponent(kw)}&offset=${(page-1)*20}&limit=20&${FQ_COMMON}`);
  const list = d?.data?.search_tabs?.[0]?.data || [];
  return jsonify({ list: list.map(e => ({ id: `${e.book_id}`, name: e.book_name, cover: e.thumb_url, ext: { source: 'fq', id: `${e.book_id}`, type: 'album' } })) });
}
async function getSongs(ext) {
  const { id, page = 1 } = argsify(ext);
  const d = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/directory/all_items/v/?book_id=${id}&offset=${(page-1)*20}&limit=20&${FQ_COMMON}`);
  return jsonify({ list: (d?.data?.item_list || []).map(e => ({ id: `${e.item_id}`, name: e.title, ext: { source: 'fq', trackId: e.item_id, url: e.play_url } })) });
}
async function getSongInfo(ext) {
  const { url, trackId } = argsify(ext);
  if (url) return jsonify({ urls: [url] });
  const d = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/audio/info/v/?item_id=${trackId}&${FQ_COMMON}`);
  return jsonify({ urls: d?.data?.audio_info?.play_url ? [d.data.audio_info.play_url] : [] });
}
