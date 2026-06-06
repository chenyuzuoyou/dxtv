// 2Super Vtrahe Dynamic Sniffer Script
// URL: https://super.vtrahe.to/

const $base_url = 'https://super.vtrahe.to'
const $headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Referer': `${$base_url}/`,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
}

const cheerio = createCheerio()

// 1. 动态嗅探网站真实的分类与对应的链接
async function getConfig() {
    let tabs = [{ name: '最新', ext: { id: '/' } }]
    try {
        const { data: html = '' } = await $fetch.get($base_url, { headers: $headers })
        const $ = cheerio.load(html)
        const discoveredTabs = []
        
        // 动态抓取页面中所有的导航链接
        $('a').each((_, el) => {
            const href = $(el).attr('href') || ''
            const text = $(el).text().trim()
            
            // 过滤：提取包含俄语/各类分类特征的菜单项，且排除非分类链接
            if (href && text && text.length <= 15 && !text.includes('首页') && !text.includes('登录')) {
                // 确保是本站相对路径或绝对路径
                if (href.startsWith('/') || href.includes($base_url)) {
                    const cleanHref = href.replace($base_url, '')
                    if (cleanHref && cleanHref !== '/' && !discoveredTabs.some(t => t.ext.id === cleanHref)) {
                        discoveredTabs.push({ name: text, ext: { id: cleanHref } })
                    }
                }
            }
        })
        if (discoveredTabs.length > 0) tabs = discoveredTabs.slice(0, 12) // 最多加载前12个真实分类
    } catch (e) {
        // 兜底静态数据
        tabs = [
            { name: 'Русское', ext: { id: '/categories/russkoe/' } },
            { name: 'Зрелые', ext: { id: '/categories/zrelye/' } }
        ]
    }

    return jsonify({ ver: 1, title: 'Super Vtrahe', site: $base_url, tabs })
}

// 2. 动态抓取对应分类下的海报
async function getCards(ext) {
    ext = argsify(ext)
    const { id = '/', page = 1 } = ext
    
    // 自动适配动态链接的分页
    let url = id.startsWith('http') ? id : `${$base_url}${id}`
    if (page > 1) {
        url = url.includes('?') ? `${url}&page=${page}` : `${url.replace(/\/$/, '')}/page/${page}/`
    }
    
    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        const $ = cheerio.load(html)
        const list = []
        
        // 核心提取算法：扫描所有包含图片的 A 标签
        $('a').each((_, el) => {
            const a = $(el)
            const href = a.attr('href') || ''
            const img = a.find('img').first()
            
            if (href && img.length > 0) {
                // 排除主页和分类自身链接
                if (href === '/' || href.includes('/categories/') || href.includes('javascript:')) return
                
                const title = img.attr('alt') || img.attr('title') || a.text().trim() || 'Video'
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

        // 兜底方案：针对成人网站常用的传统 grid / block 布局类名进行强制提取
        if (list.length === 0) {
            $('.video-item, .post, .thumb, .item, .col-6, .video-thumb').each((_, el) => {
                const item = $(el)
                const a = item.find('a').first()
                const img = item.find('img').first()
                const href = a.attr('href')
                if (href) {
                    list.push({
                        vod_id: href.startsWith('http') ? href : `${$base_url}${href}`,
                        vod_name: img.attr('alt') || img.attr('title') || item.text().trim() || 'Video',
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

// 3. 解析播放列表
async function getTracks(ext) {
    const args = argsify(ext)
    const { url } = args
    if (!url) return jsonify({ code: 0, msg: 'Missing URL' })

    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        const $ = cheerio.load(html)
        const title = $('h1').first().text().trim() || $('title').text().trim() || '播放正片'
        
        const tracks = [{ name: '立即播放', url: url }]
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

// 4. 解析底层真实流媒体链接
async function getPlayinfo(ext) {
    const args = argsify(ext)
    const url = args.url
    if (!url) return jsonify({ urls: [] })

    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        
        // 扫描页面所有源码，提取隐藏的 m3u8 或 mp4 直链
        const streamMatch = html.match(/(https?:\/\/[^\s"'`<>]+?\.(?:m3u8|mp4)[^\s"'`<>]*)/i)
        if (streamMatch) {
            return jsonify({
                urls: [streamMatch[1]],
                headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
            })
        }
        
        // 如果提取不到，则直接交由内核代理嗅探
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
