/*!
 * @name ListenNotesPodcasts
 * @description Listen Notes 播客搜索引擎
 * @version v1.0.03
 * @author AI
 * @key csp_listennotes
 */

const $config = argsify($config_str)

// 【注意】Listen Notes 需要在 header 中传入 API Key。
// 请前往 https://www.listennotes.com/api/ 申请免费的 FREE Plan Key 填入此处。
const API_KEY = 'YOUR_LISTEN_API_KEY_HERE' 

const API_BASE = 'https://listen-api.listennotes.com/api/v2'
const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
  'X-ListenAPI-Key': API_KEY, 
}

const PAGE_LIMIT = 20
const SOURCE_NAME = 'listen_notes'

const GID = {
  TOP_PODCASTS: '1',
  TAG_PODCASTS: '2',
  PODCAST_EPISODES: '3',
}

const appConfig = {
  ver: 1,
  name: 'ListenNotesPodcasts',
  message: '请确保在脚本中填入 Listen Notes API Key',
  warning: '',
  desc: '全球播客搜索引擎',
  tabLibrary: {
    name: '探索',
    groups: [{
      name: '热门播客',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TOP_PODCASTS,
      }
    }, {
      name: '机器人与自动化',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PODCASTS,
        kw: '机器人',
      }
    }, {
      name: '先进制造',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PODCASTS,
        kw: '制造',
      }
    }, {
      name: '前沿科技',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PODCASTS,
        kw: '科技',
      }
    }, {
      name: '人工智能',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PODCASTS,
        kw: 'AI',
      }
    }]
  },
  tabSearch: {
    name: '搜索',
    groups: [{
      name: '播客频道',
      type: 'album',
      ext: {
        type: 'album',
      }
    }, {
      name: '单集节目',
      type: 'song',
      ext: {
        type: 'track',
      }
    }]
  }
}

function safeArgs(data) {
  return typeof data === 'string' ? argsify(data) : (data ?? {})
}

async function fetchJson(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`)
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
  
  try {
    const { data } = await $fetch.get(url.toString(), { headers })
    return safeArgs(data)
  } catch (e) {
    return null
  }
}

// 映射播客频道 (Album)
function mapAlbum(item) {
  const id = `${item?.id ?? ''}`
  const name = item?.title ?? item?.title_original ?? ''
  const cover = item?.image ?? item?.thumbnail ?? ''
  const artistName = item?.publisher ?? item?.publisher_original ?? 'Listen Notes'
  const desc = item?.description ?? item?.description_original ?? ''

  return {
    id,
    name,
    title: name,
    cover,
    artwork: cover,
    pic: cover,
    desc,
    artist: {
      name: artistName,
    },
    ext: {
      gid: GID.PODCAST_EPISODES,
      id,
      type: 'album',
    }
  }
}

// 映射播客单集 (Track)
function mapTrack(item) {
  const id = `${item?.id ?? ''}`
  const name = item?.title ?? item?.title_original ?? ''
  const cover = item?.image ?? item?.thumbnail ?? ''
  
  // 如果是搜索结果，会有 podcast 嵌套对象；如果是详情接口，外层就是播客信息
  const podcastObj = item?.podcast ?? item?.podcast_title ?? {}
  const artistName = podcastObj?.publisher_original ?? podcastObj?.title_original ?? (typeof podcastObj === 'string' ? podcastObj : '播客单集')
  
  const duration = item?.audio_length_sec ?? 0
  const audioUrl = item?.audio ?? ''

  return {
    id,
    name,
    title: name,
    cover,
    artwork: cover,
    pic: cover,
    duration,
    artist: {
      name: artistName,
    },
    ext: {
      source: SOURCE_NAME,
      trackId: id,
      url: audioUrl, // Listen Notes 直接给出了 MP3 直链，直接存入 ext
    }
  }
}

// 获取热门播客
async function loadTopPodcasts(page = 1) {
  const data = await fetchJson('/best_podcasts', {
    page: page,
    region: 'cn', // 默认中国区，可按需修改为 us 等
  })
  return data?.podcasts || []
}

// 搜索播客频道
async function loadPodcastsByKeyword(keyword, page = 1) {
  const offset = (page - 1) * 10 // Listen Notes 默认每页 10 条
  const data = await fetchJson('/search', {
    q: keyword,
    type: 'podcast',
    offset: offset,
    language: 'Chinese', 
  })
  return data?.results || []
}

// 获取播客频道下的单集
async function loadPodcastEpisodes(podcastId, next_episode_pub_date = '') {
  // Listen Notes 分页使用 next_episode_pub_date 而不是页码
  const params = { sort: 'recent_first' }
  if (next_episode_pub_date) {
    params.next_episode_pub_date = next_episode_pub_date
  }
  
  const data = await fetchJson(`/podcasts/${podcastId}`, params)
  return data?.episodes || []
}

// 搜索播客单集
async function loadEpisodesByKeyword(keyword, page = 1) {
  const offset = (page - 1) * 10
  const data = await fetchJson('/search', {
    q: keyword,
    type: 'episode',
    offset: offset,
    language: 'Chinese',
  })
  return data?.results || []
}

/* ================= API ================= */

async function getConfig() {
  return jsonify(appConfig)
}

async function getAlbums(ext) {
  const { page, gid, kw } = argsify(ext)
  const gidValue = `${gid ?? ''}`

  if (gidValue == GID.TOP_PODCASTS) {
    const list = await loadTopPodcasts(page)
    return jsonify({
      list: list.map(mapAlbum),
    })
  }

  if (gidValue == GID.TAG_PODCASTS) {
    const list = await loadPodcastsByKeyword(kw, page)
    return jsonify({
      list: list.map(mapAlbum),
    })
  }

  return jsonify({ list: [] })
}

async function getSongs(ext) {
  const { page, gid, id, text } = argsify(ext)
  const gidValue = `${gid ?? ''}`

  if (gidValue == GID.PODCAST_EPISODES) {
    // 简化的分页处理：严格来说应该把上次请求返回的 next_episode_pub_date 传进来。
    // 为了适配 page = 1, 2, 3 的简单逻辑，这里仅在 page=1 时请求最新数据。
    // 若要支持深度分页，需在客户端记录或魔改 page 参数。
    if (page > 1) {
      return jsonify({ list: [] }) 
    }
    const list = await loadPodcastEpisodes(id)
    return jsonify({
      list: list.map(mapTrack),
    })
  }

  return jsonify({ list: [] })
}

async function getArtists(ext) {
  return jsonify({ list: [] })
}

async function getPlaylists(ext) {
  return jsonify({ list: [] })
}

async function search(ext) {
  const { text, page, type } = argsify(ext)

  if (!text) return jsonify({})

  if (type == 'album') {
    const list = await loadPodcastsByKeyword(text, page)
    return jsonify({
      list: list.map(mapAlbum),
    })
  }

  if (type == 'track' || type == 'song') {
    const list = await loadEpisodesByKeyword(text, page)
    return jsonify({
      list: list.map(mapTrack),
    })
  }

  return jsonify({})
}

async function getSongInfo(ext) {
  const extObj = argsify(ext)
  
  // Listen Notes 最爽的一点：在列表/搜索接口中已经下发了音频直链。
  // 我们直接提取使用，实现零延迟播放。
  if (extObj.url) {
    return jsonify({
      urls: [extObj.url],
    })
  }

  // 兜底请求
  const trackId = extObj.trackId
  if (trackId) {
    const data = await fetchJson(`/episodes/${trackId}`)
    if (data && data.audio) {
      return jsonify({
        urls: [data.audio],
      })
    }
  }

  return jsonify({ urls: [] })
}
