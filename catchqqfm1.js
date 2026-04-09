/*!
 * @name Grokqqfm
 * @description qqfm  收藏进最近播放
 * @version v1.0.0
 * @author codex
 * @key csp_Grokqqfm
 */

var $config = argsify($config_str)
var UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
var headers = {
  'User-Agent': UA,
}

var PAGE_LIMIT = 20
var SEARCH_PAGE_LIMIT = 5
var QQ_SOURCE = 'tx'
var GID = {
  TOPLISTS: '1',
  TOP_ARTISTS: '2',
  ARTIST_SONGS: '3',
  ARTIST_ALBUMS: '4',
  ALBUM_SONGS: '5',
  SEARCH_PLAYLISTS: '6',
  TAG_PLAYLISTS: '7',
  RECENT_PLAYED: '8'
}

var recentSongsList = []
var urlCacheMap = new Map()
var RECENT_MAX_LIMIT = 200

var appConfig = {
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
      name: '最近播放(缓存)',
      type: 'song',
      ext: {
        gid: GID.RECENT_PLAYED
      }
    }, {
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
  return ('' + url).replace(/^http:\/\//, 'https://')
}

function withQqHeaders(extra) {
  var extHeaders = extra || {}
  return Object.assign({}, headers, {
    Referer: 'https://y.qq.com/',
    Origin: 'https://y.qq.com',
    Cookie: 'uin=0;'
  }, extHeaders)
}

function buildSearchUrl(text, page, searchType, limit) {
  var searchTypeVal = searchType === undefined ? 0 : searchType
  var limitVal = limit === undefined ? PAGE_LIMIT : limit
  var payload = {
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
        num_per_page: limitVal,
        page_num: page,
        query: text,
        search_type: searchTypeVal,
      }
    }
  }
  return 'https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=' + encodeURIComponent(JSON.stringify(payload))
}

function buildMusicuUrl(payload) {
  return 'https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=' + encodeURIComponent(JSON.stringify(payload))
}

async function fetchJson(url, extraHeaders) {
  var headerParams = extraHeaders || {}
  var res = await $fetch.get(url, {
    headers: withQqHeaders(headerParams),
  })
  return safeArgs(res.data)
}

async function fetchHtml(url, extraHeaders) {
  var headerParams = extraHeaders || {}
  var res = await $fetch.get(url, {
    headers: Object.assign({}, headers, headerParams),
  })
  return '' + (res.data || '')
}

function parseInitialData(html) {
  var match = html.match(/__INITIAL_DATA__\s*=\s*({[\s\S]*?})<\/script>/)
  if (!match || !match[1]) {
    return {}
  }
  return safeArgs(match[1])
}

function singerListOf(song) {
  return song?.singer ?? song?.singer_list ?? []
}

function singerNameOf(song) {
  return singerListOf(song).map(function(artist) { return artist?.name ?? artist?.singer_name ?? '' }).filter(Boolean).join('/')
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
  var song = rawSong?.songInfo ?? rawSong ?? {}
  var singers = singerListOf(song)
  var singer = singerNameOf(song)
  var songmid = songMidOf(song)
  var albumMid = albumMidOf(song)

  return {
    id: '' + (songmid || song?.id || ''),
    name: song?.name ?? song?.title ?? '',
    cover: albumMid ? ('https://y.gtimg.cn/music/photo_new/T002R800x800M000' + albumMid + '.jpg') : '',
    duration: parseInt(song?.interval ?? 0),
    artist: {
      id: '' + (singers[0]?.mid ?? singers[0]?.singer_mid ?? singers[0]?.id ?? singers[0]?.singer_id ?? ''),
      name: singer,
      cover: singers[0]?.mid || singers[0]?.singer_mid
        ? ('https://y.qq.com/music/photo_new/T001R500x500M000' + (singers[0]?.mid ?? singers[0]?.singer_mid) + '.jpg')
        : '',
    },
    ext: {
      source: QQ_SOURCE,
      songmid: '' + songmid,
      singer: singer,
      songName: song?.name ?? song?.title ?? '',
      albumName: albumNameOf(song),
    }
  }
}

function mapToplistCard(item) {
  return {
    id: '' + (item?.topId ?? ''),
    name: item?.title ?? '',
    cover: toHttps(item?.headPicUrl ?? item?.frontPicUrl ?? item?.mbHeadPicUrl ?? item?.mbFrontPicUrl ?? ''),
    artist: {
      id: 'qq',
      name: item?.updateTips ?? item?.period ?? 'qqfm',
      cover: '',
    },
    ext: {
      gid: GID.TOPLISTS,
      id: '' + (item?.topId ?? ''),
      period: item?.period ?? '',
      type: 'playlist',
    }
  }
}

function mapArtistCard(artist) {
  var artistId = '' + (artist?.singerMID ?? artist?.singer_mid ?? artist?.mid ?? artist?.singer_mid ?? '')
  var artistName = artist?.singerName ?? artist?.singer_name ?? artist?.name ?? ''
  var artistCover = toHttps(
    artist?.singerPic
    ?? artist?.singer_pic
    ?? (artistId ? ('https://y.qq.com/music/photo_new/T001R500x500M000' + artistId + '.jpg') : '')
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
  var albumMid = '' + (album?.albumMID ?? album?.albumMid ?? album?.album_mid ?? '')
  var singers = album?.singer_list ?? album?.singers ?? []
  var firstSinger = singers[0] ?? {}
  var singerName = album?.singerName ?? album?.singer_name ?? singers.map(function(artist) { return artist?.name ?? artist?.singer_name ?? '' }).filter(Boolean).join('/') ?? ''
  var singerMid = '' + (album?.singerMID ?? album?.singer_mid ?? firstSinger?.mid ?? firstSinger?.singer_mid ?? '')

  return {
    id: albumMid,
    name: album?.albumName ?? album?.album_name ?? '',
    cover: toHttps(
      album?.albumPic
      ?? (albumMid ? ('https://y.gtimg.cn/music/photo_new/T002R800x800M000' + albumMid + '.jpg') : '')
    ),
    artist: {
      id: singerMid,
      name: singerName,
      cover: singerMid ? ('https://y.qq.com/music/photo_new/T001R500x500M000' + singerMid + '.jpg') : '',
    },
    ext: {
      gid: GID.ALBUM_SONGS,
      id: albumMid,
      type: 'album',
    }
  }
}

function mapPlaylistCard(playlist) {
  var playlistId = '' + (playlist?.dissid ?? playlist?.disstid ?? playlist?.tid ?? playlist?.id ?? '')

  return {
    id: playlistId,
    name: playlist?.dissname ?? playlist?.title ?? playlist?.name ?? '',
    cover: toHttps(playlist?.imgurl ?? playlist?.logo ?? playlist?.cover ?? ''),
    artist: {
      id: '' + (playlist?.encrypt_uin ?? playlist?.creator?.encrypt_uin ?? playlist?.creator?.creator_uin ?? ''),
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
  var info = await fetchJson('https://u.y.qq.com/cgi-bin/musicu.fcg?_=1577086820633&data=%7B%22comm%22%3A%7B%22g_tk%22%3A5381%2C%22uin%22%3A123456%2C%22format%22%3A%22json%22%2C%22inCharset%22%3A%22utf-8%22%2C%22outCharset%22%3A%22utf-8%22%2C%22notice%22%3A0%2C%22platform%22%3A%22h5%22%2C%22needNewCode%22%3A1%2C%22ct%22%3A23%2C%22cv%22%3A0%7D%2C%22topList%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetAll%22%2C%22param%22%3A%7B%7D%7D%7D', {
    Cookie: 'uin=',
  })
  return (info?.topList?.data?.group ?? []).flatMap(function(group) { return group?.toplist ?? [] })
}

async function loadToplistSongs(id, period, page) {
  var pageNum = page === undefined ? 1 : page
  var offset = Math.max(pageNum - 1, 0) * PAGE_LIMIT
  var periodValue = period ?? ''

  if (!periodValue) {
    var toplists = await loadToplists()
    var found = toplists.find(function(each) { return '' + (each?.topId ?? '') == '' + id })
    periodValue = found?.period ?? ''
  }

  var info = await fetchJson(buildMusicuUrl({
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

async function loadPlaylistSongs(id, page) {
  var pageNum = page === undefined ? 1 : page
  var info = await fetchJson('https://c.y.qq.com/v8/fcg-bin/fcg_v8_playlist_cp.fcg?newsong=1&id=' + id + '&format=json&inCharset=GB2312&outCharset=utf-8')
  var list = info?.data?.cdlist?.[0]?.songlist ?? []
  var offset = Math.max(pageNum - 1, 0) * PAGE_LIMIT

  return list.slice(offset, offset + PAGE_LIMIT)
}

async function loadTagPlaylists(categoryId, sortId, page) {
  var sortVal = sortId === undefined ? '5' : sortId
  var pageNum = page === undefined ? 1 : page
  var offset = Math.max(pageNum - 1, 0) * PAGE_LIMIT
  var end = offset + PAGE_LIMIT - 1
  var info = await fetchJson('https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg?picmid=1&rnd=0.1&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&categoryId=' + encodeURIComponent(categoryId) + '&sortId=' + encodeURIComponent(sortVal) + '&sin=' + offset + '&ein=' + end)

  return info?.data?.list ?? []
}

async function loadSingerList(page) {
  var pageNum = page === undefined ? 1 : page
  if (pageNum > 1) {
    return []
  }

  var html = await fetchHtml('https://y.qq.com/n/ryqq/singer_list')
  var initialData = parseInitialData(html)
  return initialData?.singerListImage ?? []
}

async function loadSingerSongs(id, page) {
  var pageNum = page === undefined ? 1 : page
  var offset = Math.max(pageNum - 1, 0) * PAGE_LIMIT
  var info = await fetchJson(buildMusicuUrl({
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

async function loadSingerAlbums(id, page) {
  var pageNum = page === undefined ? 1 : page
  var offset = Math.max(pageNum - 1, 0) * PAGE_LIMIT
  var info = await fetchJson(buildMusicuUrl({
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

async function loadAlbumSongs(id, page) {
  var pageNum = page === undefined ? 1 : page
  var offset = Math.max(pageNum - 1, 0) * PAGE_LIMIT
  var info = await fetchJson(buildMusicuUrl({
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
  var info = await fetchJson(buildSearchUrl(text, page, searchType))
  return info?.req?.data?.body ?? {}
}

async function getConfig() {
  return jsonify(appConfig)
}

async function getSongs(ext) {
  var extObj = argsify(ext)
  var page = extObj.page
  var gid = extObj.gid
  var id = extObj.id
  var period = extObj.period
  
  var gidValue = '' + (gid ?? '')
  var songs = []

  if (gidValue == GID.RECENT_PLAYED) {
    var offset = Math.max(page - 1, 0) * PAGE_LIMIT
    songs = recentSongsList.slice(offset, offset + PAGE_LIMIT)
    return jsonify({ list: songs })
  }

  if (gidValue == GID.TOPLISTS) {
    var list1 = await loadToplistSongs(id, period, page)
    songs = list1.map(function(each) { return mapSong(each) })
  }

  if (gidValue == GID.SEARCH_PLAYLISTS) {
    var list2 = await loadPlaylistSongs(id, page)
    songs = list2.map(function(each) { return mapSong(each) })
  }

  if (gidValue == GID.ARTIST_SONGS) {
    var list3 = await loadSingerSongs(id, page)
    songs = list3.map(function(each) { return mapSong(each) })
  }

  if (gidValue == GID.ALBUM_SONGS) {
    var list4 = await loadAlbumSongs(id, page)
    songs = list4.map(function(each) { return mapSong(each) })
  }

  return jsonify({
    list: songs,
  })
}

async function getArtists(ext) {
  var extObj = argsify(ext)
  var page = extObj.page
  var gid = extObj.gid
  var gidValue = '' + (gid ?? '')
  var artists = []

  if (gidValue == GID.TOP_ARTISTS) {
    var list = await loadSingerList(page)
    artists = list.map(function(each) { return mapArtistCard(each) })
  }

  return jsonify({
    list: artists,
  })
}

async function getPlaylists(ext) {
  var extObj = argsify(ext)
  var page = extObj.page
  var gid = extObj.gid
  var from = extObj.from
  var categoryId = extObj.categoryId
  var sortId = extObj.sortId
  
  var gidValue = '' + (gid ?? '')
  var cards = []

  if (gidValue == GID.TOPLISTS) {
    var topLists = await loadToplists()
    var filtered = topLists.filter(function(each) { return each?.title && each?.title !== 'MV榜' })
    var offset = (page - 1) * PAGE_LIMIT

    cards = filtered.map(function(each) { return mapToplistCard(each) })
    cards = from === 'index'
      ? cards.slice(0, PAGE_LIMIT)
      : cards.slice(offset, offset + PAGE_LIMIT)
  }

  if (gidValue == GID.TAG_PLAYLISTS) {
    var list = await loadTagPlaylists(categoryId, sortId, page)
    cards = list.map(function(each) { return mapPlaylistCard(each) })
  }

  return jsonify({
    list: cards,
  })
}

async function getAlbums(ext) {
  var extObj = argsify(ext)
  var page = extObj.page
  var gid = extObj.gid
  var id = extObj.id
  var gidValue = '' + (gid ?? '')
  var cards = []

  if (gidValue == GID.ARTIST_ALBUMS) {
    var list = await loadSingerAlbums(id, page)
    cards = list.map(function(each) { return mapAlbumCard(each) })
  }

  return jsonify({
    list: cards,
  })
}

async function search(ext) {
  var extObj = argsify(ext)
  var text = extObj.text
  var page = extObj.page
  var type = extObj.type

  if (!text || page > SEARCH_PAGE_LIMIT) {
    return jsonify({})
  }

  if (type == 'song') {
    var body1 = await loadSearchBody(text, page, 0)
    var songs = (body1?.song?.list ?? []).map(function(each) { return mapSong(each) })
    return jsonify({ list: songs })
  }

  if (type == 'playlist') {
    var body2 = await loadSearchBody(text, page, 3)
    var cards2 = (body2?.songlist?.list ?? []).map(function(each) { return mapPlaylistCard(each) })
    return jsonify({ list: cards2 })
  }

  if (type == 'album') {
    var body3 = await loadSearchBody(text, page, 2)
    var cards3 = (body3?.album?.list ?? []).map(function(each) { return mapAlbumCard(each) })
    return jsonify({ list: cards3 })
  }

  if (type == 'artist') {
    var body4 = await loadSearchBody(text, page, 1)
    var artists = (body4?.singer?.list ?? []).map(function(each) { return mapArtistCard(each) })
    return jsonify({ list: artists })
  }

  return jsonify({})
}

async function getSongInfo(ext) {
  var extObj = argsify(ext)
  var source = extObj.source
  var songmid = extObj.songmid
  var singer = extObj.singer
  var songName = extObj.songName
  var quality = extObj.quality
  var albumName = extObj.albumName

  if (songmid == undefined || source == undefined) {
    return jsonify({ urls: [] })
  }

  if (urlCacheMap.has(songmid)) {
    return jsonify({ urls: [urlCacheMap.get(songmid)] })
  }

  var result = await $lx.request('musicUrl', {
    type: quality || '320k',
    musicInfo: {
      songmid: '' + songmid,
      name: songName ?? '',
      singer: singer ?? '',
    },
  }, {
    source: '' + source,
  })
  
  var soundurl = typeof result === 'string'
    ? result
    : result?.url ?? result?.data?.url ?? result?.urls?.[0]

  if (soundurl) {
    urlCacheMap.set(songmid, soundurl)
    
    var playedSong = {
      id: songmid,
      name: songName ?? '',
      cover: '',
      duration: 0,
      artist: {
        id: '',
        name: singer ?? '',
        cover: ''
      },
      ext: {
        source: source,
        songmid: songmid,
        singer: singer,
        songName: songName,
        albumName: albumName ?? ''
      }
    }

    recentSongsList = recentSongsList.filter(function(s) { return s.id !== songmid })
    recentSongsList.unshift(playedSong)

    if (recentSongsList.length > RECENT_MAX_LIMIT) {
      var removedSong = recentSongsList.pop()
      if (removedSong && removedSong.id) {
        urlCacheMap.delete(removedSong.id)
      }
    }
  }

  return jsonify({ urls: soundurl ? [soundurl] : [] })
}
