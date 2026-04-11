/*!
 * @name fanqie
 * @description 番茄畅听 (防崩溃版)
 * @author AI
 * @key csp_fanqie
 */
const $config = typeof $config_str !== 'undefined' ? argsify($config_str) : {};
const headers = { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) AppleWebKit/605.1.15' };
const FQ_COMMON = 'aid=1967&device_platform=android&version_code=1000';

const appConfig = {
  ver: 1, name: '番茄畅听', 
  tabLibrary: {
    name: '探索', groups: [
      { name: '畅听热门', type: 'album', ui: 1, showMore: true, ext: { kw: '热门' } },
      { name: '男生频道', type: 'album', ui: 1, showMore: true, ext: { kw: '男生' } },
      { name: '女生频道', type: 'album', ui: 1, showMore: true, ext: { kw: '女生' } }
    ]
  },
  tabSearch: { name: '搜索', groups: [{ name: '专辑', type: 'album' }] }
}

function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}); }
function firstArray(...c) { for (const i of c) if (Array.isArray(i) && i.length > 0) return i; return []; }

async function fetchJson(url) {
  try { const { data } = await $fetch.get(url, { headers }); return safeArgs(data); } 
  catch (e) { return {}; }
}

async function getConfig() { return jsonify(appConfig); }

async function getAlbums(ext) {
  try {
    const { page = 1, kw = '热门' } = safeArgs(ext);
    const d = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/search/page/v/?query=${encodeURIComponent(kw)}&offset=${(page-1)*20}&limit=20&${FQ_COMMON}`);
    const list = firstArray(d?.data?.search_tabs?.[0]?.data, d?.data?.item_list);
    return jsonify({ list: list.map(e => ({ id: `${e.book_id}`, name: e.book_name, cover: e.thumb_url, artist: { name: e.author || '番茄' }, ext: { source: 'fq', id: `${e.book_id}`, type: 'album' } })) });
  } catch (e) { return jsonify({ list: [] }); }
}

async function getSongs(ext) {
  try {
    const { id, page = 1 } = safeArgs(ext);
    const d = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/directory/all_items/v/?book_id=${id}&offset=${(page-1)*20}&limit=20&${FQ_COMMON}`);
    const list = firstArray(d?.data?.item_list);
    return jsonify({ list: list.map(e => ({ id: `${e.item_id}`, name: e.title, artist: { name: '主播' }, ext: { source: 'fq', trackId: e.item_id, url: e.play_url } })) });
  } catch (e) { return jsonify({ list: [] }); }
}

async function search(ext) { return await getAlbums(ext); }

async function getSongInfo(ext) {
  try {
    const { url, trackId } = safeArgs(ext);
    if (url) return jsonify({ urls: [url] });
    const d = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/audio/info/v/?item_id=${trackId}&${FQ_COMMON}`);
    const audio = d?.data?.audio_info?.play_url || d?.data?.play_url;
    return jsonify({ urls: audio ? [audio] : [] });
  } catch (e) { return jsonify({ urls: [] }); }
}

async function getPlaylists(ext) { return jsonify({ list: [] }); }
async function getArtists(ext) { return jsonify({ list: [] }); }
