/*!
 * @name AllInOneAudio
 * @description 全网听书聚合 (喜马/荔枝/蜻蜓/懒人/番茄)
 * @version v1.2
 * @author AI
 * @key csp_AllInOneAudio
 */

const $config = typeof $config_str !== 'undefined' ? argsify($config_str) : {};
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
const UA_MB = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) AppleWebKit/605.1.15 Mobile/15E148';

function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}); }
function toHttps(url) { if (!url) return ''; let s = `${url}`; return s.startsWith('//') ? 'https:' + s : s.replace(/^http:\/\//, 'https://'); }
function firstArray(...c) { for (const i of c) if (Array.isArray(i) && i.length > 0) return i; return []; }
async function fetchJson(url, extraHeaders = {}) { try { const { data } = await $fetch.get(url, { headers: { 'User-Agent': UA_MB, ...extraHeaders } }); return typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return {}; } }

const appConfig = {
  ver: 1, name: '全网听书聚合', desc: '完美修复各端探索与播放',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: '喜马-播客', type: 'album', ui: 1, showMore: true, ext: { source: 'xm', kw: '播客' } },
      { name: '喜马-小说', type: 'album', ui: 1, showMore: true, ext: { source: 'xm', kw: '小说' } },
      { name: '荔枝-热门推荐', type: 'album', ui: 1, showMore: true, ext: { source: 'lz', kw: '热门' } },
      { name: '蜻蜓-有声书', type: 'album', ui: 1, showMore: true, ext: { source: 'qt', kw: '521', reqType: 'category' } },
      { name: '懒人-玄幻', type: 'album', ui: 1, showMore: true, ext: { source: 'lr', kw: '1', reqType: 'category' } },
      { name: '番茄-热门', type: 'album', ui: 1, showMore: true, ext: { source: 'fq', kw: '热门' } }
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '喜马专辑', type: 'album', ext: { type: 'album', source: 'xm' } },
      { name: '荔枝专辑', type: 'album', ext: { type: 'album', source: 'lz' } },
      { name: '蜻蜓专辑', type: 'album', ext: { type: 'album', source: 'qt' } },
      { name: '懒人专辑', type: 'album', ext: { type: 'album', source: 'lr' } },
      { name: '番茄专辑', type: 'album', ext: { type: 'album', source: 'fq' } }
    ]
  }
};

// ========================== 核心模块 ==========================
const XM = {
  isPaid(item) { return item?.isPaid === true || item?.isPaid === 1 || item?.isVip === true || item?.payType > 0; },
  mapAlbum: e => ({ id: `${e?.albumId ?? e?.id ?? ''}`, name: e?.title ?? e?.albumTitle ?? '', cover: toHttps(e?.coverUrlLarge ?? e?.coverUrl ?? e?.cover_path ?? ''), artist: { id: 'xm', name: e?.anchorName ?? '喜马拉雅' }, ext: { source: 'xm', id: `${e?.albumId ?? e?.id ?? ''}`, type: 'album' } }),
  mapTrack: e => ({ id: `${e?.trackId ?? e?.id ?? ''}`, name: e?.title ?? e?.trackTitle ?? '', cover: toHttps(e?.coverUrlLarge ?? e?.coverMiddle ?? ''), duration: parseInt(e?.duration ?? 0), artist: { id: 'xm', name: '主播' }, ext: { source: 'xm', trackId: `${e?.trackId ?? e?.id ?? ''}` } }),
  async getAlbums({ kw, page = 1 }) {
    for (let u of [`https://mobile.ximalaya.com/mobile/search/result?query=${encodeURIComponent(kw)}&page=${page}`, `https://www.ximalaya.com/revision/search?core=album&kw=${encodeURIComponent(kw)}&page=${page}&rows=20&device=web`]) {
      const d = await fetchJson(u, { 'User-Agent': UA_PC });
      const l = firstArray(d?.data?.album?.docs, d?.data?.result?.response?.docs);
      if (l.length) return { list: l.filter(e => !this.isPaid(e)).map(this.mapAlbum) };
    } return { list: [] };
  },
  async getSongs({ id, page = 1 }) {
    for (let u of [`https://mobile.ximalaya.com/mobile/v1/album/track/?albumId=${id}&pageSize=20&pageId=${page}`, `https://www.ximalaya.com/revision/album/v1/getTracksList?albumId=${id}&pageNum=${page}&sort=0&pageSize=20`]) {
      const d = await fetchJson(u, { Referer: `https://www.ximalaya.com/album/${id}` });
      const l = firstArray(d?.data?.list, d?.data?.tracks, d?.data?.trackList);
      if (l.length) return { list: l.filter(e => !this.isPaid(e)).map(this.mapTrack) };
    } return { list: [] };
  },
  async search(ext) { return await this.getAlbums(ext); },
  async getSongInfo({ trackId }) {
    const d = await fetchJson(`https://m.ximalaya.com/tracks/${trackId}.json`);
    const u = d?.play_path_64 || d?.play_path_32 || d?.src;
    return { urls: u && !d?.is_paid ? [u] : [] };
  }
};

const LZ = {
  mapAlbum: (v) => { const e = v?.voiceInfo ?? v; return { id: `${e?.voiceId ?? e?.id ?? ''}`, name: e?.name ?? e?.title ?? '', cover: toHttps(e?.imageUrl ?? e?.cover ?? ''), artist: { id: 'lz', name: v?.userInfo?.name ?? '荔枝FM' }, ext: { source: 'lz', id: `${e?.voiceId ?? e?.id ?? ''}`, type: 'album' } }; },
  mapTrack: (v) => { const e = v?.voiceInfo ?? v; return { id: `${e?.voiceId ?? e?.id ?? ''}`, name: e?.name ?? e?.title ?? '', cover: toHttps(e?.imageUrl ?? ''), duration: parseInt(e?.duration ?? 0), artist: { id: 'lz', name: '主播' }, ext: { source: 'lz', trackId: `${e?.voiceId ?? e?.id ?? ''}` } }; },
  async getAlbums({ kw, page = 1 }) {
    const url = `https://m.lizhi.fm/vodapi/search/voice?deviceId=h5-f93e74ac-0065-8207-4853-75dec8585db3&receiptData=CAASJ2g1LWY5M2U3NGFjLTAwNjUtODIwNy00ODUzLTc1ZGVjODU4NWRiMyj%2FhvGLxy0wDDgF&keywords=${encodeURIComponent(kw)}&page=${page}`;
    const d = await fetchJson(url, { Referer: 'https://m.lizhi.fm/' });
    return { list: firstArray(d?.data).map(this.mapAlbum) };
  },
  async getSongs({ id }) {
    const d = await fetchJson(`https://m.lizhi.fm/vodapi/voice/info/${id}`);
    const l = firstArray(d?.data?.tracks, [d?.data?.userVoice], [d?.data?.voiceInfo], [d?.data]);
    return { list: l.map(this.mapTrack) };
  },
  async search(ext) { return await this.getAlbums(ext); },
  async getSongInfo({ trackId }) {
    let url = '';
    const d1 = await fetchJson(`https://m.lizhi.fm/vodapi/voice/play/${trackId}`);
    url = d1?.data?.trackUrl || d1?.data?.url || d1?.data?.userVoice?.voicePlayProperty?.trackUrl;
    if (!url) {
      const d2 = await fetchJson(`https://m.lizhi.fm/vodapi/voice/info/${trackId}`);
      url = d2?.data?.userVoice?.voicePlayProperty?.trackUrl || d2?.data?.voicePlayProperty?.trackUrl || d2?.data?.userVoice?.voiceInfo?.trackUrl || d2?.data?.trackUrl;
    }
    return { urls: url ? [toHttps(url)] : [] };
  }
};

const QT = {
  mapAlbum: e => ({ id: `${e?.id ?? ''}`, name: e?.title ?? '', cover: toHttps(e?.cover ?? e?.thumb ?? ''), artist: { id: 'qt', name: e?.podcasters?.[0]?.name ?? '蜻蜓FM' }, ext: { source: 'qt', id: `${e?.id ?? ''}`, type: 'album' } }),
  mapTrack: e => ({ id: `${e?.id ?? ''}`, name: e?.title ?? '', cover: toHttps(e?.cover ?? ''), duration: parseInt(e?.duration ?? 0), artist: { id: 'qt', name: '主播' }, ext: { source: 'qt', trackId: `${e?.id ?? ''}`, file_path: e?.file_path ?? '' } }),
  async getAlbums({ kw, page = 1, reqType }) {
    if (reqType === 'category') {
      const d = await fetchJson(`https://i.qingting.fm/wapi/categories/${kw}/channels?page=${page}`, { Referer: 'https://m.qingting.fm/' });
      return { list: firstArray(d?.data).map(this.mapAlbum) };
    }
    const d = await fetchJson(`https://i.qingting.fm/wapi/search?k=${encodeURIComponent(kw)}&page=${page}&pagesize=20`, { Referer: 'https://m.qingting.fm/' });
    return { list: firstArray(d?.data?.data?.docs, d?.data?.docs, d?.docs).map(this.mapAlbum) };
  },
  async getSongs({ id, page = 1 }) {
    const d = await fetchJson(`https://i.qingting.fm/wapi/channels/${id}/programs/page/${page}/pagesize=20`);
    return { list: firstArray(d?.data).map(this.mapTrack) };
  },
  async search(ext) { return await this.getAlbums(ext); },
  async getSongInfo({ file_path }) { return { urls: file_path ? [`https://lcache.qingting.fm/cache/${file_path}`] : [] }; }
};

const LR = {
  mapAlbum: e => ({ id: `${e?.id ?? e?.bookId ?? ''}`, name: e?.name ?? e?.bookName ?? '', cover: toHttps(e?.cover ?? e?.bookCover ?? ''), artist: { id: 'lr', name: e?.announcer ?? '懒人主播' }, ext: { source: 'lr', id: `${e?.id ?? e?.bookId ?? ''}`, type: 'album' } }),
  mapTrack: e => ({ id: `${e?.id ?? e?.sectionId ?? ''}`, name: e?.name ?? e?.sectionName ?? '', cover: '', duration: 0, artist: { id: 'lr', name: '主播' }, ext: { source: 'lr', trackId: `${e?.id ?? ''}`, path: e?.path ?? '' } }),
  async getAlbums({ kw, page = 1, reqType }) {
    if (reqType === 'category') {
      const d = await fetchJson(`http://m.lrts.me/ajax/getCategoryBookList?id=${kw}&sortType=1&pageNum=${page}&pageSize=20`, { Referer: 'http://m.lrts.me/' });
      return { list: firstArray(d?.data?.list, d?.list).map(this.mapAlbum) };
    }
    const d = await fetchJson(`http://m.lrts.me/ajax/search?word=${encodeURIComponent(kw)}&type=book&page=${page}`, { Referer: 'http://m.lrts.me/' });
    return { list: firstArray(d?.data?.list, d?.list).map(this.mapAlbum) };
  },
  async getSongs({ id, page = 1 }) {
    const d = await fetchJson(`http://m.lrts.me/ajax/playlist/2/${id}/${page}`);
    return { list: firstArray(d?.data?.list, d?.list).map(this.mapTrack) };
  },
  async search(ext) { return await this.getAlbums(ext); },
  async getSongInfo({ path }) { return { urls: path ? [toHttps(path)] : [] }; }
};

const FQ = {
  mapAlbum: e => ({ id: `${e?.book_id ?? e?.id ?? ''}`, name: e?.book_name ?? e?.title ?? '', cover: e?.thumb_url ?? '', artist: { id: 'fq', name: e?.author ?? '番茄' }, ext: { source: 'fq', id: `${e?.book_id ?? e?.id ?? ''}`, type: 'album' } }),
  mapTrack: e => ({ id: `${e?.item_id ?? ''}`, name: e?.title ?? '', cover: '', duration: 0, artist: { id: 'fq', name: '主播' }, ext: { source: 'fq', trackId: `${e?.item_id ?? ''}`, url: e?.play_url ?? '' } }),
  async getAlbums({ kw, page = 1 }) {
    const d = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/search/page/v/?query=${encodeURIComponent(kw)}&offset=${(page-1)*20}&limit=20&aid=1967&device_platform=android&version_code=1000`);
    return { list: firstArray(d?.data?.search_tabs?.[0]?.data, d?.data?.item_list).map(this.mapAlbum) };
  },
  async getSongs({ id, page = 1 }) {
    const d = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/directory/all_items/v/?book_id=${id}&offset=${(page-1)*20}&limit=20&aid=1967&device_platform=android&version_code=1000`);
    return { list: firstArray(d?.data?.item_list).map(this.mapTrack) };
  },
  async search(ext) { return await this.getAlbums(ext); },
  async getSongInfo({ trackId, url }) {
    if (url) return { urls: [url] };
    const d = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/audio/info/v/?item_id=${trackId}&aid=1967&device_platform=android&version_code=1000`);
    const audio = d?.data?.audio_info?.play_url || d?.data?.play_url;
    return { urls: audio ? [audio] : [] };
  }
};

// ========================== 全局路由分发 ==========================
const PROVIDERS = { xm: XM, lz: LZ, qt: QT, lr: LR, fq: FQ };

async function getConfig() { return jsonify(appConfig); }

async function getAlbums(ext) {
  try {
    const args = safeArgs(ext);
    const api = PROVIDERS[args.source];
    return api ? jsonify(await api.getAlbums(args)) : jsonify({ list: [] });
  } catch(e) { return jsonify({ list: [] }); }
}

async function getSongs(ext) {
  try {
    const args = safeArgs(ext);
    const api = PROVIDERS[args.source];
    return api ? jsonify(await api.getSongs(args)) : jsonify({ list: [] });
  } catch(e) { return jsonify({ list: [] }); }
}

async function search(ext) {
  try {
    const args = safeArgs(ext);
    const api = PROVIDERS[args.source];
    return api ? jsonify(await api.search(args)) : jsonify({ list: [] });
  } catch(e) { return jsonify({ list: [] }); }
}

async function getSongInfo(ext) {
  try {
    const args = safeArgs(ext);
    const api = PROVIDERS[args.source];
    return api ? jsonify(await api.getSongInfo(args)) : jsonify({ urls: [] });
  } catch(e) { return jsonify({ urls: [] }); }
}
