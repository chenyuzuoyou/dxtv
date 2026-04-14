/*!
 * @name qishuifm
 * @description qishuifm
 * @version v1.0.0
 * @author codex
 * @key csp_qishuifm
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = {
  'User-Agent': UA,
}
const PAGE_LIMIT = 20
const SEARCH_PAGE_LIMIT = 5
const QISHUI_SOURCE = 'qs'
const GID = {
  TOPLISTS: '1',
  TOP_ARTISTS: '2',
  ARTIST_SONGS: '3',
  ARTIST_ALBUMS: '4',
  ALBUM_SONGS: '5',
  SEARCH_PLAYLISTS: '6',
  TAG_PLAYLISTS: '7',
}
const appConfig = {
  ver: 1,
  name: 'qishuifm',
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
      ext: {
        gid: GID.TOPLISTS,
        id: '101',
      }
    }, {
      name: '热歌榜',
      type: 'song',
      ui: 0,
      showMore: false,
      ext: {
        gid: GID.TOPLISTS,
        id: '102',
      }
    }, {
      name: '新歌榜',
      type: 'song',
      ui: 0,
      showMore: false,
      ext: {
        gid: GID.TOPLISTS,
        id: '103',
      }
    }, {
      name: '排行榜',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TOPLISTS,
      }
    }, {
      name: '流行歌单',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PLAYLISTS,
        categoryId: '1',
        sortId: '5',
      }
    }, {
      name: '国语精选',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PLAYLISTS,
        categoryId: '2',
        sortId: '5',
      }
    }, {
      name: '轻音乐',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PLAYLISTS,
        categoryId: '3',
        sortId: '5',
      }
    }, {
      name: '影视原声',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PLAYLISTS,
        categoryId: '4',
        sortId: '5',
      }
    }, {
      name: '治愈歌单',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PLAYLISTS,
        categoryId: '5',
        sortId: '5',
      }
    }, {
      name: '热门歌手',
      type: 'artist',
      ui: 0,
      showMore: true,
      ext: {
        gid: GID.TOP_ARTISTS,
      }
    }]
  },
  tabMe: {
    name: '我的',
    groups: [{
      name: '红心',
      type: 'song'
    }, {
      name: '歌单',
      type: 'playlist'
    }, {
      name: '专辑',
      type: 'album'
    }, {
      name: '创作者',
      type: 'artist'
    }]
  },
  tabSearch: {
    name: '搜索',
    groups: [{
      name: '歌曲',
      type: 'song',
      ext: {
        type: 'song',
      }
    }, {
      name: '歌单',
      type: 'playlist',
      ext: {
        type: 'playlist',
      }
    }, {
      name: '专辑',
      type: 'album',
      ext: {
        type: 'album',
      }
    }, {
      name: '歌手',
      type: 'artist',
      ext: {
        type: 'artist',
      }
    }]
  }
}
function safeArgs(data) {
  return typeof data === 'string' ? argsify(data) : (data ?? {})
}
function toHttps(url) {
  if (!url) {
    return ''
  }
  return `${url}`.replace(/^http:\/\//, 'https://')
}
function withQishuiHeaders(extra = {}) {
  return {
    ...headers,
    Referer: 'https://music.qishui.com/',
    Origin: 'https://music.qishui.com',
    Cookie: 'uid=0;',
    ...extra,
  }
}
function buildSearchUrl(text, page, searchType = 0, limit = PAGE_LIMIT) {
  const payload = {
    comm: {
      ct: '21',
      cv: '100',
      uid: '0',
    },
    req: {
      method: 'Search',
      module: 'music.search.SearchService',
      param: {
        num_per_page: limit,
        page_num: page,
        query: text,
        search_type: searchType,
      }
    }
  }
  return `https://api.qishui.com/cgi-bin/music.fcg?format=json&data=${encodeURIComponent(JSON.stringify(payload))}`
}
function buildMusicUrl(payload) {
  return `https://api.qishui.com/cgi-bin/music.fcg?format=json&data=${encodeURIComponent(JSON.stringify(payload))}`
}
async function fetchJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, {
    headers: withQishuiHeaders(extraHeaders),
  })
  return safeArgs(data)
}
async function fetchHtml(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, {
    headers: {
      ...headers,
      ...extraHeaders,
    },
  })
  return `${data ?? ''}`
}
function parseInitialData(html) {
  const match = html.match(/__INITIAL_DATA__\s*=\s*({[\s\S]*?})<\/script>/)
  if (!match?.[1]) {
    return {}
  }
  return safeArgs(match[1])
}
function singerListOf(song) {
  return song?.singer ?? song?.artists ?? []
}
function singerNameOf(song) {
  return singerListOf(song).map((artist) => artist?.name ?? '').filter(Boolean).join('/')
}
function albumIdOf(song) {
  return song?.album?.id ?? song?.albumId ?? ''
}
function albumNameOf(song) {
  return song?.album?.name ?? song?.albumName ?? ''
}
function songIdOf(song) {
  return song?.id ?? song?.songId ?? ''
}
function mapSong(rawSong) {
  const song = rawSong?.songInfo ?? rawSong ?? {}
  const singers = singerListOf(song)
  const singer = singerNameOf(song)
  const songId = songIdOf(song)
  const albumId = albumIdOf(song)
  return {
    id: `${songId || song?.id || ''}`,
    name: song?.name ?? song?.title ?? '',
    cover: albumId ? `https://img.qishui.com/photo/new/T002R800x800M000${albumId}.jpg` : '',
    duration: parseInt(song?.interval ?? 0),
    artist: {
      id: `${singers[0]?.id ?? singers[0]?.singerId ?? ''}`,
      name: singer,
      cover: singers[0]?.id
        ? `https://img.qishui.com/photo/new/T001R500x500M000${singers[0]?.id}.jpg`
        : '',
    },
    ext: {
      source: QISHUI_SOURCE,
      songId: `${songId}`,
      singer: singer,
      songName: song?.name ?? song?.title ?? '',
      albumName: albumNameOf(song),
    }
  }
}
function mapToplistCard(item) {
  return {
    id: `${item?.topId ?? ''}`,
    name: item?.title ?? '',
    cover: toHttps(item?.coverUrl ?? item?.picUrl ?? ''),
    artist: {
      id: 'qishui',
      name: item?.updateTips ?? 'qishuifm',
      cover: '',
    },
    ext: {
      gid: GID.TOPLISTS,
      id: `${item?.topId ?? ''}`,
      period: item?.period ?? '',
      type: 'playlist',
    }
  }
}
function mapArtistCard(artist) {
  const artistId = `${artist?.id ?? artist?.singerId ?? ''}`
  const artistName = artist?.name ?? ''
  const artistCover = toHttps(
    artist?.avatar
    ?? (artistId ? `https://img.qishui.com/photo/new/T001R500x500M000${artistId}.jpg` : '')
  )
  return {
    id: artistId,
    name: artistName,
    cover: artistCover,
    groups: [{
      name: '热门歌曲',
      type: 'song',
      ext: {
        gid: GID.ARTIST_SONGS,
        id: artistId,
      }
    }, {
      name: '专辑',
      type: 'album',
      ext: {
        gid: GID.ARTIST_ALBUMS,
        id: artistId,
      }
    }],
    ext: {
      gid: GID.TOP_ARTISTS,
      id: artistId,
    }
  }
}
function mapAlbumCard(album) {
  const albumId = `${album?.id ?? album?.albumId ?? ''}`
  const singers = album?.singers ?? []
  const firstSinger = singers[0] ?? {}
  const singerName = singers.map(a => a.name ?? '').filter(Boolean).join('/')
  const singerId = `${firstSinger?.id ?? ''}`
  return {
    id: albumId,
    name: album?.name ?? '',
    cover: toHttps(
      album?.cover
      ?? (albumId ? `https://img.qishui.com/photo/new/T002R800x800M000${albumId}.jpg` : '')
    ),
    artist: {
      id: singerId,
      name: singerName,
      cover: singerId ? `https://img.qishui.com/photo/new/T001R500x500M000${singerId}.jpg` : '',
    },
    ext: {
      gid: GID.ALBUM_SONGS,
      id: albumId,
      type: 'album',
    }
  }
}
function mapPlaylistCard(playlist) {
  const playlistId = `${playlist?.id ?? playlist?.dissid ?? ''}`
  return {
    id: playlistId,
    name: playlist?.title ?? playlist?.name ?? '',
    cover: toHttps(playlist?.cover ?? playlist?.imgurl ?? ''),
    artist: {
      id: `${playlist?.creatorId ?? ''}`,
      name: playlist?.creatorName ?? 'qishuifm',
      cover: toHttps(playlist?.avatar ?? ''),
    },
    ext: {
      gid: GID.SEARCH_PLAYLISTS,
      id: playlistId,
      type: 'playlist',
    }
  }
}
async function loadToplists() {
  const info = await fetchJson(buildMusicUrl({
    topList: {
      module: 'musicToplist.ToplistServer',
      method: 'GetAll',
      param: {}
    },
    comm: { ct: 21, cv: 0 }
  }))
  return info?.topList?.data?.list ?? []
}
async function loadToplistSongs(id, period, page = 1) {
  const offset = Math.max(page - 1, 0) * PAGE_LIMIT
  const info = await fetchJson(buildMusicUrl({
    detail: {
      module: 'musicToplist.ToplistServer',
      method: 'GetDetail',
      param: { topId: Number(id), offset, num: PAGE_LIMIT }
    },
    comm: { ct: 21, cv: 0 }
  }))
  return info?.detail?.data?.songList ?? []
}
async function loadPlaylistSongs(id, page = 1) {
  const info = await fetchJson(`https://api.qishui.com/v8/playlist/detail?id=${id}&format=json`)
  const list = info?.data?.songlist ?? []
  const offset = (page - 1) * PAGE_LIMIT
  return list.slice(offset, offset + PAGE_LIMIT)
}
async function loadTagPlaylists(categoryId, sortId = '5', page = 1) {
  const offset = (page - 1) * PAGE_LIMIT
  const end = offset + PAGE_LIMIT - 1
  const info = await fetchJson(`https://api.qishui.com/tag/playlist?categoryId=${categoryId}&sortId=${sortId}&offset=${offset}&limit=${PAGE_LIMIT}`)
  return info?.data?.list ?? []
}
async function loadSingerList(page = 1) {
  if (page > 1) return []
  const html = await fetchHtml('https://music.qishui.com/artist')
  const data = parseInitialData(html)
  return data?.artistList ?? []
}
async function loadSingerSongs(id, page = 1) {
  const offset = (page - 1) * PAGE_LIMIT
  const info = await fetchJson(buildMusicUrl({
    singer: {
      module: 'music.artist.ArtistServer',
      method: 'getSingerSongs',
      param: { singerId: id, offset, num: PAGE_LIMIT }
    },
    comm: { ct: 21, cv: 0 }
  }))
  return info?.singer?.data?.songlist ?? []
}
async function loadSingerAlbums(id, page = 1) {
  const offset = (page - 1) * PAGE_LIMIT
  const info = await fetchJson(buildMusicUrl({
    singer: {
      module: 'music.artist.ArtistServer',
      method: 'getSingerAlbums',
      param: { singerId: id, begin: offset, num: PAGE_LIMIT }
    },
    comm: { ct: 21, cv: 0 }
  }))
  return info?.singer?.data?.list ?? []
}
async function loadAlbumSongs(id, page = 1) {
  const offset = (page - 1) * PAGE_LIMIT
  const info = await fetchJson(buildMusicUrl({
    album: {
      module: 'music.album.AlbumServer',
      method: 'getAlbumSongs',
      param: { albumId: id, begin: offset, num: PAGE_LIMIT }
    },
    comm: { ct: 21, cv: 0 }
  }))
  return info?.album?.data?.songList ?? []
}
async function loadSearchBody(text, page, searchType) {
  const info = await fetchJson(buildSearchUrl(text, page, searchType))
  return info?.req?.data?.body ?? {}
}
async function getConfig() {
  return jsonify(appConfig)
}
async function getSongs(ext) {
  const { page, gid, id, period } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let songs = []
  if (gidValue == GID.TOPLISTS) {
    const list = await loadToplistSongs(id, period, page)
    songs = list.map(e => mapSong(e))
  }
  if (gidValue == GID.SEARCH_PLAYLISTS) {
    const list = await loadPlaylistSongs(id, page)
    songs = list.map(e => mapSong(e))
  }
  if (gidValue == GID.ARTIST_SONGS) {
    const list = await loadSingerSongs(id, page)
    songs = list.map(e => mapSong(e))
  }
  if (gidValue == GID.ALBUM_SONGS) {
    const list = await loadAlbumSongs(id, page)
    songs = list.map(e => mapSong(e))
  }
  return jsonify({ list: songs })
}
async function getArtists(ext) {
  const { page, gid } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let artists = []
  if (gidValue == GID.TOP_ARTISTS) {
    const list = await loadSingerList(page)
    artists = list.map(e => mapArtistCard(e))
  }
  return jsonify({ list: artists })
}
async function getPlaylists(ext) {
  const { page, gid, categoryId, sortId } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let cards = []
  if (gidValue == GID.TOPLISTS) {
    const topLists = await loadToplists()
    const offset = (page - 1) * PAGE_LIMIT
    cards = topLists.map(e => mapToplistCard(e))
    cards = cards.slice(offset, offset + PAGE_LIMIT)
  }
  if (gidValue == GID.TAG_PLAYLISTS) {
    const list = await loadTagPlaylists(categoryId, sortId, page)
    cards = list.map(e => mapPlaylistCard(e))
  }
  return jsonify({ list: cards })
}
async function getAlbums(ext) {
  const { page, gid, id } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let cards = []
  if (gidValue == GID.ARTIST_ALBUMS) {
    const list = await loadSingerAlbums(id, page)
    cards = list.map(e => mapAlbumCard(e))
  }
  return jsonify({ list: cards })
}
async function search(ext) {
  const { text, page, type } = argsify(ext)
  if (!text || page > SEARCH_PAGE_LIMIT) return jsonify({})
  if (type == 'song') {
    const body = await loadSearchBody(text, page, 0)
    return jsonify({ list: (body?.song?.list ?? []).map(mapSong) })
  }
  if (type == 'playlist') {
    const body = await loadSearchBody(text, page, 3)
    return jsonify({ list: (body?.playlist?.list ?? []).map(mapPlaylistCard) })
  }
  if (type == 'album') {
    const body = await loadSearchBody(text, page, 2)
    return jsonify({ list: (body?.album?.list ?? []).map(mapAlbumCard) })
  }
  if (type == 'artist') {
    const body = await loadSearchBody(text, page, 1)
    return jsonify({ list: (body?.artist?.list ?? []).map(mapArtistCard) })
  }
  return jsonify({})
}
async function getSongInfo(ext) {
  const { source, songId, singer, songName, quality } = argsify(ext)
  if (!songId || source !== QISHUI_SOURCE) return jsonify({ urls: [] })
  const result = await $lx.request('musicUrl', {
    type: quality || '320k',
    musicInfo: { songId, name: songName, singer }
  }, { source: QISHUI_SOURCE })
  const url = typeof result === 'string' ? result : result?.url ?? result?.data?.url ?? result?.urls?.[0]
  return jsonify({ urls: url ? [url] : [] })
}