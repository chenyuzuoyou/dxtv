/*!
 * @name bili
 * @description 
 * @version v1.0.0
 * @author kobe
 * @key csp_bili
 */

const $config = argsify($config_str)
const cheerio = createCheerio()
const CryptoJS = createCryptoJS()
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const headers = {
  'User-Agent': UA,
  'Referer': 'https://www.bilibili.com/',
  'Origin': 'https://www.bilibili.com'
}

const appConfig = {
  "ver": 1,
  "name": "bilibili音乐",
  "message": "",
  //"warning": "⚠️ 测试用 随时改结构 请勿使用",
  "desc": "",
  "tabLibrary": {
    "name": "探索",
    "groups": [{
      "name": "VOCALOID·UTAU",
      "type": "song",
      "ui": 0,
      "showMore": false,
      "ext": {
          "gid": "2",
          "rid": 30
      }
    }, {
      "name": "演奏",
      "type": "song",
      "ui": 0,
      "showMore": false,
      "ext": {
          "gid": "2",
          "rid": 59
      }
    }, {
      "name": "MV",
      "type": "song",
      "ui": 0,
      "showMore": false,
      "ext": {
          "gid": "2",
          "rid": 193
      }
    }, {
      "name": "音乐综合",
      "type": "song",
      "ui": 0,
      "showMore": false,
      "ext": {
          "gid": "2",
          "rid": 130
      }
    }, {
      "name": "华语",
      "type": "song",
      "ui": 0,
      "showMore": false,
      "ext": {
          "gid": "2",
          "rid": 63
      }
    }, {
      "name": "欧美",
      "type": "song",
      "ui": 0,
      "showMore": false,
      "ext": {
          "gid": "2",
          "rid": 64
      }
    }, {
      "name": "日语",
      "type": "song",
      "ui": 0,
      "showMore": false,
      "ext": {
          "gid": "2",
          "rid": 65
      }
    }, {
      "name": "韩语",
      "type": "song",
      "ui": 0,
      "showMore": false,
      "ext": {
          "gid": "2",
          "rid": 66
      }
    }, {
      "name": "民谣",
      "type": "song",
      "ui": 0,
      "showMore": false,
      "ext": {
          "gid": "2",
          "rid": 70
      }
    }, {
      "name": "摇滚",
      "type": "song",
      "ui": 0,
      "showMore": false,
      "ext": {
          "gid": "2",
          "rid": 71
      }
    }, {
      "name": "轻音乐",
      "type": "song",
      "ui": 0,
      "showMore": false,
      "ext": {
          "gid": "2",
          "rid": 72
      }
    }, {
      "name": "影视",
      "type": "song",
      "ui": 0,
      "showMore": false,
      "ext": {
          "gid": "2",
          "rid": 73
      }
    }, {
      "name": "游戏",
      "type": "song",
      "ui": 0,
      "showMore": false,
      "ext": {
          "gid": "2",
          "rid": 74
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

function dictToURI(dict) {
  var str = [];
  for(var p in dict){
     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(dict[p]));
  }
  return str.join("&");
}

async function getConfig() {
  return jsonify(appConfig)
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
    const { data } = await $fetch.get('https://www.bilibili.com/v/music/', {
      headers
    })
    // $print(`***data: ${data}`)
    let json = data.match(/__INITIAL_DATA__=(\[.*?\])<\/script>/)[1]
    $print(`***json: ${json}`)
    argsify(json)[0]?.response["5010"]?.forEach( each => {
      let archive = each.archive
      songs.push({
        id: `${archive.aid}`,
        name: archive.title,
        cover: archive.pic,
        duration: parseInt(archive.duration),
        artist: {
          id: `${archive.owner.mid}`,
          name: archive.owner.name,
          cover: archive.owner.face
        },
        ext: {
          aid: archive.aid,
          cid: archive.cid,
          bvid: archive.bvid
        }
      })
    })
  }

  if (gid == '2') {
    if (page > 1) {
      return jsonify({
        list: [],
      })
    }
    const { rid } = argsify(ext)
    const { data } = await $fetch.get(`https://api.bilibili.com/x/web-interface/dynamic/region?ps=14&pn=1&rid=${rid}`, {
      headers
    })
    $print(`***json: ${data}`)
    argsify(data)?.data?.archives?.forEach( each => {
      songs.push({
        id: `${each.aid}`,
        name: each.title,
        cover: each.pic,
        duration: each.duration,
        artist: {
          id: `${each.owner.mid}`,
          name: each.owner.name,
          cover: each.owner.face,
        },
        ext: {
          aid: each.aid,
          cid: each.cid,
          bvid: each.bvid
        }
      })
    })
  }

  // search
  if (gid === '99') {
    if (page > 1) {
      return jsonify({
        list: [],
      })
    }
    const { aid, cid, bvid } = argsify(ext)
    let params = {
      aid: aid
    }
    const { data } = await $fetch.get(`https://api.bilibili.com/x/web-interface/view/detail?` + dictToURI(params), {
      headers
    })
    let view = argsify(data).data?.View
    view?.ugc_season?.sections[0]?.episodes?.forEach( each => {
      songs.push({
        id: `${each.cid}`,
        name: each.title,
        cover: each.arc.pic,
        duration: each.arc.duration,
        artist: {
          id: `${view.owner.mid}`,
          name: view.owner.name,
          cover: view.owner.face
        },
        ext: {
          aid: each.aid,
          cid: each.cid,
          bvid: each.bvid
        }
      })
    })
    if (songs.length == 0) {
      view?.pages?.forEach( each => {
        songs.push({
          id: `${each.cid}`,
          name: each.part,
          cover: each.first_frame,
          duration: each.duration,
          artist: {
            id: `${view.owner.mid}`,
            name: view.owner.name,
            cover: view.owner.face
          },
          ext: {
            aid: view.aid,
            cid: each.cid,
            bvid: view.bvid
          }
        })
      })
    }
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
  const { page, from } = argsify(ext)
  if (page > 1) {
    return jsonify({
      list: [],
    })
  }
  
  let cards = []

  return jsonify({
    list: cards
  })
}

async function getAlbums(ext) {
  const { page, from } = argsify(ext)
  if (page > 1) {
    return jsonify({
      list: [],
    })
  }

  let cards = []

  return jsonify({
    list: cards
  })
}

const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
  61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
  36, 20, 34, 44, 52
]

// 对 imgKey 和 subKey 进行字符顺序打乱编码
function getMixinKey(orig) {
  let temp = ''
  mixinKeyEncTab.forEach((n) => {
    temp += orig[n]
  })
  return temp.slice(0, 32)
}

// 为请求参数进行 wbi 签名
function encWbi(params, imgKey, subKey) {
  const mixinKey = getMixinKey(imgKey + subKey)
  const currTime = Math.round(Date.now() / 1000)
  const chrFilter = /[!'()*]/g
  let query = []
  Object.assign(params, { wts: currTime }) // 添加 wts 字段
  // 按照 key 重排参数
  Object.keys(params).sort().forEach((key) => {
    query.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(
            // 过滤 value 中的 "!'()*" 字符
            params[key].toString().replace(chrFilter, '')
        )}`
    )
  })
  query = query.join('&')
  const wbiSign = CryptoJS.MD5(query + mixinKey) // 计算 w_rid
  return query + '&w_rid=' + wbiSign
}

async function getWbiKeys () {
  const { data } = await $fetch.get('https://api.bilibili.com/x/web-interface/nav', headers)
  const jsonContent = argsify(data)
  const imgUrl = jsonContent.data.wbi_img.img_url
  const subUrl = jsonContent.data.wbi_img.sub_url

  return {
    img_key: imgUrl.slice(
      imgUrl.lastIndexOf('/') + 1,
      imgUrl.lastIndexOf('.')
    ),
    sub_key: subUrl.slice(
      subUrl.lastIndexOf('/') + 1,
      subUrl.lastIndexOf('.')
    )
  }
}

async function search(ext) {
  const { text, page, type } = argsify(ext)

  if (page > 1) {
    return jsonify({})
  }

  if (!text.startsWith('BV')) {
    if (type == 'playlist') {
      return jsonify({})
    }
    let songs = []
    const { img_key, sub_key } = await getWbiKeys()
    $print(`***keys: ${img_key} , ${sub_key}`)
    const query = encWbi({
        keyword: text,
      },
      img_key,
      sub_key
    )
    $print(`***query: ${query}`)
    const { data } = await $fetch.get(`https://api.bilibili.com/x/web-interface/wbi/search/all/v2?${query}`, headers)
    $print(`***data: ${data}`)
    argsify(data).data?.result?.forEach( each => {
      if (each?.result_type === 'video') {
        each?.data.forEach( item => {
          songs.push({
            id: `${item.aid}`,
            name: item.title.replace(/<[^>]*>/g, ''),
            cover: 'https:' + item.pic,
            duration: 0,
            artist: {
              id: `${item.mid}`,
              name: item.author,
              cover: item.upic
            },
            ext: {
              aid: item.aid,
              bvid: item.bvid
            }
          })
        })
      }
    })
    return jsonify({list: songs})
  }

  if (type == 'song') {
    let songs = []
    let params = {
      bvid: text
    }
    const { data } = await $fetch.get(`https://api.bilibili.com/x/web-interface/view/detail?` + dictToURI(params), {
      headers
    })

    let view = argsify(data).data?.View
    if (view != undefined) {
      songs.push({
        id: `${view.aid}`,
        name: view.title,
        cover: view.pic,
        duration: view.duration,
        artist: {
          id: `${view.owner.mid}`,
          name: view.owner.name,
          cover: view.owner.face
        },
        ext: {
          aid: view.aid,
          cid: view.cid,
          bvid: view.bvid
        }
      })
    }

    return jsonify({
      list: songs,
    })
  }

  if (type == 'playlist') {
    let cards = []
    let params = {
      bvid: text
    }
    const { data } = await $fetch.get(`https://api.bilibili.com/x/web-interface/view/detail?` + dictToURI(params), {
      headers
    })

    $print(`***data: ${data}`)

    let view = argsify(data).data?.View
    if (view != undefined) {
      let ugc = view?.ugc_season
      if (ugc != undefined) {
        cards.push({
          id: `${view.aid}`,
          name: ugc.title,
          cover: ugc.cover,
          artist: {
            id: `${view.owner.mid}`,
            name: view.owner.name,
            cover: view.owner.face
          },
          ext: {
            gid: '99',
            aid: view.aid,
            cid: view.cid,
            bvid: view.bvid
          }
        })
      } else {
        cards.push({
          id: `${view.aid}`,
          name: view.title,
          cover: view.pic,
          artist: {
            id: `${view.owner.mid}`,
            name: view.owner.name,
            cover: view.owner.face
          },
          ext: {
            gid: '99',
            aid: view.aid,
            cid: view.cid,
            bvid: view.bvid
          }
        })
      }
    }

    return jsonify({
      list: cards
    })
  }
  
  return jsonify({})
}

async function getSongInfo(ext) {
  let { aid, cid } = argsify(ext)
  
  if (cid == undefined) {
    const { data } = await $fetch.get(`https://api.bilibili.com/x/player/pagelist?aid=${aid}`, headers)
    cid = argsify(data)?.data[0]?.cid ?? 0
  }
  
  let params = {
    avid: aid,
    cid: cid,
    qn: 32,
    fnval: 1,
    type: '',
    fnver: 0,
    otype: 'json',
    fourk: 0
  }
  const { data } = await $fetch.get('https://api.bilibili.com/x/player/wbi/playurl?' + dictToURI(params), {
    headers
  })
  $print(`***song: ${data}`)
  let audio = argsify(data).data?.durl[0]?.url ?? ""
  return jsonify({ urls: [audio], headers: [{"User-Agent": "Bilibili/APPLE TV", "Referer": "https://www.bilibili.com/video/av${aid}"}] })
}