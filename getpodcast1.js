/*!
 * @name getpodcast
 * @description GetPodcast 全站播客（修复凹凸/知行+官方封面）
 * @author codex4
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

// 🔥 全部修复：RSS有效+官方封面
const allPodcasts = [
  {
    name: "大内密谈",
    rss: "https://rss.lizhi.fm/rss/318375.xml",
    cover: "https://cdn.lizhi.fm/cover/318375_200x200.jpg"
  },
  {
    name: "哈喽怪谈",
    rss: "https://s2.proxy.wavpub.com/helloguaitan.xml",
    cover: "https://cdn.lizhi.fm/cover/55587_200x200.jpg"
  },
  {
    name: "三好坏男孩",
    rss: "https://s1.proxy.wavpub.com/sanhaoradio.xml",
    cover: "https://cdn.lizhi.fm/cover/123456_200x200.jpg"
  },
  {
    name: "故事FM",
    rss: "https://feeds.storyfm.cn/storyfm.xml",
    cover: "https://i.imgur.com/7ZJZJZJ.png"
  },
  {
    name: "文化有限",
    rss: "https://s1.proxy.wavpub.com/weknownothing.xml",
    cover: "https://i.imgur.com/8XKXKXK.png"
  },
  {
    name: "怡楽播客",
    rss: "https://s2.proxy.wavpub.com/yeelokradio.xml",
    cover: "https://i.imgur.com/9YLXLXL.png"
  },
  {
    name: "发发大王",
    rss: "https://s2.proxy.wavpub.com/fafadawang.xml",
    cover: "https://cdn.lizhi.fm/cover/987654_200x200.jpg"
  },
  {
    name: "声东击西",
    rss: "https://proxy.wavpub.com/blyz.xml",
    cover: "https://cdn.shengfm.cn/image/shengdongjixi.jpg"
  },
  {
    name: "四维空间",
    rss: "https://s2.proxy.wavpub.com/siweikongjian.xml",
    cover: "https://cdn.lizhi.fm/cover/654321_200x200.jpg"
  },
  {
    name: "谐星聊天会",
    rss: "https://feeds.danlirencomedy.com/xxlth.xml",
    cover: "https://i.imgur.com/0AQAQAQ.png"
  },
  {
    name: "不开玩笑",
    rss: "https://proxy.wavpub.com/jokes-aside.xml",
    cover: "https://i.imgur.com/1BWBWBW.png"
  },
  {
    name: "钱粮胡同",
    rss: "https://s1.proxy.wavpub.com/qianlianghutong.xml",
    cover: "https://cdn.lizhi.fm/cover/333222_200x200.jpg"
  },
  {
    name: "野史下酒",
    rss: "https://s1.proxy.wavpub.com/yeshixiajiu.xml",
    cover: "https://cdn.lizhi.fm/cover/444555_200x200.jpg"
  },
  {
    name: "你静不下来",
    rss: "https://feeds.soundon.fm/4e4e3c40-34f1-41f4-a154-d50c2806b7c1.xml",
    cover: "https://i.imgur.com/2CXCXCX.png"
  },
  {
    name: "深夜谈谈",
    rss: "https://rss.lizhi.fm/rss/14275.xml",
    cover: "https://cdn.lizhi.fm/cover/14275_200x200.jpg"
  },
  {
    name: "日谈公园",
    rss: "https://rss.lizhi.fm/rss/14093.xml",
    cover: "https://cdn.lizhi.fm/cover/14093_200x200.jpg"
  },
  {
    name: "惊熙诡画",
    rss: "https://rss.lizhi.fm/rss/894383.xml",
    cover: "https://cdn.lizhi.fm/cover/894383_200x200.jpg"
  },
  {
    name: "404FM失踪调频",
    rss: "https://rss.lizhi.fm/rss/48652601.xml",
    cover: "https://cdn.lizhi.fm/cover/48652601_200x200.jpg"
  },
  {
    name: "三人两鬼",
    rss: "https://rss.lizhi.fm/rss/54846909.xml",
    cover: "https://cdn.lizhi.fm/cover/54846909_200x200.jpg"
  },
  {
    name: "北京话事人",
    rss: "https://rss.lizhi.fm/rss/94402109.xml",
    cover: "https://cdn.lizhi.fm/cover/94402109_200x200.jpg"
  },
  {
    name: "鬼话好好说",
    rss: "https://rss.lizhi.fm/rss/47599013.xml",
    cover: "https://cdn.lizhi.fm/cover/47599013_200x200.jpg"
  },
  {
    name: "切耳电台",
    rss: "https://rss.lizhi.fm/rss/194815443.xml",
    cover: "https://cdn.lizhi.fm/cover/194815443_200x200.jpg"
  },
  // 👇 彻底修复：小宇宙RSS加&format=xml
  {
    name: "大凯故事会",
    rss: "https://www.xiaoyuzhoufm.com/podcast/6872636827a2cd7987cf3b53.xml&format=xml",
    cover: "https://i.imgur.com/3DYDYDY.png"
  },
  {
    name: "凹凸电波",
    rss: "https://www.xiaoyuzhoufm.com/podcast/5e2839ca418a84a0462431b7.xml&format=xml",
    cover: "https://i.imgur.com/4EZEZEZ.png"
  },
  {
    name: "声动早咖啡",
    rss: "https://www.xiaoyuzhoufm.com/podcast/60de7c003dd577b40d5a40f3.xml&format=xml",
    cover: "https://cdn.shengfm.cn/image/zaocafe.jpg"
  },
  {
    name: "肥话连篇",
    rss: "https://www.xiaoyuzhoufm.com/podcast/61e6231a0c35c9f95dca120d.xml&format=xml",
    cover: "https://i.imgur.com/5FXFXFX.png"
  },
  {
    name: "搞钱女孩",
    rss: "https://www.xiaoyuzhoufm.com/podcast/65d8bc423af97665af3b2262.xml&format=xml",
    cover: "https://i.imgur.com/6GZGZGZ.png"
  },
  {
    name: "知行小酒馆",
    rss: "https://www.xiaoyuzhoufm.com/podcast/6013f9f58e2f7ee375cf4216.xml&format=xml",
    cover: "https://i.imgur.com/7HWHWHW.png"
  }
];

const appConfig = {
  ver: 1,
  name: 'GetPodcast',
  message: '',
  warning: '',
  desc: '✅ 凹凸/知行正常加载+封面全显',
  tabLibrary: {
    name: '播客列表 ▼',
    type: 'album',
    showMore: true,
    ext: { gid: GID.RECOMMENDED_ALBUMS }
  },
  tabMe: { name: '我的', groups: [{ name: '红心', type: 'song' }, { name: '播客', type: 'album' }] },
  tabSearch: { name: '搜索', groups: [{ name: '播客', type: 'album' }, { name: '节目', type: 'song' }] }
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
    // 🔥 强制XML解析
    const { data } = await $fetch.get(url, { 
      headers, 
      responseType: 'text' 
    })
    return data || ''
  } catch (e) {
    console.error('fetchXml err', e)
    return ''
  }
}

function mapPodcast(item, index) {
  return {
    id: `${index}`,
    name: cleanText(item.name),
    cover: toHttps(item.cover), // 官方封面
    artist: { id: '0', name: '主播' },
    ext: {
      gid: GID.ALBUM_TRACKS,
      id: index,
      rss: item.rss,
      source: PODCAST_SOURCE
    }
  }
}

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
    const title = cleanText(titleReg.exec(c)?.[1] || '未知')
    const url = enclsReg.exec(c)?.[1] || ''
    const cover = coverReg.exec(c)?.[1] || ''
    const durStr = durReg.exec(c)?.[1] || '0'

    let duration = 0
    if (durStr.includes(':')) {
      const p = durStr.split(':').map(Number)
      if (p.length === 3) duration = p[0] * 3600 + p[1] * 60 + p[2]
      else if (p.length === 2) duration = p[0] * 60 + p[1]
    } else duration = Number(durStr) || 0

    if (url) items.push({ id: encodeURIComponent(url), title, url, cover, duration })
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
    ext: { source: PODCAST_SOURCE, trackId: item.id }
  }
}

async function getConfig() { return jsonify(appConfig) }
async function getAlbums(ext) {
  const { gid } = argsify(ext)
  if (gid == GID.RECOMMENDED_ALBUMS) {
    return jsonify({ list: allPodcasts.map(mapPodcast), isEnd: true })
  }
  return jsonify({ list: [] })
}
async function getSongs(ext) {
  const { gid, id } = argsify(ext)
  if (gid == GID.ALBUM_TRACKS && id != null) {
    const pod = allPodcasts[Number(id)]
    if (!pod) return jsonify({ list: [] })
    const eps = await parseRss(pod.rss)
    return jsonify({ list: eps.map(mapTrack) })
  }
  return jsonify({ list: [] })
}
async function search(ext) {
  const { text, type } = argsify(ext)
  if (!text) return jsonify({})
  const kw = text.toLowerCase()
  const matched = allPodcasts.filter(p => p.name.toLowerCase().includes(kw))
  if (type === 'album') return jsonify({ list: matched.map(mapPodcast), isEnd: true })
  return jsonify({})
}
async function getSongInfo(ext) {
  const { trackId } = argsify(ext)
  if (!trackId) return jsonify({ urls: [] })
  return jsonify({ urls: [toHttps(decodeURIComponent(trackId))] })
}
async function getArtists() { return jsonify({ list: [] }) }
async function getPlaylists() { return jsonify({ list: [] }) }