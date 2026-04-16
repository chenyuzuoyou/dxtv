/*!
 * @name xmlyfm4 (限免专辑加载+播放修复版)
 * @description 喜马拉雅FM（仅修改限免专辑内列表加载 + 单曲播放链接，基于原v1.6.4）
 * @version v1.7.2-mod
 * @author codex + Grok 限免专改
 * @key csp_xmlyfm
 */
const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
const headers = { 'User-Agent': UA }
const PAGE_LIMIT = 20
const SEARCH_PAGE_LIMIT = 5
const XM_SOURCE = 'xmly'
const GID = {
  RECOMMENDED_ALBUMS: '1',
  TAG_ALBUMS: '2',
  ALBUM_TRACKS: '3',
}

// ==================== 你原版的 appConfig、safeArgs、toHttps、firstArray、isPaidItem、mapAlbum、mapTrack 等全部保持不变 ====================
// （为节省篇幅，这里省略，你直接把原脚本中的这些部分复制粘贴进来即可）

// ==================== 仅修改：loadAlbumTracks（限免专辑加载优化） ====================
async function loadAlbumTracks(albumId, page = 1) {
  let allTracks = [];
  let currentPage = 1;
  const maxPage = 50;

  while (currentPage <= maxPage) {
    // 优先移动端接口（对限免专辑更友好）
    const urls = [
      `https://mobile.ximalaya.com/mobile/v1/album/track/?albumId=${albumId}&pageSize=100&pageId=${currentPage}&isAsc=true`,
      `https://mobile.ximalaya.com/mobile/v1/album/track/?albumId=${albumId}&pageSize=100&pageId=${currentPage}`,
      `https://www.ximalaya.com/revision/album/v1/getTracksList?albumId=${albumId}&pageNum=${currentPage}&pageSize=100`
    ];

    let pageTracks = [];
    for (const url of urls) {
      try {
        const isMobile = url.includes('mobile.ximalaya.com');
        const extra = {
          Referer: `https://www.ximalaya.com/album/${albumId}`,
          'User-Agent': isMobile ? MOBILE_UA : UA
        };
        const data = await $fetch.get(url, { headers: { ...headers, ...extra } });
        const info = safeArgs(data?.data);
        const list = firstArray(info?.tracks, info?.list, info?.data?.tracks, info?.data?.list);
        if (list.length > 0) {
          pageTracks = list;
          break;
        }
      } catch (e) {}
    }

    if (pageTracks.length === 0) break;
    allTracks = allTracks.concat(pageTracks);
    if (pageTracks.length < 100) break; 
    currentPage++;
  }

  return allTracks;
}

// ==================== 仅修改：getSongInfo（限免单曲播放链接优化） ====================
async function getSongInfo(ext) {
  let arg = safeArgs(ext);
  let trackId = arg?.trackId || arg?.id;
  
  if (!trackId && typeof ext === 'string') {
    try {
      const parsed = JSON.parse(ext);
      trackId = parsed.trackId || parsed.id;
    } catch (e) {
      trackId = ext; 
    }
  }
  if (!trackId) return jsonify({ urls: [] });

  const urls = [
    // 新增 device=web 版本，对限免内容更稳定
    `https://www.ximalaya.com/mobile-playpage/track/v3/baseInfo/${Date.now()}?device=web&trackId=${trackId}`,
    `https://mobile.ximalaya.com/mobile-playpage/track/v3/baseInfo/${Date.now()}?device=android&trackId=${trackId}&trackQualityLevel=2`,
    `https://m.ximalaya.com/m-revision/common/track/getPlayUrlV4?trackId=${trackId}`,
    `https://mobile.ximalaya.com/mobile/v1/track/baseInfo?device=android&trackId=${trackId}`
  ];

  for (const url of urls) {
    try {
      const isWeb = url.includes('device=web');
      const { data } = await $fetch.get(url, {
        headers: { 
          'User-Agent': isWeb ? UA : MOBILE_UA,
          'Referer': 'https://www.ximalaya.com/'
        }
      });
      
      const info = typeof data === 'string' ? JSON.parse(data) : data;
      const d = info?.data?.trackInfo || info?.data || info?.trackInfo || info;

      let playUrl = d?.playUrl64 || d?.playUrl32 || d?.playUrl || d?.src || d?.url || 
                    d?.playPathHq || d?.play_path_64 || d?.play_path_32 ||
                    d?.playPathAacv164 || d?.audioUrl || d?.epPlayUrl;

      if (playUrl && playUrl.includes('http')) {
        if (playUrl.startsWith("//")) playUrl = "https:" + playUrl;
        if (playUrl.startsWith("http://")) playUrl = playUrl.replace(/^http:\/\//, "https://");
        return jsonify({ urls: [playUrl] });
      }
    } catch (e) {}
  }

  return jsonify({ urls: [] });
}

// ==================== 其余函数完全使用你原版（getAlbums、getSongs、search、getConfig 等）===================
// 把你原脚本中 getAlbums、getSongs、search、getArtists、getPlaylists、loadRecommendedAlbums、loadAlbumsByKeyword 等函数完整复制到这里

// 示例（请替换为你的原版对应函数）：
async function getAlbums(ext) {
  // ... 你原版代码 ...
}

async function getSongs(ext) {
  const { page, gid, id, text, type } = argsify(ext);
  let list = [];

  if (`${gid ?? ''}` == GID.ALBUM_TRACKS) {
    if (type === 'artist') {
      list = await loadArtistTracks(id, page);   // 原版函数
    } else if (text) {
      list = await loadTracksByKeyword(text, page);
    } else {
      list = await loadAlbumTracks(id, page);   // 使用上面修改后的限免优化版
    }
  }

  return jsonify({ list: list.filter(item => !isPaidItem(item)).map(mapTrack) });
}

// search、getConfig 等保持你原版不变