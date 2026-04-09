/*!
 * @name catchqqfm
 * @description qqfm
 * @version v1.0.0
 * @author codex
 * @key csp_catchqqfm
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
  RECENT_PLAYS: '8' // 新增：最近播放GID
}

// 新增：最近播放缓存配置
const RECENT_PLAY_CONFIG = {
  KEY: 'qqfm_recent_plays', // 缓存键名
  MAX_LIMIT: 100 // 最多保留100首
}

const appConfig = {
  ver: 1,
  name: 'qqfm',
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
        id: '62',
      }
    }, {
      name: '热歌榜',
      type: 'song',
      ui: 0,
      showMore: false,
      ext: {
        gid: GID.TOPLISTS,
        id: '26',
      }
    }, {
      name: '新歌榜',
      type: 'song',
      ui: 0,
      showMore: false,
      ext: {
        gid: GID.TOPLISTS,
        id: '27',
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
        categoryId: '6',
        sortId: '5',
      }
    }, {
      name: '国语精选',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PLAYLISTS,
        categoryId: '165',
        sortId: '5',
      }
    }, {
      name: '轻音乐',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PLAYLISTS,
        categoryId: '15',
        sortId: '5',
      }
    }, {
      name: '影视原声',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PLAYLISTS,
        categoryId: '133',
        sortId: '5',
      }
    }, {
      name: '治愈歌单',
      type: 'playlist',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PLAYLISTS,
        categoryId: '116',
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
    }, {
      // 新增：最近播放分组
      name: '最近播放',
      type: 'song',
      ext: {
        gid: GID.RECENT_PLAYS
      }
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

// 新增：读取本地缓存的最近播放列表
function getRecentPlayCache() {
  try {
    const cacheStr = $persistentStore.read(RECENT_PLAY_CONFIG.KEY) || '[]'
    return JSON.parse(cacheStr)
  } catch (e) {
    return []
  }
}

// 新增：写入最近播放到本地缓存（去重、限制数量）
function setRecentPlayCache(song) {
  if (!song?.id || !song?.ext?.songmid) return
  
  let recentPlays = getRecentPlayCache()
  // 去重：移除已存在的同首歌
  recentPlays = recentPlays.filter(item => item.id !== song.id)
  // 新增到顶部（最新播放的在最前面）
  recentPlays.unshift(song)
  // 限制最多100首
  if (recentPlays.length > RECENT_PLAY_CONFIG.MAX_LIMIT) {
    recentPlays = recentPlays.slice(0, RECENT_PLAY_CONFIG.MAX_LIMIT)
  }
  // 写入缓存
  $persistentStore.write(JSON.stringify(recentPlays), RECENT_PLAY_CONFIG.KEY)
}

// 新增：获取最近播放歌曲列表
async function getRecentPlays(page = 1) {
  const recentPlays = getRecentPlayCache()
  const offset = Math.max(page - 1, 0) * PAGE_LIMIT
  // 分页返回（保持和其他列表一致的分页逻辑）
  const paginated = recentPlays.slice(offset, offset + PAGE_LIMIT)
  return paginated
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
    comm: {
      ct: '19',
      cv: '1859',
      uin: '0',
    },
    req: {
      method: 'DoSearchForQQMusicDesktop',
      module: 'music.search.SearchCgiService',
      param: {
        grp: 1,
        num_per_page: limit,
        page_num: page,
        query: text,
        search_type: searchType,
      }
    }
  }

  return `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=${encodeURIComponent(JSON.stringify(payload))}`
}

function buildMusicuUrl(payload) {
  return `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=${encodeURIComponent(JSON.stringify(payload))}`
}

async function fetchJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, {
    headers: withQqHeaders(extraHeaders),
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
  return song?.singer ?? song?.singer_list ?? []
}

function singerNameOf(song) {
  return singerListOf(song).map((artist) => artist?.name ?? artist?.singer_name ?? '').filter(Boolean).join('/')
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
      id: `${singers[0]?.mid ?? singers[0]?.singer_mid ?? singers[0]?.id ?? singers[0]?.singer_id ?? ''}`,
      name: singer,
      cover: singers[0]?.mid || singers[0]?.singer_mid
        ? `https://y.qq.com/music/photo_new/T001R500x500M000${singers[0]?.mid ?? singers[0]?.singer_mid}.jpg`
        : '',
    },
    ext: {
      source: QQ_SOURCE,
      songmid: `${songmid}`,
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
    cover: toHttps(item?.headPicUrl ?? item?.frontPicUrl ?? item?.mbHeadPicUrl ?? item?.mbFrontPicUrl ?? ''),
    artist: {
      id: 'qq',
      name: item?.updateTips ?? item?.period ?? 'qqfm',
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
  const artistId = `${artist?.singerMID ?? artist?.singer_mid ?? artist?.mid ?? artist?.singer_mid ?? ''}`
  const artistName = artist?.singerName ?? artist?.singer_name ?? artist?.name ?? ''
  const artistCover = toHttps(
    artist?.singerPic
    ?? artist?.singer_pic
    ?? (artistId ? `https://y.qq.com/music/photo_new/T001R500x500M000${artistId}.jpg` : '')
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
  const albumMid = `${album?.albumMID ?? album?.albumMid ?? album?.album_mid ?? ''}`
  const singers = album?.singer_list ?? album?.singers ?? []
  const firstSinger = singers[0] ?? {}
  const singerName = album?.singerName ?? album?.singer_name ?? singers.map((artist) => artist?.name ?? artist?.singer_name ?? '').filter(Boolean).join('/') ?? ''
  const singerMid = `${album?.singerMID ?? album?.singer_mid ?? firstSinger?.mid ?? firstSinger?.singer_mid ?? ''}`

  return {
    id: albumMid,
    name: album?.albumName ?? album?.album_name ?? '',
    cover: toHttps(
      album?.albumPic
      ?? (albumMid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${albumMid}.jpg` : '')
    ),
    artist: {
      id: singerMid,
      name: singerName,
      cover: singerMid ? `https://y.qq.com/music/photo_new/T001R500x500M000${singerMid}.jpg` : '',
    },
    ext: {
      gid: GID.ALBUM_SONGS,
      id: albumMid,
      type: 'album',
    }
  }
}

function mapPlaylistCard(playlist) {
  const playlistId = `${playlist?.dissid ?? playlist?.disstid ?? playlist?.tid ?? playlist?.id ?? ''}`

  return {
    id: playlistId,
    name: playlist?.dissname ?? playlist?.title ?? playlist?.name ?? '',
    cover: toHttps(playlist?.imgurl ?? playlist?.logo ?? playlist?.cover ?? ''),
    artist: {
      id: `${playlist?.encrypt_uin ?? playlist?.creator?.encrypt_uin ?? playlist?.creator?.creator_uin ?? ''}`,
      name: playlist?.creator?.name ?? playlist?.nickname ?? playlist?.nick ?? playlist?.creatorName ?? 'qqfm',
      cover: toHttps(playlist?.creator?.avatarUrl ?? playlist?.headurl ?? ''),
    },
    ext: {
      gid: GID.SEARCH_PLAYLISTS,
      id: playlistId,
      type: 'playlist',
    }
  }
}

async function loadToplists() {
  const info = await fetchJson('https://u.y.qq.com/cgi-bin/musicu.fcg?_=1577086820633&data=%7B%22comm%22%3A%7B%22g_tk%22%3A5381%2C%22uin%22%3A123456%2C%22format%22%3A%22json%22%2C%22inCharset%22%3A%22utf-8%22%2C%22outCharset%22%3A%22utf-8%22%2C%22notice%22%3A0%2C%22platform%22%3A%22h5%22%2C%22needNewCode%22%3A1%2C%22ct%22%3A23%2C%22cv%22%3A0%7D%2C%22topList%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetAll%22%2C%22param%22%3A%7B%7D%7D%7D', {
    Cookie: 'uin=',
  })

  return (info?.topList?.data?.group ?? []).flatMap((group) => group?.toplist ?? [])
}

async function loadToplistSongs(id, period, page = 1) {
  const offset = Math.max(page - 1, 0) * PAGE_LIMIT
  let periodValue = period ?? ''

  if (!periodValue) {
    const toplists = await loadToplists()
    periodValue = toplists.find((each) => `${each?.topId ?? ''}` == `${id}`)?.period ?? ''
  }

  const info = await fetchJson(buildMusicuUrl({
    detail: {
      module: 'musicToplist.ToplistInfoServer',
      method: 'GetDetail',
      param: {
        topId: Number(id),
        offset: offset,
        num: PAGE_LIMIT,
        period: periodValue,
      }
    },
    comm: {
      ct: 24,
      cv: 0,
    }
  }), {
    Cookie: 'uin=',
  })

  return info?.detail?.data?.songInfoList ?? []
}

async function loadPlaylistSongs(id, page = 1) {
  const info = await fetchJson(`https://c.y.qq.com/v8/fcg-bin/fcg_v8_playlist_cp.fcg?newsong=1&id=${id}&format=json&inCharset=GB2312&outCharset=utf-8`)
  const list = info?.data?.cdlist?.[0]?.songlist ?? []
  const offset = Math.max(page - 1, 0) * PAGE_LIMIT

  return list.slice(offset, offset + PAGE_LIMIT)
}

async function loadTagPlaylists(categoryId, sortId = '5', page = 1) {
  const offset = Math.max(page - 1, 0) * PAGE_LIMIT
  const end = offset + PAGE_LIMIT - 1
  const info = await fetchJson(`https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg?picmid=1&rnd=0.1&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&categoryId=${encodeURIComponent(categoryId)}&sortId=${encodeURIComponent(sortId)}&sin=${offset}&ein=${end}`)

  return info?.data?.list ?? []
}

async function loadSingerList(page = 1) {
  if (page > 1) {
    return []
  }

  const html = await fetchHtml('https://y.qq.com/n/ryqq/singer_list')
  const initialData = parseInitialData(html)
  return initialData?.singerListImage ?? []
}

async function loadSingerSongs(id, page = 1) {
  const offset = Math.max(page - 1, 0) * PAGE_LIMIT
  const info = await fetchJson(buildMusicuUrl({
    comm: {
      ct: 24,
      cv: 0,
    },
    singer: {
      module: 'music.web_singer_info_svr',
      method: 'get_singer_detail_info',
      param: {
        singermid: id,
        sort: 5,
        sin: offset,
        num: PAGE_LIMIT,
      }
    }
  }))

  return info?.singer?.data?.songlist ?? []
}

async function loadSingerAlbums(id, page = 1) {
  const offset = Math.max(page - 1, 0) * PAGE_LIMIT
  const info = await fetchJson(buildMusicuUrl({
    comm: {
      ct: 24,
      cv: 0,
    },
    singer: {
      module: 'music.web_singer_info_svr',
      method: 'get_singer_album',
      param: {
        singermid: id,
        order: 'time',
        begin: offset,
        num: PAGE_LIMIT,
      }
    }
  }))

  return info?.singer?.data?.list ?? []
}

async function loadAlbumSongs(id, page = 1) {
  const offset = Math.max(page - 1, 0) * PAGE_LIMIT
  const info = await fetchJson(buildMusicuUrl({
    comm: {
      ct: 24,
      cv: 0,
    },
    album: {
      module: 'music.musichallAlbum.AlbumSongList',
      method: 'GetAlbumSongList',
      param: {
        albumMid: id,
        begin: offset,
        num: PAGE_LIMIT,
        order: 2,
      }
    }
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
    songs = list.map((each) => mapSong(each))
  }

  if (gidValue == GID.SEARCH_PLAYLISTS) {
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

  // 新增：处理最近播放歌曲列表
  if (gidValue == GID.RECENT_PLAYS) {
    songs = await getRecentPlays(page)
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
    const list = await loadSingerList(page)
    artists = list.map((each) => mapArtistCard(each))
  }

  return jsonify({
    list: artists,
  })
}

async function getPlaylists(ext) {
  const { page, gid, from, categoryId, sortId } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let cards = []

  if (gidValue == GID.TOPLISTS) {
    const topLists = await loadToplists()
    const filtered = topLists.filter((each) => each?.title && each?.title !== 'MV榜')
    const offset = (page - 1) * PAGE_LIMIT

    cards = filtered.map((each) => mapToplistCard(each))
    cards = from === 'index'
      ? cards.slice(0, PAGE_LIMIT)
      : cards.slice(offset, offset + PAGE_LIMIT)
  }

  if (gidValue == GID.TAG_PLAYLISTS) {
    const list = await loadTagPlaylists(categoryId, sortId, page)
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
    const body = await loadSearchBody(text, page, 0)
    const songs = (body?.song?.list ?? []).map((each) => mapSong(each))

    return jsonify({
      list: songs,
    })
  }

  if (type == 'playlist') {
    const body = await loadSearchBody(text, page, 3)
    const cards = (body?.songlist?.list ?? []).map((each) => mapPlaylistCard(each))

    return jsonify({
      list: cards,
    })
  }

  if (type == 'album') {
    const body = await loadSearchBody(text, page, 2)
    const cards = (body?.album?.list ?? []).map((each) => mapAlbumCard(each))

    return jsonify({
      list: cards,
    })
  }

  if (type == 'artist') {
    const body = await loadSearchBody(text, page, 1)
    const artists = (body?.singer?.list ?? []).map((each) => mapArtistCard(each))

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

  // 新增：获取歌曲信息时，将歌曲加入最近播放缓存
  if (soundurl) {
    const song = {
      id: `${songmid}`,
      name: songName ?? '',
      cover: '', // 若需要封面，可补充逻辑
      duration: 0, // 若需要时长，可补充逻辑
      artist: {
        id: '',
        name: singer ?? '',
        cover: ''
      },
      ext: {
        source: QQ_SOURCE,
        songmid: `${songmid}`,
        singer: singer ?? '',
        songName: songName ?? ''
      }
    }
    setRecentPlayCache(song)
  }

  return jsonify({ urls: soundurl ? [soundurl] : [] })
}
