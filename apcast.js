/*!
 * @name ApplePodcasts
 * @description 苹果播客
 * @version v1.0.0
 * @author codex (adapted by AI)
 * @key csp_apple_podcasts
 */

const $config = argsify($config_str)

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = {
  'User-Agent': UA,
}

const PAGE_LIMIT = 20
const SOURCE_NAME = 'apple_podcasts'

const GID = {
  TOP_PODCASTS: '1',
  TAG_PODCASTS: '2',
  PODCAST_EPISODES: '3',
}

const appConfig = {
  ver: 1,
  name: 'ApplePodcasts',
  message: '',
  warning: '',
  desc: '基于苹果 iTunes API 的播客插件',
  tabLibrary: {
    name: '探索',
    groups: [{
      name: '热门播客',
      type: 'album',
      ui: 1,
      showMore: false,
      ext: {
        gid: GID.TOP_PODCASTS,
      }
    }, {
      name: '科技',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PODCASTS,
        kw: '科技',
      }
    }, {
      name: '商业',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PODCASTS,
        kw: '商业',
      }
    }, {
      name: '喜剧',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PODCASTS,
        kw: '喜剧',
      }
    }, {
      name: '新闻',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PODCASTS,
        kw: '新闻',
      }
    }, {
      name: '真实犯罪',
      type: 'album',
      ui: 1,
      showMore: true,
      ext: {
        gid: GID.TAG_PODCASTS,
        kw: '犯罪',
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

async function fetchJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, {
    headers: {
      ...headers,
      ...extraHeaders,
    },
  })
  return safeArgs(data)
}

// 映射 Apple RSS Top API 返回的数据为专辑（播客频道）
function mapTopAlbum(item) {
  const id = `${item?.id ?? ''}`
  const name = item?.name ?? ''
  // 尽量获取高清封面
  const cover = (item?.artworkUrl100 ?? '').replace('100x100bb', '600x600bb')
  const artistName = item?.artistName ?? 'Apple Podcasts'

  return {
    id,
    name,
    title: name,
    cover,
    artwork: cover,
    pic: cover,
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

// 映射 iTunes Search API 返回的数据为专辑（播客频道）
function mapAlbum(item) {
  const id = `${item?.collectionId ?? ''}`
  const name = item?.collectionName ?? ''
  const cover = item?.artworkUrl600 ?? item?.artworkUrl100 ?? ''
  const artistName = item?.artistName ?? 'Apple Podcasts'

  return {
    id,
    name,
    title: name,
    cover,
    artwork: cover,
    pic: cover,
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

// 映射 iTunes API 返回的数据为单曲（播客单集）
function mapTrack(item) {
  const id = `${item?.trackId ?? ''}`
  const name = item?.trackName ?? ''
  const cover = item?.artworkUrl600 ?? item?.artworkUrl160 ?? item?.artworkUrl60 ?? ''
  const artistName = item?.artistName ?? item?.collectionName ?? '主播'
  // 将毫秒转换为秒
  const duration = item?.trackTimeMillis ? Math.floor(item.trackTimeMillis / 1000) : 0
  const episodeUrl = item?.episodeUrl ?? ''

  return {
    id,
    name,
    title: name,
    cover,
    artwork: cover,
    pic: cover,
    duration: duration,
    artist: {
      name: artistName,
    },
    ext: {
      source: SOURCE_NAME,
      trackId: id,
      url: episodeUrl, // Apple API 直接返回了音频链接，存入 ext 备用
    }
  }
}

// 获取中国区热门播客排行
async function loadTopPodcasts() {
  try {
    const url = `https://rss.applemarketingtools.com/api/v2/cn/podcasts/top/50/podcasts.json`
    const data = await fetchJson(url)
    const list = data?.feed?.results || []
    return list
  } catch (e) {
    return []
  }
}

// 根据关键词搜索播客（频道级别）
async function loadPodcastsByKeyword(keyword, page = 1) {
  const kw = keyword || ''
  const offset = (page - 1) * PAGE_LIMIT
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(kw)}&media=podcast&entity=podcast&limit=${PAGE_LIMIT}&offset=${offset}&country=cn`
    const data = await fetchJson(url)
    return data?.results || []
  } catch (e) {
    return []
  }
}

// 获取播客频道下的所有单集
async function loadPodcastEpisodes(podcastId) {
  try {
    // entity=podcastEpisode 允许同时获取播客主体及其下的单集列表，limit 设为 200 获取较多近期单集
    const url = `https://itunes.apple.com/lookup?id=${podcastId}&media=podcast&entity=podcastEpisode&limit=200&country=cn`
    const data = await fetchJson(url)
    
    if (data && data.results) {
      // 过滤掉类型为 "podcast" 的主干信息，只保留单集 "podcast-episode"
      return data.results.filter(item => item.kind === 'podcast-episode')
    }
    return []
  } catch (e) {
    return []
  }
}

// 根据关键词搜索播客单集
async function loadEpisodesByKeyword(keyword, page = 1) {
  const kw = keyword || ''
  const offset = (page - 1) * PAGE_LIMIT
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(kw)}&media=podcast&entity=podcastEpisode&limit=${PAGE_LIMIT}&offset=${offset}&country=cn`
    const data = await fetchJson(url)
    return data?.results || []
  } catch (e) {
    return []
  }
}

/* ================= 暴露给播放器核心的 API ================= */

async function getConfig() {
  return jsonify(appConfig)
}

async function getAlbums(ext) {
  const { page, gid, kw } = argsify(ext)
  const gidValue = `${gid ?? ''}`

  if (gidValue == GID.TOP_PODCASTS) {
    if (page > 1) {
      // RSS 排行榜没有分页，只返回第一页数据
      return jsonify({ list: [] })
    }
    const list = await loadTopPodcasts()
    return jsonify({
      list: list.map(mapTopAlbum),
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
    if (page > 1 && !text) {
      // Apple lookup 接口一次性返回最多 200 条单集，未做服务端深度分页，后续页码直接返回空
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
  // Apple Podcasts 较难通过简单 API 精准聚合创作者，这里暂时返回空列表
  return jsonify({ list: [] })
}

async function getPlaylists(ext) {
  return jsonify({ list: [] })
}

async function search(ext) {
  const { text, page, type } = argsify(ext)

  if (!text) {
    return jsonify({})
  }

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
  const trackId = extObj.trackId

  if (!trackId) {
    return jsonify({ urls: [] })
  }

  // 优化：如果在 mapTrack 阶段已经存下了 episodeUrl，直接使用，省去一次网络请求
  if (extObj.url) {
    return jsonify({
      urls: [extObj.url],
    })
  }

  // 兜底：如果没传 URL，则通过 ID 再次请求 Apple lookup API 获取媒体直链
  try {
    const url = `https://itunes.apple.com/lookup?id=${trackId}&country=cn`
    const data = await fetchJson(url)
    const result = data?.results?.[0]
    
    if (result && result.episodeUrl) {
      return jsonify({
        urls: [result.episodeUrl],
      })
    }
  } catch (e) {
    // fail silently
  }

  return jsonify({ urls: [] })
}
