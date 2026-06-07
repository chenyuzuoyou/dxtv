// Super Vtrahe Web-Core Production Script
// URL: https://super.vtrahe.to/

const $base_url = 'https://super.vtrahe.to'
const $headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Referer': `${$base_url}/`
}

const cheerio = createCheerio()

// 1. 初始化静态配置，防止初始请求因为五秒盾直接卡住
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

// 2. 针对 DDoS-Guard 的流媒体列表捕获机制
async function getCards(ext) {
    ext = argsify(ext)
    const { id = '/', page = 1 } = ext
    
    let url = id.startsWith('http') ? id : `${$base_url}${id}`
    if (page > 1) {
        url = url.includes('?') ? `${url}&page=${page}` : `${url.replace(/\/$/, '')}/page/${page}/`
    }
    
    try {
        // 请求底层页面结构
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        const $ = cheerio.load(html)
        const list = []
        
        // 基于图片及 A 标签的通用流媒体网格节点提取
        $('a').each((_, el) => {
            const a = $(el)
            const href = a.attr('href') || ''
            const img = a.find('img').first()
            
            if (href && img.length > 0) {
                if (href === '/' || href.includes('/categories/') || href.includes('javascript:')) return
                
                const title = img.attr('alt') || img.attr('title') || a.text().trim() || '高清资源'
                const pic = img.attr('data-src') || img.attr('data-original') || img.attr('data-lazy-src') || img.attr('src') || ''
                const fullHref = href.startsWith('http') ? href : `${$base_url}${href}`
                
                if (!list.some(item => item.vod_id === fullHref)) {
                    list.push({
                        vod_id: fullHref,
                        vod_name: title,
                        vod_pic: pic,
                        ext: { id: fullHref, url: fullHref }
                    })
                }
            }
        })

        // 若直接提取失败（由于盾拦截返回了验证页），下发能触发 XPTV 内置浏览器直接穿透的入口卡片
        if (list.length === 0) {
            list.push({
                vod_id: url,
                vod_name: '👉【点击此项】进入内置浏览器，完成5秒防爬验证 👈',
                vod_pic: 'https://img.icons8.com/clouds/200/shield.png',
                ext: { url: url }
            })
        }
        
        return jsonify({ list })
    } catch (e) {
        return jsonify({ list: [] })
    }
}

// 3. 关联详情页与播放线路
async function getTracks(ext) {
    const args = argsify(ext)
    const { url } = args
    if (!url) return jsonify({ code: 0, msg: 'Missing URL' })

    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        const $ = cheerio.load(html)
        const title = $('h1').first().text().trim() || $('title').text().trim() || '高清内容'
        
        // 将视频节点交给内置核心处理
        const tracks = [{ name: '🎬 原画无损直连通道', url: url }]
        return jsonify({
            code: 1,
            msg: 'success',
            id: url,
            title,
            list: [{ title: '播放线路', tracks }],
        })
    } catch (e) {
        return jsonify({ code: 0, msg: e.toString() })
    }
}

// 4. 重大核心修复：通过内置 WebView 原生接管，完成防爬盾环境初始化与 MP4 直链劫持
async function getPlayinfo(ext) {
    const args = argsify(ext)
    const url = args.url
    if (!url) return jsonify({ urls: [] })

    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        
        // 1. 尝试直接匹配你发给我的 vstor.top CDN 的加密 MP4 视频直链
        const mp4Match = html.match(/(https?:\/\/[^\s"'`<>]+?\.vstor\.[^\s"'`<>]*?\.mp4[^\s"'`<>]*)/i)
        if (mp4Match) {
            return jsonify({
                urls: [mp4Match[1]],
                headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
            })
        }
        
        // 2. 通用 MP4/M3U8 格式规则捕获
        const generalMp4Match = html.match(/(https?:\/\/[^\s"'`<>]+?\.(?:mp4|m3u8)[^\s"'`<>]*)/i)
        if (generalMp4Match) {
            return jsonify({
                urls: [generalMp4Match[1]],
                headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
            })
        }
        
        // 🚨 3. 【极重要】如果后台由于未验证拿到验证页面，原样丢回网页：
        // 此时 XPTV 会在播放时拉起内置的 WebView 组件。WebView 会执行网页里的 JS。
        // 它过盾之后，底层网络链路上就会自动产生你抓到的那个 "d2.vstor.top/.../*.mp4" 数据包，播放器会瞬间捕获并开始播放。
        return jsonify({
            urls: [url],
            headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
        })
    } catch (e) {
        return jsonify({ urls: [url] })
    }
}

// 5. 搜索
async function search(ext) {
    const args = argsify(ext)
    const keyword = args.text || args.wd || ''
    if (!keyword) return jsonify({ code: 0, msg: 'Missing keyword' })

    const searchUrl = `${$base_url}/?s=${encodeURIComponent(keyword)}`
    try {
        const { data: html = '' } = await $fetch.get(searchUrl, { headers: $headers })
        const $ = cheerio.load(html)
        const list = []
        
        $('a').each((_, el) => {
            const a = $(el)
            const href = a.attr('href') || ''
            const img = a.find('img').first()
            if (href && img.length > 0) {
                const title = img.attr('alt') || a.text().trim()
                if (title && title.includes(keyword)) {
                    list.push({
                        vod_id: href,
                        vod_name: title,
                        vod_pic: img.attr('src') || '',
                        ext: { url: href.startsWith('http') ? href : `${$base_url}${href}` }
                    })
                }
            }
        })
        return jsonify({ code: 1, list })
    } catch (e) {
        return jsonify({ code: 0, list: [] })
    }
}
