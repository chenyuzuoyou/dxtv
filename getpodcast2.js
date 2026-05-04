/*!
 * @name getpodcast
 * @description 兼容喜马拉雅/小宇宙/荔枝 完整解析版
 * @author codex
 * @key csp_getpodcast
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const headers = {
  'User-Agent': UA,
  'Referer': 'https://getpodcast.xyz/',
  'Accept': 'text/xml,application/xml,application/xhtml+xml;q=0.9,*/*;q=0.8'
}
const PODCAST_SOURCE = 'getpodcast'
const GID = {
  RECOMMENDED_ALBUMS: '1',
  ALBUM_TRACKS: '3',
}

// 你原有全部播客 + 原订阅地址 一点没改
const allPodcasts = [
  { name: "大内密谈", rss: "https://rss.lizhi.fm/rss/318375.xml", cover: "" },
  { name: "哈喽怪谈", rss: "https://s2.proxy.wavpub.com/helloguaitan.xml", cover: "" },
  { name: "三好坏男孩", rss: "https://s1.proxy.wavpub.com/sanhaoradio.xml", cover: "" },
  { name: "故事FM", rss: "https://feeds.storyfm.cn/storyfm.xml", cover: "" },
  { name: "文化有限", rss: "https://s1.proxy.wavpub.com/weknownothing.xml", cover: "" },
  { name: "怡楽播客", rss: "https://s2.proxy.wavpub.com/yeelokradio.xml", cover: "" },
  { name: "发发大王", rss: "https://s2.proxy.wavpub.com/fafadawang.xml", cover: "" },
  { name: "声东击西", rss: "https://proxy.wavpub.com/blyz.xml", cover: "" },
  { name: "四维空间", rss: "https://s2.proxy.wavpub.com/siweikongjian.xml", cover: "" },
  { name: "谐星聊天会", rss: "https://feeds.danlirencomedy.com/xxlth.xml", cover: "" },
  { name: "不开玩笑", rss: "https://proxy.wavpub.com/jokes-aside.xml", cover: "" },
  { name: "钱粮胡同", rss: "https://s1.proxy.wavpub.com/qianlianghutong.xml", cover: "" },
  { name: "野史下酒", rss: "https://s1.proxy.wavpub.com/yeshixiajiu.xml", cover: "" },
  { name: "你，静不下来", rss: "https://feeds.soundon.fm/4e4e3c40-34f1-41f4-a154-d50c2806b7c1.xml", cover: "" },
  { name: "深夜谈谈", rss: "https://rss.lizhi.fm/rss/14275.xml", cover: "" },
  { name: "日谈公园", rss: "https://rss.lizhi.fm/rss/14093.xml", cover: "" },
  { name: "惊熙诡画", rss: "https://rss.lizhi.fm/rss/894383.xml", cover: "" },
  { name: "404FM失踪调频", rss: "https://rss.lizhi.fm/rss/48652601.xml", cover: "" },
  { name: "三人两鬼", rss: "https://rss.lizhi.fm/rss/54846909.xml", cover: "" },
  { name: "北京话事人", rss: "https://rss.lizhi.fm/rss/94402109.xml", cover: "" },
  { name: "鬼话好好说", rss: "https://rss.lizhi.fm/rss/47599013.xml", cover: "" },
  { name: "切耳电台", rss: "https://rss.lizhi.fm/rss/194815443.xml", cover: "" },
  { name: "大凯故事会", rss: "https://www.ximalaya.com/album/64689453.xml", cover: "" },
  { name: "凹凸电波", rss: "https://www.ximalaya.com/album/18088545.xml", cover: "" },
  { name: "声动早咖啡", rss: "https://www.ximalaya.com/album/76735246.xml", cover: "" },
  { name: "肥话连篇", rss: "https://www.ximalaya.com/album/41153937.xml", cover: "" },
  { name: "搞钱女孩", rss: "https://www.ximalaya.com/album/29535750.xml", cover: "" },
  { name: "知行小酒馆", rss: "https://www.ximalaya.com/album/31195070.xml", cover: "" }
];

const appConfig = {
  ver: 1,
  name: 'GetPodcast',
  message: '',
  warning: '',
  desc: '播客RSS全解析',
  tabLibrary: {
    name: '探索',
    groups: [
      {
        name: '全部播客 ▼',
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

// 核心：万能解析 兼容喜马拉雅/小宇宙/标准RSS
async function parseRss(rssUrl) {
  const xml = await fetchXml(rssUrl)
  if (!xml) return []

  const items = []
  // 匹配 item 或 entry
  const itemReg = /<(item|entry)>([\s\S]*?)<\/\1>/gi
  const titleReg = /<title[^>]*>([\s\S]*?)<\/title>/i
  // 兼容单引号双引号 enclosure
  const enclsReg = /<enclosure\s+url=(["'])(.*?)\1/i
  const durReg = /<itunes:duration>([\d:]+)<\/itunes:duration>/i
  const coverReg = /<itunes:image\s+href=(["'])(.*?)\1/i

  let match
  while ((match = itemReg.exec(xml))) {
    const c = match[2]
    const title = cleanText(titleReg.exec(c)?.[1] || '未知节目')
    const mp3Url = enclsReg.exec(c)?.[2] || ''
    const cover = coverReg.exec(c)?.[2] || ''
    const durStr = durReg.exec(c)?.[1] || '0'

    let duration = 0
    if (durStr.includes(':')) {
      const arr = durStr.split(':').map(Number)
      if (arr.length === 3) duration = arr[0]*3600 + arr[1]*60 + arr[2]
      else if (arr.length === 2) duration = arr[0]*60 + arr[1]
    } else {
      duration = parseInt(durStr) || 0
    }

    if (mp3Url) {
      items.push({
        id: encodeURIComponent(mp3Url),
        title,
        url: mp3Url,
        cover,
        duration
      })
    }
  }
  return items
}

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

async function getSongs(ext) {
  const { gid, id } = argsify(ext)
  if (gid == GID.ALBUM_TRACKS && id != null) {
    const pod = allPodcasts[Number(id)]
    if (!pod) return jsonify({ list: [] })
    const list = await parseRss(pod.rss)
    return jsonify({ list: list.map(mapTrack) })
  }
  return jsonify({ list: [] })
}

async function getSongInfo(ext) {
  const { trackId } = argsify(ext)
  if (!trackId) return jsonify({ urls: [] })
  const realUrl = decodeURIComponent(trackId)
  return jsonify({ urls: [toHttps(realUrl)] })
}

async function search(ext) {
  const { text, type } = argsify(ext)
  if (!text) return jsonify({})
  const kw = text.toLowerCase()
  const res = allPodcasts.filter(p => p.name.toLowerCase().includes(kw))
  if (type === 'album') return jsonify({ list: res.map(mapPodcast), isEnd: true })
  return jsonify({})
}

async function getArtists() { return jsonify({ list: [] }) }
async function getPlaylists() { return jsonify({ list: [] }) }