/*!
 * @name allfm_music
 * @description 聚合多平台音乐源（tx / kw / wy / mg / kg）
 * @version v1.0.0
 * @author codex
 * @key csp_allfm
 */

const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = {
  'User-Agent': UA,
}

const PAGE_LIMIT = 20
const SEARCH_PAGE_LIMIT = 5

// =========================================================
// 通用工具函数
// =========================================================
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
function uniqueBySongId(songs) {
  const seen = new Set()
  return songs.filter((song) => {
    const songId = `${song?.id ?? ''}`
    if (!songId || seen.has(songId)) return false
    seen.add(songId)
    return true
  })
}

// =========================================================
// GID 配置及 UI 聚合
// =========================================================
const GID = {
  // QQ
  QQ_TOPLISTS: 'qq_1',
  QQ_TOP_ARTISTS: 'qq_2',
  QQ_ARTIST_SONGS: 'qq_3',
  QQ_ARTIST_ALBUMS: 'qq_4',
  QQ_ALBUM_SONGS: 'qq_5',
  QQ_SEARCH_PLAYLISTS: 'qq_6',
  QQ_TAG_PLAYLISTS: 'qq_7',
  
  // KW
  KW_TOPLISTS: 'kw_1',
  KW_RECOMMENDED_PLAYLISTS: 'kw_2',
  KW_SEARCH_PLAYLISTS: 'kw_3',
  KW_ARTIST_SONGS: 'kw_4',
  KW_ARTIST_ALBUMS: 'kw_5',
  KW_ALBUM_SONGS: 'kw_6',
  KW_HOT_PLAYLISTS: 'kw_7',
  KW_CLASSIC_PLAYLISTS: 'kw_8',
  KW_TOP_ARTISTS: 'kw_9',
  
  // WY
  WY_RECOMMENDED_SONGS: 'wy_1',
  WY_RECOMMENDED_PLAYLISTS: 'wy_2',
  WY_CHINESE_PLAYLISTS: 'wy_3',
  WY_POP_PLAYLISTS: 'wy_4',
  WY_TOPLISTS: 'wy_5',
  WY_NEW_ALBUMS: 'wy_6',
  WY_TOP_ARTISTS: 'wy_7',
  WY_ARTIST_ALBUMS: 'wy_8',
  WY_SEARCH_PLAYLISTS: 'wy_9',
  WY_ALBUM_SONGS: 'wy_10',
  
  // KG
  KG_TOPLISTS: 'kg_1',
  KG_TOP_ARTISTS: 'kg_2',
  KG_ARTIST_SONGS: 'kg_3',
  KG_ARTIST_ALBUMS: 'kg_4',
  KG_ALBUM_SONGS: 'kg_5',
  KG_SEARCH_PLAYLISTS: 'kg_6',
  KG_FEATURED_PLAYLISTS: 'kg_7',
  
  // MG
  MG_TOPLISTS: 'mg_1',
  MG_TOP_ARTISTS: 'mg_2',
  MG_ARTIST_SONGS: 'mg_3',
  MG_ARTIST_ALBUMS: 'mg_4',
  MG_SEARCH_PLAYLISTS: 'mg_5',
  MG_ALBUM_SONGS: 'mg_6',
}

const appConfig = {
  ver: 1,
  name: 'allfm',
  message: '聚合搜索：tx / kw / wy / mg / kg',
  desc: '搜索结果以 tx-、kw-、wy-、mg-、kg- 前缀区分来源',
  warning: '',
  tabLibrary: {
    name: '探索',
    groups: [
      // 首页只展示 KW 内容，减少并发请求数
      { name: '排行榜', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.KW_TOPLISTS } },
      { name: '推荐歌单', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.KW_RECOMMENDED_PLAYLISTS } },
      { name: '热门歌单', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.KW_HOT_PLAYLISTS } },
      { name: '经典歌单', type: 'playlist', ui: 1, showMore: true, ext: { gid: GID.KW_CLASSIC_PLAYLISTS } },
      { name: '热门歌手', type: 'artist', ui: 0, showMore: true, ext: { gid: GID.KW_TOP_ARTISTS } }
    ]
  },
  tabMe: {
    name: '我的',
    groups: [{ name: '红心', type: 'song' }, { name: '歌单', type: 'playlist' }, { name: '专辑', type: 'album' }, { name: '创作者', type: 'artist' }]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '歌曲', type: 'song', ext: { type: 'song' } },
      { name: '歌单', type: 'playlist', ext: { type: 'playlist' } },
      { name: '专辑', type: 'album', ext: { type: 'album' } },
      { name: '歌手', type: 'artist', ext: { type: 'artist' } }
    ]
  }
}

// =========================================================
// tx 音乐相关
// =========================================================
const QQ_SOURCE = 'tx'

function withQqHeaders(extra = {}) {
  return { ...headers, Referer: 'https://y.qq.com/', Origin: 'https://y.qq.com', Cookie: 'uin=0;', ...extra }
}

function qqSingerNameOf(song) {
  const singers = song?.singer ?? song?.singer_list ?? []
  return singers.map((a) => a?.name ?? a?.singer_name ?? '').filter(Boolean).join('/')
}
function qqAlbumMidOf(song) { return song?.album?.mid ?? song?.albumMid ?? song?.album_mid ?? song?.albummid ?? '' }
function qqSongMidOf(song) { return song?.mid ?? song?.songmid ?? song?.song_mid ?? '' }

function mapQqSong(rawSong) {
  const song = rawSong?.songInfo ?? rawSong ?? {}
  const singers = song?.singer ?? song?.singer_list ?? []
  const singer = qqSingerNameOf(song)
  const songmid = qqSongMidOf(song)
  const albumMid = qqAlbumMidOf(song)
  return {
    id: `qq_${songmid || song?.id || ''}`,
    name: `tx-${song?.name ?? song?.title ?? ''}`,
    cover: albumMid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${albumMid}.jpg` : '',
    duration: parseInt(song?.interval ?? 0),
    artist: {
      id: `${singers[0]?.mid ?? singers[0]?.singer_mid ?? singers[0]?.id ?? singers[0]?.singer_id ?? ''}`,
      name: singer,
      cover: singers[0]?.mid || singers[0]?.singer_mid ? `https://y.qq.com/music/photo_new/T001R500x500M000${singers[0]?.mid ?? singers[0]?.singer_mid}.jpg` : '',
    },
    ext: { source: QQ_SOURCE, songmid: `${songmid}`, singer: singer, songName: song?.name ?? song?.title ?? '', albumName: song?.album?.name ?? song?.albumName ?? song?.album_name ?? '' }
  }
}
function mapQqToplistCard(item) {
  return { id: `qq_${item?.topId ?? ''}`, name: item?.title ?? '', cover: toHttps(item?.headPicUrl ?? item?.frontPicUrl ?? item?.mbHeadPicUrl ?? item?.mbFrontPicUrl ?? ''), artist: { id: 'qq', name: item?.updateTips ?? item?.period ?? 'qqfm', cover: '' }, ext: { gid: GID.QQ_TOPLISTS, id: `${item?.topId ?? ''}`, period: item?.period ?? '', type: 'playlist' } }
}
function mapQqArtistCard(artist) {
  const artistId = `${artist?.singerMID ?? artist?.singer_mid ?? artist?.mid ?? artist?.singer_mid ?? ''}`
  return { id: `qq_${artistId}`, name: `tx-${artist?.singerName ?? artist?.singer_name ?? artist?.name ?? ''}`, cover: toHttps(artist?.singerPic ?? artist?.singer_pic ?? (artistId ? `https://y.qq.com/music/photo_new/T001R500x500M000${artistId}.jpg` : '')), groups: [{ name: '热门歌曲', type: 'song', ext: { gid: GID.QQ_ARTIST_SONGS, id: artistId } }, { name: '专辑', type: 'album', ext: { gid: GID.QQ_ARTIST_ALBUMS, id: artistId } }], ext: { gid: GID.QQ_TOP_ARTISTS, id: artistId } }
}
function mapQqAlbumCard(album) {
  const albumMid = `${album?.albumMID ?? album?.albumMid ?? album?.album_mid ?? ''}`
  const singers = album?.singer_list ?? album?.singers ?? []
  const singerMid = `${album?.singerMID ?? album?.singer_mid ?? singers[0]?.mid ?? singers[0]?.singer_mid ?? ''}`
  return { id: `qq_${albumMid}`, name: `tx-${album?.albumName ?? album?.album_name ?? ''}`, cover: toHttps(album?.albumPic ?? (albumMid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${albumMid}.jpg` : '')), artist: { id: `qq_${singerMid}`, name: album?.singerName ?? album?.singer_name ?? singers.map((a) => a?.name ?? a?.singer_name ?? '').filter(Boolean).join('/') ?? '', cover: singerMid ? `https://y.qq.com/music/photo_new/T001R500x500M000${singerMid}.jpg` : '', }, ext: { gid: GID.QQ_ALBUM_SONGS, id: albumMid, type: 'album' } }
}
function mapQqPlaylistCard(playlist) {
  const playlistId = `${playlist?.dissid ?? playlist?.disstid ?? playlist?.tid ?? playlist?.id ?? ''}`
  return { id: `qq_${playlistId}`, name: `tx-${playlist?.dissname ?? playlist?.title ?? playlist?.name ?? ''}`, cover: toHttps(playlist?.imgurl ?? playlist?.logo ?? playlist?.cover ?? ''), artist: { id: `qq_${playlist?.encrypt_uin ?? playlist?.creator?.encrypt_uin ?? playlist?.creator?.creator_uin ?? ''}`, name: playlist?.creator?.name ?? playlist?.nickname ?? playlist?.nick ?? playlist?.creatorName ?? 'qqfm', cover: toHttps(playlist?.creator?.avatarUrl ?? playlist?.headurl ?? '') }, ext: { gid: GID.QQ_SEARCH_PLAYLISTS, id: playlistId, type: 'playlist' } }
}

async function fetchQqJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, { headers: withQqHeaders(extraHeaders) }); return safeArgs(data)
}
function buildQqMusicuUrl(payload) {
  return `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=${encodeURIComponent(JSON.stringify(payload))}`
}

async function loadQqToplists() {
  const info = await fetchQqJson('https://u.y.qq.com/cgi-bin/musicu.fcg?_=1577086820633&data=%7B%22comm%22%3A%7B%22g_tk%22%3A5381%2C%22uin%22%3A123456%2C%22format%22%3A%22json%22%2C%22inCharset%22%3A%22utf-8%22%2C%22outCharset%22%3A%22utf-8%22%2C%22notice%22%3A0%2C%22platform%22%3A%22h5%22%2C%22needNewCode%22%3A1%2C%22ct%22%3A23%2C%22cv%22%3A0%7D%2C%22topList%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetAll%22%2C%22param%22%3A%7B%7D%7D%7D', { Cookie: 'uin=' })
  return (info?.topList?.data?.group ?? []).flatMap((group) => group?.toplist ?? [])
}
async function loadQqToplistSongs(id, period, page = 1) {
  let periodValue = period ?? ''
  if (!periodValue) {
    const toplists = await loadQqToplists()
    periodValue = toplists.find((each) => `${each?.topId ?? ''}` == `${id}`)?.period ?? ''
  }
  const info = await fetchQqJson(buildQqMusicuUrl({ detail: { module: 'musicToplist.ToplistInfoServer', method: 'GetDetail', param: { topId: Number(id), offset: Math.max(page - 1, 0) * PAGE_LIMIT, num: PAGE_LIMIT, period: periodValue } }, comm: { ct: 24, cv: 0 } }), { Cookie: 'uin=' })
  return info?.detail?.data?.songInfoList ?? []
}
async function loadQqPlaylistSongs(id, page = 1) {
  const info = await fetchQqJson(`https://c.y.qq.com/v8/fcg-bin/fcg_v8_playlist_cp.fcg?newsong=1&id=${id}&format=json&inCharset=GB2312&outCharset=utf-8`)
  const list = info?.data?.cdlist?.[0]?.songlist ?? []
  const offset = Math.max(page - 1, 0) * PAGE_LIMIT
  return list.slice(offset, offset + PAGE_LIMIT)
}
async function loadQqTagPlaylists(categoryId, sortId = '5', page = 1) {
  const offset = Math.max(page - 1, 0) * PAGE_LIMIT
  const info = await fetchQqJson(`https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg?picmid=1&rnd=0.1&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&categoryId=${encodeURIComponent(categoryId)}&sortId=${encodeURIComponent(sortId)}&sin=${offset}&ein=${offset + PAGE_LIMIT - 1}`)
  return info?.data?.list ?? []
}
async function loadQqSingerList(page = 1) {
  if (page > 1) return []
  const { data } = await $fetch.get('https://y.qq.com/n/ryqq/singer_list', { headers })
  const match = `${data ?? ''}`.match(/__INITIAL_DATA__\s*=\s*({[\s\S]*?})<\/script>/)
  return match?.[1] ? safeArgs(match[1])?.singerListImage ?? [] : []
}
async function loadQqSingerSongs(id, page = 1) {
  const info = await fetchQqJson(buildQqMusicuUrl({ comm: { ct: 24, cv: 0 }, singer: { module: 'music.web_singer_info_svr', method: 'get_singer_detail_info', param: { singermid: id, sort: 5, sin: Math.max(page - 1, 0) * PAGE_LIMIT, num: PAGE_LIMIT } } }))
  return info?.singer?.data?.songlist ?? []
}
async function loadQqSingerAlbums(id, page = 1) {
  const info = await fetchQqJson(buildQqMusicuUrl({ comm: { ct: 24, cv: 0 }, singer: { module: 'music.web_singer_info_svr', method: 'get_singer_album', param: { singermid: id, order: 'time', begin: Math.max(page - 1, 0) * PAGE_LIMIT, num: PAGE_LIMIT } } }))
  return info?.singer?.data?.list ?? []
}
async function loadQqAlbumSongs(id, page = 1) {
  const info = await fetchQqJson(buildQqMusicuUrl({ comm: { ct: 24, cv: 0 }, album: { module: 'music.musichallAlbum.AlbumSongList', method: 'GetAlbumSongList', param: { albumMid: id, begin: Math.max(page - 1, 0) * PAGE_LIMIT, num: PAGE_LIMIT, order: 2 } } }))
  return info?.album?.data?.songList ?? []
}
async function searchQqInner(text, page, searchType) {
  const payload = { comm: { ct: '19', cv: '1859', uin: '0' }, req: { method: 'DoSearchForQQMusicDesktop', module: 'music.search.SearchCgiService', param: { grp: 1, num_per_page: PAGE_LIMIT, page_num: page, query: text, search_type: searchType } } }
  const info = await fetchQqJson(`https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=${encodeURIComponent(JSON.stringify(payload))}`)
  return info?.req?.data?.body ?? {}
}
async function searchQqSongs(text, page) {
  try {
    const body = await searchQqInner(text, page, 0); return (body?.song?.list ?? []).map((each) => mapQqSong(each))
  } catch (e) { return [] }
}
async function searchQqPlaylists(text, page) {
  try {
    const body = await searchQqInner(text, page, 3); return (body?.songlist?.list ?? []).map((each) => mapQqPlaylistCard(each))
  } catch (e) { return [] }
}
async function searchQqAlbums(text, page) {
  try {
    const body = await searchQqInner(text, page, 2); return (body?.album?.list ?? []).map((each) => mapQqAlbumCard(each))
  } catch (e) { return [] }
}
async function searchQqArtists(text, page) {
  try {
    const body = await searchQqInner(text, page, 1); return (body?.singer?.list ?? []).map((each) => mapQqArtistCard(each))
  } catch (e) { return [] }
}


// =========================================================
// kw音乐相关
// =========================================================
const KW_SOURCE = 'kw'

function withKwHeaders(extra = {}) { return { ...headers, Referer: 'https://m.kuwo.cn/newh5app/', Origin: 'https://m.kuwo.cn', ...extra } }
function parseLegacySearch(text) { try { return safeArgs(`${text}`.replace(/'/g, '"')) } catch (error) { return {} } }

function mapKwSong(item) {
  const rid = `${item?.rid ?? `${item?.musicrid ?? ''}`.replace(/^MUSIC_/, '') ?? `${item?.MUSICRID ?? ''}`.replace(/^MUSIC_/, '') ?? ''}`
  const artistId = `${item?.artistid ?? item?.artistId ?? item?.ARTISTID ?? ''}`
  const artistName = cleanText(item?.artist ?? item?.artistName ?? item?.ARTIST ?? '')
  const songName = cleanText(item?.name ?? item?.songName ?? item?.NAME ?? item?.SONGNAME ?? '')
  const albumName = cleanText(item?.album ?? item?.ALBUM ?? '')
  return { id: `kw_${rid}`, name: `kw-${songName}`, cover: toHttps(item?.pic ?? item?.albumpic ?? item?.web_albumpic_short ?? item?.web_albumpic_ver_500 ?? ''), duration: parseInt(item?.duration ?? item?.DURATION ?? 0), artist: { id: `kw_${artistId}`, name: artistName, cover: '' }, ext: { source: KW_SOURCE, songmid: rid, rid: rid, singer: artistName, songName: songName, albumName: albumName } }
}
function mapKwToplistCard(item) { return { id: `kw_${item?.sourceid ?? item?.id ?? ''}`, name: cleanText(item?.name ?? item?.disname ?? ''), cover: toHttps(item?.pic2 ?? item?.pic5 ?? item?.pic ?? ''), artist: { id: 'kw', name: cleanText(item?.pubTime ?? item?.intro ?? 'kwfm'), cover: '' }, ext: { gid: GID.KW_TOPLISTS, id: `${item?.sourceid ?? item?.id ?? ''}`, type: 'playlist' } } }
function mapKwPlaylistCard(item, gid = GID.KW_SEARCH_PLAYLISTS) { return { id: `kw_${item?.id ?? ''}`, name: `kw-${cleanText(item?.name ?? '')}`, cover: toHttps(item?.img ?? item?.pic ?? ''), artist: { id: `kw_${item?.uid ?? ''}`, name: cleanText(item?.uname ?? 'kwfm'), cover: '' }, ext: { gid: gid, id: `${item?.id ?? ''}`, type: 'playlist' } } }
function mapKwArtistCard(item) {
  const artistId = `${item?.id ?? item?.artistid ?? ''}`
  const artistCover = toHttps(item?.pic300 ?? item?.pic240 ?? item?.pic120 ?? item?.pic70 ?? item?.pic ?? item?.img ?? item?.avatar ?? '')
  return { id: `kw_${artistId}`, name: `kw-${cleanText(item?.name ?? item?.artist ?? '')}`, cover: artistCover, avatar: artistCover, img: artistCover, pic: artistCover, artist: { id: `kw_${artistId}`, name: cleanText(item?.name ?? item?.artist ?? ''), cover: artistCover }, groups: [{ name: '热门歌曲', type: 'song', ext: { gid: GID.KW_ARTIST_SONGS, id: artistId } }, { name: '专辑', type: 'album', ext: { gid: GID.KW_ARTIST_ALBUMS, id: artistId } }], ext: { gid: GID.KW_TOP_ARTISTS, id: artistId } }
}
function mapKwAlbumCard(item) {
  const albumId = `${item?.albumid ?? item?.id ?? ''}`
  return { id: `kw_${albumId}`, name: `kw-${cleanText(item?.name ?? item?.album ?? '')}`, cover: toHttps(item?.pic ?? item?.pic300 ?? item?.img ?? ''), artist: { id: `kw_${item?.artistid ?? ''}`, name: cleanText(item?.artist ?? item?.artistName ?? ''), cover: '' }, ext: { gid: GID.KW_ALBUM_SONGS, id: albumId, type: 'album' } }
}

async function fetchKwJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, { headers: withKwHeaders(extraHeaders) }); return safeArgs(data)
}
async function fetchKwText(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, { headers: withKwHeaders(extraHeaders) }); return `${data ?? ''}`
}

async function loadKwToplists() { return ((await fetchKwJson('https://m.kuwo.cn/newh5app/wapi/api/pc/bang/list'))?.child ?? []).flatMap(g => g?.child ?? []) }
async function loadKwToplistSongs(id, page = 1) { return (await fetchKwJson(`https://m.kuwo.cn/newh5app/wapi/api/www/bang/bang/musicList?bangId=${encodeURIComponent(id)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.musicList ?? [] }
async function loadKwRecommendedPlaylists(page = 1) { return (await fetchKwJson(`https://m.kuwo.cn/newh5app/wapi/api/pc/classify/playlist/getRcmPlayList?pn=${page}&rn=${PAGE_LIMIT}&order=hot`))?.data?.data ?? [] }
async function loadKwFilteredPlaylists(page = 1, keyword = '') {
  const list = await loadKwRecommendedPlaylists(page)
  if (!keyword) return list
  const matched = list.filter((each) => `${cleanText(each?.name)} ${cleanText(each?.uname)} ${cleanText(each?.desc)} ${cleanText(each?.info)}`.toLowerCase().includes(keyword.toLowerCase()))
  return matched.length > 0 ? matched : list
}
async function loadKwPlaylistSongs(id, page = 1) { return (await fetchKwJson(`https://m.kuwo.cn/newh5app/wapi/api/www/playlist/playListInfo?pid=${encodeURIComponent(id)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.musicList ?? [] }
async function loadKwHotArtists(page = 1) {
  if (page > 1) return []
  const artistMap = new Map()
  for (const rankId of ['93', '17', '16']) {
    const songs = await loadKwToplistSongs(rankId, 1)
    for (const song of songs) {
      const artistId = `${song?.artistid ?? ''}`
      if (!artistId || !cleanText(song?.artist ?? '')) continue
      const prev = artistMap.get(artistId) ?? { id: artistId, artistid: artistId, name: cleanText(song?.artist ?? ''), artist: cleanText(song?.artist ?? ''), count: 0 }
      prev.count += 1
      if (!prev.pic300) { const c = toHttps(song?.artist_pic ?? song?.pic120 ?? song?.pic ?? ''); prev.pic300 = c; prev.pic120 = c; prev.pic70 = c; prev.pic = c }
      artistMap.set(artistId, prev)
    }
  }
  return Array.from(artistMap.values()).sort((a, b) => b.count - a.count).slice(0, PAGE_LIMIT)
}
async function searchKwSongs(text, page) {
  try {
    const body = await fetchKwText(`https://search.kuwo.cn/r.s?all=${encodeURIComponent(text)}&ft=music&itemset=web_2013&client=kt&pn=${Math.max(page - 1, 0) * PAGE_LIMIT}&rn=${PAGE_LIMIT}&rformat=json&encoding=utf8`)
    const list = parseLegacySearch(body)?.abslist ?? []
    const seen = new Set()
    return list.filter((each) => {
      const rid = `${each?.MUSICRID ?? each?.musicrid ?? ''}`.replace(/^MUSIC_/, '')
      const key = `${rid}|${cleanText(each?.NAME ?? each?.SONGNAME ?? '')}|${cleanText(each?.ARTIST ?? each?.artist ?? '')}`
      if (!key || seen.has(key)) return false
      seen.add(key); return true
    }).map(e => mapKwSong(e))
  } catch (e) { return [] }
}
async function searchKwPlaylists(text, page) { try { return ((await fetchKwJson(`https://m.kuwo.cn/newh5app/wapi/api/www/search/searchPlayListBykeyWord?key=${encodeURIComponent(text)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.list ?? []).map(e => mapKwPlaylistCard(e)) } catch (e) { return [] } }
async function searchKwAlbums(text, page) { try { return ((await fetchKwJson(`https://m.kuwo.cn/newh5app/wapi/api/www/search/searchAlbumBykeyWord?key=${encodeURIComponent(text)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.albumList ?? []).map(e => mapKwAlbumCard(e)) } catch (e) { return [] } }
async function searchKwArtists(text, page) { try { const list = await fetchKwJson(`https://m.kuwo.cn/newh5app/wapi/api/www/search/searchArtistBykeyWord?key=${encodeURIComponent(text)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`); return (list?.data?.list?.artistList ?? list?.data?.list ?? []).map(e => mapKwArtistCard(e)) } catch (e) { return [] } }
async function loadKwArtistSongs(id, page = 1) { return (await fetchKwJson(`https://m.kuwo.cn/newh5app/wapi/api/www/artist/artistMusic?artistid=${encodeURIComponent(id)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.list ?? [] }
async function loadKwArtistAlbums(id, page = 1) { return (await fetchKwJson(`https://m.kuwo.cn/newh5app/wapi/api/www/artist/artistAlbum?artistid=${encodeURIComponent(id)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.albumList ?? [] }
async function loadKwAlbumSongs(id, page = 1) { return (await fetchKwJson(`https://m.kuwo.cn/newh5app/wapi/api/www/album/albumInfo?albumId=${encodeURIComponent(id)}&pn=${page}&rn=${PAGE_LIMIT}&httpsStatus=1`))?.data?.musicList ?? [] }


// =========================================================
// wy音乐相关
// =========================================================
const WY_SOURCE = 'wy'

function withWyHeaders(extra = {}) { return { ...headers, Referer: 'https://music.163.com/', Origin: 'https://music.163.com', ...extra } }
function wyArtistNameOf(song) { return (song?.ar ?? song?.artists ?? []).map((a) => a.name).join('/') }

function mapWySong(song, fallback = {}) {
  const artists = song?.ar ?? song?.artists ?? []
  const album = song?.al ?? song?.album ?? fallback.album ?? {}
  const songId = song?.id ?? fallback.id ?? ''
  const songName = song?.name ?? fallback.name ?? ''
  const singer = wyArtistNameOf(song) || fallback.singer || ''
  return { id: `wy_${songId}`, name: `wy-${songName}`, cover: toHttps(album?.picUrl ?? fallback.cover ?? ''), duration: parseInt((song?.dt ?? song?.duration ?? fallback.duration ?? 0) / 1000), artist: { id: `wy_${artists[0]?.id ?? fallback.artistId ?? ''}`, name: singer, cover: toHttps(artists[0]?.img1v1Url ?? fallback.artistCover ?? '') }, ext: { source: WY_SOURCE, songmid: `${songId}`, singer: singer, songName: songName } }
}
function mapWyPlaylistCard(playlist, gid) {
  const creator = playlist?.creator ?? {}
  return { id: `wy_${playlist?.id ?? ''}`, name: `wy-${playlist?.name ?? ''}`, cover: toHttps(playlist?.coverImgUrl ?? playlist?.picUrl ?? playlist?.coverUrl ?? ''), artist: { id: `wy_${creator?.userId ?? playlist?.userId ?? 'wy'}`, name: creator?.nickname ?? playlist?.copywriter ?? playlist?.recommendText ?? 'wyfm', cover: toHttps(creator?.avatarUrl ?? '') }, ext: { gid: `${gid}`, id: `${playlist?.id ?? ''}`, type: 'playlist' } }
}
function mapWyAlbumCard(album, gid = GID.WY_NEW_ALBUMS) {
  const artist = album?.artist ?? album?.artists?.[0] ?? {}
  return { id: `wy_${album?.id ?? ''}`, name: `wy-${album?.name ?? ''}`, cover: toHttps(album?.picUrl ?? album?.blurPicUrl ?? ''), artist: { id: `wy_${artist?.id ?? ''}`, name: artist?.name ?? '', cover: toHttps(artist?.picUrl ?? artist?.img1v1Url ?? '') }, ext: { gid: `${gid}`, id: `${album?.id ?? ''}`, type: 'album' } }
}
function mapWyArtistCard(artist, gid = GID.WY_TOP_ARTISTS) {
  const artistId = `${artist?.id ?? ''}`
  return { id: `wy_${artistId}`, name: `wy-${artist?.name ?? ''}`, cover: toHttps(artist?.picUrl ?? artist?.img1v1Url ?? ''), groups: [{ name: '热门歌曲', type: 'song', ext: { gid: GID.WY_TOP_ARTISTS, id: artistId } }, { name: '专辑', type: 'album', ext: { gid: GID.WY_ARTIST_ALBUMS, id: artistId } }], ext: { gid: `${gid}`, id: artistId } }
}

async function fetchWyJson(url, extraHeaders = {}) {
  const { data } = await $fetch.get(url, { headers: withWyHeaders(extraHeaders) }); return safeArgs(data)
}
async function loadWyPlaylistTracks(id, page = 1) {
  const info = await fetchWyJson(`https://music.163.com/api/v6/playlist/detail?id=${id}&n=0&s=0`)
  const playlist = info?.playlist ?? {}
  const offset = Math.max(page - 1, 0) * PAGE_LIMIT
  const trackIds = (playlist?.trackIds ?? []).map((each) => `${each?.id ?? ''}`).filter(Boolean)
  const pageTrackIds = trackIds.slice(offset, offset + PAGE_LIMIT)
  const trackMap = new Map();
  (playlist?.tracks ?? []).forEach((each) => { if (each?.id != undefined) trackMap.set(`${each.id}`, each) })
  
  const missingTrackIds = pageTrackIds.filter((trackId) => !trackMap.has(trackId))
  if (missingTrackIds.length > 0) {
    const detailInfo = await fetchWyJson(`https://music.163.com/api/song/detail?ids=${encodeURIComponent(JSON.stringify(missingTrackIds))}`)
    ;(detailInfo?.songs ?? detailInfo?.songsData ?? []).forEach((each) => { if (each?.id != undefined) trackMap.set(`${each.id}`, each) })
  }
  if (pageTrackIds.length > 0) return pageTrackIds.map((trackId) => trackMap.get(trackId)).filter(Boolean).filter((song, index, list) => list.findIndex((each) => `${each?.id ?? ''}` == `${song?.id ?? ''}`) == index)
  return uniqueBySongId((playlist?.tracks ?? []).slice(offset, offset + PAGE_LIMIT))
}

function buildWyWebSearchUrl(text, page, code) { return `https://music.163.com/api/search/get/web?type=${code}&s=${encodeURIComponent(text)}&offset=${(page - 1) * PAGE_LIMIT}&limit=${PAGE_LIMIT}` }
async function searchWySongs(text, page) { try { return ((await fetchWyJson(buildWyWebSearchUrl(text, page, 1)))?.result?.songs ?? []).map(e => mapWySong(e, { cover: e?.album?.picUrl ?? '' })) } catch (e) { return [] } }
async function searchWyPlaylists(text, page) { try { return ((await fetchWyJson(buildWyWebSearchUrl(text, page, 1000)))?.result?.playlists ?? []).map(e => mapWyPlaylistCard(e, GID.WY_SEARCH_PLAYLISTS)) } catch (e) { return [] } }
async function searchWyAlbums(text, page) { try { return ((await fetchWyJson(buildWyWebSearchUrl(text, page, 10)))?.result?.albums ?? []).map(e => mapWyAlbumCard(e, GID.WY_NEW_ALBUMS)) } catch (e) { return [] } }
async function searchWyArtists(text, page) { try { return ((await fetchWyJson(buildWyWebSearchUrl(text, page, 100)))?.result?.artists ?? []).map(e => mapWyArtistCard(e)) } catch (e) { return [] } }


// =========================================================
// mg音乐相关（搜索）
// =========================================================
const MG_SOURCE = 'mg'

function withMgHeaders(extra = {}) { return { ...headers, Referer: 'https://music.migu.cn/', Origin: 'https://music.migu.cn', ...extra } }
async function fetchMgJson(url, extraHeaders = {}) { const { data } = await $fetch.get(url, { headers: withMgHeaders(extraHeaders) }); return safeArgs(data) }

function mgPickCover(imgItems) {
  if (!imgItems || !Array.isArray(imgItems)) return ''
  // imgSizeType: 03 是大图，02 中图，01 小图
  const big = imgItems.find(e => e?.imgSizeType === '03') ?? imgItems.find(e => e?.imgSizeType === '02') ?? imgItems[0]
  return toHttps(big?.img ?? '')
}

function mapMgSong(item) {
  const songId = `${item?.contentId ?? item?.copyrightId ?? item?.id ?? ''}`
  const copyrightId = `${item?.copyrightId ?? item?.contentId ?? songId}`
  const singers = item?.singers ?? []
  const albums = item?.albums ?? []
  const songName = cleanText(item?.name ?? '')
  const singer = cleanText(singers.map(s => s?.name ?? '').join('/'))
  const cover = mgPickCover(item?.imgItems)
  return {
    id: `mg_${songId}`,
    name: `mg-${songName}`,
    cover: cover,
    duration: 0,
    artist: { id: `mg_${singers[0]?.id ?? ''}`, name: singer, cover: '' },
    ext: { source: MG_SOURCE, songmid: songId, copyrightId: copyrightId, singer: singer, songName: songName, albumName: cleanText(albums[0]?.name ?? '') }
  }
}

async function searchMgSongs(text, page) {
  try {
    const info = await fetchMgJson(`https://pd.musicapp.migu.cn/MIGUM3.0/v1.0/content/search_all.do?text=${encodeURIComponent(text)}&pageNo=${page}&pageSize=${PAGE_LIMIT}&searchSwitch=%7B%22song%22%3A1%7D`)
    return (info?.songResultData?.result ?? []).map(e => mapMgSong(e))
  } catch (e) { return [] }
}

async function loadMgSingerSongs(id, page = 1) {
  const reqId = `${id ?? ''}`.replace(/^mg_/, '')
  const blocks = (await fetchMgJson(`https://app.c.nf.migu.cn/pc/bmw/singer/song/v1.0?pageNo=${page}&singerId=${encodeURIComponent(reqId)}&type=1`))?.data?.contents ?? []
  const songBlock = blocks.find((each) => each?.view == 'ZJ-Singer-Song-Scroll')
  return songBlock?.contents ?? []
}

function mapMgSingerSong(each) {
  const songItem = each?.songItem ?? {}
  const songId = `${songItem?.contentId ?? songItem?.songId ?? each?.resId ?? ''}`
  const copyrightId = `${songItem?.copyrightId ?? songItem?.contentId ?? songId}`
  const songName = cleanText(each?.txt ?? songItem?.songName ?? '')
  const singerList = songItem?.singerList ?? []
  const singer = cleanText(each?.txt2 ?? singerList.map((s) => s?.name ?? '').join('/'))
  const albumName = cleanText(each?.txt3 ?? songItem?.album ?? '')
  const cover = toHttps(songItem?.img2 ?? songItem?.img1 ?? songItem?.img3 ?? each?.img ?? '')
  return {
    id: `mg_${songId}`,
    name: `mg-${songName}`,
    cover: cover,
    duration: parseInt(songItem?.duration ?? 0),
    artist: { id: `mg_${singerList[0]?.id ?? ''}`, name: singer, cover: '' },
    ext: { source: MG_SOURCE, songmid: songId, copyrightId: copyrightId, singer: singer, songName: songName, albumName: albumName }
  }
}

async function loadMgSingerAlbums(id, page = 1) {
  const reqId = `${id ?? ''}`.replace(/^mg_/, '')
  const contents = (await fetchMgJson(`https://app.c.nf.migu.cn/pc/bmw/singer/album/v1.0?pageNo=${page}&singerId=${encodeURIComponent(reqId)}`))?.data?.contents ?? []
  const seen = new Set()
  return contents.filter((each) => {
    const resId = `${each?.resId ?? ''}`
    if (!resId || seen.has(resId)) return false
    seen.add(resId)
    return true
  }).map((each) => ({
    id: `mg_${each?.resId ?? ''}`,
    name: `mg-${cleanText(each?.txt ?? '')}`,
    cover: toHttps(each?.img ?? ''),
    artist: { id: `mg_${reqId}`, name: cleanText(each?.txt2 ?? ''), cover: '' },
    ext: { gid: GID.MG_ALBUM_SONGS, id: `${each?.resId ?? ''}`, albumName: cleanText(each?.txt ?? ''), type: 'album' }
  }))
}

function mapMgPlaylistCard(item) {
  return { id: `mg_${item?.id ?? ''}`, name: `mg-${cleanText(item?.name ?? '')}`, cover: toHttps(item?.musicListPicUrl ?? ''), artist: { id: `mg_${item?.userId ?? ''}`, name: 'mgfm', cover: '' }, ext: { gid: GID.MG_SEARCH_PLAYLISTS, id: `${item?.id ?? ''}`, type: 'playlist' } }
}
function mapMgAlbumCard(item) {
  return { id: `mg_${item?.id ?? ''}`, name: `mg-${cleanText(item?.name ?? '')}`, cover: mgPickCover(item?.imgItems), artist: { id: '', name: cleanText(item?.singer ?? ''), cover: '' }, ext: { gid: GID.MG_ALBUM_SONGS, id: `${item?.id ?? ''}`, albumName: cleanText(item?.name ?? ''), type: 'album' } }
}
function mapMgArtistCard(item) {
  return { id: `mg_${item?.id ?? ''}`, name: `mg-${cleanText(item?.name ?? '')}`, cover: '', artist: { id: `mg_${item?.id ?? ''}`, name: cleanText(item?.name ?? ''), cover: '' }, groups: [{ name: '热门歌曲', type: 'song', ext: { gid: GID.MG_ARTIST_SONGS, id: `${item?.id ?? ''}` } }, { name: '专辑', type: 'album', ext: { gid: GID.MG_ARTIST_ALBUMS, id: `${item?.id ?? ''}` } }], ext: { gid: GID.MG_TOP_ARTISTS, id: `${item?.id ?? ''}` } }
}
function buildMgSearchUrl(text, page, switchKey) {
  return `https://pd.musicapp.migu.cn/MIGUM3.0/v1.0/content/search_all.do?text=${encodeURIComponent(text)}&pageNo=${page}&pageSize=${PAGE_LIMIT}&searchSwitch=%7B%22${switchKey}%22%3A1%7D`
}
async function searchMgPlaylists(text, page) { try { return ((await fetchMgJson(buildMgSearchUrl(text, page, 'songlist')))?.songListResultData?.result ?? []).map(e => mapMgPlaylistCard(e)) } catch (e) { return [] } }
async function searchMgAlbums(text, page) { try { return ((await fetchMgJson(buildMgSearchUrl(text, page, 'album')))?.albumResultData?.result ?? []).map(e => mapMgAlbumCard(e)) } catch (e) { return [] } }
async function searchMgArtists(text, page) { try { return ((await fetchMgJson(buildMgSearchUrl(text, page, 'singer')))?.singerResultData?.result ?? []).map(e => mapMgArtistCard(e)) } catch (e) { return [] } }


// =========================================================
// kg音乐相关（搜索）
// =========================================================
const KG_SOURCE = 'kg'

function withKgHeaders(extra = {}) { return { ...headers, Referer: 'https://www.kugou.com/', Origin: 'https://www.kugou.com', ...extra } }
async function fetchKgJson(url, extraHeaders = {}) { const { data } = await $fetch.get(url, { headers: withKgHeaders(extraHeaders) }); return safeArgs(data) }

function kgToHttps(url) {
  if (!url) return ''
  return `${url}`.replace(/\{size\}/g, '400').replace(/^http:\/\//, 'https://')
}
function kgPick(...values) { for (const each of values) { if (each !== undefined && each !== null && `${each}` !== '') return each } return '' }

function mapKgSong(rawSong) {
  const song = rawSong?.songInfo ?? rawSong ?? {}
  const hash = `${song?.hash ?? song?.audio_id ?? song?.songmid ?? ''}`
  const singer = song?.singername ?? song?.author_name ?? song?.artist_name ?? song?.singerName ?? song?.author ?? ''
  const songName = song?.songname ?? song?.filename?.split('-')?.slice(1)?.join('-')?.trim() ?? song?.name ?? ''
  const albumName = song?.album_name ?? song?.albumname ?? song?.remark ?? ''
  const cover = kgToHttps(kgPick(song?.album_sizable_cover, song?.trans_param?.union_cover, song?.imgurl, song?.sizable_cover, song?.album_img, song?.cover))
  return {
    id: `kg_${hash || song?.album_audio_id || ''}`,
    name: `kg-${songName}`,
    cover: cover,
    duration: parseInt(song?.duration ?? song?.timelen ?? 0),
    artist: { id: `kg_${song?.singerid ?? song?.author_id ?? song?.artistid ?? ''}`, name: singer, cover: '' },
    ext: { source: KG_SOURCE, hash: `${hash}`, songmid: `${hash}`, singer: singer, songName: songName, albumName: albumName, album_id: `${song?.album_id ?? ''}` }
  }
}

async function loadKgPlaylistSongs(id, page = 1) { return (await fetchKgJson(`https://mobiles.kugou.com/api/v3/special/song?specialid=${encodeURIComponent(id)}&page=${page}&pagesize=${PAGE_LIMIT}&json=true`))?.data?.info ?? [] }
async function loadKgSingerSongs(id, page = 1) { return (await fetchKgJson(`https://mobiles.kugou.com/api/v3/singer/song?singerid=${encodeURIComponent(id)}&page=${page}&pagesize=${PAGE_LIMIT}&json=true`))?.data?.info ?? [] }
async function loadKgSingerAlbums(id, page = 1) { return (await fetchKgJson(`https://mobiles.kugou.com/api/v3/singer/album?singerid=${encodeURIComponent(id)}&page=${page}&pagesize=${PAGE_LIMIT}&json=true`))?.data?.info ?? [] }
async function loadKgAlbumSongs(id, page = 1) { return (await fetchKgJson(`https://mobiles.kugou.com/api/v3/album/song?albumid=${encodeURIComponent(id)}&page=${page}&pagesize=${PAGE_LIMIT}&json=true`))?.data?.info ?? [] }

function mapKgPlaylistCard(item) {
  return { id: `kg_${item?.specialid ?? ''}`, name: `kg-${item?.specialname ?? ''}`, cover: kgToHttps(item?.imgurl ?? ''), artist: { id: `kg_${item?.userid ?? ''}`, name: item?.nickname ?? 'kgfm', cover: '' }, ext: { gid: GID.KG_SEARCH_PLAYLISTS, id: `${item?.specialid ?? ''}`, type: 'playlist' } }
}
function mapKgAlbumCard(item) {
  return { id: `kg_${item?.albumid ?? ''}`, name: `kg-${item?.albumname ?? ''}`, cover: kgToHttps(item?.imgurl ?? ''), artist: { id: `kg_${item?.singerid ?? ''}`, name: item?.singername ?? '', cover: '' }, ext: { gid: GID.KG_ALBUM_SONGS, id: `${item?.albumid ?? ''}`, type: 'album' } }
}
function mapKgArtistCard(item) {
  return { id: `kg_${item?.singerid ?? item?.id ?? ''}`, name: `kg-${item?.singername ?? item?.name ?? ''}`, cover: kgToHttps(item?.imgurl ?? ''), artist: { id: `kg_${item?.singerid ?? ''}`, name: item?.singername ?? '', cover: '' }, ext: { gid: GID.QQ_TOP_ARTISTS, id: `${item?.singerid ?? ''}` } }
}

async function searchKgSongs(text, page) {
  try {
    return ((await fetchKgJson(`https://mobiles.kugou.com/api/v3/search/song?format=json&keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${PAGE_LIMIT}`))?.data?.info ?? []).map(e => mapKgSong(e))
  } catch (e) { return [] }
}
async function searchKgPlaylists(text, page) { try { return ((await fetchKgJson(`https://mobiles.kugou.com/api/v3/search/special?format=json&keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${PAGE_LIMIT}`))?.data?.info ?? []).map(e => mapKgPlaylistCard(e)) } catch (e) { return [] } }
async function searchKgAlbums(text, page) { try { return ((await fetchKgJson(`https://mobiles.kugou.com/api/v3/search/album?format=json&keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${PAGE_LIMIT}`))?.data?.info ?? []).map(e => mapKgAlbumCard(e)) } catch (e) { return [] } }
async function searchKgArtists(text, page) { try { return ((await fetchKgJson(`https://mobiles.kugou.com/api/v3/search/singer?format=json&keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${PAGE_LIMIT}`))?.data?.info ?? []).map(e => mapKgArtistCard(e)) } catch (e) { return [] } }


// =========================================================
// 插件入口聚合函数
// =========================================================
async function getConfig() { return jsonify(appConfig) }

async function getSongs(ext) {
  const { gid, id, period } = argsify(ext)
  const page = parseInt(argsify(ext).page) || 1
  const gidValue = `${gid ?? ''}`
  let songs = []

  // QQ 逻辑
  if (gidValue == GID.QQ_TOPLISTS) songs = (await loadQqToplistSongs(id, period, page)).map((each) => mapQqSong(each))
  if (gidValue == GID.QQ_SEARCH_PLAYLISTS || gidValue == GID.QQ_TAG_PLAYLISTS) songs = (await loadQqPlaylistSongs(id, page)).map((each) => mapQqSong(each))
  if (gidValue == GID.QQ_ARTIST_SONGS) songs = (await loadQqSingerSongs(id, page)).map((each) => mapQqSong(each))
  if (gidValue == GID.QQ_ALBUM_SONGS) songs = (await loadQqAlbumSongs(id, page)).map((each) => mapQqSong(each))
  
  // KW 逻辑
  if (gidValue == GID.KW_TOPLISTS) songs = (await loadKwToplistSongs(id, page)).map((each) => mapKwSong(each))
  if ([GID.KW_SEARCH_PLAYLISTS, GID.KW_RECOMMENDED_PLAYLISTS, GID.KW_HOT_PLAYLISTS, GID.KW_CLASSIC_PLAYLISTS].includes(gidValue)) songs = (await loadKwPlaylistSongs(id, page)).map((each) => mapKwSong(each))
  if (gidValue == GID.KW_ARTIST_SONGS) songs = (await loadKwArtistSongs(id, page)).map((each) => mapKwSong(each))
  if (gidValue == GID.KW_ALBUM_SONGS) songs = (await loadKwAlbumSongs(id, page)).map((each) => mapKwSong(each))
  
  // WY 逻辑
  if (gidValue == GID.WY_RECOMMENDED_SONGS) {
    if (page === 1) {
      const info = await fetchWyJson('https://music.163.com/api/personalized/newsong')
      songs = (info?.result ?? info?.data?.result ?? []).map(each => mapWySong(each?.song ?? each, { cover: each?.picUrl ?? (each?.song?.al ?? each?.song?.album ?? each?.album)?.picUrl ?? '' }))
    }
  }
  if ([GID.WY_RECOMMENDED_PLAYLISTS, GID.WY_CHINESE_PLAYLISTS, GID.WY_POP_PLAYLISTS, GID.WY_TOPLISTS, GID.WY_SEARCH_PLAYLISTS].includes(gidValue)) songs = (await loadWyPlaylistTracks(id, page)).map((each) => mapWySong(each))
  if ([GID.WY_NEW_ALBUMS, GID.WY_ALBUM_SONGS].includes(gidValue) && page === 1) songs = ((await fetchWyJson(`https://music.163.com/api/v1/album/${id}`))?.songs ?? []).map((each) => mapWySong(each))
  if ([GID.WY_TOP_ARTISTS, GID.WY_ARTIST_SONGS].includes(gidValue) && page === 1) songs = ((await fetchWyJson(`https://music.163.com/api/artist/top/song?id=${id}`))?.songs ?? []).map((each) => mapWySong(each))

  // KG 逻辑
  if (gidValue == GID.KG_SEARCH_PLAYLISTS) songs = (await loadKgPlaylistSongs(id, page)).map((each) => mapKgSong(each))
  if (gidValue == GID.KG_ARTIST_SONGS) songs = (await loadKgSingerSongs(id, page)).map((each) => mapKgSong(each))
  if (gidValue == GID.KG_ALBUM_SONGS) songs = (await loadKgAlbumSongs(id, page)).map((each) => mapKgSong(each))

  // MG 逻辑
  if (gidValue == GID.MG_SEARCH_PLAYLISTS) {
    const info = await fetchMgJson(`https://pd.musicapp.migu.cn/MIGUM3.0/v1.0/user/queryMusicListSongs.do?musicListId=${encodeURIComponent(id)}&pageNo=${page}&pageSize=${PAGE_LIMIT}`)
    songs = (info?.list ?? []).map((each) => {
      const songId = `${each?.contentId ?? each?.copyrightId ?? each?.songId ?? ''}`
      const copyrightId = `${each?.copyrightId ?? each?.contentId ?? songId}`
      const songName = cleanText(each?.songName ?? '')
      const singer = cleanText(each?.singer ?? '')
      const cover = mgPickCover(each?.albumImgs)
      return { id: `mg_${songId}`, name: `mg-${songName}`, cover: cover, duration: parseInt(each?.length ?? 0), artist: { id: `mg_${each?.singerId ?? ''}`, name: singer, cover: toHttps(each?.singerImg ?? '') }, ext: { source: MG_SOURCE, songmid: songId, copyrightId: copyrightId, singer: singer, songName: songName, albumName: cleanText(each?.album ?? '') } }
    })
  }
  if (gidValue == GID.MG_ARTIST_SONGS) songs = (await loadMgSingerSongs(id, page)).map((each) => mapMgSingerSong(each))
  if (gidValue == GID.MG_ALBUM_SONGS) {
    const albumName = argsify(ext).albumName ?? ''
    if (albumName) {
      try {
        const info = await fetchMgJson(buildMgSearchUrl(albumName, page, 'song'))
        songs = (info?.songResultData?.result ?? []).filter(e => (e?.albums ?? []).some(a => cleanText(a?.name ?? '') === cleanText(albumName))).map(e => mapMgSong(e))
      } catch (e) {}
    }
  }

  return jsonify({ list: songs })
}

async function getArtists(ext) {
  const { gid } = argsify(ext)
  const page = parseInt(argsify(ext).page) || 1
  const gidValue = `${gid ?? ''}`
  let artists = []
  if (gidValue == GID.QQ_TOP_ARTISTS) artists = (await loadQqSingerList(page)).map((each) => mapQqArtistCard(each))
  if (gidValue == GID.KW_TOP_ARTISTS) artists = (await loadKwHotArtists(page)).map((each) => ({ ...mapKwArtistCard(each), ext: { gid: GID.KW_TOP_ARTISTS, id: `${each?.id ?? ''}` } }))
  if (gidValue == GID.WY_TOP_ARTISTS) artists = ((await fetchWyJson(`https://music.163.com/api/artist/top?limit=${PAGE_LIMIT}&offset=${(page - 1) * PAGE_LIMIT}`))?.artists ?? []).map((each) => mapWyArtistCard(each))
  return jsonify({ list: artists })
}

async function getPlaylists(ext) {
  const { gid, from, categoryId, sortId } = argsify(ext)
  const page = parseInt(argsify(ext).page) || 1
  const gidValue = `${gid ?? ''}`
  const offset = (page - 1) * PAGE_LIMIT
  let cards = []

  // QQ
  if (gidValue == GID.QQ_TOPLISTS) cards = (await loadQqToplists()).filter(e => e?.title && e?.title !== 'MV榜').map(e => mapQqToplistCard(e)).slice(from === 'index' ? 0 : offset, from === 'index' ? PAGE_LIMIT : offset + PAGE_LIMIT)
  if (gidValue == GID.QQ_TAG_PLAYLISTS) cards = (await loadQqTagPlaylists(categoryId, sortId, page)).map(e => mapQqPlaylistCard(e))
  
  // KW
  if (gidValue == GID.KW_TOPLISTS) cards = (await loadKwToplists()).map(e => mapKwToplistCard(e)).slice(from === 'index' ? 0 : offset, from === 'index' ? PAGE_LIMIT : offset + PAGE_LIMIT)
  if (gidValue == GID.KW_RECOMMENDED_PLAYLISTS) cards = (await loadKwRecommendedPlaylists(page)).map(e => mapKwPlaylistCard(e, GID.KW_RECOMMENDED_PLAYLISTS))
  if (gidValue == GID.KW_HOT_PLAYLISTS) cards = (await loadKwFilteredPlaylists(page, '热门')).map(e => mapKwPlaylistCard(e, GID.KW_HOT_PLAYLISTS))
  if (gidValue == GID.KW_CLASSIC_PLAYLISTS) cards = (await loadKwFilteredPlaylists(page, '经典')).map(e => mapKwPlaylistCard(e, GID.KW_CLASSIC_PLAYLISTS))
  
  // WY
  if (gidValue == GID.WY_RECOMMENDED_PLAYLISTS) cards = ((await fetchWyJson(`https://music.163.com/api/personalized/playlist?limit=${PAGE_LIMIT}&offset=${offset}`))?.result ?? []).map(e => mapWyPlaylistCard(e, gidValue))
  if (gidValue == GID.WY_CHINESE_PLAYLISTS) cards = ((await fetchWyJson(`https://music.163.com/api/playlist/list?cat=${encodeURIComponent('华语')}&order=hot&limit=${PAGE_LIMIT}&offset=${offset}`))?.playlists ?? []).map(e => mapWyPlaylistCard(e, gidValue))
  if (gidValue == GID.WY_POP_PLAYLISTS) cards = ((await fetchWyJson(`https://music.163.com/api/playlist/list?cat=${encodeURIComponent('流行')}&order=hot&limit=${PAGE_LIMIT}&offset=${offset}`))?.playlists ?? []).map(e => mapWyPlaylistCard(e, gidValue))
  if (gidValue == GID.WY_TOPLISTS) cards = ((await fetchWyJson('https://music.163.com/api/toplist/detail/v2'))?.data ?? []).flatMap(g => g?.list ?? []).filter(e => e?.id && e?.targetType === 'PLAYLIST').map(e => ({ id: `wy_${e.id}`, name: e.name ?? '', cover: toHttps(e.coverUrl ?? e.coverImgUrl ?? e.firstCoverUrl ?? ''), artist: { id: 'wy', name: e.updateFrequency ?? 'wyfm', cover: '' }, ext: { gid: GID.WY_TOPLISTS, id: `${e.id}`, type: 'playlist' } })).slice(from === 'index' ? 0 : offset, from === 'index' ? PAGE_LIMIT : offset + PAGE_LIMIT)
  
  return jsonify({ list: cards })
}

async function getAlbums(ext) {
  const { gid, id } = argsify(ext)
  const page = parseInt(argsify(ext).page) || 1
  const gidValue = `${gid ?? ''}`
  let cards = []
  
  if (gidValue == GID.QQ_ARTIST_ALBUMS) cards = (await loadQqSingerAlbums(id, page)).map(e => mapQqAlbumCard(e))
  if (gidValue == GID.KW_ARTIST_ALBUMS) cards = (await loadKwArtistAlbums(id, page)).map(e => mapKwAlbumCard(e))
  if (gidValue == GID.WY_NEW_ALBUMS) { if (page === 1) cards = ((await fetchWyJson(`https://music.163.com/api/discovery/newAlbum?area=ALL&limit=${PAGE_LIMIT}`))?.albums ?? []).map(e => mapWyAlbumCard(e, gidValue)) }
  if (gidValue == GID.WY_ARTIST_ALBUMS) cards = ((await fetchWyJson(`https://music.163.com/api/artist/albums/${id}?offset=${(page - 1) * PAGE_LIMIT}&limit=${PAGE_LIMIT}`))?.hotAlbums ?? []).map(e => mapWyAlbumCard(e, GID.WY_ALBUM_SONGS))
  
  // KG
  if (gidValue == GID.KG_ARTIST_ALBUMS) cards = (await loadKgSingerAlbums(id, page)).map(e => mapKgAlbumCard(e))
  
  // MG
  if (gidValue == GID.MG_ARTIST_ALBUMS) cards = await loadMgSingerAlbums(id, page)
  
  return jsonify({ list: cards })
}

async function search(ext) {
  const { text, type } = argsify(ext)
  const page = parseInt(argsify(ext).page) || 1
  if (!text || page > SEARCH_PAGE_LIMIT) return jsonify({})

  if (type == 'song') {
    // 歌曲搜索：并发请求五个平台
    const [qqRes, kwRes, wyRes, mgRes, kgRes] = await Promise.all([
      searchQqSongs(text, page),
      searchKwSongs(text, page),
      searchWySongs(text, page),
      searchMgSongs(text, page),
      searchKgSongs(text, page),
    ])

    // 交叉合并五个平台结果
    const allResults = [qqRes, kwRes, wyRes, mgRes, kgRes]
    const merged = []
    const maxLen = Math.max(...allResults.map(r => r.length))
    for (let i = 0; i < maxLen; i++) {
      for (const results of allResults) {
        if (i < results.length) merged.push(results[i])
      }
    }
    return jsonify({ list: merged })
  }

  // 歌单/专辑/歌手搜索：并发请求五个平台
  const [qqRes, kwRes, wyRes, mgRes, kgRes] = await Promise.all([
    type == 'playlist' ? searchQqPlaylists(text, page) : type == 'album' ? searchQqAlbums(text, page) : searchQqArtists(text, page),
    type == 'playlist' ? searchKwPlaylists(text, page) : type == 'album' ? searchKwAlbums(text, page) : searchKwArtists(text, page),
    type == 'playlist' ? searchWyPlaylists(text, page) : type == 'album' ? searchWyAlbums(text, page) : searchWyArtists(text, page),
    type == 'playlist' ? searchMgPlaylists(text, page) : type == 'album' ? searchMgAlbums(text, page) : searchMgArtists(text, page),
    type == 'playlist' ? searchKgPlaylists(text, page) : type == 'album' ? searchKgAlbums(text, page) : searchKgArtists(text, page),
  ])

  const allResults = [qqRes, kwRes, wyRes, mgRes, kgRes]
  const merged = []
  const maxLen = Math.max(...allResults.map(r => r.length))
  for (let i = 0; i < maxLen; i++) {
    for (const results of allResults) {
      if (i < results.length) merged.push(results[i])
    }
  }

  return jsonify({ list: merged })
}

async function getSongInfo(ext) {
  const { source, songmid, rid, hash, copyrightId, singer, songName, album_id, quality } = argsify(ext)
  if (source == undefined) return jsonify({ urls: [] })

  const musicInfo = { songmid: `${songmid ?? rid ?? hash ?? copyrightId ?? ''}`, name: songName ?? '', singer: singer ?? '' }

  // 各平台特殊字段
  if (source === KW_SOURCE) musicInfo.rid = `${rid ?? songmid ?? ''}`
  if (source === MG_SOURCE) musicInfo.copyrightId = `${copyrightId ?? songmid ?? ''}`
  if (source === KG_SOURCE) { musicInfo.hash = `${hash ?? songmid ?? ''}`; musicInfo.album_id = `${album_id ?? ''}` }

  const result = await $lx.request('musicUrl', { type: quality || '320k', musicInfo: musicInfo }, { source: `${source}` })
  const soundurl = typeof result === 'string' ? result : result?.url ?? result?.data?.url ?? result?.urls?.[0]
  return jsonify({ urls: soundurl ? [soundurl] : [] })
}