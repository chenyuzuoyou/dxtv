/*!
 * @name kwfm
 * @description kwfm
 * @version v1.0.0
 * @author codex
 * @key csp_kwfm
 */

const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = {
  'User-Agent': UA,
}

const PAGE_LIMIT = 20
const SEARCH_PAGE_LIMIT = 5
const KW_SOURCE = 'kw'
const GID = {
  TOPLISTS: '1',
  RECOMMENDED_PLAYLISTS: '2',
  SEARCH_PLAYLISTS: '3',
  ARTIST_SONGS: '4',
  ARTIST_ALBUMS: '5',
  ALBUM_SONGS: '6',
  HOT_PLAYLISTS: '7',
  CLASSIC_PLAYLISTS: '8',
  TOP_ARTISTS: '9',
}

const appConfig = {
  ver: 1,
  name: '酷我音乐',
  //warning: '⚠️🤖 警告，请勿使用 ⚡️📡',
  message: '',
  desc: '',
  tabLibrary: {
    name: '探索',
    groups: [{ name: '排行榜', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.TOPLISTS } }, { name: '推荐歌单', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.RECOMMENDED_PLAYLISTS } }, { name: '热门歌单', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.HOT_PLAYLISTS } }, { name: '经典歌单', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.CLASSIC_PLAYLISTS } }, { name: '热门歌手', type: 'artist', ui: 0, showMore: true, ext: { gid: GID.TOP_ARTISTS } }]
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

function safeArgs(data) {
  return typeof data === 'string' ? argsify(data) : (data ?? {})
}
function toHttps(url) {
  if (!url) return ''
  return `${url}`.replace(/^http:\/\//, 'https://')
}
function cleanText(text) {
  return `${text ?? ''}`
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\\u0026/g, '&')
    .replace(/\\\\u0026/g, '&')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
function withKwHeaders(extra = {}) {
  return { ...headers, Referer: 'https://m.kuwo.cn/newh5app/', Origin: 'https://m.kuwo.cn', ...extra }
}
async function fetchJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, { headers: withKwHeaders(extraHeaders) })
  return safeArgs(data)
}
async function fetchText(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, { headers: withKwHeaders(extraHeaders) })
  return `${data ?? ''}`
}
function parseLegacySearch(text) {
  try { return safeArgs(`${text}`.replace(/'/g, '"')) } catch (error) { return {} }
}
function mapToplistCard(item) {
  return { id: `${item?.sourceid ?? item?.id ?? ''}`, name: cleanText(item?.name ?? item?.disname ?? ''), cover: toHttps(item?.pic2 ?? item?.pic5 ?? item?.pic ?? ''), artist: { id: 'kw', name: cleanText(item?.pubTime ?? item?.intro ?? 'kwfm'), cover: '' }, ext: { gid: GID.TOPLISTS, id: `${item?.sourceid ?? item?.id ?? ''}`, type: 'playlist' } }
}
function mapSong(item) {
  const rid = `${item?.rid ?? `${item?.musicrid ?? ''}`.replace(/^MUSIC_/, '') ?? `${item?.MUSICRID ?? ''}`.replace(/^MUSIC_/, '') ?? ''}`
  const artistId = `${item?.artistid ?? item?.artistId ?? item?.ARTISTID ?? ''}`
  const artistName = cleanText(item?.artist ?? item?.artistName ?? item?.ARTIST ?? '')
  const songName = cleanText(item?.name ?? item?.songName ?? item?.NAME ?? item?.SONGNAME ?? '')
  const albumName = cleanText(item?.album ?? item?.ALBUM ?? '')
  return {
    id: rid,
    name: songName,
    cover: toHttps(item?.pic ?? item?.albumpic ?? item?.web_albumpic_short ?? item?.web_albumpic_ver_500 ?? ''),
    duration: parseInt(item?.duration ?? item?.DURATION ?? 0),
    artist: { id: artistId, name: artistName, cover: '' },
    ext: { source: KW_SOURCE, songmid: rid, rid: rid, singer: artistName, songName: songName, albumName: albumName }
  }
}
function mapPlaylistCard(item, gid = GID.SEARCH_PLAYLISTS) {
  return { id: `${item?.id ?? ''}`, name: cleanText(item?.name ?? ''), cover: toHttps(item?.img ?? item?.pic ?? ''), artist: { id: `${item?.uid ?? ''}`, name: cleanText(item?.uname ?? 'kwfm'), cover: '' }, ext: { gid: gid, id: `${item?.id ?? ''}`, type: 'playlist' } }
}
function mapArtistCard(item) {
  const artistId = `${item?.id ?? item?.artistid ?? ''}`
  const artistName = cleanText(item?.name ?? item?.artist ?? '')
  const artistCover = toHttps(item?.pic300 ?? item?.pic240 ?? item?.pic120 ?? item?.pic70 ?? item?.pic ?? item?.img ?? item?.avatar ?? '')
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
function mapAlbumCard(item) {
  const albumId = `${item?.albumid ?? item?.id ?? ''}`
  const artistId = `${item?.artistid ?? ''}`
  const artistName = cleanText(item?.artist ?? item?.artistName ?? '')
  return { id: albumId, name: cleanText(item?.name ?? item?.album ?? ''), cover: toHttps(item?.pic ?? item?.pic300 ?? item?.img ?? ''), artist: { id: artistId, name: artistName, cover: '' }, ext: { gid: GID.ALBUM_SONGS, id: albumId, type: 'album' } }
}
async function loadToplists() {
  const info = await fetchJson('https://m.kuwo.cn/newh5app/wapi/api/pc/bang/list')
  return (info?.child ?? []).flatMap((group) => group?.child ?? [])
}
async function loadToplistSongs(id, page = 1) { return (await fetchJson(`https://m.kuwo.cn/newh5app/wapi/api/www/bang/bang/musicList?bangId=${encodeURIComponent(id)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.musicList ?? [] }
async function loadRecommendedPlaylists(page = 1) { return (await fetchJson(`https://m.kuwo.cn/newh5app/wapi/api/pc/classify/playlist/getRcmPlayList?pn=${page}&rn=${PAGE_LIMIT}&order=hot`))?.data?.data ?? [] }
async function loadFilteredPlaylists(page = 1, keyword = '') {
  const list = await loadRecommendedPlaylists(page)
  if (!keyword) return list
  const matched = list.filter((each) => `${cleanText(each?.name)} ${cleanText(each?.uname)} ${cleanText(each?.desc)} ${cleanText(each?.info)}`.toLowerCase().includes(keyword.toLowerCase()))
  return matched.length > 0 ? matched : list
}
async function loadPlaylistSongs(id, page = 1) { return (await fetchJson(`https://m.kuwo.cn/newh5app/wapi/api/www/playlist/playListInfo?pid=${encodeURIComponent(id)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.musicList ?? [] }
async function searchArtists(text, page) { return (await fetchJson(`https://m.kuwo.cn/newh5app/wapi/api/www/search/searchArtistBykeyWord?key=${encodeURIComponent(text)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.list ?? [] }
async function loadHotArtists(page = 1) {
  if (page > 1) return []
  const rankIds = ['93', '17', '16']
  const artistMap = new Map()
  for (const rankId of rankIds) {
    const songs = await loadToplistSongs(rankId, 1)
    for (const song of songs) {
      const artistId = `${song?.artistid ?? ''}`
      const artistName = cleanText(song?.artist ?? '')
      if (!artistId || !artistName) continue
      const prev = artistMap.get(artistId) ?? {
        id: artistId,
        artistid: artistId,
        name: artistName,
        artist: artistName,
        count: 0,
      }
      prev.count += 1
      if (!prev.pic300) {
        const maybeCover = toHttps(song?.artist_pic ?? song?.pic120 ?? song?.pic ?? '')
        prev.pic300 = maybeCover
        prev.pic120 = maybeCover
        prev.pic70 = maybeCover
        prev.pic = maybeCover
      }
      artistMap.set(artistId, prev)
    }
  }
  return Array.from(artistMap.values()).sort((a, b) => b.count - a.count).slice(0, PAGE_LIMIT)
}
async function searchSongs(text, page) {
  const offset = Math.max(page - 1, 0) * PAGE_LIMIT
  const body = await fetchText(`https://search.kuwo.cn/r.s?all=${encodeURIComponent(text)}&ft=music&itemset=web_2013&client=kt&pn=${offset}&rn=${PAGE_LIMIT}&rformat=json&encoding=utf8`)
  const data = parseLegacySearch(body)
  const list = data?.abslist ?? []
  const seen = new Set()
  return list.filter((each) => {
    const rid = `${each?.MUSICRID ?? each?.musicrid ?? ''}`.replace(/^MUSIC_/, '')
    const key = `${rid}|${cleanText(each?.NAME ?? each?.name ?? '')}|${cleanText(each?.ARTIST ?? each?.artist ?? '')}`
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}
async function searchPlaylists(text, page) { return (await fetchJson(`https://m.kuwo.cn/newh5app/wapi/api/www/search/searchPlayListBykeyWord?key=${encodeURIComponent(text)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.list ?? [] }
async function searchAlbums(text, page) { return (await fetchJson(`https://m.kuwo.cn/newh5app/wapi/api/www/search/searchAlbumBykeyWord?key=${encodeURIComponent(text)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.albumList ?? [] }
async function loadArtistSongs(id, page = 1) { return (await fetchJson(`https://m.kuwo.cn/newh5app/wapi/api/www/artist/artistMusic?artistid=${encodeURIComponent(id)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.list ?? [] }
async function loadArtistAlbums(id, page = 1) { return (await fetchJson(`https://m.kuwo.cn/newh5app/wapi/api/www/artist/artistAlbum?artistid=${encodeURIComponent(id)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.albumList ?? [] }
async function loadAlbumSongs(id, page = 1) { return (await fetchJson(`https://m.kuwo.cn/newh5app/wapi/api/www/album/albumInfo?albumId=${encodeURIComponent(id)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.musicList ?? [] }
async function getConfig() { return jsonify(appConfig) }
async function getSongs(ext) {
  const { page, gid, id } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let songs = []
  if (gidValue == GID.TOPLISTS) songs = (await loadToplistSongs(id, page)).map((each) => mapSong(each))
  if ([GID.SEARCH_PLAYLISTS, GID.RECOMMENDED_PLAYLISTS, GID.HOT_PLAYLISTS, GID.CLASSIC_PLAYLISTS].includes(gidValue)) songs = (await loadPlaylistSongs(id, page)).map((each) => mapSong(each))
  if (gidValue == GID.ARTIST_SONGS) songs = (await loadArtistSongs(id, page)).map((each) => mapSong(each))
  if (gidValue == GID.ALBUM_SONGS) songs = (await loadAlbumSongs(id, page)).map((each) => mapSong(each))
  return jsonify({ list: songs })
}
async function getArtists(ext) {
  const { page, gid } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let artists = []
  if (gidValue == GID.TOP_ARTISTS) artists = (await loadHotArtists(page)).map((each) => ({ ...mapArtistCard(each), ext: { gid: GID.TOP_ARTISTS, id: `${each?.id ?? ''}` } }))
  return jsonify({ list: artists })
}
async function getPlaylists(ext) {
  const { page, gid, from } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let cards = []
  if (gidValue == GID.TOPLISTS) {
    const all = await loadToplists()
    const offset = (page - 1) * PAGE_LIMIT
    cards = all.map((each) => mapToplistCard(each))
    cards = from === 'index' ? cards.slice(0, PAGE_LIMIT) : cards.slice(offset, offset + PAGE_LIMIT)
  }
  if (gidValue == GID.RECOMMENDED_PLAYLISTS) cards = (await loadRecommendedPlaylists(page)).map((each) => mapPlaylistCard(each, GID.RECOMMENDED_PLAYLISTS))
  if (gidValue == GID.HOT_PLAYLISTS) cards = (await loadFilteredPlaylists(page, '热门')).map((each) => mapPlaylistCard(each, GID.HOT_PLAYLISTS))
  if (gidValue == GID.CLASSIC_PLAYLISTS) cards = (await loadFilteredPlaylists(page, '经典')).map((each) => mapPlaylistCard(each, GID.CLASSIC_PLAYLISTS))
  return jsonify({ list: cards })
}
async function getAlbums(ext) {
  const { page, gid, id } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let cards = []
  if (gidValue == GID.ARTIST_ALBUMS) cards = (await loadArtistAlbums(id, page)).map((each) => mapAlbumCard(each))
  return jsonify({ list: cards })
}
async function search(ext) {
  const { text, page, type } = argsify(ext)
  if (!text || page > SEARCH_PAGE_LIMIT) return jsonify({})
  if (type == 'song') return jsonify({ list: (await searchSongs(text, page)).map((each) => mapSong(each)) })
  if (type == 'playlist') return jsonify({ list: (await searchPlaylists(text, page)).map((each) => mapPlaylistCard(each)) })
  if (type == 'album') return jsonify({ list: (await searchAlbums(text, page)).map((each) => mapAlbumCard(each)) })
  if (type == 'artist') { const list = await searchArtists(text, page); return jsonify({ list: (list?.artistList ?? list ?? []).map((each) => mapArtistCard(each)) }) }
  return jsonify({})
}
async function getSongInfo(ext) {
  const { source, songmid, rid, singer, songName, quality } = argsify(ext)
  if (source == undefined) return jsonify({ urls: [] })
  const result = await $lx.request('musicUrl', {
    type: quality || '320k',
    musicInfo: {
      songmid: `${songmid ?? rid ?? ''}`,
      rid: `${rid ?? songmid ?? ''}`,
      name: songName ?? '',
      singer: singer ?? '',
    },
  }, { source: `${source}` })
  const soundurl = typeof result === 'string' ? result : result?.url ?? result?.data?.url ?? result?.urls?.[0]
  return jsonify({ urls: soundurl ? [soundurl] : [] })
}
