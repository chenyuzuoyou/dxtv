/*!
 * @name wy_radio
 * @description 网易云电台
 * @version v1.0.0
 * @author codex
 * @key csp_wyradio
 */
let userCookie = '';
try {
  if (typeof $config_str !== 'undefined' && $config_str) {
    if (typeof $config_str === 'string' && !$config_str.trim().startsWith('{')) {
      userCookie = $config_str;
    } else {
      const parsedConfig = argsify($config_str);
      userCookie = parsedConfig?.cookie || parsedConfig?.ext || '';
    }
  }
} catch (e) {}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const headers = { 'User-Agent': UA };
const PAGE_LIMIT = 100;
const SEARCH_PAGE_LIMIT = 5;
const SOURCE = 'wyradio';

const GID = {
  RADIO_SEARCH: '1',
  RADIO_ARTIST: '2',
  RADIO_ALBUM: '3',
};

const appConfig = {
  ver: 1,
  name: 'wy_radio',
  message: '',
  warning: '',
  desc: '网易云电台',
  tabLibrary: {
    name: '探索',
    groups: [{
      name: '电台搜索',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: { gid: GID.RADIO_SEARCH }
    }]
  },
  tabMe: {
    name: '我的',
    groups: []
  },
  tabSearch: {
    name: '搜索',
    groups: [{
      name: '电台',
      type: 'playlist',
      ext: { type: 'radio' }
    }, {
      name: 'DJ用户',
      type: 'artist',
      ext: { type: 'djuser' }
    }]
  }
};

function withWyHeaders(extra = {}) {
  const reqHeaders = { ...headers, Referer: 'https://music.163.com/', Origin: 'https://music.163.com', ...extra };
  if (userCookie) reqHeaders.Cookie = userCookie;
  return reqHeaders;
}

function safeExt(ext) {
  if (!ext) return {};
  if (typeof ext === 'object') return ext;
  try { return argsify(ext); } catch(e) { return {}; }
}

function safeArgs(data) {
  return typeof data === 'string' ? argsify(data) : (data ?? {});
}

function toHttps(url) {
  if (!url) return '';
  return url.replace(/^http:\/\//, 'https://');
}

function mapRadioSong(program) {
  const song = program.mainSong || {};
  const artists = song.artists || [];
  const album = program.radio || {};
  return {
    id: `${song.id || ''}`,
    name: song.name || '',
    cover: toHttps(program.coverUrl || ''),
    duration: Math.floor((song.duration || 0) / 1000),
    artist: {
      id: `${artists[0]?.id || ''}`,
      name: artists[0]?.name || '',
      cover: toHttps(artists[0]?.img1v1Url || ''),
    },
    ext: {
      source: SOURCE,
      songmid: `${song.id || ''}`,
      singer: artists[0]?.name || '',
      songName: song.name || '',
    }
  };
}

function mapRadio(radio) {
  const dj = radio.dj || {};
  return {
    id: `${radio.id || ''}`,
    name: radio.name || '',
    cover: toHttps(radio.picUrl || ''),
    artist: {
      id: `${dj.id || ''}`,
      name: dj.nickname || '',
      cover: toHttps(dj.avatarUrl || ''),
    },
    ext: {
      gid: GID.RADIO_ALBUM,
      id: `${radio.id || ''}`,
      type: 'radio',
    }
  };
}

function mapDjUser(user) {
  return {
    id: `${user.userId || ''}`,
    name: user.nickname || '',
    cover: toHttps(user.avatarUrl || ''),
    groups: [{
      name: 'TA的电台',
      type: 'playlist',
      ext: { gid: GID.RADIO_ARTIST, id: `${user.userId || ''}` }
    }],
    ext: {
      gid: GID.RADIO_ARTIST,
      id: `${user.userId || ''}`,
    }
  };
}

async function fetchJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, { headers: withWyHeaders(extraHeaders) });
  return safeArgs(data);
}

async function getConfig() {
  return jsonify(appConfig);
}

async function getSongs(ext) {
  const { page = 1, gid = '', id = '' } = safeExt(ext);
  let list = [];

  if (gid === GID.RADIO_ALBUM) {
    const offset = (page - 1) * PAGE_LIMIT;
    const res = await fetchJson(`https://music.163.com/weapi/dj/program/byradio?radioId=${id}&limit=${PAGE_LIMIT}&offset=${offset}`);
    list = (res.programs || []).map(mapRadioSong);
  }

  return jsonify({ list });
}

async function getPlaylists(ext) {
  const { page = 1, gid = '' } = safeExt(ext);
  let list = [];

  if (gid === GID.RADIO_SEARCH) {
    const offset = (page - 1) * PAGE_LIMIT;
    const res = await fetchJson(`https://music.163.com/weapi/djradio/recommend?limit=${PAGE_LIMIT}&offset=${offset}`);
    list = (res.djRadios || []).map(mapRadio);
  }

  return jsonify({ list });
}

async function getArtists(ext) {
  return jsonify({ list: [] });
}

async function getAlbums(ext) {
  return jsonify({ list: [] });
}

async function search(ext) {
  const { text = '', page = 1, type = '' } = safeExt(ext);
  if (!text || page > SEARCH_PAGE_LIMIT) return jsonify({});

  const offset = (page - 1) * PAGE_LIMIT;
  if (type === 'radio') {
    const res = await fetchJson(`https://music.163.com/weapi/search/get?type=1009&s=${encodeURIComponent(text)}&limit=${PAGE_LIMIT}&offset=${offset}`);
    const list = (res.result?.djRadios || []).map(mapRadio);
    return jsonify({ list });
  }

  if (type === 'djuser') {
    const res = await fetchJson(`https://music.163.com/weapi/search/get?type=1002&s=${encodeURIComponent(text)}&limit=${PAGE_LIMIT}&offset=${offset}`);
    const list = (res.result?.userprofiles || []).map(mapDjUser);
    return jsonify({ list });
  }

  return jsonify({});
}

async function getSongInfo(ext) {
  const { songmid } = safeExt(ext);
  const url = `https://music.163.com/song/media/outer/url?id=${songmid}.mp3`;
  return jsonify({ urls: [url] });
}