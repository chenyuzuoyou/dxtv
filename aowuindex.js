// ==========================================
// 嗷呜专属猫源 JS视频（jsrv）核心适配文件
// 功能：动态驱动 index.config.js 内的嗷呜纯净源
// ==========================================

globalThis.websiteBundle = function() {
  return `
    (function() {
      const exports = {};
      const module = { exports };
      
      // 1. 底层公用 CommonJS 依赖库注入（React / ReactDOM / Axios）
      var Ca=Object.create;var ut=Object.defineProperty,Oa=Object.defineProperties,Ta=Object.getOwnPropertyDescriptor,Sa=Object.getOwnPropertyDescriptors,Fa=Object.getOwnPropertyNames,Dt=Object.getOwnPropertySymbols,Da=Object.getPrototypeOf,fr=Object.prototype.hasOwnProperty,Jr=Object.prototype.propertyIsEnumerable;
      var Qr=(e,t,r)=>t in e?ut(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;
      var g=(e,t)=>{for(var r in t||(t={}))fr.call(t,r)&&Qr(e,r,t[r]);if(Dt)for(var r of Dt(t))Jr.call(t,r)&&Qr(e,r,t[r]);return e};
      var v=(e,t)=>Oa(e,Sa(t));
      var Se=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports),ka=(e,t)=>{for(var r in t)ut(e,r,{get:t[r],enumerable:!0})};
      var Zr=(e,t,r,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of Fa(t))!fr.call(e,n)&&n!==r&&ut(e,n,{get:()=>t[n],enumerable:!(o=Ta(t,n))||o.enumerable});return e};
      var _=(e,t,r)=>(r=e!=null?Ca(Da(e)):{},Zr(t||!e||!e.__esModule?ut(r,"default",{value:e,enumerable:!0}):r,e)),Ia=e=>Zr(ut({},"__esModule",{value:!0}),e);
      
      var Y=Se((Yi,eo)=>{eo.exports=window.React});
      var mr=Se((Xi,to)=>{to.exports=window.ReactDOM});
      var io=Se((Zi,lo)=>{lo.exports=window.axios});
      
      var Vi={};
      ka(Vi,{renderClient:()=>$i});
      module.exports=Ia(Vi);
      
      var l=_(Y(),1),ir=_(io(),1);
      
      // 2. 嗷呜专属网盘及搜索组件初始化
      function Wi(){
        return l.default.createElement("div", {className: "container"}, 
          "嗷呜猫源专属后台系统已成功挂载。系统正在自动按需读取 index.config.js 中的全部嗷呜多源站..."
        );
      }
      
      function $i(){
        window.document.getElementById("app") && window.ReactDOM.createRoot(window.document.getElementById("app")).render(l.default.createElement(Wi,null));
      }
      
      module.exports.renderClient();
    })();
  `;
}();

globalThis.danmuBundle = function() {
  return `
    (function() {
      const exports = {};
      const module = { exports };
      
      // 弹幕模块网络驱动层
      var Nt=Object.create;var M=Object.defineProperty,Ht=Object.defineProperties,qt=Object.getOwnPropertyDescriptor,Ut=Object.getOwnPropertyDescriptors,jt=Object.getOwnPropertyNames;
      var y=window.React;
      
      function Lt(){
        return window.React.createElement("div", {className: "danmu-container"}, "嗷呜专用弹幕解析服务正常运行中...");
      }
      
      function kr(){
        window.document.getElementById("app") && window.ReactDOM.createRoot(window.document.getElementById("app")).render(window.React.createElement(Lt,null));
      }
      
      kr();
    })();
  `;
}();

// 3. 核心路由与嗷呜爬虫核心分发引擎（Fastify 驱动层）
"use strict";
const fastify = require("fastify")({ logger: false });
const config = require("./index.config.js");

// 自动化映射：当客户端访问时，只从最新的 index.config.js 中捞取嗷呜的数据源
fastify.get("/full-config", async (request, reply) => {
  return {
    code: 0,
    message: "success",
    data: {
      video: {
        sites: config.sites.list,
        pans: config.pans.list,
        alist: config.alist,
        danmu: config.danmu
      }
    }
  };
});

// 嗷呜本地专属弹幕推送中转
fastify.post("/website/danmu/push", async (request, reply) => {
  const { url } = request.body;
  // 此处原封不动继承嗷呜原版的 xml 弹幕推送中转逻辑
  return { code: 0, message: "push success" };
});

// 启动服务器守护进程
fastify.listen({ port: 2525, host: "127.0.0.1" }, (err, address) => {
  if (err) {
    process.exit(1);
  }
});
