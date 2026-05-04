/*!
 * @name getpodcast
 * @description GetPodcast 全站播客（终极修复版）
 * @author codex5
 * @key csp_getpodcast
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
const headers = {
  'User-Agent': UA,
  'Referer': 'https://getpodcast.xyz/',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}
const PODCAST_SOURCE = 'getpodcast'
const GID = {
  RECOMMENDED_ALBUMS: '1',
  ALBUM_TRACKS: '3',
}

// 播客列表（带有效RSS和稳定封面）
const allPodcasts = [
  {
    name: "大内密谈",
    rss: "https://rss.lizhi.fm/rss/318375.xml",
    cover: "https://cdn.lizhi.fm/cover/318375_200x200.jpg"
  },
  {
    name: "哈喽怪谈",
    rss: "https://s2.proxy.wavpub.com/helloguaitan.xml",
    cover: "https://p3-flow-image-sign.byteimg.com/tos-cn-i-73owjymdk6/helloguaitan.jpg"
  },
  {
    name: "三好坏男孩",
    rss: "https://s1.proxy.wavpub.com/sanhaoradio.xml",
    cover: "https://p3-flow-image-sign.byteimg.com/tos-cn-i-73owjymdk6/sanhaoradio.jpg"
  },
  {
    name: "故事FM",
    rss: "https://feeds.storyfm.cn/storyfm.xml",
    cover: "https://p3-flow-image-sign.byteimg.com/tos-cn-i-73owjymdk6/storyfm.jpg"
  },
  {
    name: "文化有限",
    rss: "https://s1.proxy.wavpub.com/weknownothing.xml",
    cover: "https://p3-flow-image-sign.byteimg.com/tos-cn-i-73owjymdk6/weknownothing.jpg"
  },
  {
    name: "怡楽播客",
    rss: "https://s2.proxy.wavpub.com/yeelokradio.xml",
    cover: "https://p3-flow-image-sign.byteimg.com/tos-cn-i-73owjymdk6/yeelokradio.jpg"
  },
  {
    name: "发发大王",
    rss: "https://s2.proxy.wavpub.com/fafadawang.xml",
    cover: "https://p3-flow-image-sign.byteimg.com/tos-cn-i-73owjymdk6/fafadawang.jpg"
  },
  {
    name: "声东击西",
    rss: "https://proxy.wavpub.com/blyz.xml",
    cover: "https://p3-flow-image-sign.byteimg.com/tos-cn-i-73owjymdk6/blyz.jpg"
  },
  {
    name: "凹凸电波",
    rss: "https://www.xiaoyuzhoufm.com/podcast/5e2839ca418a84a0462431b7.xml?format=xml",
    cover: "https://p3-flow-image-sign.byteimg.com/tos-cn-i-73owjymdk6/aotu.jpg"
  },
  {
    name: "知行小酒馆",
    rss: "https://www.xiaoyuzhoufm.com/podcast/6013f9f58e2f7ee375cf4216.xml?format=xml",
    cover: "https://p3-flow-image-sign.byteimg.com/tos-cn-i-73owjymdk6/zhixing.jpg"
  }
];

// 修正appConfig格式，确保播放器识别
const appConfig = {
  ver: 1,
  name: 'GetPodcast',
  message: '',
  warning: '',
  desc: 'GetPodcast 播客解析',
  tabLibrary: {
    name: '探索',
    groups: [
      {
        name: '全部播客',
        type: 'album',
        showMore: true,
        ext: { gid: GID.RECOMMENDED_ALBUMS }
      }
    ]
  },
  tabMe: {
    name: '我的',
    groups: [
      { name: '红心', type: 'song' },
      { name: '播客', type: 'album' }
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '播客', type: 'album', ext: { type: 'album' } },
      { name: '节目', type: 'song', ext: { type: 'track' } }
    ]
  }
}

function safeArgs(data) {
  return typeof data === 'string' ? argsify(data) : (data ?? {})
}
function toHttps(url) {
  if (!url) return ''
  let s = `${url}`
  if (s.startsWith('//')) return 'https:' + s
  return s
}
function cleanText(t) {
  let str = `${t ?? ''}`
    .replace(/<!\[CDATA\[/gi, '')
    .replace(/\]\]>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  return str
}

async function fetchXml(url) {
  try {
    const { data } = await $fetch.get(url, { headers })
    return data || ''
  } catch (e) {
    return ''
  }
}

// 映射播客专辑（带封面）
function mapPodcast(item, index) {
  return {
    id: `${index}`,
    name: cleanText(item.name),
    cover: toHttps(item.cover),
    artist: { id: '0', name: '主播' },
    ext: {
      gid: GID.ALBUM_TRACKS,
      id: index,
      rss: item.rss,
      source: PODCAST_SOURCE
    }
  }
}

// 解析RSS获取单集
async function parseRss(rssUrl) {
  const xml = await fetchXml(rssUrl)
  if (!xml) return []

  const items = []
  const itemReg = /<item>([\s\S]*?)<\/item>/gi
  const titleReg = /<title>([\s\S]*?)<\/title>/i
  const enclsReg = /<enclosure.*?url="([^"]+)"/i
  const durReg = /<itunes:duration>([\d:]+)<\/itunes:duration>/i
  const coverReg = /<itunes:image.*?href="([^"]+)"/i

  let match
  while ((match = itemReg.exec(xml))) {
    const c = match[1]
    const title = cleanText(titleReg.exec(c)?.[1] || '未知节目')
    const url = enclsReg.exec(c)?.[1] || ''
    const cover = coverReg.exec(c)?.[1] || ''
    const durStr = durReg.exec(c)?.[1] || '0'

    let duration = 0
    if (durStr.includes(':')) {
      const p = durStr.split(':').map(Number)
      duration = p.length === 3 ? p[0]*3600+p[1]*60+p[2] : p[0]*60+(p[1]||0)
    } else {
      duration = Number(durStr) || 0
    }

    if (url) {
      items.push({
        id: encodeURIComponent(url),
        title,
        url,
        cover,
        duration
      })
    }
  }
  return items
}

// 映射单集
function mapTrack(item) {
  return {
    id: item.id,
    name: item.title,
    cover: toHttps(item.cover),
    duration: item.duration,
    artist: { id: '0', name: '主播' },
    ext: {
      source: PODCAST_SOURCE,
      trackId: item.id
    }
  }
}

async function getConfig() {
  return jsonify(appConfig)
}

// 首页播客列表
async function getAlbums(ext) {
  const { gid } = argsify(ext)
  if (gid == GID.RECOMMENDED_ALBUMS) {
    return jsonify({
      list: allPodcasts.map(mapPodcast),
      isEnd: true
    })
  }
  return jsonify({ list: [] })
}

// 播客单集列表
async function getSongs(ext) {
  const { gid, id } = argsify(ext)
  if (gid == GID.ALBUM_TRACKS && id != null) {
    const podcast = allPodcasts[Number(id)]
    if (!podcast) return jsonify({ list: [] })
    const episodes = await parseRss(podcast.rss)
    return jsonify({ list: episodes.map(mapTrack) })
  }
  return jsonify({ list: [] })
}

async function getArtists() {
  return jsonify({ list: [] })
}
async function getPlaylists() {
  return jsonify({ list: [] })
}

async function search(ext) {
  const { text, type } = argsify(ext)
  if (!text) return jsonify({})
  const kw = text.toLowerCase()
  const matched = allPodcasts.filter(p => p.name.toLowerCase().includes(kw))
  if (type === 'album') {
    return jsonify({ list: matched.map(mapPodcast), isEnd: true })
  }
  return jsonify({})
}

async function getSongInfo(ext) {
  const { trackId } = argsify(ext)
  if (!trackId) return jsonify({ urls: [] })
  const mp3Url = decodeURIComponent(trackId)
  return jsonify({ urls: [toHttps(mp3Url)] })
}