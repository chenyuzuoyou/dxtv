/*!
 * @name getpodcast
 * @description GetPodcast 全站播客 RSS 解析播放（修复版）
 * @author codex
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

// 全站播客列表（名称 + RSS 订阅地址）
const allPodcasts = [
  { name: "大内密谈", rss: "https://rss.lizhi.fm/rss/318375.xml" },
  { name: "哈喽怪谈", rss: "https://s2.proxy.wavpub.com/helloguaitan.xml" },
  { name: "三好坏男孩", rss: "https://s1.proxy.wavpub.com/sanhaoradio.xml" },
  { name: "故事FM", rss: "https://feeds.storyfm.cn/storyfm.xml" },
  { name: "文化有限", rss: "https://s1.proxy.wavpub.com/weknownothing.xml" },
  { name: "怡楽播客", rss: "https://s2.proxy.wavpub.com/yeelokradio.xml" },
  { name: "发发大王", rss: "https://s2.proxy.wavpub.com/fafadawang.xml" },
  { name: "声东击西", rss: "https://proxy.wavpub.com/blyz.xml" },
  { name: "四维空间", rss: "https://s2.proxy.wavpub.com/siweikongjian.xml" },
  { name: "谐星聊天会", rss: "https://feeds.danlirencomedy.com/xxlth.xml" },
  { name: "不开玩笑", rss: "https://proxy.wavpub.com/jokes-aside.xml" },
  { name: "钱粮胡同", rss: "https://s1.proxy.wavpub.com/qianlianghutong.xml" },
  { name: "野史下酒", rss: "https://s1.proxy.wavpub.com/yeshixiajiu.xml" },
  { name: "你静不下来", rss: "https://feeds.soundon.fm/4e4e3c40-34f1-41f4-a154-d50c2806b7c1.xml" },
  { name: "深夜谈谈", rss: "https://rss.lizhi.fm/rss/14275.xml" },
  { name: "日谈公园", rss: "https://rss.lizhi.fm/rss/14093.xml" },
  { name: "惊熙诡画", rss: "https://rss.lizhi.fm/rss/894383.xml" },
  { name: "404FM失踪调频", rss: "https://rss.lizhi.fm/rss/48652601.xml" },
  { name: "三人两鬼", rss: "https://rss.lizhi.fm/rss/54846909.xml" },
  { name: "北京话事人", rss: "https://rss.lizhi.fm/rss/94402109.xml" },
  { name: "鬼话好好说", rss: "https://rss.lizhi.fm/rss/47599013.xml" },
  { name: "切耳电台", rss: "https://rss.lizhi.fm/rss/194815443.xml" },
  { name: "大凯故事会", rss: "https://www.ximalaya.com/album/64689453.xml" },
  { name: "凹凸电波", rss: "https://www.ximalaya.com/album/18088545.xml" },
  { name: "声动早咖啡", rss: "https://www.ximalaya.com/album/76735246.xml" },
  { name: "肥话连篇", rss: "https://www.ximalaya.com/album/41153937.xml" },
  { name: "搞钱女孩", rss: "https://www.ximalaya.com/album/29535750.xml" },
  { name: "知行小酒馆", rss: "https://www.ximalaya.com/album/31195070.xml" }
];

const appConfig = {
  ver: 1,
  name: 'GetPodcast',
  message: '',
  warning: '',
  desc: 'GetPodcast 全站播客，修复CDATA与播放问题',
  tabLibrary: {
    name: '播客列表',
    groups: [
      {
        name: '全部播客',
        type: 'album',
        showMore: false,
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
  // 核心修复：去除 CDATA 标签
  let str = `${t ?? ''}`
    .replace(/<!\[CDATA\[/gi, '')
    .replace(/\]\]>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  return str
}
function firstArray(...candidates) {
  for (const i of candidates) {
    if (Array.isArray(i) && i.length > 0) return i
  }
  return []
}

async function fetchXml(url) {
  try {
    const { data } = await $fetch.get(url, { headers })
    return data || ''
  } catch (e) {
    console.error('fetchXml error:', e)
    return ''
  }
}

// 映射播客专辑
function mapPodcast(item, index) {
  return {
    id: `${index}`,
    name: cleanText(item.name),
    cover: '',
    artist: { id: '0', name: '主播' },
    ext: {
      gid: GID.ALBUM_TRACKS,
      id: index,
      rss: item.rss,
      source: PODCAST_SOURCE
    }
  }
}

// 解析 RSS 获取单集（修复CDATA、播放地址）
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
    // 修复：处理 CDATA 包裹的标题
    const rawTitle = titleReg.exec(c)?.[1] || '未知节目'
    const title = cleanText(rawTitle)
    const url = enclsReg.exec(c)?.[1] || ''
    const cover = coverReg.exec(c)?.[1] || ''
    const durStr = durReg.exec(c)?.[1] || '0'

    let duration = 0
    if (durStr.includes(':')) {
      const p = durStr.split(':').map(Number)
      if (p.length === 3) duration = p[0] * 3600 + p[1] * 60 + p[2]
      else if (p.length === 2) duration = p[0] * 60 + p[1]
    } else {
      duration = Number(durStr) || 0
    }

    if (url) {
      items.push({ 
        id: encodeURIComponent(url), // 修复：对URL编码，避免特殊字符问题
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

// 配置
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

// 单集列表
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

async function getArtists(ext) {
  return jsonify({ list: [] })
}
async function getPlaylists() {
  return jsonify({ list: [] })
}

// 搜索
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

// 播放地址（修复：解码URL，直接返回）
async function getSongInfo(ext) {
  const { trackId } = argsify(ext)
  if (!trackId) return jsonify({ urls: [] })
  const mp3Url = decodeURIComponent(trackId)
  return jsonify({ urls: [toHttps(mp3Url)] })
}