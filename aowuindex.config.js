var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.config.js
var index_config_exports = {};
__export(index_config_exports, {
  default: () => index_config_default
});
module.exports = __toCommonJS(index_config_exports);

var index_config_default = {
  // 网盘私钥 Token 预留位（供 JS视频 网盘模块调用）
  ali: { token: "", token280: "token280" },
  quark: { cookie: "" },
  uc: { cookie: "cookie", token: "token", ut: "ut" },
  y115: { cookie: "" },
  
  // 嗷呜核心 4K/网盘的主镜像直接映射（取自 aowu 的主要节点）
  muou: { url: "https://666.666291.xyz" },
  wogg: { url: "http://www.wogg.lol" },
  leijing: { url: "" },
  tgsou: { tgPic: false, count: 0, url: "", channelUsername: "" },
  tgchannel: {},

  // 1. 嗷呜专属：【云盘/4K/2K/轻量 站点专区】
  pans: {
    list: [
      { name: "💥玩偶|4K", key: "woWogg", type: 3, ext: ["http://www.wogg.lol", "https://wogg.xxooo.cf", "https://woggpan.888484.xyz", "https://wogg.333232.xyz", "http://woggpan.xxooo.cf", "https://www.wogg.one", "https://www.wogg.live"] },
      { name: "💥木偶|4K", key: "moWobg", type: 3, ext: ["http://123.666291.xyz", "https://666.666291.xyz"] },
      { name: "☁️二小|4K", key: "exWobg", type: 3, ext: ["https://www.2xiaopan.top", "https://2xiaopan.top", "https://www.erxiaozhan.top", "https://www.2xiaozhan.top", "https://wexwp.cc"] },
      { name: "☁️至臻|4K", key: "zzWobg", type: 3, ext: ["https://pan.mihdr.top", "https://zhizhen1.top", "https://mihdr.top", "https://www.mihdr.top", "https://www.miqk.cc", "https://zhizhenpan.com", "https://zhizhen8.click", "https://www.zhizhen8.click"] },
      { name: "☁️闪电|4K", key: "yxWobg", type: 3, ext: ["http://sd.sduc.site", "http://www.xiaocgege.shop"] },
      { name: "☁️多多|4K", key: "ddWobg", type: 3, ext: ["https://tv.yydsys.top", "https://tv.yydsys.cc", "https://tv.214521.xyz"] },
      { name: "🔗Gaze|2K", key: "Gaze", type: 3, ext: ["https://gaze.red", "https://gazes.store", "https://gazes.top", "https://gazes.host"] },
      { name: "🔗哔嘀|2K", key: "Bidys", type: 3, ext: ["https://v.xl01.eu.cc", "https://xl02.com.de", "https://v.xl02.eu.cc", "https://v.xl01.cc.ua"] },
      { name: "🔗厂长|2K", key: "Czzy", type: 3, ext: ["https://czzy.top", "https://www.4kcz.com", "https://www.cz4k.com"] },
      { name: "🔗LBV|2K", key: "Libvio", type: 3, ext: ["https://www.libvios.com", "https://www.libhd.com", "https://www.libvio.life"] },
      { name: "☁️Seed|4K", key: "SeedHub", type: 3, ext: ["http://104.243.25.80", "https://sidhub.cc", "https://seeduck.cc", "https://hubdog.cc"] },
      { name: "☁️七味|4K", key: "Qiwei", type: 3, ext: ["https://www.qwnull.com", "https://www.qwmkv.com", "https://www.qwfilm.com", "https://www.qnmp4.com", "https://www.qnnull.com", "https://www.qnhot.com"] }
    ]
  },

  // 2. 嗷呜专属：【多源影视/短剧/动漫/快速 站点列表】
  sites: {
    list: [
      { name: "🔥豆瓣推荐", key: "Douban", type: 3, searchable: 0, quickSearch: 0, changeable: 0 },
      { name: "⭐夏天|秒播", key: "NewGrV2", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "⭐韩剧|秒播", key: "Hxq", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "⭐瓜子|秒播", key: "Guazi", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🐱嗷嗚|动漫", key: "AowuDmAw", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🐱番薯|动漫", key: "FanShu", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🐱喵物|动漫", key: "AowuDmMw", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🎬嗷嗚|漫剧", key: "MjHggg", type: 3, searchable: 0, quickSearch: 0, changeable: 0 },
      { name: "🎬嗷嗚|短剧", key: "DjHggg", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🎬豪堪|短剧", key: "HHkk", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🎬盒马|短剧", key: "Hema", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🎬拜拜|短剧", key: "Bddj", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🎬围观|短剧", key: "Wgdj", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🎬喵喵|短剧", key: "Qmdj", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🎬星星|短剧", key: "Xydj", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🧩金牌|快速", key: "JinPai", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🧩荐片|快速", key: "JPian", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🧩热播|快速", key: "Rbys", type: 3, api: "http://v.rbotv.cn", searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🧩杜北|快速", key: "Dubk", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🧩伊外|快速", key: "YIys", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🧩爱看|采集", key: "AiBot", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🌍爱瓜|墙外", key: "AiGua", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🌍U视|墙外", key: "Ysp", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🌍欧乐|墙外", key: "Olyy", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🌍壹帆|墙外", key: "Aiyf", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🏆88|体育", key: "BbkqLive", type: 3, ext: ["https://www.88kanqiu.app", "https://www.88kanqiu.la"], searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🔍fish|盘搜", key: "PSfish", type: 3, searchable: 1, quickSearch: 1, changeable: 0 },
      { name: "🔍短剧|盘搜", key: "PSdju", type: 3, searchable: 1, quickSearch: 1, changeable: 0 }
    ]
  },

  // 3. 嗷呜专属：【体育/卫视直播专区】（完美平移 lives 数据）
  alist: [
    // 清空了原本模板中的 AList 地址，此处可留空或供后续动态载入
  ],

  // 4. 嗷呜特有的自定义 T4 等待层（无 T4 资源则保持空列表结构）
  t4: { list: [] },

  // 5. 纯净 CMS 采集：剔除成人，只保留纯影视采集（无单独 API 采集则留空）
  cms: { list: [] },

  // 6. 嗷呜配置弹幕服务（本地弹幕池）
  danmu: {
    urls: [
      { address: "http://127.0.0.1:2525/danmu", name: "嗷呜本地专属弹幕" }
    ],
    autoPush: true
  },

  // 7. 保持原系统需要的颜色 UI 参数不变
  color: [
    {
      light: {
        bg: "https://i2.100024.xyz/2024/01/13/pptcej.webp",
        bgMask: "0x50ffffff",
        primary: "0xff446732",
        onPrimary: "0xffffffff",
        primaryContainer: "0xffc5efab",
        onPrimaryContainer: "0xff072100",
        secondary: "0xff55624c",
        onSecondary: "0xffffffff",
        secondaryContainer: "0xffd9e7cb",
        onSecondaryContainer: "0xff131f0d",
        tertiary: "0xff386666",
        onTertiary: "0xffffffff",
        tertiaryContainer: "0xffbbebec",
        onTertiaryContainer: "0xff002020",
        error: "0xffba1a1a",
        onError: "0xffffffff",
        errorContainer: "0xffffdad6",
        onErrorContainer: "0xff410002",
        background: "0xfff8faf0",
        onBackground: "0xff191d16",
        surface: "0xfff8faf0",
        onSurface: "0xff191d16",
        surfaceVariant: "0xffe0e4d6",
        onSurfaceVariant: "0xff191d16",
        inverseSurface: "0xff2e312b",
        inverseOnSurface: "0xfff0f2e7",
        outline: "0xff74796d",
        outlineVariant: "0xffc3c8bb",
        shadow: "0xff000000",
        scrim: "0xff000000",
        inversePrimary: "0xffaad291",
        surfaceTint: "0xff446732"
      },
      dark: {
        bg: "https://i2.100024.xyz/2024/01/13/pptg3z.webp",
        bgMask: "0x50000000",
        primary: "0xffaad291",
        onPrimary: "0xff173807",
        primaryContainer: "0xff2d4f1c",
        onPrimaryContainer: "0xffc5efab",
        secondary: "0xffbdcbb0",
        onSecondary: "0xff283420",
        secondaryContainer: "0xff3e4a35",
        onSecondaryContainer: "0xffd9e7cb",
        tertiary: "0xffa0cfcf",
        onTertiary: "0xff003738",
        tertiaryContainer: "0xff1e4e4e",
        onTertiaryContainer: "0xffbbebec",
        error: "0xffffb4ab",
        onError: "0xff690005",
        errorContainer: "0xff93000a",
        onErrorContainer: "0xffffdad6",
        background: "0xff11140e",
        onBackground: "0xffe1e4d9",
        surface: "0xff11140e",
        onSurface: "0xffe1e4d9",
        surfaceVariant: "0xff43483e",
        onSurfaceVariant: "0xffe1e4d9",
        inverseSurface: "0xffe1e4d9",
        inverseOnSurface: "0xff2e312b",
        outline: "0xff8d9286",
        outlineVariant: "0xff43483e",
        shadow: "0xff000000",
        scrim: "0xff000000",
        inversePrimary: "0xff446732",
        surfaceTint: "0xffaad291"
      }
    }
  ]
};
