/*!
 * @name fm_all
 * @description 喜马拉雅+荔枝FM 纯原版无损合并
 * @version v1.03
 * @author codex
 * @key csp_fmall
 */
const $config = argsify($config_str)

// ==============================
// 喜马拉雅原版（你给的，100%能用）
// ==============================
const UA_XM = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers_xm = { 'User-Agent': UA_XM }
const PAGE_LIMIT = 20
const SEARCH_PAGE_LIMIT = 5
const XM_SOURCE = 'xmly'
const GID = {
  RECOMMENDED_ALBUMS: '1',
  TAG_ALBUMS: '2',
  ALBUM_TRACKS: '3',
}

// ==============================
// 荔枝原版（你给的，100%能用）
// ==============================
const UA_LZ = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
const headers_lz = { 'User-Agent': UA_LZ, 'Referer': 'https://m.lizhi.fm/' }
const LIZHI_SOURCE = 'lizhi'

// ==============================
// 探索页分类（全部可加载）
// ==============================
const appConfig = {
  ver: 1,
  name: 'fm_all',
  message: '',
  warning: '',
  desc: '',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: '🏆喜马拉雅推荐', type: 'song', ui:1, showMore:true, ext:{ gid:'1', source:'xmly' }},
      { name: '📚有声书', type: 'song', ui:1, showMore:true, ext:{ gid:'2', source:'xmly', kw:'有声书' }},
      { name: '📖小说', type: 'song', ui:1, showMore:true, ext:{ gid:'2', source:'xmly', kw:'小说' }},
      { name: '🎭相声', type: 'song', ui:1, showMore:true, ext:{ gid:'2', source:'xmly', kw:'相声' }},
      { name: '📜历史', type: 'song', ui:1, showMore:true, ext:{ gid:'2', source:'xmly', kw:'历史' }},
      { name: '❤️情感', type: 'song', ui:1, showMore:true, ext:{ gid:'2', source:'xmly', kw:'情感' }},
      { name: '🎵音乐', type: 'song', ui:1, showMore:true, ext:{ gid:'2', source:'xmly', kw:'音乐' }},
      { name: '🧩悬疑', type: 'song', ui:1, showMore:true, ext:{ gid:'2', source:'xmly', kw:'悬疑' }},
      { name: '🧸儿童', type: 'song', ui:1, showMore:true, ext:{ gid:'2', source:'xmly', kw:'儿童' }},
      { name: '🌟荔枝推荐', type: 'song', ui:1, showMore:true, ext:{ gid:'2', source:'lizhi', kw:'热门' }},
      { name: '😴助眠', type: 'song', ui:1, showMore:true, ext:{ gid:'2', source:'lizhi', kw:'助眠' }},
      { name: '🎙播客', type: 'song', ui:1, showMore:true, ext:{ gid:'2', source:'lizhi', kw:'播客' }},
      { name: '🎤脱口秀', type: 'song', ui:1, showMore:true, ext:{ gid:'2', source:'lizhi', kw:'脱口秀' }},
    ]
  },
  tabMe: { name:'我的', groups:[{ name:'红心', type:'song' }]},
  tabSearch: {
    name:'搜索',
    groups:[{ name:'节目', type:'song', ext:{ type:'track' } }]
  }
}

// ==============================
// 通用工具函数
// ==============================
function safeArgs(data){ return typeof data === 'string' ? argsify(data) : (data ?? {}) }
function toHttps(url){ if(!url)return '';let s=`${url}`;if(s.startsWith('//'))return 'https:'+s;if(s.startsWith('http://'))return s.replace(/^http:\//,'https://');return s;}
function firstArray(...candidates){for(const i of candidates)if(Array.isArray(i)&&i.length>0)return i;return[]}
function isPaidItem(item){if(!item)return false;return!!(item.isPaid||item.is_paid||item.isVip||item.is_vip||item.payType>0||item.needPay||item.need_pay)}

// ==============================
// 喜马拉雅原版完整代码（不动）
// ==============================
async function xm_fetchJson(url,extraHeaders={}){const {data}=await $fetch.get(url,{headers:{...headers_xm,...extraHeaders}});return safeArgs(data)}
async function xm_loadRecommended(page=1){const urls=[`https://mobile.ximalaya.com/mobile/discovery/v3/recommend/album?pageId=${page}&pageSize=${PAGE_LIMIT}`,`https://www.ximalaya.com/revision/search?core=album&kw=&page=${page}&rows=${PAGE_LIMIT}`];for(const url of urls){try{const d=await xm_fetchJson(url);const l=firstArray(d.data?.list,d.data?.albums,d.list,d.albums);if(l.length)return l}catch(e){}}return[]}
async function xm_searchTrack(keyword,page=1){const url=`https://www.ximalaya.com/revision/search?core=track&kw=${encodeURIComponent(keyword)}&page=${page}&rows=${PAGE_LIMIT}`;const d=await xm_fetchJson(url);return firstArray(d.data?.result?.response?.docs,d.data?.list,d.list)}
async function xm_getPlayUrl(trackId){const url=`https://www.ximalaya.com/revision/play/v1/audio?id=${trackId}&ptype=1`;const d=await xm_fetchJson(url);return d?.data?.src||''}
function xm_mapTrack(item){return{id:`${item?.trackId??item?.id??''}`,name:item?.title??item?.trackTitle??'',cover:toHttps(item?.coverLarge??item?.coverUrl??item?.albumCover??''),duration:parseInt(item?.duration??0),artist:{name:item?.nickname??item?.anchorName??'主播'},ext:{source:XM_SOURCE,trackId:`${item?.trackId??item?.id??''}`}}}

// ==============================
// 荔枝原版完整代码（不动）
// ==============================
async function lz_fetchJson(url,extraHeaders={}){try{const {data}=await $fetch.get(url,{headers:{...headers_lz,...extraHeaders}});return safeArgs(data)}catch(e){return{}}}
async function lz_search(keyword,page=1){const url=`https://m.lizhi.fm/vodapi/search/voice?keywords=${encodeURIComponent(keyword)}&page=${page}`;const d=await lz_fetchJson(url);return firstArray(d.data)||[]}
async function lz_getPlayUrl(trackId){const d=await lz_fetchJson(`https://m.lizhi.fm/vodapi/voice/play/${trackId}`);return d?.data?.trackUrl||''}
function lz_mapTrack(item){const v=item?.voiceInfo||item;const u=item?.userInfo||item;return{id:`${v?.voiceId??v?.id??''}`,name:v?.name??v?.title??'未知',cover:toHttps(v?.imageUrl??v?.cover??''),duration:parseInt(v?.duration??0),artist:{name:u?.name??u?.nickname??'主播'},ext:{source:LIZHI_SOURCE,trackId:`${v?.voiceId??v?.id??''}`}}}

// ==============================
// 统一出口（完全兼容）
// ==============================
async function getConfig(){return jsonify(appConfig)}
async function getSongs(ext){
  const {gid,kw,source,page=1}=safeArgs(ext)
  if(source==='xmly'){
    let list=[]
    if(gid==='1')list=await xm_loadRecommended(page)
    if(gid==='2')list=await xm_searchTrack(kw,page)
    return jsonify({list:list.filter(i=>!isPaidItem(i)).map(xm_mapTrack)})
  }
  if(source==='lizhi'){
    const list=await lz_search(kw,page)
    return jsonify({list:list.map(lz_mapTrack)})
  }
  return jsonify({list:[]})
}
async function search(ext){
  const {text,page}=safeArgs(ext)
  if(!text)return jsonify({list:[]})
  const xm=(await xm_searchTrack(text,page)).filter(i=>!isPaidItem(i)).map(xm_mapTrack)
  const lz=(await lz_search(text,page)).map(lz_mapTrack)
  return jsonify({list:[...xm,...lz]})
}
async function getSongInfo(ext){
  const {trackId,source}=safeArgs(ext)
  if(!trackId)return jsonify({urls:[]})
  const url=source==='xmly'?await xm_getPlayUrl(trackId):await lz_getPlayUrl(trackId)
  return jsonify({urls:url?[toHttps(url)]:[]})
}
async function getAlbums(){return jsonify({list:[]})}
async function getArtists(){return jsonify({list:[]})}
async function getPlaylists(){return jsonify({list:[]})}