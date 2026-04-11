/*!
 * @name AllInOneAudio
 * @description 全网听书聚合 v1.3 - 彻底修复专辑显示与播放
 * @version v1.3
 * @author AI
 */
const $config = typeof $config_str !== 'undefined' ? argsify($config_str) : {};
const UA_MB = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) AppleWebKit/605.1.15';

function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}); }
async function fetchJson(url, extraHeaders = {}) { try { const { data } = await $fetch.get(url, { headers: { 'User-Agent': UA_MB, ...extraHeaders } }); return typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return {}; } }

const appConfig = {
  ver: 1, name: '全网听书聚合', tabLibrary: {
    name: '探索', groups: [
      { name: '喜马-播客', type: 'album', ui: 1, showMore: true, ext: { source: 'xm', kw: '播客' } },
      { name: '荔枝-热门推荐', type: 'album', ui: 1, showMore: true, ext: { source: 'lz', kw: '热门' } }, // 修复：此处必须为 album
      { name: '蜻蜓-有声书', type: 'album', ui: 1, showMore: true, ext: { source: 'qt', kw: '521', reqType: 'category' } },
      { name: '懒人-玄幻', type: 'album', ui: 1, showMore: true, ext: { source: 'lr', kw: '1', reqType: 'category' } },
      { name: '番茄-畅听', type: 'album', ui: 1, showMore: true, ext: { source: 'fq', kw: '热门' } }
    ]
  },
  tabSearch: { name: '搜索', groups: [{ name: '专辑聚合', type: 'album', ext: { source: 'all' } }] }
};

const PROVIDERS = {
  xm: {
    async getAlbums({ kw, page = 1 }) {
      const d = await fetchJson(`https://mobile.ximalaya.com/mobile/search/result?query=${encodeURIComponent(kw)}&page=${page}`);
      return { list: (d?.data?.album?.docs || []).map(e => ({ id: `${e.id}`, name: e.title, cover: e.coverUrl || e.cover_path, ext: { source: 'xm', id: `${e.id}`, type: 'album' } })) };
    },
    async getSongs({ id, page = 1 }) {
      const d = await fetchJson(`https://mobile.ximalaya.com/mobile/v1/album/track/?albumId=${id}&pageSize=20&pageId=${page}`);
      return { list: (d?.data?.list || []).map(e => ({ id: `${e.trackId}`, name: e.title, ext: { source: 'xm', trackId: `${e.trackId}` } })) };
    },
    async getSongInfo({ trackId }) {
      const d = await fetchJson(`https://m.ximalaya.com/tracks/${trackId}.json`);
      return { urls: d?.play_path_64 ? [d.play_path_64] : [] };
    }
  },
  lz: {
    async getAlbums({ kw, page = 1 }) {
      const d = await fetchJson(`https://m.lizhi.fm/vodapi/search/voice?keywords=${encodeURIComponent(kw)}&page=${page}`, { Referer: 'https://m.lizhi.fm/' });
      return { list: (d?.data || []).map(e => ({ id: `${e.voiceId || e.id}`, name: e.name || e.title, cover: e.imageUrl || e.cover, ext: { source: 'lz', id: `${e.voiceId || e.id}`, type: 'album' } })) };
    },
    async getSongs({ id }) {
      const d = await fetchJson(`https://m.lizhi.fm/vodapi/voice/info/${id}`);
      const l = d?.data?.tracks || [d?.data?.voiceInfo || d?.data];
      return { list: l.map(e => ({ id: `${e.id || e.voiceId}`, name: e.name || e.title, ext: { source: 'lz', trackId: `${e.id || e.voiceId}` } })) };
    },
    async getSongInfo({ trackId }) {
      const d = await fetchJson(`https://m.lizhi.fm/vodapi/voice/play/${trackId}`);
      const url = d?.data?.trackUrl || d?.data?.url;
      return { urls: url ? [url] : [] };
    }
  },
  qt: {
    async getAlbums({ kw, page = 1, reqType }) {
      const url = reqType === 'category' ? `https://i.qingting.fm/wapi/categories/${kw}/channels?page=${page}` : `https://i.qingting.fm/wapi/search?k=${encodeURIComponent(kw)}&page=${page}`;
      const d = await fetchJson(url, { Referer: 'https://m.qingting.fm/' });
      return { list: (d?.data?.data?.docs || d?.data || []).map(e => ({ id: `${e.id}`, name: e.title || e.name, cover: e.cover || e.thumb, ext: { source: 'qt', id: `${e.id}`, type: 'album' } })) };
    },
    async getSongs({ id, page = 1 }) {
      const d = await fetchJson(`https://i.qingting.fm/wapi/channels/${id}/programs/page/${page}/pagesize/20`);
      return { list: (d?.data || []).map(e => ({ id: `${e.id}`, name: e.title, ext: { source: 'qt', file_path: e.file_path } })) };
    },
    async getSongInfo({ file_path }) { return { urls: file_path ? [`https://lcache.qingting.fm/cache/${file_path}`] : [] }; }
  },
  lr: {
    async getAlbums({ kw, page = 1, reqType }) {
      const url = reqType === 'category' ? `http://m.lrts.me/ajax/getCategoryBookList?id=${kw}&sortType=1&pageNum=${page}&pageSize=20` : `http://m.lrts.me/ajax/search?word=${encodeURIComponent(kw)}&type=book&page=${page}`;
      const d = await fetchJson(url, { Referer: 'http://m.lrts.me/' });
      return { list: (d?.data?.list || d?.list || []).map(e => ({ id: `${e.id || e.bookId}`, name: e.name || e.bookName, cover: e.cover || e.bookCover, ext: { source: 'lr', id: `${e.id || e.bookId}`, type: 'album' } })) };
    },
    async getSongs({ id, page = 1 }) {
      const d = await fetchJson(`http://m.lrts.me/ajax/playlist/2/${id}/${page}`);
      return { list: (d?.data?.list || d?.list || []).map(e => ({ id: `${e.id}`, name: e.name, ext: { source: 'lr', path: e.path } })) };
    },
    async getSongInfo({ path }) { return { urls: path ? [path.startsWith('http') ? path : 'https:' + path] : [] }; }
  },
  fq: {
    async getAlbums({ kw, page = 1 }) {
      const d = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/search/page/v/?query=${encodeURIComponent(kw)}&offset=${(page-1)*20}&limit=20&aid=1967&device_platform=android`);
      return { list: (d?.data?.search_tabs?.[0]?.data || []).map(e => ({ id: `${e.book_id}`, name: e.book_name, cover: e.thumb_url, ext: { source: 'fq', id: `${e.book_id}`, type: 'album' } })) };
    },
    async getSongs({ id, page = 1 }) {
      const d = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/directory/all_items/v/?book_id=${id}&offset=${(page-1)*20}&limit=20&aid=1967`);
      return { list: (d?.data?.item_list || []).map(e => ({ id: `${e.item_id}`, name: e.title, ext: { source: 'fq', trackId: e.item_id, url: e.play_url } })) };
    },
    async getSongInfo({ trackId, url }) {
      if (url) return { urls: [url] };
      const d = await fetchJson(`https://api5-normal-lf.fqnovel.com/reading/bookapi/audio/info/v/?item_id=${trackId}&aid=1967`);
      return { urls: d?.data?.audio_info?.play_url ? [d.data.audio_info.play_url] : [] };
    }
  }
};

async function getConfig() { return jsonify(appConfig); }
async function getAlbums(ext) { const args = safeArgs(ext); return jsonify(await PROVIDERS[args.source].getAlbums(args)); }
async function getSongs(ext) { const args = safeArgs(ext); return jsonify(await PROVIDERS[args.source].getSongs(args)); }
async function search(ext) { return await getAlbums(ext); }
async function getSongInfo(ext) { const args = safeArgs(ext); return jsonify(await PROVIDERS[args.source].getSongInfo(args)); }
