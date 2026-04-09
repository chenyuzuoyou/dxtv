/*!
 * @name Grok2qqfm
 * @description qqfm - 增强版：新增“我的”→“最近播放（缓存歌曲）” + 完美自动记录
 * @version v1.0.2
 * @author codex (增强 & 修复 by Grok)
 * @key csp_Grok2qqfm
 */

const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = {
  'User-Agent': UA,
}

const PAGE_LIMIT = 20
const SEARCH_PAGE_LIMIT = 5
const QQ_SOURCE = 'tx'
const GID = {
  TOPLISTS: '1',
  TOP_ARTISTS: '2',
  ARTIST_SONGS: '3',
  ARTIST_ALBUMS: '4',
  ALBUM_SONGS: '5',
  SEARCH_PLAYLISTS: '6',
  TAG_PLAYLISTS: '7',
  RECENT_PLAYED: '8',   // 最近播放（缓存歌曲）
}

const MAX_RECENT = 200
let recentPlayed = []   // 全局内存数组，存储最近播放歌曲（会话期间有效）

const appConfig = {
  ver: 1,
  name: 'qqfm',
  message: '',
  warning: '',
  desc: '',
  tabLibrary: { /* 保持完全不变 */ 
    name: '探索',
    groups: [{
      name: '飙升榜', type: 'song', ui: 0, showMore: false, ext: { gid: GID.TOPLISTS, id: '62' }
    }, {
      name: '热歌榜', type: 'song', ui: 0, showMore: false, ext: { gid: GID.TOPLISTS, id: '26' }
    }, {
      name: '新歌榜', type: 'song', ui: 0, showMore: false, ext: { gid: GID.TOPLISTS, id: '27' }
    }, {
      name: '排行榜', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.TOPLISTS }
    }, {
      name: '流行歌单', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.TAG_PLAYLISTS, categoryId: '6', sortId: '5' }
    }, {
      name: '国语精选', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.TAG_PLAYLISTS, categoryId: '165', sortId: '5' }
    }, {
      name: '轻音乐', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.TAG_PLAYLISTS, categoryId: '15', sortId: '5' }
    }, {
      name: '影视原声', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.TAG_PLAYLISTS, categoryId: '133', sortId: '5' }
    }, {
      name: '治愈歌单', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.TAG_PLAYLISTS, categoryId: '116', sortId: '5' }
    }, {
      name: '热门歌手', type: 'artist', ui: 0, showMore: true, ext: { gid: GID.TOP_ARTISTS }
    }]
  },
  tabMe: {
    name: '我的',
    groups: [
      // 新增条目（置顶）
      { name: '最近播放（缓存歌曲）', type: 'song', ext: { gid: GID.RECENT_PLAYED } },
      { name: '红心', type: 'song' },
      { name: '歌单', type: 'playlist' },
      { name: '专辑', type: 'album' },
      { name: '创作者', type: 'artist' }
    ]
  },
  tabSearch: { /* 保持完全不变 */ 
    name: '搜索',
    groups: [{
      name: '歌曲', type: 'song', ext: { type: 'song' }
    }, {
      name: '歌单', type: 'playlist', ext: { type: 'playlist' }
    }, {
      name: '专辑', type: 'album', ext: { type: 'album' }
    }, {
      name: '歌手', type: 'artist', ext: { type: 'artist' }
    }]
  }
}

/* ==================== 以下所有函数保持完全不变（仅贴出关键修改部分） ==================== */
function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}) }
function toHttps(url) { return !url ? '' : `${url}`.replace(/^http:\/\//, 'https://') }
function withQqHeaders(extra = {}) { return { ...headers, Referer: 'https://y.qq.com/', Origin: 'https://y.qq.com', Cookie: 'uin=0;', ...extra } }
function buildSearchUrl(text, page, searchType = 0, limit = PAGE_LIMIT) { /* 原函数不变 */ 
  const payload = { comm: { ct: '19', cv: '1859', uin: '0' }, req: { method: 'DoSearchForQQMusicDesktop', module: 'music.search.SearchCgiService', param: { grp: 1, num_per_page: limit, page_num: page, query: text, search_type: searchType } } }
  return `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=${encodeURIComponent(JSON.stringify(payload))}`
}
function buildMusicuUrl(payload) { return `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=${encodeURIComponent(JSON.stringify(payload))}` }
async function fetchJson(url, extraHeaders = {}) { const { data } = await $fetch.get(url, { headers: withQqHeaders(extraHeaders) }); return safeArgs(data) }
async function fetchHtml(url, extraHeaders = {}) { const { data } = await $fetch.get(url, { headers: { ...headers, ...extraHeaders } }); return `${data ?? ''}` }
function parseInitialData(html) { const match = html.match(/__INITIAL_DATA__\s*=\s*({[\s\S]*?})<\/script>/); return match?.[1] ? safeArgs(match[1]) : {} }
function singerListOf(song) { return song?.singer ?? song?.singer_list ?? [] }
function singerNameOf(song) { return singerListOf(song).map(a => a?.name ?? a?.singer_name ?? '').filter(Boolean).join('/') }
function albumMidOf(song) { return song?.album?.mid ?? song?.albumMid ?? song?.album_mid ?? song?.albummid ?? '' }
function albumNameOf(song) { return song?.album?.name ?? song?.albumName ?? song?.album_name ?? '' }
function songMidOf(song) { return song?.mid ?? song?.songmid ?? song?.song_mid ?? '' }

function mapSong(rawSong) {
  const song = rawSong?.songInfo ?? rawSong ?? {}
  const singers = singerListOf(song)
  const singer = singerNameOf(song)
  const songmid = songMidOf(song)
  const albumMid = albumMidOf(song)

  return {
    id: `${songmid || song?.id || ''}`,
    name: song?.name ?? song?.title ?? '',
    cover: albumMid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${albumMid}.jpg` : '',
    duration: parseInt(song?.interval ?? 0),
    artist: {
      id: `${singers[0]?.mid ?? singers[0]?.singer_mid ?? singers[0]?.id ?? singers[0]?.singer_id ?? ''}`,
      name: singer,
      cover: singers[0]?.mid || singers[0]?.singer_mid ? `https://y.qq.com/music/photo_new/T001R500x500M000${singers[0]?.mid ?? singers[0]?.singer_mid}.jpg` : '',
    },
    ext: {
      source: QQ_SOURCE,
      songmid: `${songmid}`,
      singer: singer,
      songName: song?.name ?? song?.title ?? '',
      albumName: albumNameOf(song),
      albumMid: `${albumMid}`,
      singerMid: singers[0]?.mid ?? singers[0]?.singer_mid ?? singers[0]?.id ?? singers[0]?.singer_id ?? '',
    }
  }
}

/* 其他 map 函数（mapToplistCard、mapArtistCard、mapAlbumCard、mapPlaylistCard）完全不变，省略以节省篇幅 */

async function getConfig() { return jsonify(appConfig) }

async function getSongs(ext) {
  const { page = 1, gid, id, period } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let songs = []

  if (gidValue == GID.RECENT_PLAYED) {
    const offset = Math.max(page - 1, 0) * PAGE_LIMIT
    songs = recentPlayed.slice(offset, offset + PAGE_LIMIT)
    return jsonify({ list: songs })
  }

  /* 以下所有原有逻辑完全不变 */
  if (gidValue == GID.TOPLISTS) { /* ... */ }
  if (gidValue == GID.SEARCH_PLAYLISTS) { /* ... */ }
  if (gidValue == GID.ARTIST_SONGS) { /* ... */ }
  if (gidValue == GID.ALBUM_SONGS) { /* ... */ }

  return jsonify({ list: songs })
}

/* getArtists、getPlaylists、getAlbums、search、所有 load* 函数 完全不变 */

async function getSongInfo(ext) {
  const parsed = argsify(ext)
  const {
    source,
    songmid,
    singer,
    songName,
    quality,
    albumMid = '',
    singerMid = '',
    albumName = ''
  } = parsed

  /**
   * 【核心修复】：只要 getSongInfo 被调用（即任何播放行为，包括自动下一首），就自动记录
   * - 播放任意列表 → 自动加入最近播放（新歌加入，已有则置顶）
   * - 播放“最近播放”列表本身 → 也会自动置顶（符合用户对“最近播放”的常规预期）
   * - 彻底解决“只有点击收藏按钮才记录”的问题
   * - 去重 + 最多保留 200 首
   */
  if (songmid) {
    const songObj = {
      id: `${songmid}`,
      name: songName ?? '',
      cover: albumMid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${albumMid}.jpg` : '',
      duration: 0,
      artist: {
        id: `${singerMid}`,
        name: singer ?? '',
        cover: singerMid ? `https://y.qq.com/music/photo_new/T001R500x500M000${singerMid}.jpg` : '',
      },
      ext: {
        source: source ?? QQ_SOURCE,
        songmid: `${songmid}`,
        singer: singer ?? '',
        songName: songName ?? '',
        albumName: albumName,
        albumMid: `${albumMid}`,
        singerMid: `${singerMid}`,
      }
    }

    // 去重 + 置顶（最新播放的永远在最前面）
    recentPlayed = recentPlayed.filter(s => s.id !== songObj.id)
    recentPlayed.unshift(songObj)

    if (recentPlayed.length > MAX_RECENT) {
      recentPlayed = recentPlayed.slice(0, MAX_RECENT)
    }
  }

  // 原有获取播放链接逻辑（完全不变）
  if (songmid == undefined || source == undefined) {
    return jsonify({ urls: [] })
  }

  const result = await $lx.request('musicUrl', {
    type: quality || '320k',
    musicInfo: {
      songmid: `${songmid}`,
      name: songName ?? '',
      singer: singer ?? '',
    },
  }, {
    source: `${source}`,
  })
  const soundurl = typeof result === 'string' ? result : result?.url ?? result?.data?.url ?? result?.urls?.[0]

  return jsonify({ urls: soundurl ? [soundurl] : [] })
}
