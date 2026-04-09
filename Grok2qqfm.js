/*!
 * @name Grok2qqfm
 * @description qqfm - 自动最近播放最终修复版（首页/搜索正常）
 * @version v1.0.4
 * @author codex (增强 & 最终修复 by Grok)
 * @key csp_Grok2qqfm
 */

const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = { 'User-Agent': UA }

const PAGE_LIMIT = 20
const SEARCH_PAGE_LIMIT = 5
const QQ_SOURCE = 'tx'
const GID = {
  TOPLISTS: '1', TOP_ARTISTS: '2', ARTIST_SONGS: '3', ARTIST_ALBUMS: '4',
  ALBUM_SONGS: '5', SEARCH_PLAYLISTS: '6', TAG_PLAYLISTS: '7',
  RECENT_PLAYED: '8'
}

const MAX_RECENT = 200
let recentPlayed = []   // 全局记录数组

const appConfig = {
  ver: 1, name: 'qqfm', message: '', warning: '', desc: '',
  tabLibrary: { /* 原脚本完全一致，省略以节省空间 */ 
    name: '探索',
    groups: [
      {name:'飙升榜',type:'song',ui:0,showMore:false,ext:{gid:GID.TOPLISTS,id:'62'}},
      {name:'热歌榜',type:'song',ui:0,showMore:false,ext:{gid:GID.TOPLISTS,id:'26'}},
      {name:'新歌榜',type:'song',ui:0,showMore:false,ext:{gid:GID.TOPLISTS,id:'27'}},
      {name:'排行榜',type:'playlist',ui:1,showMore:true,ext:{gid:GID.TOPLISTS}},
      {name:'流行歌单',type:'playlist',ui:1,showMore:true,ext:{gid:GID.TAG_PLAYLISTS,categoryId:'6',sortId:'5'}},
      {name:'国语精选',type:'playlist',ui:1,showMore:true,ext:{gid:GID.TAG_PLAYLISTS,categoryId:'165',sortId:'5'}},
      {name:'轻音乐',type:'playlist',ui:1,showMore:true,ext:{gid:GID.TAG_PLAYLISTS,categoryId:'15',sortId:'5'}},
      {name:'影视原声',type:'playlist',ui:1,showMore:true,ext:{gid:GID.TAG_PLAYLISTS,categoryId:'133',sortId:'5'}},
      {name:'治愈歌单',type:'playlist',ui:1,showMore:true,ext:{gid:GID.TAG_PLAYLISTS,categoryId:'116',sortId:'5'}},
      {name:'热门歌手',type:'artist',ui:0,showMore:true,ext:{gid:GID.TOP_ARTISTS}}
    ]
  },
  tabMe: {
    name: '我的',
    groups: [
      { name: '最近播放（缓存歌曲）', type: 'song', ext: { gid: GID.RECENT_PLAYED } },
      { name: '红心', type: 'song' },
      { name: '歌单', type: 'playlist' },
      { name: '专辑', type: 'album' },
      { name: '创作者', type: 'artist' }
    ]
  },
  tabSearch: { /* 原脚本一致 */ 
    name: '搜索',
    groups: [
      {name:'歌曲',type:'song',ext:{type:'song'}},
      {name:'歌单',type:'playlist',ext:{type:'playlist'}},
      {name:'专辑',type:'album',ext:{type:'album'}},
      {name:'歌手',type:'artist',ext:{type:'artist'}}
    ]
  }
}

/* ==================== 以下函数与你原始脚本几乎完全一致 ==================== */
function safeArgs(data) { return typeof data === 'string' ? argsify(data) : (data ?? {}) }
function toHttps(url) { return !url ? '' : `${url}`.replace(/^http:\/\//, 'https://') }
function withQqHeaders(extra = {}) { return {...headers, Referer:'https://y.qq.com/', Origin:'https://y.qq.com', Cookie:'uin=0;', ...extra} }
function buildSearchUrl(text, page, searchType=0, limit=PAGE_LIMIT) { /* 原函数不变 */ 
  const payload = {comm:{ct:'19',cv:'1859',uin:'0'},req:{method:'DoSearchForQQMusicDesktop',module:'music.search.SearchCgiService',param:{grp:1,num_per_page:limit,page_num:page,query:text,search_type:searchType}}}
  return `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=${encodeURIComponent(JSON.stringify(payload))}`
}
function buildMusicuUrl(payload) { return `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=${encodeURIComponent(JSON.stringify(payload))}` }
async function fetchJson(url, extraHeaders={}) { const {data} = await $fetch.get(url,{headers:withQqHeaders(extraHeaders)}); return safeArgs(data) }
async function fetchHtml(url, extraHeaders={}) { const {data} = await $fetch.get(url,{headers:{...headers,...extraHeaders}}); return `${data??''}` }
function parseInitialData(html) { const m=html.match(/__INITIAL_DATA__\s*=\s*({[\s\S]*?})<\/script>/); return m?.[1]?safeArgs(m[1]):{} }

function singerListOf(song){return song?.singer??song?.singer_list??[]}
function singerNameOf(song){return singerListOf(song).map(a=>a?.name??a?.singer_name??'').filter(Boolean).join('/')}
function albumMidOf(song){return song?.album?.mid??song?.albumMid??song?.album_mid??song?.albummid??''}
function albumNameOf(song){return song?.album?.name??song?.albumName??song?.album_name??''}
function songMidOf(song){return song?.mid??song?.songmid??song?.song_mid??''}

function mapSong(rawSong) {
  const song = rawSong?.songInfo ?? rawSong ?? {}
  const singers = singerListOf(song)
  const singer = singerNameOf(song)
  const songmid = songMidOf(song)
  const albumMid = albumMidOf(song)

  return {
    id: `${songmid || song?.id || ''}`,
    name: song?.name ?? song?.title ?? '',
    cover: albumMid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${albumMid}.jpg` : '',
    duration: parseInt(song?.interval ?? 0),
    artist: { id: `${singers[0]?.mid??singers[0]?.singer_mid??''}`, name: singer, cover: singers[0]?.mid||singers[0]?.singer_mid ? `https://y.qq.com/music/photo_new/T001R500x500M000${singers[0]?.mid??singers[0]?.singer_mid}.jpg` : '' },
    ext: {
      source: QQ_SOURCE,
      songmid: `${songmid}`,
      singer: singer,
      songName: song?.name ?? song?.title ?? '',
      albumName: albumNameOf(song),
      albumMid: `${albumMid}`,
      singerMid: singers[0]?.mid ?? singers[0]?.singer_mid ?? ''
    }
  }
}

/* mapToplistCard、mapArtistCard、mapAlbumCard、mapPlaylistCard 与你原脚本完全一致（此处省略，复制你原来的即可） */

async function loadToplists() { /* 原函数不变 */ 
  const info = await fetchJson('https://u.y.qq.com/cgi-bin/musicu.fcg?_=1577086820633&data=%7B%22comm%22%3A%7B%22g_tk%22%3A5381%2C%22uin%22%3A123456%2C%22format%22%3A%22json%22%2C%22inCharset%22%3A%22utf-8%22%2C%22outCharset%22%3A%22utf-8%22%2C%22notice%22%3A0%2C%22platform%22%3A%22h5%22%2C%22needNewCode%22%3A1%2C%22ct%22%3A23%2C%22cv%22%3A0%7D%2C%22topList%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetAll%22%2C%22param%22%3A%7B%7D%7D%7D',{Cookie:'uin='})
  return (info?.topList?.data?.group??[]).flatMap(g=>g?.toplist??[])
}

/* 其余 loadToplistSongs、loadPlaylistSongs、loadTagPlaylists、loadSingerList、loadSingerSongs、loadSingerAlbums、loadAlbumSongs、loadSearchBody 全部与你原脚本一致（直接复制粘贴） */

/* getConfig、getArtists、getPlaylists、getAlbums、search 函数也与原脚本一致 */

async function getConfig() { return jsonify(appConfig) }

async function getSongs(ext) {
  const { page=1, gid, id, period } = argsify(ext)
  const gidValue = `${gid ?? ''}`
  let songs = []

  if (gidValue == GID.RECENT_PLAYED) {
    const offset = Math.max(page - 1, 0) * PAGE_LIMIT
    songs = recentPlayed.slice(offset, offset + PAGE_LIMIT)
    return jsonify({ list: songs })
  }

  // 以下完全沿用你原始脚本逻辑
  if (gidValue == GID.TOPLISTS) {
    const list = await loadToplistSongs(id, period, page)
    songs = list.map(mapSong)
  }
  if (gidValue == GID.SEARCH_PLAYLISTS) {
    const list = await loadPlaylistSongs(id, page)
    songs = list.map(mapSong)
  }
  if (gidValue == GID.ARTIST_SONGS) {
    const list = await loadSingerSongs(id, page)
    songs = list.map(mapSong)
  }
  if (gidValue == GID.ALBUM_SONGS) {
    const list = await loadAlbumSongs(id, page)
    songs = list.map(mapSong)
  }

  return jsonify({ list: songs })
}

/* getArtists、getPlaylists、getAlbums、search 函数保持原样（此处省略） */

// ==================== 核心修复：getSongInfo ====================
async function getSongInfo(ext) {
  const p = argsify(ext)
  let { source, songmid, singer, songName, quality, albumMid='', singerMid='', albumName='' } = p

  if (!songmid) {
    return jsonify({ urls: [] })
  }

  // 关键修复：信息不全时，从 recentPlayed 中查找已有记录补充
  if (!songName || !singer) {
    const existing = recentPlayed.find(s => s.id === songmid)
    if (existing) {
      songName = songName || existing.name
      singer = singer || existing.artist?.name
      albumMid = albumMid || existing.ext?.albumMid || ''
      singerMid = singerMid || existing.ext?.singerMid || ''
      albumName = albumName || existing.ext?.albumName || ''
    }
  }

  // 自动记录到最近播放（无论手动还是自动下一首）
  const songObj = {
    id: `${songmid}`,
    name: songName || '未知歌曲',
    cover: albumMid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${albumMid}.jpg` : '',
    duration: 0,
    artist: {
      id: `${singerMid}`,
      name: singer || '未知歌手',
      cover: singerMid ? `https://y.qq.com/music/photo_new/T001R500x500M000${singerMid}.jpg` : ''
    },
    ext: {
      source: source ?? QQ_SOURCE,
      songmid: `${songmid}`,
      singer: singer || '',
      songName: songName || '',
      albumName: albumName || '',
      albumMid: `${albumMid}`,
      singerMid: `${singerMid}`
    }
  }

  // 去重 + 置顶
  recentPlayed = recentPlayed.filter(s => s.id !== songmid)
  recentPlayed.unshift(songObj)
  if (recentPlayed.length > MAX_RECENT) recentPlayed = recentPlayed.slice(0, MAX_RECENT)

  // 原有播放链接获取逻辑（完全不变）
  const result = await $lx.request('musicUrl', {
    type: quality || '320k',
    musicInfo: { songmid: `${songmid}`, name: songName || '', singer: singer || '' }
  }, { source: `${source}` })

  const soundurl = typeof result === 'string' ? result : result?.url ?? result?.data?.url ?? result?.urls?.[0]

  return jsonify({ urls: soundurl ? [soundurl] : [] })
}
