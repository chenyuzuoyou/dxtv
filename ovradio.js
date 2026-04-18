/*!
 * @name overseas_radio
 * @description 境外广播电台合集
 * @version v1.0.0
 * @author AI
 * @key csp_overseas_radio
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 预定义的电台数据
const RADIO_LIST = [
  { name: "Radio France Interntional", url: "https://rfienchinois64k.ice.infomaniak.ch/rfienchinois-64.mp3", logo: "https://live.fanmingming.cn/radio/rfi.png" },
  { name: "BCC News Network", url: "http://stream.rcs.revma.com/78fm9wyy2tzuv", logo: "https://live.fanmingming.cn/radio/中广新闻网.png" },
  { name: "BBC World Service", url: "http://as-hls-ww-live.akamaized.net/pool_87948813/live/ww/bbc_world_service/bbc_world_service.isml/bbc_world_service-audio%3d96000.norewind.m3u8", logo: "" },
  { name: "CNN", url: "https://tunein.cdnstream1.com/3519_96.aac", logo: "" },
  { name: "CNA", url: "https://14033.live.streamtheworld.com/938NOW_PREM.aac", logo: "" },
  { name: "GB News", url: "https://listen-gbnews.sharp-stream.com/gbnews.mp3", logo: "" },
  { name: "LBC News", url: "https://icecast.thisisdax.com/LBCNewsUKMP3", logo: "" },
  { name: "Times Radio", url: "http://timesradio.wireless.radio/stream", logo: "" },
  { name: "Talk Radio", url: "https://radio.talkradio.co.uk/stream", logo: "" },
  { name: "Capital FM", url: "https://19183.live.streamtheworld.com/CAPITAL958FM_PREM.aac", logo: "" },
  { name: "Hao FM", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/HAO_963.mp3", logo: "" },
  { name: "Gold FM", url: "http://22903.live.streamtheworld.com:3690/GOLD905_PREM.aac", logo: "" },
  { name: "Money FM", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/MONEY_893AAC.aac", logo: "" },
  { name: "Yes FM", url: "https://22393.live.streamtheworld.com/YES933_PREM.aac", logo: "" },
  { name: "Kiss FM", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/KISS_92AAC.aac", logo: "" },
  { name: "NPR News", url: "https://nprdmcoitunes.akamaized.net/hls/live/2034276/itls/playlist.m3u8", logo: "" },
  { name: "ABC News Radio", url: "https://mediaserviceslive.akamaized.net/hls/live/2038318/rnnsw/masterhq.m3u8", logo: "" },
  { name: "Newstalk ZB", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/NZME_31AAC.aac", logo: "" },
  { name: "Power FM", url: "https://crystalout.surfernetwork.com:8001/KVSP_MP3", logo: "" },
  { name: "Classic FM", url: "https://ice-sov.musicradio.com/ClassicFMMP3", logo: "" },
  { name: "BBC Radio 1", url: "http://as-hls-ww-live.akamaized.net/pool_01505109/live/ww/bbc_radio_one/bbc_radio_one.isml/bbc_radio_one-audio%3d96000.norewind.m3u8", logo: "" },
  { name: "BBC Radio 1 Xtra", url: "http://as-hls-ww-live.akamaized.net/pool_92079267/live/ww/bbc_1xtra/bbc_1xtra.isml/bbc_1xtra-audio%3d96000.norewind.m3u8", logo: "" },
  { name: "BBC Radio 1 Dance", url: "http://as-hls-ww-live.akamaized.net/pool_62063831/live/ww/bbc_radio_one_dance/bbc_radio_one_dance.isml/bbc_radio_one_dance-audio%3d96000.norewind.m3u8", logo: "" },
  { name: "BBC Radio 2", url: "http://as-hls-ww-live.akamaized.net/pool_74208725/live/ww/bbc_radio_two/bbc_radio_two.isml/bbc_radio_two-audio%3d96000.norewind.m3u8", logo: "" },
  { name: "BBC Radio 3", url: "http://as-hls-ww-live.akamaized.net/pool_23461179/live/ww/bbc_radio_three/bbc_radio_three.isml/bbc_radio_three-audio%3d96000.norewind.m3u8", logo: "" },
  { name: "BBC Radio 4", url: "http://as-hls-ww-live.akamaized.net/pool_55057080/live/ww/bbc_radio_fourfm/bbc_radio_fourfm.isml/bbc_radio_fourfm-audio%3d96000.norewind.m3u8", logo: "" },
  { name: "BBC Radio 4 Extra", url: "http://as-hls-ww-live.akamaized.net/pool_26173715/live/ww/bbc_radio_four_extra/bbc_radio_four_extra.isml/bbc_radio_four_extra-audio%3d96000.norewind.m3u8", logo: "" },
  { name: "BBC Radio 5 Live", url: "http://as-hls-ww-live.akamaized.net/pool_89021708/live/ww/bbc_radio_five_live/bbc_radio_five_live.isml/bbc_radio_five_live-audio%3d96000.norewind.m3u8", logo: "" },
  { name: "BBC Radio 6 Music", url: "http://as-hls-ww-live.akamaized.net/pool_81827798/live/ww/bbc_6music/bbc_6music.isml/bbc_6music-audio%3d96000.norewind.m3u8", logo: "" },
  { name: "BBC Radio Asian Network", url: "http://as-hls-ww-live.akamaized.net/pool_22108647/live/ww/bbc_asian_network/bbc_asian_network.isml/bbc_asian_network-audio%3d96000.norewind.m3u8", logo: "" }
];

const appConfig = {
  ver: 1,
  name: '境外广播',
  message: '欢迎使用境外广播合集',
  warning: '',
  desc: '实时转播全球主要新闻与音乐电台',
  tabLibrary: {
    name: '探索',
    groups: [{
      name: '境外广播', type: 'song', ui: 0, showMore: true, ext: { gid: 'overseas' }
    }]
  },
  tabMe: {
    name: '我的',
    groups: [{ name: '我的收藏', type: 'song', ext: { gid: 'fav' } }]
  },
  tabSearch: {
    name: '搜索',
    groups: [{ name: '电台', type: 'song', ext: { type: 'song' } }]
  }
};

function safeExt(ext) {
  if (!ext) return {};
  if (typeof ext === 'object') return ext;
  try { return argsify(ext); } catch (e) { return {}; }
}

async function getConfig() {
  return jsonify(appConfig);
}

async function getSongs(ext) {
  const { gid = 'overseas' } = safeExt(ext);
  
  // 按照模板格式映射电台条目
  const songs = RADIO_LIST.map((item, index) => ({
    id: `radio_${index}`,
    name: item.name,
    cover: item.logo || 'https://www.bbc.co.uk/favicon.ico', // 默认Logo占位
    duration: 0, // 直播流时长设为0
    artist: {
      id: 'overseas_group',
      name: '境外广播',
      cover: '',
    },
    ext: {
      source: 'radio_source',
      playUrl: item.url, // 存储真实的播放地址
      songName: item.name,
    }
  }));

  return jsonify({ list: songs });
}

// 播放核心：直接返回预埋的直播流地址
async function getSongInfo(ext) {
  const { playUrl } = safeExt(ext);
  if (!playUrl) return jsonify({ urls: [] });
  
  return jsonify({ 
    urls: [playUrl],
    headers: { 'User-Agent': UA } 
  });
}

// 占位函数，保持与 netcodeS.js 模板结构一致
async function getArtists(ext) { return jsonify({ list: [] }); }
async function getPlaylists(ext) { return jsonify({ list: [] }); }
async function getAlbums(ext) { return jsonify({ list: [] }); }
async function search(ext) { return jsonify({ list: [] }); }
