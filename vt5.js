// Super Vtrahe Engine-Level Production Script
// URL: https://super.vtrahe.to/

const $base_url = 'https://super.vtrahe.to'
const $headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Referer': `${$base_url}/`,
}

const cheerio = createCheerio()

// 1. 固定底层静态 Tabs，避免初始化时请求首页被五秒盾彻底卡死
async function getConfig() {
    return jsonify({
        ver: 1,
        title: 'Super Vtrahe',
        site: $base_url,
        tabs: [
            { name: '最新 (最新)', ext: { id: '/' } },
            { name: 'Русское (俄语)', ext: { id: '/categories/russkoe/' } },
            { name: 'Зрелые (成熟)', ext: { id: '/categories/zrelye/' } }
        ],
    })
}

// 2. 自适应穿透流媒体卡片抓取
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
        
        // 核心提取 A 标签内嵌图片算法
        $('a').each((_, el) => {
            const a = $(el)
            const href = a.attr('href') || ''
            const img = a.find('img').first()
            
            if (href && img.length > 0) {
                if (href === '/' || href.includes('/categories/') || href.includes('javascript:')) return
                
                const title = img.attr('alt') || img.attr('title') || a.text().trim() || '高清内容'
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

        // 成人类网站瀑布流容器特征名兜底泛解析
        if (list.length === 0) {
            $('.video-item, .post, .thumb, .item, .video-thumb, [class*="video"], [class*="post"]').each((_, el) => {
                const item = $(el)
                const a = item.find('a').first()
                const img = item.find('img').first()
                const href = a.attr('href')
                if (href) {
                    const fullHref = href.startsWith('http') ? href : `${$base_url}${href}`
                    list.push({
                        vod_id: fullHref,
                        vod_name: img.attr('alt') || img.attr('title') || item.text().trim() || '高清内容',
                        vod_pic: img.attr('data-src') || img.attr('src') || '',
                        ext: { url: fullHref }
                    })
                }
            })
        }
        
        // 🚨 终极杀招：如果由于防护盾导致后台抓取列表依然为空，直接触发 XPTV 的页面重载与内核嗅探机制
        if (list.length === 0 && page === 1) {
            list.push({
                vod_id: url,
                vod_name: '⚠️ 正在破盾加载，请点击此项直接进入',
                vod_pic: 'https://img.icons8.com/clouds/200/shield.png',
                ext: { url: url }
            })
        }
        
        return jsonify({ list })
    } catch (e) {
        return jsonify({ list: [] })
    }
}

// 3. 关联播放轨道
async function getTracks(ext) {
    const args = argsify(ext)
    const { url } = args
    if (!url) return jsonify({ code: 0, msg: 'Missing URL' })

    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        const $ = cheerio.load(html)
        const title = $('h1').first().text().trim() || $('title').text().trim() || '原画正片'
        
        // 生成独立极速播放通道
        const tracks = [{ name: '⚡ 独立 CDN 原画直连播放', url: url }]
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

// 4. 重构核心：完美吃掉你提供给我的独立 vstor.top MP4 直链
async function getPlayinfo(ext) {
    const args = argsify(ext)
    const url = args.url
    if (!url) return jsonify({ urls: [] })

    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        
        // 精准过滤匹配你给我的真实的那个带有时效签名加密Token的 vstor.top MP4 视频直链
        const mp4Match = html.match(/(https?:\/\/[^\s"'`<>]+?\.vstor\.[^\s"'`<>]*?\.mp4[^\s"'`<>]*)/i)
        if (mp4Match) {
            return jsonify({
                urls: [mp4Match[1]],
                headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
            })
        }
        
        // 泛解析匹配可能存在的其他普通 MP4 直链节点
        const generalMp4Match = html.match(/(https?:\/\/[^\s"'`<>]+?\.(?:mp4|m3u8)[^\s"'`<>]*)/i)
        if (generalMp4Match) {
            return jsonify({
                urls: [generalMp4Match[1]],
                headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
            })
        }
        
        // 如果网站的 JS 混淆级别极高，直接交由 XPTV 原生内置浏览器组件在系统底层强制拦截流媒体数据包
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
