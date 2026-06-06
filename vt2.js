// Super Vtrahe Video-Direct XPTV Source
// URL: https://super.vtrahe.to/

const $base_url = 'https://super.vtrahe.to'
const $headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer': `${$base_url}/`,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
}

const cheerio = createCheerio()

// 1. 获取全自动嗅探分类
async function getConfig() {
    let tabs = [{ name: '最新', ext: { id: '/' } }]
    try {
        const { data: html = '' } = await $fetch.get($base_url, { headers: $headers })
        const $ = cheerio.load(html)
        const discoveredTabs = []
        
        $('a').each((_, el) => {
            const href = $(el).attr('href') || ''
            const text = $(el).text().trim()
            
            if (href && text && text.length <= 15 && !text.includes('首页') && !text.includes('登录')) {
                if (href.startsWith('/') || href.includes($base_url)) {
                    const cleanHref = href.replace($base_url, '')
                    if (cleanHref && cleanHref !== '/' && !discoveredTabs.some(t => t.ext.id === cleanHref)) {
                        discoveredTabs.push({ name: text, ext: { id: cleanHref } })
                    }
                }
            }
        })
        if (discoveredTabs.length > 0) tabs = discoveredTabs.slice(0, 12)
    } catch (e) {
        tabs = [
            { name: 'Русское (俄语)', ext: { id: '/categories/russkoe/' } },
            { name: 'Зрелые (成熟)', ext: { id: '/categories/zrelye/' } }
        ]
    }
    return jsonify({ ver: 1, title: 'Super Vtrahe', site: $base_url, tabs })
}

// 2. 自适应流媒体列表抓取（解决加载空内容问题）
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
        
        // 策略A：地毯式扫描所有内嵌海报图的超链接
        $('a').each((_, el) => {
            const a = $(el)
            const href = a.attr('href') || ''
            const img = a.find('img').first()
            
            if (href && img.length > 0) {
                if (href === '/' || href.includes('/categories/') || href.includes('javascript:')) return
                
                const title = img.attr('alt') || img.attr('title') || a.text().trim() || '精彩内容'
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

        // 策略B：如果没有抓到，针对成人站特有的网格包装容器强行提取
        if (list.length === 0) {
            $('.video-item, .post, .thumb, .item, .col-6, .video-thumb, [class*="video"]').each((_, el) => {
                const item = $(el)
                const a = item.find('a').first()
                const img = item.find('img').first()
                const href = a.attr('href')
                if (href) {
                    list.push({
                        vod_id: href.startsWith('http') ? href : `${$base_url}${href}`,
                        vod_name: img.attr('alt') || img.attr('title') || item.text().trim() || '精彩内容',
                        vod_pic: img.attr('data-src') || img.attr('src') || '',
                        ext: { url: href.startsWith('http') ? href : `${$base_url}${href}` }
                    })
                }
            })
        }
        return jsonify({ list })
    } catch (e) {
        return jsonify({ list: [] })
    }
}

// 3. 剧集列表与正片绑定
async function getTracks(ext) {
    const args = argsify(ext)
    const { url } = args
    if (!url) return jsonify({ code: 0, msg: 'Missing URL' })

    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        const $ = cheerio.load(html)
        const title = $('h1').first().text().trim() || $('title').text().trim() || '播放正片'
        
        // 直接将带有临时Token的详情页丢给 getPlayinfo 去抓最新的直链
        const tracks = [{ name: '立即播放高清原画', url: url }]
        return jsonify({
            code: 1,
            msg: 'success',
            id: url,
            title,
            list: [{ title: '高清原画线路', tracks }],
        })
    } catch (e) {
        return jsonify({ code: 0, msg: e.toString() })
    }
}

// 4. 重磅修正：独立 CDN 的 MP4 视频直链深度嗅探
async function getPlayinfo(ext) {
    const args = argsify(ext)
    const url = args.url
    if (!url) return jsonify({ urls: [] })

    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        
        // 【核心优化】基于你提供的真实 CDN 地址特征 (vstor.top 且包含 .mp4) 构建的精准匹配正则
        const mp4Match = html.match(/(https?:\/\/[^\s"'`<>]+?\.vstor\.(?:top|com|net)[^\s"'`<>]*?\.mp4[^\s"'`<>]*)/i)
        
        if (mp4Match) {
            return jsonify({
                urls: [mp4Match[1]],
                headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
            })
        }
        
        // 兜底方案：如果服务节点更换，匹配任何带 Token 签名的独立 MP4 直链
        const generalMp4Match = html.match(/(https?:\/\/[^\s"'`<>]+?\.(?:mp4)[^\s"'`<>]*)/i)
        if (generalMp4Match) {
            return jsonify({
                urls: [generalMp4Match[1]],
                headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
            })
        }
        
        // 如果依然无法提取（存在混淆），交由 XPTV 自带浏览器内核强制拦截嗅探
        return jsonify({
            urls: [url],
            headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
        })
    } catch (e) {
        return jsonify({ urls: [url] })
    }
}

// 5. 搜索功能
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
