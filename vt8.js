// Super Vtrahe Native WebView Penetration Script
// URL: https://super.vtrahe.to/

const $base_url = 'https://super.vtrahe.to'
const $headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Referer': `${$base_url}/`,
}

const cheerio = createCheerio()

// 1. 初始化全静态配置，杜绝请求被防火墙卡死导致白屏
async function getConfig() {
    return jsonify({
        ver: 1,
        title: 'Super Vtrahe',
        site: $base_url,
        tabs: [
            { name: '最新', ext: { id: '/' } },
            { name: 'Русское (俄语)', ext: { id: '/categories/russkoe/' } },
            { name: 'Зрелые (成熟)', ext: { id: '/categories/zrelye/' } }
        ],
    })
}

// 2. 自适应流媒体列表抓取：如果后台直接获取为空，给用户提供一条可以手动点击的“破盾通道”
async function getCards(ext) {
    ext = argsify(ext)
    const { id = '/', page = 1 } = ext
    
    let url = id.startsWith('http') ? id : `${$base_url}${id}`
    if (page > 1) {
        url = url.includes('?') ? `${url}&page=${page}` : `${url.replace(/\/$/, '')}/page/${page}/`
    }
    
    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        const $ = cheerio.load(html)
        const list = []
        
        $('a').each((_, el) => {
            const a = $(el)
            const href = a.attr('href') || ''
            const img = a.find('img').first()
            
            if (href && img.length > 0) {
                if (href === '/' || href.includes('/categories/') || href.includes('javascript:')) return
                
                const title = img.attr('alt') || img.attr('title') || a.text().trim() || '高清内容'
                const pic = img.attr('data-src') || img.attr('data-original') || img.attr('src') || ''
                const fullHref = href.startsWith('http') ? href : `${$base_url}${href}`
                
                if (!list.some(item => item.vod_id === fullHref)) {
                    list.push({
                        vod_id: fullHref,
                        vod_name: title,
                        vod_pic: pic,
                        ext: { url: fullHref }
                    })
                }
            }
        })

        // 🚨 黄金关键：如果被高强度的盾拦截返回了空列表，直接下发可以让 XPTV 强制调起 WebView 的卡片
        if (list.length === 0) {
            list.push({
                vod_id: url,
                vod_name: '进入自动破盾播放（若有防爬提示请手动在网页验证）',
                vod_pic: 'https://img.icons8.com/clouds/200/play.png',
                ext: { url: url }
            })
        }
        
        return jsonify({ list })
    } catch (e) {
        return jsonify({ list: [] })
    }
}

// 3. 关联播放线路
async function getTracks(ext) {
    const args = argsify(ext)
    const { url } = args
    if (!url) return jsonify({ code: 0, msg: 'Missing URL' })

    // 这里使用系统的内置浏览器拦截嗅探配置
    const tracks = [{
        name: '🚀 强效 WebView 内核嗅探（过5秒盾专用）', 
        url: url,
        // 传递一个参数，告诉 getPlayinfo 这个链接需要被全面解密
        ext: { use_webview: true } 
    }]

    return jsonify({
        code: 1,
        msg: 'success',
        id: url,
        title: '高清视频正片',
        list: [{ title: '播放线路', tracks }],
    })
}

// 4. 【终极核心】让 XPTV 原生组件接管网络包，提取真实的 vstor.top 直链
async function getPlayinfo(ext) {
    const args = argsify(ext)
    const url = args.url
    if (!url) return jsonify({ urls: [] })

    // 🚨 终极核武器：在这里配置特殊的指令，告诉 XPTV 客户端：
    // “不要在后台用代码去请求了，直接拉起一个带 JS 执行能力的 WebView 系统浏览器组件去加载这个网页！”
    // 只要系统浏览器开始加载页面并自动通过了网站的 DDoS 防火墙，底层的原生多媒体框架就会嗅探并接管你之前抓到的那个
    // "https://d2.vstor.top/whpvid/.../*.mp4" 直链，从而直接在软件里开始满速播放。
    return jsonify({
        urls: [url],
        parse: 1, // 激活 XPTV 内置的深度解析器
        encrypt: 3, // 核心机制：强制使用客户端内置的浏览器（WebView）嗅探模式
        headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
    })
}

async function search(ext) {
    return jsonify({ code: 1, list: [] })
}
