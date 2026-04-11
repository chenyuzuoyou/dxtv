/*!
 * @name AllInOneAudio
 * @description 全网听书聚合 (喜马/荔枝/蜻蜓/懒人/番茄)
 * @version v1.0
 * @author AI
 * @key csp_AllInOneAudio
 */

const $config = typeof $config_str !== 'undefined' ? argsify($config_str) : {};
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';
const PAGE_LIMIT = 20;

function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}); }
function toHttps(url) { if (!url) return ''; let s = `${url}`; return s.startsWith('//') ? 'https:' + s : s.replace(/^http:\/\//, 'https://'); }

const appConfig = {
  ver: 1, name: '全网听书聚合', desc: '整合喜马、荔枝、蜻蜓、懒人、番茄',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: '喜马-播客', type: 'album', showMore: true, ext: { source: 'xm', gid: 'tags', kw: '播客' } },
      { name: '喜马-小说', type: 'album', showMore: true, ext: { source: 'xm', gid: 'tags', kw: '小说' } },
      { name: '荔枝-有声书', type: 'album', showMore: true, ext: { source: 'lz', gid: 'tags', kw: '有声书' } },
      { name: '荔枝-脱口秀', type: 'album', showMore: true, ext: { source: 'lz', gid: 'tags', kw: '脱口秀' } },
      { name: '蜻蜓-历史', type: 'album', showMore: true, ext: { source: 'qt', gid: 'tags', kw: '历史' } },
      { name: '懒人-玄幻', type: 'album', showMore: true, ext: { source: 'lr', gid: 'tags', kw: '玄幻' } },
      { name: '番茄-热门', type: 'album', showMore: true, ext: { source: 'fq', gid: 'tags', kw: '热门' } }
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '喜马专辑', type: 'album', ext: { type: 'album', source: 'xm' } },
      { name: '喜马单集', type: 'song', ext: { type: 'track', source: 'xm' } },
      { name: '荔枝专辑', type: 'album', ext: { type: 'album', source: 'lz' } },
      { name: '荔枝单集', type: 'song', ext: { type: 'track', source: 'lz' } },
      { name: '蜻蜓专辑', type: 'album', ext: { type: 'album', source: 'qt' } },
      { name: '蜻蜓单集', type: 'song', ext: { type: 'song', source: 'qt' } },
      { name: '懒人专辑', type: 'album', ext: { type: 'album', source: 'lr' } },
      { name: '番茄专辑', type: 'album', ext: { type: 'album', source: 'fq' } }
    ]
  }
};

// ========================== 喜马拉雅 (XM) ==========================
const XM = (function () {
  const headers = { 'User-Agent': UA };
  async function fetchJson(url, extra = {}) { return safeArgs((await $fetch.get(url, { headers: { ...headers, ...extra } })).data); }
  function isPaid(item) { return item?.isPaid === true || item?.isPaid === 1 || item?.isVip === true || item?.payType > 0; }
  function mapAlbum(item) { const id = `${item?.albumId ?? item?.id ?? ''}`; return { id, name: item?.title ?? item?.albumTitle ?? '', cover: toHttps(item?.coverUrlLarge ?? item?.coverUrl ?? ''), artist: { id: 'xm', name: item?.anchorName ?? '喜马拉雅' }, ext: { source: 'xm', id, type: 'album' } }; }
  function mapTrack(item) { const id = `${item?.trackId ?? item?.id ?? ''}`; return { id, name: item?.title ?? item?.trackTitle ?? '', cover: toHttps(item?.coverUrlLarge ?? ''), duration: parseInt(item?.duration ?? 0), artist: { id: 'xm', name: '主播' }, ext: { source: 'xm', trackId: id } }; }
  
  return {
    getAlbums: async ({ kw, page = 1 }) => { const data = await fetchJson(`https://mobile.ximalaya.com/mobile/search/result?query=${encodeURIComponent(kw)}&page=${page}`); return { list: (data?.data?.album?.docs ?? []).filter(e => !isPaid(e)).map(mapAlbum) }; },
    getSongs: async ({ id, page = 1 }) => { const data = await fetchJson(`https://mobile.ximalaya.com/mobile/v1/album/track/?albumId=${id}&pageSize=${PAGE_LIMIT}&pageId=${page}`); return { list: (data?.data?.list ?? []).filter(e => !isPaid(e)).map(mapTrack) }; },
    search: async ({ text, page = 1, type }) => { const data = await fetchJson(`https://mobile.ximalaya.com/mobile/search/result?query=${encodeURIComponent(text)}&page=${page}`); return { list: (type === 'album' ? data?.data?.album?.docs : data?.data?.track?.docs ?? []).filter(e => !isPaid(e)).map(type === 'album' ? mapAlbum : mapTrack) }; },
    getSongInfo: async ({ trackId }) => { const data = await fetchJson(`https://m.ximalaya.com/tracks/${trackId}.json`); return { urls: data?.play_path_64 ? [data.play_path_64] : [] }; }
  };
})();

// ========================== 荔枝FM (LZ) ==========================
const LZ = (function () {
  const headers = { 'User-Agent': UA, 'Referer': 'https://m.lizhi.fm/' };
  async function fetchJson(url) { return safeArgs((await $fetch.get(url, { headers })).data); }
  function mapAlbum(item) { const v = item?.voiceInfo ?? item; return { id: `${v?.voiceId ?? v?.id ?? ''}`, name: v?.name ?? v?.title ?? '', cover: toHttps(v?.imageUrl ?? ''), artist: { id: 'lz', name: item?.userInfo?.name ?? '荔枝' }, ext: { source: 'lz', id: `${v?.voiceId ?? v?.id ?? ''}` } }; }
  function mapTrack(item) { const v = item?.voiceInfo ?? item; return { id: `${v?.voiceId ?? v?.id ?? ''}`, name: v?.name ?? v?.title ?? '', cover: toHttps(v?.imageUrl ?? ''), duration: parseInt(v?.duration ?? 0), artist: { id: 'lz', name: '主播' }, ext: { source: 'lz', trackId: `${v?.voiceId ?? v?.id ?? ''}` } }; }

  return {
    getAlbums: async ({ kw, page = 1 }) => { const data = await fetchJson(`https://m.lizhi.fm/vodapi/search/voice?keywords=${encodeURIComponent(kw)}&page=${page}`); return { list: (data?.data ?? []).map(mapAlbum) }; },
    getSongs: async ({ id }) => { const data = await fetchJson(`https://m.lizhi.fm/vodapi/voice/info/${id}`); return { list: (data?.data?.tracks ?? [data?.data?.voiceInfo ?? data?.data]).map(mapTrack) }; },
    search: async ({ text, page = 1 }) => { const data = await fetchJson(`https://m.lizhi.fm/vodapi/search/voice?keywords=${encodeURIComponent(text)}&page=${page}`); return { list: (data?.data ?? []).map(mapAlbum) }; },
    getSongInfo: async ({ trackId }) => { const data = await fetchJson(`https://m.lizhi.fm/vodapi/voice/play/${trackId}`); const url = data?.data?.trackUrl ?? data?.data?.url; return { urls: url ? [toHttps(url)] : [] }; }
  };
})();

// ========================== 蜻蜓FM (QT) ==========================
const QT = (function () {
  const headers = { 'User-Agent': UA, 'Referer': 'https://m.qingting.fm/' };
  async function fetchJson(url) { return safeArgs((await $fetch.get(url, { headers })).data); }
  function mapAlbum(item) { return { id: `${item?.id ?? ''}`, name: item?.title ?? '', cover: toHttps(item?.cover ?? ''), artist: { id: 'qt', name: '蜻蜓FM' }, ext: { source: 'qt', id: `${item?.id ?? ''}` } }; }
  function mapTrack(item) { return { id: `${item?.id ?? ''}`, name: item?.title ?? '', cover: toHttps(item?.cover ?? ''), duration: parseInt(item?.duration ?? 0), artist: { id: 'qt', name: '主播' }, ext: { source: 'qt', file_path: item?.file_path ?? '' } }; }

  return {
    getAlbums: async ({ kw, page = 1 }) => { const data = await fetchJson(`https://i.qingting.fm/wapi/search?k=${encodeURIComponent(kw)}&page=${page}&pagesize=${PAGE_LIMIT}&include=channel_m`); return { list: (data?.data?.data?.docs ?? []).map(mapAlbum) }; },
    getSongs: async ({ id, page = 1 }) => { const data = await fetchJson(`https://i.qingting.fm/wapi/channels/${id}/programs/page/${page}/pagesize/${PAGE_LIMIT}`); return { list: (data?.data ?? []).map(mapTrack) }; },
    search: async ({ text, page = 1, type }) => { const data = await fetchJson(`https://i.qingting.fm/wapi/search?k=${encodeURIComponent(text)}&page=${page}&pagesize=${PAGE_LIMIT}`); return { list: (data?.data?.data?.docs ?? []).map(type === 'album' ? mapAlbum : mapTrack) }; },
    getSongInfo: async ({ file_path }) => { return { urls: file_path ? [`https://lcache.qingting.fm/cache/${file_path}`] : [] }; }
  };
})();

// ========================== 懒人听书 (LR) ==========================
const LR = (function () {
  const headers = { 'User-Agent': UA, 'Referer': 'http://m.lrts.me/' };
  async function fetchJson(url) { return safeArgs((await $fetch.get(url, { headers })).data); }
  
  return {
    getAlbums: async ({ kw, page = 1 }) => { const data = await fetchJson(`http://m.lrts.me/ajax/search?word=${encodeURIComponent(kw)}&type=book&page=${page}`); return { list: (data?.list ?? []).map(e => ({ id: `${e.id}`, name: e.name, cover: toHttps(e.cover), artist: { id: 'lr', name: e.announcer }, ext: { source: 'lr', id: `${e.id}` } })) }; },
    getSongs: async ({ id, page = 1 }) => { const data = await fetchJson(`http://m.lrts.me/ajax/playlist/2/${id}/${page}`); return { list: (data?.list ?? []).map(e => ({ id: `${e.id}`, name: e.name, cover: '', duration: 0, artist: { id: 'lr', name: '主播' }, ext: { source: 'lr', path: e.path } })) }; },
    search: async ({ text, page = 1 }) => { const data = await fetchJson(`http://m.lrts.me/ajax/search?word=${encodeURIComponent(text)}&type=book&page=${page}`); return { list: (data?.list ?? []).map(e => ({ id: `${e.id}`, name: e.name, cover: toHttps(e.cover), artist: { id: 'lr', name: e.announcer }, ext: { source: 'lr', id: `${e.id}` } })) }; },
    getSongInfo: async ({ path }) => { return { urls: path ? [toHttps(path)] : [] }; }
  };
})();

// ========================== 番茄畅听 (FQ) ==========================
const FQ = (function () {
  const headers = { 'User-Agent': UA };
  async function fetchJson(url) { return safeArgs((await $fetch.get(url, { headers })).data); }
  
  return {
    getAlbums: async ({ kw, page = 1 }) => { const data = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/search/page/v/?query=${encodeURIComponent(kw)}&offset=${(page-1)*20}&limit=20`); return { list: (data?.data?.search_tabs?.[0]?.data ?? []).map(e => ({ id: `${e.book_id}`, name: e.book_name, cover: e.thumb_url, artist: { id: 'fq', name: e.author }, ext: { source: 'fq', id: `${e.book_id}` } })) }; },
    getSongs: async ({ id, page = 1 }) => { const data = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/directory/all_items/v/?book_id=${id}&offset=${(page-1)*20}&limit=20`); return { list: (data?.data?.item_list ?? []).map(e => ({ id: `${e.item_id}`, name: e.title, cover: '', duration: 0, artist: { id: 'fq', name: '主播' }, ext: { source: 'fq', url: e.play_url } })) }; },
    search: async (ext) => { return await FQ.getAlbums(ext); },
    getSongInfo: async ({ url }) => { return { urls: url ? [url] : [] }; }
  };
})();

// ========================== 路由入口 ==========================
async function getConfig() { return jsonify(appConfig); }

async function getAlbums(ext) {
  const args = argsify(ext);
  if (args.source === 'xm') return jsonify(await XM.getAlbums(args));
  if (args.source === 'lz') return jsonify(await LZ.getAlbums(args));
  if (args.source === 'qt') return jsonify(await QT.getAlbums(args));
  if (args.source === 'lr') return jsonify(await LR.getAlbums(args));
  if (args.source === 'fq') return jsonify(await FQ.getAlbums(args));
  return jsonify({ list: [] });
}

async function getSongs(ext) {
  const args = argsify(ext);
  if (args.source === 'xm') return jsonify(await XM.getSongs(args));
  if (args.source === 'lz') return jsonify(await LZ.getSongs(args));
  if (args.source === 'qt') return jsonify(await QT.getSongs(args));
  if (args.source === 'lr') return jsonify(await LR.getSongs(args));
  if (args.source === 'fq') return jsonify(await FQ.getSongs(args));
  return jsonify({ list: [] });
}

async function search(ext) {
  const args = argsify(ext);
  if (args.source === 'xm') return jsonify(await XM.search(args));
  if (args.source === 'lz') return jsonify(await LZ.search(args));
  if (args.source === 'qt') return jsonify(await QT.search(args));
  if (args.source === 'lr') return jsonify(await LR.search(args));
  if (args.source === 'fq') return jsonify(await FQ.search(args));
  return jsonify({ list: [] });
}

async function getSongInfo(ext) {
  const args = argsify(ext);
  if (args.source === 'xm') return jsonify(await XM.getSongInfo(args));
  if (args.source === 'lz') return jsonify(await LZ.getSongInfo(args));
  if (args.source === 'qt') return jsonify(await QT.getSongInfo(args));
  if (args.source === 'lr') return jsonify(await LR.getSongInfo(args));
  if (args.source === 'fq') return jsonify(await FQ.getSongInfo(args));
  return jsonify({ urls: [] });
}
