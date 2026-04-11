/*!
 * @name kgfm
 * @description kgfm
 * @version v1.0.0
 * @author codex
 * @key csp_kgfm
 */

const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = {
  'User-Agent': UA,
}

const PAGE_LIMIT = 20
const SEARCH_PAGE_LIMIT = 5
const KG_SOURCE = 'kg'
const GID = {
  TOPLISTS: '1',
  TOP_ARTISTS: '2',
  ARTIST_SONGS: '3',
  ARTIST_ALBUMS: '4',
  ALBUM_SONGS: '5',
  SEARCH_PLAYLISTS: '6',
  FEATURED_PLAYLISTS: '7',
}

const appConfig = {
  ver: 1,
  name: 'kgfm',
  message: '',
  //warning: '⚠️🤖 警告，请勿使用 ⚡️📡',
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
        id: '6666',
      }
    }, {
      name: '热歌榜',
      type: 'song',
      ui: 0,
      showMore: false,
      ext: {
        gid: GID.TOPLISTS,
        id: '8888',
      }
    }, {
      name: '新歌榜',
      type: 'song',
      ui: 0,
      showMore: false,
      ext: {
        gid: GID.TOPLISTS,
        id: '23784',
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
      name: '推荐歌单',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.FEATURED_PLAYLISTS,
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

  return `${url}`
    .replace(/\{size\}/g, '400')
    .replace(/^http:\/\//, 'https://')
}

function withKgHeaders(extra = {}) {
  return {
    ...headers,
    Referer: 'https://www.kugou.com/',
    Origin: 'https://www.kugou.com',
    ...extra,
  }
}

async function fetchJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, {
    headers: withKgHeaders(extraHeaders),
  })

  return safeArgs(data)
}

function pick(...values) {
  for (const each of values) {
    if (each !== undefined && each !== null && `${each}` !== '') {
      return each
    }
  }
  return ''
}

function songHashOf(song) {
  return `${song?.hash ?? song?.audio_id ?? song?.songmid ?? ''}`
}

function singerIdOf(song) {
  return `${song?.singerid ?? song?.author_id ?? song?.artistid ?? ''}`
}

function singerNameOf(song) {
  return song?.singername ?? song?.author_name ?? song?.artist_name ?? song?.singerName ?? song?.author ?? ''
}

function songNameOf(song) {
  return song?.songname ?? song?.filename?.split('-')?.slice(1)?.join('-')?.trim() ?? song?.name ?? ''
}

function albumNameOf(song) {
  return song?.album_name ?? song?.albumname ?? song?.remark ?? ''
}

function coverOf(song) {
  return toHttps(pick(
    song?.album_sizable_cover,
    song?.trans_param?.union_cover,
    song?.imgurl,
    song?.sizable_cover,
    song?.album_img,
    song?.cover
  ))
}

function durationOf(song) {
  return parseInt(song?.duration ?? song?.timelen ?? 0)
}

function mapSong(rawSong) {
  const song = rawSong?.songInfo ?? rawSong ?? {}
  const hash = songHashOf(song)
  const singer = singerNameOf(song)
  const songName = songNameOf(song)
  const albumName = albumNameOf(song)
  const singerId = singerIdOf(song)

  return {
    id: `${hash || song?.album_audio_id || ''}`,
    name: songName,
    cover: coverOf(song),
    duration: durationOf(song),
    artist: {
      id: singerId,
      name: singer,
      cover: '',
    },
    ext: {
      source: KG_SOURCE,
      hash: `${hash}`,
      singer: singer,
      songName: songName,
      albumName: albumName,
      album_id: `${song?.album_id ?? ''}`,
    }
  }
}

function mapArtistCard(artist) {
  const artistId = `${artist?.singerid ?? artist?.id ?? ''}`
  const artistName = artist?.singername ?? artist?.name ?? ''
  const artistCover = toHttps(
    artist?.imgurl
    ?? artist?.avatar
    ?? artist?.singerimg
    ?? `https://imge.kugou.com/stdmusic/400/${artistId}.jpg`
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
  const albumId = `${album?.albumid ?? album?.id ?? ''}`
  const singerId = `${album?.singerid ?? ''}`
  const singerName = album?.singername ?? ''

  return {
    id: albumId,
    name: album?.albumname ?? album?.name ?? '',
    cover: toHttps(album?.imgurl ?? album?.cover ?? ''),
    artist: {
      id: singerId,
      name: singerName,
      cover: '',
    },
    ext: {
      gid: GID.ALBUM_SONGS,
      id: albumId,
      type: 'album',
    }
  }
}

function mapPlaylistCard(playlist) {
  const playlistId = `${playlist?.specialid ?? playlist?.id ?? ''}`

  return {
    id: playlistId,
    name: playlist?.specialname ?? playlist?.name ?? '',
    cover: toHttps(playlist?.imgurl ?? playlist?.cover ?? ''),
    artist: {
      id: `${playlist?.userid ?? playlist?.suid ?? ''}`,
      name: playlist?.nickname ?? playlist?.username ?? 'kgfm',
      cover: toHttps(playlist?.user_avatar ?? ''),
    },
    ext: {
      gid: GID.SEARCH_PLAYLISTS,
      id: playlistId,
      type: 'playlist',
    }
  }
}

function mapToplistCard(item) {
  return {
    id: `${item?.rankid ?? ''}`,
    name: item?.rankname ?? '',
    cover: toHttps(item?.imgurl ?? item?.banner7url ?? item?.bannerurl ?? ''),
    artist: {
      id: 'kg',
      name: item?.intro ?? 'kgfm',
      cover: '',
    },
    ext: {
      gid: GID.TOPLISTS,
      id: `${item?.rankid ?? ''}`,
      type: 'playlist',
    }
  }
}

async function loadToplists() {
  const info = await fetchJson('https://mobiles.kugou.com/api/v3/rank/list?withsong=1&json=true')
  return info?.data?.info ?? []
}

async function loadToplistSongs(id, page = 1) {
  return (await fetchJson(`https://mobiles.kugou.com/api/v3/rank/song?pagesize=${PAGE_LIMIT}&page=${page}&rankid=${encodeURIComponent(id)}&json=true`))?.data?.info ?? []
}

async function loadFeaturedPlaylists(page = 1) {
  return (await fetchJson(`https://mobiles.kugou.com/api/v3/search/special?format=json&keyword=${encodeURIComponent('热门')}&page=${page}&pagesize=${PAGE_LIMIT}`))?.data?.info ?? []
}

async function loadPlaylistSongs(id, page = 1) {
  return (await fetchJson(`https://mobiles.kugou.com/api/v3/special/song?specialid=${encodeURIComponent(id)}&page=${page}&pagesize=${PAGE_LIMIT}&json=true`))?.data?.info ?? []
}

async function loadSingerSongs(id, page = 1) {
  return (await fetchJson(`https://mobiles.kugou.com/api/v3/singer/song?singerid=${encodeURIComponent(id)}&page=${page}&pagesize=${PAGE_LIMIT}&json=true`))?.data?.info ?? []
}

async function loadSingerAlbums(id, page = 1) {
  return (await fetchJson(`https://mobiles.kugou.com/api/v3/singer/album?singerid=${encodeURIComponent(id)}&page=${page}&pagesize=${PAGE_LIMIT}&json=true`))?.data?.info ?? []
}

async function loadAlbumSongs(id, page = 1) {
  return (await fetchJson(`https://mobiles.kugou.com/api/v3/album/song?albumid=${encodeURIComponent(id)}&page=${page}&pagesize=${PAGE_LIMIT}&json=true`))?.data?.info ?? []
}

async function loadHotArtists(page = 1) {
  if (page > 1) {
    return []
  }

  const rankIds = ['6666', '8888', '23784']
  const result = []
  const seen = new Set()

  for (const rankId of rankIds) {
    const songs = await loadToplistSongs(rankId, 1)

    for (const song of songs) {
      const authors = song?.authors ?? []
      const firstAuthor = authors[0] ?? {}
      const singerId = `${firstAuthor?.author_id ?? song?.singerid ?? ''}`
      const singerName = firstAuthor?.author_name ?? song?.author_name ?? song?.singername ?? song?.author ?? ''
      const singerCover = toHttps(firstAuthor?.sizable_avatar ?? firstAuthor?.avatar ?? '')

      if (!singerId || !singerName || seen.has(singerId)) {
        continue
      }

      seen.add(singerId)
      result.push({
        singerid: singerId,
        singername: singerName,
        imgurl: singerCover,
      })

      if (result.length >= PAGE_LIMIT) {
        return result
      }
    }
  }

  return result
}

async function searchSong(text, page) {
  return (await fetchJson(`https://mobiles.kugou.com/api/v3/search/song?format=json&keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${PAGE_LIMIT}`))?.data?.info ?? []
}

async function searchPlaylist(text, page) {
  return (await fetchJson(`https://mobiles.kugou.com/api/v3/search/special?format=json&keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${PAGE_LIMIT}`))?.data?.info ?? []
}

async function searchAlbum(text, page) {
  return (await fetchJson(`https://mobiles.kugou.com/api/v3/search/album?format=json&keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${PAGE_LIMIT}`))?.data?.info ?? []
}

async function searchArtist(text, page) {
  return (await fetchJson(`https://mobiles.kugou.com/api/v3/search/singer?format=json&keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${PAGE_LIMIT}`))?.data ?? []
}

async function getConfig() {
  return jsonify(appConfig)
}

async function getSongs(ext) {
  const { page, gid, id } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let songs = []

  if (gidValue == GID.TOPLISTS) {
    const list = await loadToplistSongs(id, page)
    songs = list.map((each) => mapSong(each))
  }

  if (gidValue == GID.SEARCH_PLAYLISTS || gidValue == GID.FEATURED_PLAYLISTS) {
    const list = await loadPlaylistSongs(id, page)
    songs = list.map((each) => mapSong(each))
  }

  if (gidValue == GID.ARTIST_SONGS) {
    const list = await loadSingerSongs(id, page)
    songs = list.map((each) => mapSong(each))
  }

  if (gidValue == GID.ALBUM_SONGS) {
    const list = await loadAlbumSongs(id, page)
    songs = list.map((each) => mapSong(each))
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
    const list = await loadHotArtists(page)
    artists = list.map((each) => mapArtistCard(each))
  }

  return jsonify({
    list: artists,
  })
}

async function getPlaylists(ext) {
  const { page, gid, from } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let cards = []

  if (gidValue == GID.TOPLISTS) {
    const topLists = await loadToplists()
    const offset = (page - 1) * PAGE_LIMIT

    cards = topLists.map((each) => mapToplistCard(each))
    cards = from === 'index'
      ? cards.slice(0, PAGE_LIMIT)
      : cards.slice(offset, offset + PAGE_LIMIT)
  }

  if (gidValue == GID.FEATURED_PLAYLISTS) {
    const list = await loadFeaturedPlaylists(page)
    cards = list.map((each) => mapPlaylistCard(each))
  }

  return jsonify({
    list: cards,
  })
}

async function getAlbums(ext) {
  const { page, gid, id } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let cards = []

  if (gidValue == GID.ARTIST_ALBUMS) {
    const list = await loadSingerAlbums(id, page)
    cards = list.map((each) => mapAlbumCard(each))
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
    const songs = (await searchSong(text, page)).map((each) => mapSong(each))
    return jsonify({ list: songs })
  }

  if (type == 'playlist') {
    const cards = (await searchPlaylist(text, page)).map((each) => mapPlaylistCard(each))
    return jsonify({ list: cards })
  }

  if (type == 'album') {
    const cards = (await searchAlbum(text, page)).map((each) => mapAlbumCard(each))
    return jsonify({ list: cards })
  }

  if (type == 'artist') {
    const artists = (await searchArtist(text, page)).map((each) => mapArtistCard(each))
    return jsonify({ list: artists })
  }

  return jsonify({})
}

async function getSongInfo(ext) {
  const { source, hash, singer, songName, album_id, quality } = argsify(ext)

  if (hash == undefined || source == undefined) {
    return jsonify({ urls: [] })
  }

  const result = await $lx.request('musicUrl', {
    type: quality || '320k',
    musicInfo: {
      hash: `${hash}`,
      songmid: `${hash}`,
      name: songName ?? '',
      singer: singer ?? '',
      album_id: `${album_id ?? ''}`,
    },
  }, {
    source: `${source}`,
  })
  const soundurl = typeof result === 'string'
    ? result
    : result?.url ?? result?.data?.url ?? result?.urls?.[0]

  return jsonify({ urls: soundurl ? [soundurl] : [] })
}
