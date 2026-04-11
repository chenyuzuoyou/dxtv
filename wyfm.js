/*!
 * @name wyfm
 * @description wyfm
 * @version v1.0.0
 * @author codex
 * @key csp_wyfm
 */

const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = {
  'User-Agent': UA,
}

const PAGE_LIMIT = 100
const SEARCH_PAGE_LIMIT = 5
const WY_SOURCE = 'wy'
const GID = {
  RECOMMENDED_SONGS: '1',
  RECOMMENDED_PLAYLISTS: '2',
  CHINESE_PLAYLISTS: '3',
  POP_PLAYLISTS: '4',
  TOPLISTS: '5',
  NEW_ALBUMS: '6',
  TOP_ARTISTS: '7',
  ARTIST_ALBUMS: '8',
  SEARCH_PLAYLISTS: '9',
}

const appConfig = {
  ver: 1,
  name: 'wyfm',
  message: '',
  warning: '',
  desc: '',
  tabLibrary: {
    name: '探索',
    groups: [{
      name: '推荐新歌',
      type: 'song',
      ui: 0,
      showMore: false,
      ext: {
        gid: GID.RECOMMENDED_SONGS,
      }
    }, {
      name: '推荐歌单',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.RECOMMENDED_PLAYLISTS,
      }
    }, {
      name: '华语热门',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.CHINESE_PLAYLISTS,
      }
    }, {
      name: '流行歌单',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.POP_PLAYLISTS,
      }
    }, {
      name: '官方榜单',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TOPLISTS,
      }
    }, {
      name: '新碟上架',
      type: 'album',
      ui: 0,
      showMore: false,
      ext: {
        gid: GID.NEW_ALBUMS,
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

function withWyHeaders(extra = {}) {
  return {
    ...headers,
    Referer: 'https://music.163.com/',
    Origin: 'https://music.163.com',
    ...extra,
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

function artistListOf(song) {
  return song?.ar ?? song?.artists ?? []
}

function artistNameOf(song) {
  return artistListOf(song).map((artist) => artist.name).join('/')
}

function mapSong(song, fallback = {}) {
  const artists = artistListOf(song)
  const album = song?.al ?? song?.album ?? fallback.album ?? {}
  const songId = song?.id ?? fallback.id ?? ''
  const songName = song?.name ?? fallback.name ?? ''
  const singer = artistNameOf(song) || fallback.singer || ''
  const duration = parseInt((song?.dt ?? song?.duration ?? fallback.duration ?? 0) / 1000)

  return {
    id: `${songId}`,
    name: songName,
    cover: toHttps(album?.picUrl ?? fallback.cover ?? ''),
    duration: duration,
    artist: {
      id: `${artists[0]?.id ?? fallback.artistId ?? ''}`,
      name: singer,
      cover: toHttps(artists[0]?.img1v1Url ?? fallback.artistCover ?? ''),
    },
    ext: {
      source: WY_SOURCE,
      songmid: `${songId}`,
      singer: singer,
      songName: songName,
    }
  }
}

function mapPlaylistCard(playlist, gid) {
  const creator = playlist?.creator ?? {}

  return {
    id: `${playlist?.id ?? ''}`,
    name: playlist?.name ?? '',
    cover: toHttps(playlist?.coverImgUrl ?? playlist?.picUrl ?? playlist?.coverUrl ?? ''),
    artist: {
      id: `${creator?.userId ?? playlist?.userId ?? 'wy'}`,
      name: creator?.nickname ?? playlist?.copywriter ?? playlist?.recommendText ?? 'wyfm',
      cover: toHttps(creator?.avatarUrl ?? ''),
    },
    ext: {
      gid: `${gid}`,
      id: `${playlist?.id ?? ''}`,
      type: 'playlist',
    }
  }
}

function mapAlbumCard(album, gid = GID.NEW_ALBUMS) {
  const artist = album?.artist ?? album?.artists?.[0] ?? {}

  return {
    id: `${album?.id ?? ''}`,
    name: album?.name ?? '',
    cover: toHttps(album?.picUrl ?? album?.blurPicUrl ?? ''),
    artist: {
      id: `${artist?.id ?? ''}`,
      name: artist?.name ?? '',
      cover: toHttps(artist?.picUrl ?? artist?.img1v1Url ?? ''),
    },
    ext: {
      gid: `${gid}`,
      id: `${album?.id ?? ''}`,
      type: 'album',
    }
  }
}

function mapArtistCard(artist, gid = GID.TOP_ARTISTS) {
  const artistId = `${artist?.id ?? ''}`
  const artistName = artist?.name ?? ''
  const artistCover = toHttps(artist?.picUrl ?? artist?.img1v1Url ?? '')

  return {
    id: artistId,
    name: artistName,
    cover: artistCover,
    groups: [{
      name: '热门歌曲',
      type: 'song',
      ext: {
        gid: GID.TOP_ARTISTS,
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
      gid: `${gid}`,
      id: artistId,
    }
  }
}

async function fetchJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, {
    headers: withWyHeaders(extraHeaders),
  })

  return safeArgs(data)
}

function uniqueBySongId(songs) {
  const seen = new Set()

  return songs.filter((song) => {
    const songId = `${song?.id ?? ''}`

    if (!songId || seen.has(songId)) {
      return false
    }

    seen.add(songId)
    return true
  })
}

async function loadWyPlaylistTracks(id, page = 1) {
  const info = await fetchJson(`https://music.163.com/api/v6/playlist/detail?id=${id}&n=0&s=0`)
  const playlist = info?.playlist ?? {}
  const offset = Math.max(page - 1, 0) * PAGE_LIMIT
  const trackIds = (playlist?.trackIds ?? [])
    .map((each) => `${each?.id ?? ''}`)
    .filter(Boolean)
  const pageTrackIds = trackIds.slice(offset, offset + PAGE_LIMIT)
  const trackMap = new Map()

  ;(playlist?.tracks ?? []).forEach((each) => {
    if (each?.id == undefined) {
      return
    }

    trackMap.set(`${each.id}`, each)
  })

  const missingTrackIds = pageTrackIds.filter((trackId) => !trackMap.has(trackId))

  if (missingTrackIds.length > 0) {
    const detailInfo = await fetchJson(`https://music.163.com/api/song/detail?ids=${encodeURIComponent(JSON.stringify(missingTrackIds))}`)
    const detailTracks = detailInfo?.songs ?? detailInfo?.songsData ?? []

    detailTracks.forEach((each) => {
      if (each?.id == undefined) {
        return
      }

      trackMap.set(`${each.id}`, each)
    })
  }

  if (pageTrackIds.length > 0) {
    return pageTrackIds
      .map((trackId) => trackMap.get(trackId))
      .filter(Boolean)
      .filter((song, index, list) => list.findIndex((each) => `${each?.id ?? ''}` == `${song?.id ?? ''}`) == index)
  }

  return uniqueBySongId((playlist?.tracks ?? []).slice(offset, offset + PAGE_LIMIT))
}

async function loadWyAlbumSongs(id) {
  const info = await fetchJson(`https://music.163.com/api/v1/album/${id}`)
  return info?.songs ?? []
}

function buildWebSearchUrl(text, page, code) {
  const offset = (page - 1) * PAGE_LIMIT
  return `https://music.163.com/api/search/get/web?type=${code}&s=${encodeURIComponent(text)}&offset=${offset}&limit=${PAGE_LIMIT}`
}

async function getConfig() {
  return jsonify(appConfig)
}

async function getSongs(ext) {
  const { page, gid, id } = argsify(ext)
  const gidValue = `${gid ?? ''}`

  if (page > 1 && [
    GID.RECOMMENDED_SONGS,
    GID.TOPLISTS,
    GID.NEW_ALBUMS,
    GID.TOP_ARTISTS,
  ].includes(gidValue)) {
    return jsonify({
      list: [],
    })
  }

  let songs = []

  if (gidValue == GID.RECOMMENDED_SONGS) {
    const info = await fetchJson('https://music.163.com/api/personalized/newsong')
    const list = info?.result ?? info?.data?.result ?? []

    songs = list.map((each) => {
      const song = each?.song ?? each
      const album = song?.al ?? song?.album ?? each?.album ?? {}
      return mapSong(song, {
        cover: each?.picUrl ?? album?.picUrl ?? '',
      })
    })
  }

  if ([
    GID.RECOMMENDED_PLAYLISTS,
    GID.CHINESE_PLAYLISTS,
    GID.POP_PLAYLISTS,
    GID.TOPLISTS,
    GID.SEARCH_PLAYLISTS,
  ].includes(gidValue)) {
    const tracks = await loadWyPlaylistTracks(id, page)
    songs = tracks.map((each) => mapSong(each))
  }

  if (gidValue == GID.NEW_ALBUMS) {
    const tracks = await loadWyAlbumSongs(id)
    songs = tracks.map((each) => mapSong(each))
  }

  if (gidValue == GID.TOP_ARTISTS) {
    const info = await fetchJson(`https://music.163.com/api/artist/top/song?id=${id}`)
    songs = (info?.songs ?? []).map((each) => mapSong(each))
  }

  return jsonify({
    list: songs,
  })
}

async function getArtists(ext) {
  const { page, gid } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let artists = []

  if (gidValue == GID.TOP_ARTISTS) {
    const offset = (page - 1) * PAGE_LIMIT
    const info = await fetchJson(`https://music.163.com/api/artist/top?limit=${PAGE_LIMIT}&offset=${offset}`)
    artists = (info?.artists ?? []).map((each) => mapArtistCard(each))
  }

  return jsonify({
    list: artists,
  })
}

async function getPlaylists(ext) {
  const { page, gid, from } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let cards = []

  if (gidValue == GID.RECOMMENDED_PLAYLISTS) {
    const offset = (page - 1) * PAGE_LIMIT
    const info = await fetchJson(`https://music.163.com/api/personalized/playlist?limit=${PAGE_LIMIT}&offset=${offset}`)
    cards = (info?.result ?? []).map((each) => mapPlaylistCard(each, gidValue))
  }

  if (gidValue == GID.CHINESE_PLAYLISTS) {
    const offset = (page - 1) * PAGE_LIMIT
    const info = await fetchJson(`https://music.163.com/api/playlist/list?cat=${encodeURIComponent('华语')}&order=hot&limit=${PAGE_LIMIT}&offset=${offset}`)
    cards = (info?.playlists ?? []).map((each) => mapPlaylistCard(each, gidValue))
  }

  if (gidValue == GID.POP_PLAYLISTS) {
    const offset = (page - 1) * PAGE_LIMIT
    const info = await fetchJson(`https://music.163.com/api/playlist/list?cat=${encodeURIComponent('流行')}&order=hot&limit=${PAGE_LIMIT}&offset=${offset}`)
    cards = (info?.playlists ?? []).map((each) => mapPlaylistCard(each, gidValue))
  }

  if (gidValue == GID.TOPLISTS) {
    const offset = (page - 1) * PAGE_LIMIT
    const info = await fetchJson('https://music.163.com/api/toplist/detail/v2')
    const toplists = (info?.data ?? []).flatMap((group) => group?.list ?? [])

    cards = toplists
      .filter((each) => each?.id && each?.targetType === 'PLAYLIST')
      .map((each) => ({
        id: `${each.id}`,
        name: each.name ?? '',
        cover: toHttps(each.coverUrl ?? each.coverImgUrl ?? each.firstCoverUrl ?? ''),
        artist: {
          id: 'wy',
          name: each.updateFrequency ?? 'wyfm',
          cover: '',
        },
        ext: {
          gid: GID.TOPLISTS,
          id: `${each.id}`,
          type: 'playlist',
        }
      }))

    if (from === 'index') {
      cards = cards.slice(0, PAGE_LIMIT)
    } else {
      cards = cards.slice(offset, offset + PAGE_LIMIT)
    }
  }

  return jsonify({
    list: cards,
  })
}

async function getAlbums(ext) {
  const { page, gid, id } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let cards = []

  if (gidValue == GID.NEW_ALBUMS) {
    if (page > 1) {
      return jsonify({
        list: [],
      })
    }

    const info = await fetchJson(`https://music.163.com/api/discovery/newAlbum?area=ALL&limit=${PAGE_LIMIT}`)
    cards = (info?.albums ?? []).map((each) => mapAlbumCard(each, gidValue))
  }

  if (gidValue == GID.ARTIST_ALBUMS) {
    const offset = (page - 1) * PAGE_LIMIT
    const info = await fetchJson(`https://music.163.com/api/artist/albums/${id}?offset=${offset}&limit=${PAGE_LIMIT}`)
    cards = (info?.hotAlbums ?? []).map((each) => mapAlbumCard(each, GID.NEW_ALBUMS))
  }

  return jsonify({
    list: cards,
  })
}

async function search(ext) {
  const { text, page, type } = argsify(ext)

  if (!text || page > SEARCH_PAGE_LIMIT) {
    return jsonify({})
  }

  if (type == 'song') {
    const info = await fetchJson(buildWebSearchUrl(text, page, 1))
    const songs = (info?.result?.songs ?? []).map((each) => {
      return mapSong(each, {
        cover: each?.album?.picUrl ?? '',
      })
    })

    return jsonify({
      list: songs,
    })
  }

  if (type == 'playlist') {
    const info = await fetchJson(buildWebSearchUrl(text, page, 1000))
    const cards = (info?.result?.playlists ?? []).map((each) => mapPlaylistCard(each, GID.SEARCH_PLAYLISTS))

    return jsonify({
      list: cards,
    })
  }

  if (type == 'album') {
    const info = await fetchJson(buildWebSearchUrl(text, page, 10))
    const cards = (info?.result?.albums ?? []).map((each) => mapAlbumCard(each, GID.NEW_ALBUMS))

    return jsonify({
      list: cards,
    })
  }

  if (type == 'artist') {
    const info = await fetchJson(buildWebSearchUrl(text, page, 100))
    const artists = (info?.result?.artists ?? []).map((each) => mapArtistCard(each))

    return jsonify({
      list: artists,
    })
  }

  return jsonify({})
}

async function getSongInfo(ext) {
  const { source, songmid, singer, songName, quality } = argsify(ext)

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
  const soundurl = typeof result === 'string'
    ? result
    : result?.url ?? result?.data?.url ?? result?.urls?.[0]

  return jsonify({ urls: soundurl ? [soundurl] : [] })
}
