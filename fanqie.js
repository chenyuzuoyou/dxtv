/*!
 * @name fanqie
 * @description 番茄畅听 (修复探索页)
 * @author AI1
 * @key csp_fanqie
 */
const $config = typeof $config_str !== 'undefined' ? argsify($config_str) : {};
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) AppleWebKit/605.1.15 Mobile/15E148';
const headers = { 'User-Agent': UA };

const appConfig = {
  ver: 1, name: '番茄畅听', tabLibrary: {
    name: '探索', groups: [
      { name: '男生热门', type: 'album', ui: 1, showMore: true, ext: { kw: '男生' } },
      { name: '女生热门', type: 'album', ui: 1, showMore: true, ext: { kw: '女生' } }
    ]
  },
  tabSearch: { name: '搜索', groups: [{ name: '专辑', type: 'album' }] }
};

function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}); }
function firstArray(...c) { for (const i of c) if (Array.isArray(i) && i.length > 0) return i; return []; }
async function fetchJson(url) { try { const { data } = await $fetch.get(url, { headers }); return typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return {}; } }

function mapAlbum(item) {
  const id = `${item?.book_id ?? item?.id ?? ''}`;
  return { id, name: item?.book_name ?? item?.title ?? '未知', cover: item?.thumb_url ?? '', artist: { id: 'fq', name: item?.author ?? '番茄' }, ext: { source: 'fq', id, type: 'album' } };
}
function mapTrack(item) {
  const id = `${item?.item_id ?? ''}`;
  return { id, name: item?.title ?? '未知', cover: '', duration: 0, artist: { id: 'fq', name: '主播' }, ext: { source: 'fq', trackId: id, url: item?.play_url ?? '' } };
}

async function getConfig() { return jsonify(appConfig); }

async function getAlbums(ext) {
  try {
    const { page = 1, kw } = safeArgs(ext);
    let data = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/search/page/v/?query=${encodeURIComponent(kw)}&offset=${(page-1)*20}&limit=20`);
    let list = firstArray(data?.data?.search_tabs?.[0]?.data, data?.data?.item_list);
    return jsonify({ list: list.map(mapAlbum) });
  } catch(e) { return jsonify({ list: [] }); }
}

async function getSongs(ext) {
  try {
    const { id, page = 1 } = safeArgs(ext);
    let data = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/directory/all_items/v/?book_id=${id}&offset=${(page-1)*20}&limit=20`);
    return jsonify({ list: firstArray(data?.data?.item_list).map(mapTrack) });
  } catch(e) { return jsonify({ list: [] }); }
}

async function search(ext) { return await getAlbums(ext); }

async function getSongInfo(ext) {
  const { trackId, url } = safeArgs(ext);
  if (url) return jsonify({ urls: [url] });
  try {
      const data = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/audio/info/v/?item_id=${trackId}`);
      const audio = data?.data?.audio_info?.play_url || data?.data?.play_url;
      return jsonify({ urls: audio ? [audio] : [] });
  } catch(e) { return jsonify({ urls: [] }); }
}
