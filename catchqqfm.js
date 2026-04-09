/*!
 * @name catchQQ
 * @description catchQQ
 * @version v1.0.0
 * @author codex
 * @key csp_qqfm
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
  RECENT_PLAYS: '8'
}

const RECENT_PLAY_CONFIG = {
  KEY: 'catchqq_recent_plays',
  MAX_LIMIT: 100
}

const appConfig = {
  ver: 1,
  name: 'catchQQ',
  message: '',
  warning: '',
  desc: '',
  tabLibrary: {
    name: '探索',
    groups: [{
      name: '飙升榜',
      type: 'song',
      ui: 0,
      showMore: false,
      ext: { gid: GID.TOPLISTS, id: '62' }
    }, {
      name: '热歌榜',
      type: 'song',
      ui: 0,
      showMore: false,
      ext: { gid: GID.TOPLISTS, id: '26' }
    }, {
      name: '新歌榜',
      type: 'song',
      ui: 0,
      showMore: false,
      ext: { gid: GID.TOPLISTS, id: '27' }
    }, {
      name: '排行榜',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: { gid: GID.TOPLISTS }
    }, {
      name: '流行歌单',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: { gid: GID.TAG_PLAYLISTS, categoryId: '6', sortId: '5' }
    }, {
      name: '国语精选',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: { gid: GID.TAG_PLAYLISTS, categoryId: '165', sortId: '5' }
    }, {
      name: '轻音乐',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: { gid: GID.TAG_PLAYLISTS, categoryId: '15', sortId: '5' }
    }, {
      name: '影视原声',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: { gid: GID.TAG_PLAYLISTS, categoryId: '133', sortId: '5' }
    }, {
      name: '治愈歌单',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: { gid: GID.TAG_PLAYLISTS, categoryId: '116', sortId: '5' }
    }, {
      name: '热门歌手',
      type: 'artist',
      ui: 0,
      showMore: true,
      ext: { gid: GID.TOP_ARTISTS }
    }]
  },
  tabMe: {
    name: '我的',
    groups: [{
      name: '红心', type: 'song'
    }, {
      name: '歌单', type: 'playlist'
    }, {
      name: '专辑', type: 'album'
    }, {
      name: '创作者', type: 'artist'
    }, {
      name: '最近播放',
      type: 'song',
      ext: { gid: GID.RECENT_PLAYS }
    }]
  },
  tabSearch: {
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

function getRecentPlayCache() {
  try {
    return JSON.parse($persistentStore.read(RECENT_PLAY_CONFIG.KEY) || '[]')
  } catch (e) {
    return []
  }
}

function saveRecentPlay(song) {
  if (!song?.id || !song?.ext?.songmid) return
  let list = getRecentPlayCache()
  list = list.filter(item => item.id !== song.id)
  list.unshift(song)
  if (list.length > RECENT_PLAY_CONFIG.MAX_LIMIT) {
    list = list.slice(0, RECENT_PLAY_CONFIG.MAX_LIMIT)
  }
  $persistentStore.write(JSON.stringify(list), RECENT_PLAY_CONFIG.KEY)
}

async function getRecentPlays(page = 1) {
  const all = getRecentPlayCache()
  const start = (page - 1) * PAGE_LIMIT
  return all.slice(start, start + PAGE_LIMIT)
}

function safeArgs(data) {
  return typeof data === 'string' ? argsify(data) : (data ?? {})
}

function toHttps(url) {
  return url ? url.replace(/^http:\/\//, 'https://') : ''
}

function withQqHeaders(extra = {}) {
  return {
    ...headers,
    Referer: 'https://y.qq.com/',
    Origin: 'https://y.qq.com',
    Cookie: 'uin=0;',
    ...extra,
  }
}

function buildSearchUrl(text, page, searchType = 0, limit = PAGE_LIMIT) {
  const payload = {
    comm: { ct: '19', cv: '1859', uin: '0' },
    req: {
      method: 'DoSearchForQQMusicDesktop',
      module: 'music.search.SearchCgiService',
      param: { grp: 1, num_per_page: limit, page_num: page, query: text, search_type: searchType }
    }
  }
  return `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=${encodeURIComponent(JSON.stringify(payload))}`
}

function buildMusicuUrl(payload) {
  return `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=${encodeURIComponent(JSON.stringify(payload))}`
}

async function fetchJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, { headers: withQqHeaders(extraHeaders) })
  return safeArgs(data)
}

async function fetchHtml(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, { headers: { ...headers, ...extraHeaders } })
  return `${data ?? ''}`
}

function parseInitialData(html) {
  const match = html.match(/__INITIAL_DATA__\s*=\s*({[\s\S]*?})<\/script>/)
  return match?.[1] ? safeArgs(match[1]) : {}
}

function singerListOf(song) {
  return song?.singer ?? song?.singer_list ?? []
}

function singerNameOf(song) {
  return singerListOf(song).map(a => a?.name ?? a?.singer_name ?? '').filter(Boolean).join('/')
}

function albumMidOf(song) {
  return song?.album?.mid ?? song?.albumMid ?? song?.album_mid ?? song?.albummid ?? ''
}

function albumNameOf(song) {
  return song?.album?.name ?? song?.albumName ?? song?.album_name ?? ''
}

function songMidOf(song) {
  return song?.mid ?? song?.songmid ?? song?.song_mid ?? ''
}

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
      id: `${singers[0]?.mid ?? singers[0]?.singer_mid ?? singers[0]?.id ?? ''}`,
      name: singer,
      cover: singers[0]?.mid ? `https://y.qq.com/music/photo_new/T001R500x500M000${singers[0]?.mid}.jpg` : ''
    },
    ext: {
      source: QQ_SOURCE,
      songmid: `${songmid}`,
      singer: singer,
      songName: song?.name ?? '',
      albumName: albumNameOf(song)
    }
  }
}

function mapToplistCard(item) {
  return {
    id: `${item?.topId ?? ''}`,
    name: item?.title ?? '',
    cover: toHttps(item?.headPicUrl ?? item?.frontPicUrl ?? ''),
    artist: { id: 'qq', name: item?.updateTips ?? 'qqfm', cover: '' },
    ext: { gid: GID.TOPLISTS, id: `${item?.topId ?? ''}` }
  }
}

function mapArtistCard(artist) {
  const id = `${artist?.singerMID ?? artist?.mid ?? ''}`
  return {
    id,
    name: artist?.singerName ?? artist?.name ?? '',
    cover: toHttps(artist?.singerPic ?? (id ? `https://y.qq.com/music/photo_new/T001R500x500M000${id}.jpg` : '')),
    groups: [
      { name: '热门歌曲', type: 'song', ext: { gid: GID.ARTIST_SONGS, id } },
      { name: '专辑', type: 'album', ext: { gid: GID.ARTIST_ALBUMS, id } }
    ],
    ext: { gid: GID.TOP_ARTISTS, id }
  }
}

function mapAlbumCard(album) {
  const mid = `${album?.albumMID ?? album?.album_mid ?? ''}`
  const singers = album?.singer_list ?? []
  const sName = singers.map(a => a?.name ?? '').join('/')
  const sMid = `${singers[0]?.mid ?? ''}`
  return {
    id: mid,
    name: album?.albumName ?? '',
    cover: toHttps(album?.albumPic ?? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${mid}.jpg`),
    artist: { id: sMid, name: sName, cover: sMid ? `https://y.qq.com/music/photo_new/T001R500x500M000${sMid}.jpg` : '' },
    ext: { gid: GID.ALBUM_SONGS, id: mid }
  }
}

function mapPlaylistCard(pl) {
  const id = `${pl?.dissid ?? pl?.disstid ?? pl?.id ?? ''}`
  return {
    id,
    name: pl?.dissname ?? pl?.title ?? '',
    cover: toHttps(pl?.imgurl ?? pl?.logo ?? ''),
    artist: { id: `${pl?.creator?.uin ?? ''}`, name: pl?.creator?.name ?? 'qqfm', cover: '' },
    ext: { gid: GID.SEARCH_PLAYLISTS, id }
  }
}

async function loadToplists() {
  const d = await fetchJson('https://u.y.qq.com/cgi-bin/musicu.fcg?data=%7B%22comm%22%3A%7B%22ct%22%3A23%7D%2C%22topList%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetAll%22%2C%22param%22%3A%7B%7D%7D%7D')
  return (d?.topList?.data?.group ?? []).flatMap(g => g?.toplist ?? [])
}

async function loadToplistSongs(id, period, page) {
  const offset = (page - 1) * PAGE_LIMIT
  const d = await fetchJson(buildMusicuUrl({
    detail: { module: 'musicToplist.ToplistInfoServer', method: 'GetDetail', param: { topId: +id, offset, num: PAGE_LIMIT, period } },
    comm: { ct: 24 }
  }))
  return d?.detail?.data?.songInfoList ?? []
}

async function loadPlaylistSongs(id, page) {
  const d = await fetchJson(`https://c.y.qq.com/v8/fcg-bin/fcg_v8_playlist_cp.fcg?id=${id}&format=json`)
  const list = d?.data?.cdlist?.[0]?.songlist ?? []
  return list.slice((page - 1)*PAGE_LIMIT, page*PAGE_LIMIT)
}

async function loadTagPlaylists(cid, sid, page) {
  const s = (page-1)*PAGE_LIMIT, e = s+PAGE_LIMIT-1
  const d = await fetchJson(`https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg?categoryId=${cid}&sortId=${sid}&sin=${s}&ein=${e}`)
  return d?.data?.list ?? []
}

async function loadSingerList() {
  const html = await fetchHtml('https://y.qq.com/n/ryqq/singer_list')
  return parseInitialData(html)?.singerListImage ?? []
}

async function loadSingerSongs(id, page) {
  const d = await fetchJson(buildMusicuUrl({
    comm: { ct:24 },
    singer: { module:'music.web_singer_info_svr', method:'get_singer_detail_info', param:{ singermid:id, sort:5, sin:(page-1)*PAGE_LIMIT, num:PAGE_LIMIT } }
  }))
  return d?.singer?.data?.songlist ?? []
}

async function loadSingerAlbums(id, page) {
  const d = await fetchJson(buildMusicuUrl({
    comm: { ct:24 },
    singer: { module:'music.web_singer_info_svr', method:'get_singer_album', param:{ singermid:id, begin:(page-1)*PAGE_LIMIT, num:PAGE_LIMIT } }
  }))
  return d?.singer?.data?.list ?? []
}

async function loadAlbumSongs(id, page) {
  const d = await fetchJson(buildMusicuUrl({
    comm: { ct:24 },
    album: { module:'music.musichallAlbum.AlbumSongList', method:'GetAlbumSongList', param:{ albumMid:id, begin:(page-1)*PAGE_LIMIT, num:PAGE_LIMIT } }
  }))
  return d?.album?.data?.songList ?? []
}

async function loadSearchBody(text, page, st) {
  const d = await fetchJson(buildSearchUrl(text, page, st))
  return d?.req?.data?.body ?? {}
}

async function getConfig() {
  return jsonify(appConfig)
}

async function getSongs(ext) {
  const { page, gid, id, period } = safeArgs(ext)
  let songs = []
  if (gid == GID.TOPLISTS) songs = (await loadToplistSongs(id, period, page)).map(mapSong)
  if (gid == GID.SEARCH_PLAYLISTS) songs = (await loadPlaylistSongs(id, page)).map(mapSong)
  if (gid == GID.ARTIST_SONGS) songs = (await loadSingerSongs(id, page)).map(mapSong)
  if (gid == GID.ALBUM_SONGS) songs = (await loadAlbumSongs(id, page)).map(mapSong)
  if (gid == GID.RECENT_PLAYS) songs = await getRecentPlays(page)
  return jsonify({ list: songs })
}

async function getArtists(ext) {
  const { page, gid } = safeArgs(ext)
  let list = []
  if (gid == GID.TOP_ARTISTS) list = await loadSingerList(page)
  return jsonify({ list: list.map(mapArtistCard) })
}

async function getPlaylists(ext) {
  const { page, gid, categoryId, sortId } = safeArgs(ext)
  let cards = []
  if (gid == GID.TOPLISTS) {
    const tops = await loadToplists()
    cards = tops.filter(i => i.title && i.title !== 'MV榜').map(mapToplistCard)
    cards = cards.slice((page-1)*PAGE_LIMIT, page*PAGE_LIMIT)
  }
  if (gid == GID.TAG_PLAYLISTS) {
    cards = (await loadTagPlaylists(categoryId, sortId, page)).map(mapPlaylistCard)
  }
  return jsonify({ list: cards })
}

async function getAlbums(ext) {
  const { page, gid, id } = safeArgs(ext)
  let list = []
  if (gid == GID.ARTIST_ALBUMS) list = await loadSingerAlbums(id, page)
  return jsonify({ list: list.map(mapAlbumCard) })
}

async function search(ext) {
  const { text, page, type } = safeArgs(ext)
  if (!text || page > SEARCH_PAGE_LIMIT) return jsonify({})
  if (type === 'song') {
    const b = await loadSearchBody(text, page, 0)
    return jsonify({ list: (b.song?.list ?? []).map(mapSong) })
  }
  if (type === 'playlist') {
    const b = await loadSearchBody(text, page, 3)
    return jsonify({ list: (b.songlist?.list ?? []).map(mapPlaylistCard) })
  }
  if (type === 'album') {
    const b = await loadSearchBody(text, page, 2)
    return jsonify({ list: (b.album?.list ?? []).map(mapAlbumCard) })
  }
  if (type === 'artist') {
    const b = await loadSearchBody(text, page, 1)
    return jsonify({ list: (b.singer?.list ?? []).map(mapArtistCard) })
  }
  return jsonify({})
}

// ————————————————————————————————————————
// 核心修复：正常播放走原版，最近播放走缓存
// ————————————————————————————————————————
async function getSongInfo(ext) {
  const { source, songmid, singer, songName, quality, gid } = safeArgs(ext)
  if (!songmid || !source) return jsonify({ urls: [] })

  // 最近播放 → 强制走缓存
  if (gid == GID.RECENT_PLAYS) {
    return jsonify({ urls: ['cache://' + songmid] })
  }

  // 正常列表 → 原版逻辑不变
  const result = await $lx.request('musicUrl', {
    type: quality || '320k',
    musicInfo: { songmid, name: songName, singer }
  }, { source })

  const url = typeof result === 'string' ? result : (result?.url || result?.data?.url || result?.urls?.[0])

  // 播放成功 → 加入最近播放
  if (url) {
    const full = await getSongFullInfo(songmid)
    if (full) saveRecentPlay(full)
  }

  return jsonify({ urls: url ? [url] : [] })
}

// 辅助：获取完整歌曲信息用于保存最近播放
async function getSongFullInfo(songmid) {
  try {
    const res = await fetchJson(buildMusicuUrl({
      comm: { ct: 24 },
      song: {
        module: 'music.pfcOnlineSvr',
        method: 'GetSongInfo',
        param: { songmid }
      }
    }))
    const s = res?.song?.data?.trackInfo || res?.song?.data?.songInfo
    return s ? mapSong(s) : null
  } catch (e) {
    return null
  }
}
