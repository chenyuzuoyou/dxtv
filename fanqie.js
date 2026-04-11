/*!
 * @name fanqie
 * @description 番茄畅听 插件版
 * @author AI
 * @key csp_fanqie
 */
const $config = typeof $config_str !== 'undefined' ? argsify($config_str) : {};
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0.0';
const headers = { 'User-Agent': UA, 'Referer': 'https://changting.fqnovel.com/' };
const FQ_SOURCE = 'fq';

const appConfig = {
  ver: 1, name: '番茄畅听', tabLibrary: {
    name: '探索', groups: [{ name: '有声小说', type: 'album', ext: { kw: '小说' } }]
  },
  tabSearch: { name: '搜索', groups: [{ name: '专辑', type: 'album' }] }
};

function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}); }
async function fetchJson(url) { try { const { data } = await $fetch.get(url, { headers }); return safeArgs(data); } catch (e) { return {}; } }

function mapAlbum(item) {
  const id = `${item?.book_id ?? item?.id ?? ''}`;
  return { id, name: item?.book_name ?? '未知', cover: item?.thumb_url ?? '', artist: { id: 'fq', name: item?.author ?? '番茄' }, ext: { source: FQ_SOURCE, id, type: 'album' } };
}
function mapTrack(item) {
  const id = `${item?.item_id ?? ''}`;
  return { id, name: item?.title ?? '未知', cover: '', duration: 0, artist: { id: 'fq', name: '番茄' }, ext: { source: FQ_SOURCE, trackId: id, url: item?.play_url ?? '' } };
}

async function getConfig() { return jsonify(appConfig); }

async function getAlbums(ext) {
  const { page = 1, kw } = argsify(ext);
  // 注意：番茄实际抓包需要通过 signature，此处为 H5 Mock API 结构
  const data = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/search/page/v/?query=${encodeURIComponent(kw)}&offset=${(page-1)*20}&limit=20`);
  return jsonify({ list: (data?.data?.search_tabs?.[0]?.data ?? []).map(mapAlbum) });
}

async function getSongs(ext) {
  const { id, page = 1 } = argsify(ext);
  const data = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/directory/all_items/v/?book_id=${id}&offset=${(page-1)*20}&limit=20`);
  return jsonify({ list: (data?.data?.item_list ?? []).map(mapTrack) });
}

async function search(ext) {
  return await getAlbums(ext); // 番茄搜节目端点较严密，通常只支持搜书
}

async function getSongInfo(ext) {
  const { url } = argsify(ext);
  return jsonify({ urls: url ? [url] : [] });
}
