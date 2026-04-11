/*!
 * @name mgfm
 * @description mgfm
 * @version v1.0.0
 * @author codex
 * @key csp_mgfm
 */

const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = {
  'User-Agent': UA,
}

const PAGE_LIMIT = 20
const MG_SOURCE = 'mg'
const GID = {
  TOPLISTS: '1',
  TOP_ARTISTS: '2',
  ARTIST_SONGS: '4',
  ARTIST_ALBUMS: '5',
}

const appConfig = {
  ver: 1,
  name: '咪咕音乐',
  message: '',
  //warning: '⚠️🤖 警告，请勿使用 ⚡️📡',
  desc: '',
  tabLibrary: {
    name: '探索',
    groups: [{ name: '新歌榜', type: 'song', ui: 0, showMore: false, ext: { gid: GID.TOPLISTS, id: '27553319' } }, { name: '热歌榜', type: 'song', ui: 0, showMore: false, ext: { gid: GID.TOPLISTS, id: '27186466' } }, { name: '国风热歌榜', type: 'song', ui: 0, showMore: false, ext: { gid: GID.TOPLISTS, id: '83176390' } }, { name: '会员臻爱榜', type: 'song', ui: 0, showMore: false, ext: { gid: GID.TOPLISTS, id: '76557745' } }, { name: '排行榜', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.TOPLISTS } }, { name: '热门歌手', type: 'artist', ui: 0, showMore: true, ext: { gid: GID.TOP_ARTISTS } }]
  },
  tabMe: {
    name: '我的',
    groups: [{ name: '红心', type: 'song' }, { name: '歌单', type: 'playlist' }, { name: '专辑', type: 'album' }, { name: '创作者', type: 'artist' }]
  },
  tabSearch: {
    name: '搜索',
    groups: [{ name: '歌曲', type: 'song', ext: { type: 'song' } }, { name: '歌单', type: 'playlist', ext: { type: 'playlist' } }, { name: '专辑', type: 'album', ext: { type: 'album' } }, { name: '歌手', type: 'artist', ext: { type: 'artist' } }]
  }
}

function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}) }
function toHttps(url) { return url ? `${url}`.replace(/^http:\/\//, 'https://') : '' }
function cleanText(text) { return `${text ?? ''}`.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() }
function withMgHeaders(extra = {}) { return { ...headers, Referer: 'https://music.migu.cn/', Origin: 'https://music.migu.cn', ...extra } }
async function fetchJson(url, extraHeaders = {}) { const { data } = await $fetch.get(url, { headers: withMgHeaders(extraHeaders) }); return safeArgs(data) }
function actionIdOf(actionUrl) { const match = `${actionUrl ?? ''}`.match(/id=(\d+)/); return match?.[1] ?? '' }

function mapToplistCard(item) {
  const rankId = `${item?.rankId ?? item?.id ?? actionIdOf(item?.actionUrl) ?? ''}`
  return {
    id: rankId,
    name: cleanText(item?.rankName ?? item?.title ?? item?.txt ?? ''),
    cover: toHttps(item?.imageUrl ?? item?.img ?? item?.picUrl ?? ''),
    artist: { id: 'mg', name: cleanText(item?.subTitle ?? item?.updateTime ?? 'mgfm'), cover: '' },
    ext: { gid: GID.TOPLISTS, id: rankId, type: 'playlist' }
  }
}

function normalizeMiguSong(item) {
  if (item?.songItem) {
    return {
      ...item,
      songId: item?.songItem?.songId,
      copyrightId: item?.songItem?.copyrightId,
      txt: item?.txt ?? item?.songItem?.songName,
      txt2: item?.txt2 ?? item?.songItem?.singerList?.map((each) => each?.name ?? '').join('/'),
      txt3: item?.txt3 ?? item?.songItem?.album,
      img: toHttps(item?.img ?? item?.songItem?.img2 ?? item?.songItem?.img1 ?? item?.songItem?.img3 ?? ''),
      pic: toHttps(item?.img ?? item?.songItem?.img2 ?? item?.songItem?.img1 ?? item?.songItem?.img3 ?? ''),
      picUrl: toHttps(item?.img ?? item?.songItem?.img2 ?? item?.songItem?.img1 ?? item?.songItem?.img3 ?? ''),
      albumImgs: [{ img: toHttps(item?.songItem?.img1 ?? '') }, { img: toHttps(item?.songItem?.img2 ?? '') }, { img: toHttps(item?.songItem?.img3 ?? '') }],
      songData: item?.songItem,
    }
  }
  return item
}

function parseSongData(item) {
  try { return typeof item?.songData === 'string' ? safeArgs(item.songData) : (item?.songData ?? {}) } catch (error) { return {} }
}

function mapSong(raw) {
  const item = normalizeMiguSong(raw)
  const songData = parseSongData(item)
  const singerList = songData?.singerList ?? []
  const songId = `${item?.songId ?? songData?.songId ?? item?.copyrightId ?? item?.id ?? item?.resId ?? ''}`
  const copyrightId = `${item?.copyrightId ?? songData?.copyrightId ?? item?.resId ?? songId}`
  const albumId = `${songData?.albumId ?? item?.albumId ?? ''}`
  const albumName = cleanText(item?.txt3 ?? item?.albumName ?? songData?.album ?? '')
  const songName = cleanText(item?.txt ?? item?.songName ?? songData?.songName ?? item?.title ?? '')
  const singer = cleanText(item?.txt2 ?? item?.singerName ?? singerList.map((each) => each?.name ?? '').join('/') ?? '')
  const cover = toHttps(
    item?.img
    ?? songData?.img2
    ?? songData?.img1
    ?? songData?.img3
    ?? item?.picUrl
    ?? singerList?.[0]?.img
    ?? ''
  )
  const artistId = `${singerList?.[0]?.id ?? item?.singerId ?? ''}`

  return {
    id: songId,
    name: songName,
    cover: cover,
    pic: cover,
    picUrl: cover,
    img: cover,
    duration: parseInt(songData?.duration ?? item?.duration ?? 0),
    artist: { id: artistId, name: singer, cover: toHttps(singerList?.[0]?.img ?? '') },
    album: { id: albumId, name: albumName, cover: cover },
    ext: {
      source: MG_SOURCE,
      id: songId,
      songId: songId,
      songmid: songId,
      copyrightId: copyrightId,
      singer: singer,
      songName: songName,
      albumName: albumName,
      albumId: albumId,
      cover: cover,
    }
  }
}

function mapArtistCard(item) {
  const artistId = `${item?.id ?? ''}`
  const artistName = cleanText(item?.name ?? '')
  const artistCover = toHttps(item?.img ?? item?.cover ?? '')
  return {
    id: artistId,
    name: artistName,
    cover: artistCover,
    avatar: artistCover,
    img: artistCover,
    pic: artistCover,
    artist: { id: artistId, name: artistName, cover: artistCover },
    groups: [{ name: '热门歌曲', type: 'song', ext: { gid: GID.ARTIST_SONGS, id: artistId } }, { name: '专辑', type: 'album', ext: { gid: GID.ARTIST_ALBUMS, id: artistId } }],
    ext: { gid: GID.TOP_ARTISTS, id: artistId }
  }
}

async function loadToplists() {
  const info = await fetchJson('https://app.c.nf.migu.cn/pc/bmw/rank/rank-index/v1.0')
  const contents = info?.data?.contents ?? []
  const cards = []
  for (const block of contents) {
    for (const each of block?.contents ?? []) {
      cards.push({ rankId: `${each?.rankId ?? actionIdOf(each?.actionUrl) ?? ''}`, rankName: each?.title ?? each?.rankName ?? '', imageUrl: each?.imageUrl ?? each?.img ?? '', subTitle: each?.subTitle ?? block?.title ?? '', actionUrl: each?.actionUrl ?? '' })
    }
  }
  return cards.filter((each) => each?.rankId)
}

async function loadToplistSongs(id) {
  return (await fetchJson(`https://app.c.nf.migu.cn/pc/bmw/rank/rank-info/v1.0?rankId=${encodeURIComponent(id)}`))?.data?.contents ?? []
}

async function loadHotArtists(page = 1) {
  if (page > 1) return []
  const rankIds = ['27553319', '27186466', '83176390', '76557745']
  const artistMap = new Map()
  for (const rankId of rankIds) {
    const songs = await loadToplistSongs(rankId)
    for (const song of songs) {
      const songData = parseSongData(song)
      const singerList = songData?.singerList ?? []
      const firstSinger = singerList[0] ?? {}
      const artistId = `${firstSinger?.id ?? ''}`
      const artistName = cleanText(firstSinger?.name ?? song?.txt2 ?? '')
      const artistCover = toHttps(firstSinger?.img ?? '')
      if (!artistId || !artistName) continue
      const prev = artistMap.get(artistId) ?? { id: artistId, name: artistName, img: artistCover, count: 0 }
      prev.count += 1
      if (!prev.img && artistCover) prev.img = artistCover
      artistMap.set(artistId, prev)
    }
  }
  return Array.from(artistMap.values()).sort((a, b) => b.count - a.count).slice(0, PAGE_LIMIT)
}

async function loadSingerSongs(id, page = 1) {
  const blocks = (await fetchJson(`https://app.c.nf.migu.cn/pc/bmw/singer/song/v1.0?pageNo=${page}&singerId=${encodeURIComponent(id)}&type=1`))?.data?.contents ?? []
  const songBlock = blocks.find((each) => each?.view == 'ZJ-Singer-Song-Scroll')
  const list = songBlock?.contents ?? []

  return list.map((each) => {
    const songItem = each?.songItem ?? {}
    return {
      resType: '2',
      resId: `${songItem?.contentId ?? each?.resId ?? ''}`,
      img: toHttps(songItem?.img2 ?? songItem?.img1 ?? songItem?.img3 ?? each?.img ?? ''),
      txt: each?.txt ?? songItem?.songName ?? '',
      txt2: each?.txt2 ?? (songItem?.singerList ?? []).map((s) => s?.name ?? '').join('/'),
      txt3: each?.txt3 ?? songItem?.album ?? '',
      txt4: each?.txt4 ?? songItem?.mvId ?? '',
      showTag: each?.showTag ?? songItem?.showTags ?? [],
      copyright: '1',
      copyrightId: `${songItem?.copyrightId ?? ''}`,
      songId: `${songItem?.songId ?? ''}`,
      mvId: `${songItem?.mvId ?? ''}`,
      copyrightType: `${songItem?.copyrightType ?? ''}`,
      songData: JSON.stringify(songItem),
      score: '0',
      ugcAuthorList: songItem?.ugcAuthorList ?? [],
    }
  })
}

async function loadSingerAlbums(id, page = 1) {
  const contents = (await fetchJson(`https://app.c.nf.migu.cn/pc/bmw/singer/album/v1.0?pageNo=${page}&singerId=${encodeURIComponent(id)}`))?.data?.contents ?? []
  return contents.map((each) => ({
    resourceId: `${each?.resourceId ?? each?.linkId ?? each?.id ?? ''}`,
    linkTitle: each?.title ?? each?.name ?? each?.txt ?? '',
    linkPicUrl: each?.img ?? each?.picUrl ?? '',
  }))
}

async function getConfig() { return jsonify(appConfig) }
async function getSongs(ext) {
  const { gid, id, page } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  if (gidValue == GID.TOPLISTS) return jsonify({ list: (await loadToplistSongs(id)).map((each) => mapSong(each)) })
  if (gidValue == GID.ARTIST_SONGS) return jsonify({ list: (await loadSingerSongs(id, page ?? 1)).map((each) => mapSong(each)) })
  return jsonify({ list: [] })
}
async function getArtists(ext) {
  const { page, gid } = argsify(ext)
  if (`${gid ?? ''}` != GID.TOP_ARTISTS) return jsonify({ list: [] })
  return jsonify({ list: (await loadHotArtists(page)).map((each) => mapArtistCard(each)) })
}
async function getPlaylists(ext) {
  const { page, gid, from } = argsify(ext)
  if (`${gid ?? ''}` != GID.TOPLISTS) return jsonify({ list: [] })
  const all = await loadToplists()
  const offset = (page - 1) * PAGE_LIMIT
  let cards = all.map((each) => mapToplistCard(each))
  cards = from === 'index' ? cards.slice(0, PAGE_LIMIT) : cards.slice(offset, offset + PAGE_LIMIT)
  return jsonify({ list: cards })
}
async function getAlbums(ext) {
  const { page, gid, id } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  if (gidValue == GID.ARTIST_ALBUMS) return jsonify({ list: [] })
  return jsonify({ list: [] })
}
async function search(ext) { return jsonify({}) }
async function getSongInfo(ext) {
  const { source, songmid, copyrightId, singer, songName, quality } = argsify(ext)
  if (source == undefined) return jsonify({ urls: [] })
  const result = await $lx.request('musicUrl', {
    type: quality || '320k',
    musicInfo: {
      songmid: `${songmid ?? copyrightId ?? ''}`,
      copyrightId: `${copyrightId ?? songmid ?? ''}`,
      name: songName ?? '',
      singer: singer ?? '',
    },
  }, { source: `${source}` })
  const soundurl = typeof result === 'string' ? result : result?.url ?? result?.data?.url ?? result?.urls?.[0]
  return jsonify({ urls: soundurl ? [soundurl] : [] })
}
