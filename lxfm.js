/*!
 * @name lxfm
 * @description 
 * @version v1.0.0
 * @author kobe
 * @key csp_lxfm
 */

const $config = argsify($config_str)
const cheerio = createCheerio()
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = {
  'User-Agent': UA,
}
const WY_PLAYLIST_TRACK_LIMIT = 100
const KW_CSRF_TOKEN = '0'

function buildTxSearchUrl(text, page, searchType = 0, limit = 20) {
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

function buildKuwoHeaders() {
  return {
    ...headers,
    Origin: 'http://www.kuwo.cn',
    Referer: 'http://www.kuwo.cn',
    csrf: KW_CSRF_TOKEN,
    Cookie: `kw_token=${KW_CSRF_TOKEN}`,
  }
}

function parseKuwoNuxtData(html) {
  const match = html.match(/window\.__NUXT__=(\(function[\s\S]*?\))\s*;<\/script>/)
  if (!match?.[1]) {
    return {}
  }

  try {
    return Function(`"use strict"; return ${match[1]}`)()
  } catch (error) {
    return {}
  }
}

async function loadKuwoPlaylistDetail(id) {
  const { data } = await $fetch.get(`https://www.kuwo.cn/playlist_detail/${id}`, {
    headers,
  })
  const nuxtData = parseKuwoNuxtData(data)

  return nuxtData?.data?.[0]?.playListInfo ?? {}
}

const appConfig = {
  "ver": 1,
  "name": "LXFM",
  "message": "",
 // "warning": "⚠️🤖 警告，请勿使用 ⚡️📡",
  "desc": "",
  "tabLibrary": {
    "name": "探索",
    "groups": [{
      "name": "推荐",
      "type": "song",
      "ui": 0,
      "showMore": true,
      "ext": {
          "gid": '1'
      }
  }, {
      "name": "酷我热门歌单",
      "type": "playlist",
      "ui": 0,
      "showMore": false,
      "ext": {
          "gid": '12'
      }
  }, {
      "name": "网易云榜单",
      "type": "playlist",
      "ui": 1,
      "showMore": false,
      "ext": {
          "gid": '11'
      }
  }, {
      "name": "流行歌单",
      "type": "playlist",
      "ui": 1,
      "showMore": false,
      "ext": {
          "gid": '9'
      }
  }, {
      "name": "排行榜",
      "type": "playlist",
      "ui": 1,
      "showMore": true,
      "ext": {
          "gid": '4'
      }
    }]
  },
  "tabMe": {
    "name": "我的",
    "groups": [{
      "name": "红心",
      "type": "song"
    }, {
      "name": "歌单",
      "type": "playlist"
    }, {
      "name": "专辑",
      "type": "album"
    }, {
      "name": "创作者",
      "type": "artist"
    }]
  },
  "tabSearch": {
    "name": "搜索",
    "groups": [{
      "name": "歌曲",
      "type": "song",
      "ext": {
        "type": "song"
      }
    }, {
      "name": "歌单",
      "type": "playlist",
      "ext": {
        "type": "playlist"
      }
    }]
  }
}

async function getConfig() {
  return jsonify(appConfig)
}

async function loadWyPlaylistTracks(id) {
  const { data } = await $fetch.get(`https://music.163.com/api/v6/playlist/detail?id=${id}&n=${WY_PLAYLIST_TRACK_LIMIT}&s=0`, {
    headers: {
      ...headers,
      Referer: 'https://music.163.com/',
    }
  })
  const info = argsify(data).playlist ?? {}
  const trackIds = (info.trackIds ?? [])
    .map((each) => `${each?.id ?? ''}`)
    .filter(Boolean)
    .slice(0, WY_PLAYLIST_TRACK_LIMIT)
  const trackMap = new Map()

  ;(info.tracks ?? []).forEach((each) => {
    if (each?.id == undefined) {
      return
    }
    trackMap.set(`${each.id}`, each)
  })

  const missingTrackIds = trackIds.filter((trackId) => !trackMap.has(trackId))

  if (missingTrackIds.length > 0) {
    const { data: detailData } = await $fetch.get(`https://music.163.com/api/song/detail?ids=${encodeURIComponent(JSON.stringify(missingTrackIds))}`, {
      headers: {
        ...headers,
        Referer: 'https://music.163.com/',
      }
    })
    const detailInfo = argsify(detailData)
    const detailTracks = detailInfo.songs ?? detailInfo.songsData ?? []

    detailTracks.forEach((each) => {
      if (each?.id == undefined) {
        return
      }
      trackMap.set(`${each.id}`, each)
    })
  }

  if (trackIds.length > 0) {
    return trackIds
      .map((trackId) => trackMap.get(trackId))
      .filter(Boolean)
  }

  return (info.tracks ?? []).slice(0, WY_PLAYLIST_TRACK_LIMIT)
}

async function getSongs(ext) {
  const { page, gid, id, from, text } = argsify(ext)
  let songs = []

  if (gid == '1') {
    if (page > 1) {
      return jsonify({
        list: [],
      })
    }

    const { data } = await $fetch.get('https://music.163.com/api/personalized/newsong', {
      headers: {
        ...headers,
        Referer: 'https://music.163.com/',
      }
    })
    const info = argsify(data)
    const list = info?.result ?? info?.data?.result ?? []

    list.forEach((each) => {
      const song = each.song ?? each
      const artists = song.ar ?? song.artists ?? each.artists ?? []
      const album = song.al ?? song.album ?? each.album ?? {}
      const artistName = artists.map((artist) => artist.name).join('/')
      const songId = song.id ?? each.id
      const songName = song.name ?? each.name ?? ''

      songs.push({
        id: `${songId}`,
        name: songName,
        cover: album.picUrl ?? each.picUrl ?? '',
        duration: parseInt((song.dt ?? song.duration ?? each.duration ?? 0) / 1000),
        artist: {
          id: `${artists[0]?.id ?? ''}`,
          name: artistName,
          cover: '',
        },
        ext: {
          source: 'wy',
          songmid: `${songId}`,
          singer: artistName,
          songName: songName,
        }
      })
    })
  }

  if (gid == '11') {
    if (page > 1) {
      return jsonify({
        list: [],
      })
    }
    const tracks = await loadWyPlaylistTracks(id)

    tracks.forEach((each) => {
      const artists = each.ar ?? each.artists ?? []
      const album = each.al ?? each.album ?? {}
      const artistName = artists.map((artist) => artist.name).join('/')
      const songId = each.id
      const songName = each.name ?? each.songName ?? ''
      const duration = parseInt((each.dt ?? each.duration ?? 0) / 1000)

      songs.push({
        id: `${songId}`,
        name: songName,
        cover: album.picUrl ?? '',
        duration: duration,
        artist: {
          id: `${artists[0]?.id ?? ''}`,
          name: artistName,
          cover: '',
        },
        ext: {
          source: 'wy',
          songmid: `${songId}`,
          singer: artistName,
          songName: songName,
        }
      })
    })
  }

  if (gid == '12') {
    if (page > 1) {
      return jsonify({
        list: [],
      })
    }

    const info = await loadKuwoPlaylistDetail(id)
    const tracks = info?.musicList ?? []

    tracks.forEach((each) => {
      const artistName = each.artist ?? ''
      const songId = each.rid
      const songName = each.name ?? each.songName ?? ''
      const duration = parseInt((each.duration ?? 0))

      songs.push({
        id: `${songId}`,
        name: songName,
        cover: each.pic || each.albumpic || '',
        duration: duration,
        artist: {
          id: `${each.artistid ?? ''}`,
          name: artistName,
          cover: '',
        },
        ext: {
          source: 'kw',
          songmid: `${songId}`,
          singer: artistName,
          songName: songName,
        }
      })
    })
  }

  if (gid == '9') {
    if (page > 1) {
      return jsonify({
        list: [],
      })
    }
    const url = `https://c.y.qq.com/v8/fcg-bin/fcg_v8_playlist_cp.fcg?newsong=1&id=${id}&format=json&inCharset=GB2312&outCharset=utf-8`
    const { data } = await $fetch.get(url, {
      headers
    })
    const info = argsify(data).data.cdlist[0]
    info.songlist.forEach((e) => {
      songs.push({
          id: e.mid,
          name: e.name,
          cover: e?.album?.mid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${e.album.mid}.jpg` : '',
          duration: e.interval ?? 0,
          artist: {
              id: e.singer[0].mid,
              name: e.singer[0].name,
              cover: `https://y.qq.com/music/photo_new/T001R500x500M000${e.singer[0].mid}.jpg`,
          },
          ext: {
              source: 'tx',
              songmid: e.mid || e.songmid,
              singer: e.singer.map((artist) => artist.name).join('/'),
              songName: e.name,
          },
      })
    })
  }

  if (gid == '4') {
    if (page > 1) {
      return jsonify({
        list: [],
      })
    }
    let _a
    const period = ext.period
    const url = `https://u.y.qq.com/cgi-bin/musicu.fcg?g_tk=5381&data=%7B%22detail%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetDetail%22%2C%22param%22%3A%7B%22topId%22%3A${id}%2C%22offset%22%3A0%2C%22num%22%3A100%2C%22period%22%3A%22${
        (_a = period) !== null && _a !== void 0 ? _a : ''
    }%22%7D%7D%2C%22comm%22%3A%7B%22ct%22%3A24%2C%22cv%22%3A0%7D%7D`
    const { data } = await $fetch.get(url, {
        headers: {
            Cookie: 'uin=',
        },
    })
    argsify(data).detail.data.songInfoList.forEach((e) => {
      songs.push({
          id: e.mid,
          name: e.name,
          cover: e?.album?.mid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${e.album.mid}.jpg` : '',
          duration: e.interval ?? 1,
          artist: {
              id: e.singer[0].mid,
              name: e.singer[0].name,
              cover: '',
          },
          ext: {
              source: 'tx',
              songmid: e.mid || e.songmid,
              singer: e.singer.map((artist) => artist.name).join('/'),
              songName: e.name,
          },
      })
    })
  }

  if (gid == '8') {
    if (page > 1) {
      return jsonify({
        list: [],
      })
    }

    const { data } = await $fetch.get(`http://c.y.qq.com/soso/fcgi-bin/client_search_cp?new_json=1&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=${page}&n=20&w=${encodeURIComponent(text)}&needNewCode=0`, {
      headers
    })

    argsify(data.slice(9, -1)).data?.song?.list?.forEach( each => {
      if (text === each.singer[0]?.name) {
        songs.push({
          id: `${each.mid}`,
          name: each.name,
          cover: `https://y.gtimg.cn/music/photo_new/T002R800x800M000${each.album.mid}.jpg`,
          duration: 0,
          artist: {
            id: `${each.singer[0]?.id}`,
            name: each.singer[0]?.name || '',
          },
          ext: {
            source: 'tx',
            songmid: each.mid,
            singer: each.singer.map((artist) => artist.name).join('/'),
            songName: each.name,
          }
        })
      }
    })
  }

  if (gid == '7') {
    if (page > 1) {
      return jsonify({
        list: [],
      })
    }
    const { data } = await $fetch.get(id, {
      headers
    })
    const $ = cheerio.load(data, { xmlMode: true })
    const author = $('title:first').text()
    const cover = $('itunes\\:image:first').attr('href') ?? ''
    const artist = {
      id: author,
      name: author,
      cover: cover,
    }
    $('item').each((index, each) => {
      const ele = $(each)
      songs.push({
        id: ele.find('guid').text(),
        name: ele.find('title').text(),
        cover: ele.find('itunes\\:image').attr('href') ?? cover,
        duration: 0,
        artist,
        ext: {
            pid: ele.find('enclosure').attr('url') ?? ''
        },
      })
    })
  }
  
  return jsonify({
    list: songs,
  })
}

async function getArtists(ext) {
  const { page, gid, from } = argsify(ext)
  let artists = []
  
  if (page > 1) {
    return jsonify({list: artists})
  }

  if (gid === '8') {
    const { data } = await $fetch.get(`https://y.qq.com/n/ryqq/singer_list`, {
      headers
    })
    const $ = cheerio.load(data)
    $('li.singer_list__item').each((index, each) => {
      const name = $(each).find('a').attr('title')
      const id = $(each).find('a').attr('href').slice(15)
      const cover = `https://y.qq.com/music/photo_new/T001R500x500M000${id}.jpg`
      artists.push({
        id,
        name,
        cover,
        groups: [{
          name: '热门歌曲',
          type: 'song',
          ext: {
            gid: gid,
            id: id,
            text: name,
          }
        }]
      })
    })
  }
  
  return jsonify({
    list: artists,
  })
}

async function getPlaylists(ext) {
  const { page, gid, from } = argsify(ext)
  if (page > 1) {
    return jsonify({
      list: [],
    })
  }
  
  let cards = []

  if (gid == '12') {
    const { data } = await $fetch.get('http://www.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?pn=1&rn=20&order=hot', {
      headers: buildKuwoHeaders(),
    })
    const info = argsify(data)
    const playlists = info?.data?.data ?? []

    playlists.forEach((each) => {
      cards.push({
        id: `${each.id}`,
        name: each.name,
        cover: each.img ?? '',
        artist: {
          id: `${each.uid ?? 'kw'}`,
          name: each.uname ?? '酷我音乐'
        },
        ext: {
          gid,
          id: `${each.id}`,
          type: 'playlist'
        }
      })
    })
  }

  if (gid == '11') {
    const { data } = await $fetch.get('https://music.163.com/api/toplist/detail/v2', {
      headers: {
        ...headers,
        Referer: 'https://music.163.com/',
      }
    })
    const info = argsify(data)
    const toplists = (info?.data ?? []).flatMap((group) => group?.list ?? [])

    toplists.forEach((each) => {
      if (!each?.id || each.targetType !== 'PLAYLIST') {
        return
      }

      cards.push({
        id: `${each.id}`,
        name: each.name,
        cover: each.coverUrl ?? each.coverImgUrl ?? each.firstCoverUrl ?? '',
        artist: {
          id: 'wy',
          name: each.updateFrequency ?? '网易云音乐'
        },
        ext: {
          gid,
          id: `${each.id}`,
          type: 'playlist'
        }
      })
    })

    if (from === 'index') {
      cards = cards.slice(0, 20)
    }
  }

  if (gid == '9') {
    const { data } = await $fetch.get('https://y.qq.com/n/ryqq/category', {
      headers
    })
    let json = data.match(/__INITIAL_DATA__ =({.*?})<\/script>/)[1]
    argsify(json).playlist.forEach( each => {
      cards.push({
        id: `${each.dissid}`,
        name: each.dissname,
        cover: each.imgurl,
        artist: {
          id: each.encrypt_uin,
          name: each.creatorname
        },
        ext: {
          gid,
          id: `${each.dissid}`,
          type: "playlist"
        }
      })
    })
  }

  // id 1 
  if (gid == '3') {
    const { data } = await $fetch.get('https://www.missevan.com/explore/tagalbum?order=0', {
      headers
    })
    argsify(data).albums.forEach( each => {
      cards.push({
        id: `${each.id}`,
        name: each.title,
        cover: each.front_cover,
        artist: {
          id: `${each.user_id}`,
          name: each.username
        },
        ext: {
          gid,
          id: each.id
        }
      })
    })
  }

  if (gid == '4') {
    const { data } = await $fetch.get(
      'https://u.y.qq.com/cgi-bin/musicu.fcg?_=1577086820633&data=%7B%22comm%22%3A%7B%22g_tk%22%3A5381%2C%22uin%22%3A123456%2C%22format%22%3A%22json%22%2C%22inCharset%22%3A%22utf-8%22%2C%22outCharset%22%3A%22utf-8%22%2C%22notice%22%3A0%2C%22platform%22%3A%22h5%22%2C%22needNewCode%22%3A1%2C%22ct%22%3A23%2C%22cv%22%3A0%7D%2C%22topList%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetAll%22%2C%22param%22%3A%7B%7D%7D%7D',
      {
          headers: {
              Cookie: 'uin=',
          },
      }
    )
    argsify(data).topList.data.group.forEach((each) => {
        each.toplist.forEach((e) => {
            if (e.title === 'MV榜') {
              return
            }
            cards.push({
                id: `${e.topId}`,
                name: e.title,
                cover: e.headPicUrl || e.frontPicUrl,
                artist: {
                  id: 'qq',
                  name: 'QQ',
                },
                ext: {
                  gid,
                  id: `${e.topId}`,
                  type: 'toplist',
                  period: e.period,
                },
            })
        })
    })
  }

  return jsonify({
    list: cards
  })
}

async function getAlbums(ext) {
  const { page, gid, from } = argsify(ext)
  if (page > 1) {
    return jsonify({
      list: [],
    })
  }
  let cards = []

  if (gid == '2') {
    const { data } = await $fetch.get('https://www.missevan.com/explore/tagalbum?order=0', {
      headers
    })
    argsify(data).albums.forEach( each => {
      cards.push({
        id: `${each.id}`,
        name: each.title,
        cover: each.front_cover,
        artist: {
          id: `${each.user_id}`,
          name: each.username
        },
        ext: {
          gid,
          id: each.id
        }
      })
    })
  }

  return jsonify({
    list: cards
  })
}

async function search(ext) {
  const { text, page, type } = argsify(ext)

  if (page > 3) {
    return jsonify({})
  }

  if (type == 'song') {
    let songs = []
    const { data } = await $fetch.get(buildTxSearchUrl(text, page, 0), {
      headers: {
        ...headers,
        Referer: 'https://y.qq.com/',
        Origin: 'https://y.qq.com',
        Cookie: 'uin=0;',
      }
    })

    const info = typeof data === 'string' ? argsify(data) : data
    const songList = info?.req?.data?.body?.song?.list ?? info?.req?.data?.body?.song ?? []

    songList.forEach( each => {
      const singers = each.singer ?? each.singerList ?? []
      const artistName = singers.map((artist) => artist.name).join('/')
      const songmid = each.mid || each.songmid || each.song_mid || ''
      const albumMid = each.album?.mid || each.albumMid || each.albummid || ''
      songs.push({
        id: `${songmid}`,
        name: each.name,
        cover: albumMid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${albumMid}.jpg` : '',
        duration: each.interval ?? 0,
        artist: {
          id: `${singers[0]?.mid || singers[0]?.id || ''}`,
          name: singers[0]?.name || '',
        },
        ext: {
          source: 'tx',
          songmid: songmid,
          singer: artistName,
          songName: each.name,
        }
      })
    })
    
    return jsonify({
      list: songs,
    })
  }

  if (type == 'playlist') {
    let cards = []
    const { data } = await $fetch.get(buildTxSearchUrl(text, page, 3), {
      headers: {
        ...headers,
        Referer: 'https://y.qq.com/',
        Origin: 'https://y.qq.com',
        Cookie: 'uin=0;',
      }
    })

    const info = typeof data === 'string' ? argsify(data) : data
    const playlistList = info?.req?.data?.body?.songlist?.list ?? info?.req?.data?.body?.songlist ?? []

    playlistList.forEach((each) => {
      const id = each.dissid || each.id || each.tid || ''
      const name = each.dissname || each.title || each.name || ''
      const cover = each.imgurl || each.cover?.url || each.cover || ''
      const creatorName = each.creator?.name || each.nickname || each.creatorName || ''

      cards.push({
        id: `${id}`,
        name: name,
        cover: cover,
        artist: {
          id: `${each.encrypt_uin || each.creator?.encrypt_uin || each.creator?.uin || ''}`,
          name: creatorName,
        },
        ext: {
          gid: '9',
          id: `${id}`,
          type: 'playlist',
        }
      })
    })

    return jsonify({
      list: cards,
    })
  }
  
  return jsonify({})
}

async function getSongInfo(ext) {
  const { source, songmid, singer, songName } = argsify(ext)

  if (songmid == undefined || source == undefined) {
    return jsonify({ urls: [] })
  }

  const result = await $lx.request('musicUrl', {
    type: '320k',
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
