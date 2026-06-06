// Super Vtrahe Custom Production Script
// URL: https://super.vtrahe.to/

const $base_url = 'https://super.vtrahe.to'
const $headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Referer': `${$base_url}/`,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
}

const cheerio = createCheerio()

// 1. 根据你的截图直接配置站点分类
async function getConfig() {
    return jsonify({
        ver: 1,
        title: 'Super Vtrahe',
        site: $base_url,
        tabs: [
            { name: 'Русское (俄语)', ext: { id: 'russkoe' } },
            { name: 'Зрелые (成熟)', ext: { id: 'zrelye' } },
            { name: '最新', ext: { id: 'latest' } }
        ],
    })
}

// 2. 精准匹配该站点的海报数据流
async function getCards(ext) {
    ext = argsify(ext)
    const { id = 'russkoe', page = 1 } = ext
    
    // 自动适配分类URL路径（支持形如 /russkoe/ 或 /russkoe/page/2）
    const cleanId = id.replace(/^\/|\/$/g, '')
    const url = page > 1 ? `${$base_url}/${cleanId}/page/${page}/` : `${$base_url}/${cleanId}/`
    
    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        const $ = cheerio.load(html)
        const list = []
        
        // 针对该类成人站点的常见通用DOM容器及各种变体懒加载属性进行全面捕获
        $('a').each((_, el) => {
            const a = $(el)
            const href = a.attr('href') || ''
            const img = a.find('img').first()
            
            if (href && img.length > 0) {
                // 过滤掉非视频播放页的链接
                if (href === '/' || href.includes('/category/') || href.includes('javascript:')) return
                
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

        // 如果上述通用方案未抓到，则启用特征明显的成人网格布局类名（.video-item / .post / .thumb）进行二次兜底
        if (list.length === 0) {
            $('.video-item, .post, .thumb, .item').each((_, el) => {
                const item = $(el)
                const a = item.find('a').first()
                const img = item.find('img').first()
                const href = a.attr('href')
                if (href) {
                    list.push({
                        vod_id: href.startsWith('http') ? href : `${$base_url}${href}`,
                        vod_name: img.attr('alt') || item.text().trim() || 'Video',
                        vod_pic: img.attr('data-src') || img.attr('src') || '',
                        ext: { url: href.startsWith('http') ? href : `${$base_url}${href}` }
                    })
                }
            })
        }

        return jsonify({ list })
    } catch (e) {
        return jsonify({ list: [], msg: e.toString() })
    }
}

// 3. 获取播放线路（直达正片）
async function getTracks(ext) {
    const args = argsify(ext)
    const { url } = args
    if (!url) return jsonify({ code: 0, msg: 'Missing URL' })

    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        const $ = cheerio.load(html)
        
        const title = $('h1').first().text().trim() || $('title').text().trim() || '播放正片'
        
        // 直接将当前处理完毕的页面丢作为正片播放轨
        const tracks = [{ name: '立即播放', url: url }]

        return jsonify({
            code: 1,
            msg: 'success',
            id: url,
            title,
            list: [{ title: '默认播放源', tracks }],
        })
    } catch (e) {
        return jsonify({ code: 0, msg: e.toString() })
    }
}

// 4. 解析底层真实视频流（.m3u8/.mp4）
async function getPlayinfo(ext) {
    const args = argsify(ext)
    const url = args.url
    if (!url) return jsonify({ urls: [] })

    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        
        // 强力正则表达式：提取网页源码中隐藏在 JavaScript 变量或 iframe 里的所有流媒体文件
        const streamMatch = html.match(/(https?:\/\/[^\s"'`<>]+?\.(?:m3u8|mp4)[^\s"'`<>]*)/i)
        
        if (streamMatch) {
            return jsonify({
                urls: [streamMatch[1]],
                headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
            })
        }
        
        // 如果网页使用了高级加密防爬播放器，则返回原网页让 XPTV 内置浏览器内核进行拦截和嗅探
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
                if (title) {
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
