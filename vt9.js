// Super Vtrahe Ultimate WebView Shell Script
// URL: https://super.vtrahe.to/

const $base_url = 'https://super.vtrahe.to'
const $headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Referer': `${$base_url}/`,
}

const cheerio = createCheerio()

// 1. 初始化静态配置，彻底避免因为首页五秒盾导致软件初始化白屏
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

// 2. 流媒体列表抓取：如果后台无权访问，提供可直达的破盾播放通道
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

        // 🚨 关键：如果由于五秒盾拦截导致抓回的数据为空，直接下发无条件信任的强制嗅探卡片
        if (list.length === 0) {
            list.push({
                vod_id: url,
                vod_name: '进入自动破盾播放（若提示防爬，请在弹出的网页内验证）',
                vod_pic: 'https://img.icons8.com/clouds/200/play.png',
                ext: { url: url }
            })
        }
        
        return jsonify({ list })
    } catch (e) {
        return jsonify({ list: [] })
    }
}

// 3. 将卡片与播放轨道绑定
async function getTracks(ext) {
    const args = argsify(ext)
    const { url } = args
    if (!url) return jsonify({ code: 0, msg: 'Missing URL' })

    const tracks = [{
        name: '🔥 WebView 强效网页嗅探（破盾原画专线）', 
        url: url
    }]

    return jsonify({
        code: 1,
        msg: 'success',
        id: url,
        title: '原画视频正片',
        list: [{ title: '播放线路', tracks }],
    })
}

// 4. 【核心重构】唤醒系统级真实 WebView，彻底拔掉防爬盾并拦截视频
async function getPlayinfo(ext) {
    const args = argsify(ext)
    const url = args.url
    if (!url) return jsonify({ urls: [] })

    // 🚨 终极解决方案：通过配置标准的 webview 模式
    // 强制 XPTV 不使用后台爬虫代码，而是调起一个真正带有 JS 渲染和执行能力的内置浏览器
    // 这时系统内核会自动去过 DDoS-Guard / Cloudflare 五秒盾。
    // 如果网页卡住提示“人机验证”，你只需要在弹出的网页中手动勾选或点击，
    // 验证一旦成功，网页内的播放器就会下发你之前抓到的那个 "*.vstor.top/.../*.mp4" 直链，
    // XPTV 会瞬间拦截该网络包并自动切换到原生的全屏播放器进行播放。
    return jsonify({
        urls: [url],
        webview: true, // 强制唤醒全功能内置浏览器内核
        type: 'video', // 拦截目标为视频流
        headers: {
            'User-Agent': $headers['User-Agent'],
            'Referer': `${$base_url}/`
        }
    })
}

async function search(ext) {
    return jsonify({ code: 1, list: [] })
}
