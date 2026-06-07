// Super Vtrahe Wordpess-Based Video Source
// URL: https://super.vtrahe.to/

const $base_url = 'https://super.vtrahe.to'
const $headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer': `${$base_url}/`,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
}

const cheerio = createCheerio()

// 1. 根据真实的 WordPress 路由机制配置分类，确保直达内容，绝不白屏
async function getConfig() {
    return jsonify({
        ver: 1,
        title: 'Super Vtrahe',
        site: $base_url,
        tabs: [
            { name: '最新发布', ext: { id: '/' } },
            { name: 'Русское (俄语)', ext: { id: '/category/russkoe/' } },
            { name: 'Зрелые (成熟)', ext: { id: '/category/zrelye/' } },
            { name: 'Русское (标签兜底)', ext: { id: '/tag/russkoe/' } }
        ],
    })
}

// 2. 针对 WordPress 视频排版架构的卡片抓取
async function getCards(ext) {
    ext = argsify(ext)
    const { id = '/', page = 1 } = ext
    
    let url = id.startsWith('http') ? id : `${$base_url}${id}`
    // WordPress 标准的分页路由通常是 /page/2/
    if (page > 1) {
        url = `${url.replace(/\/$/, '')}/page/${page}/`
    }
    
    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        const $ = cheerio.load(html)
        const list = []
        
        // 核心提取：扫描 WordPress 文章网格中特有的详情页 URL 特征（包含年份数字路径）
        $('a').each((_, el) => {
            const a = $(el)
            const href = a.attr('href') || ''
            const img = a.find('img').first()
            
            if (href && img.length > 0) {
                // 精准过滤：只有包含完整年份数字（如 /2026/ 或 /2025/）的链接才是真正的视频详情页
                if (/\/\d{4}\/\d{2}\/\d{2}\//.test(href) || href.endsWith('.html')) {
                    
                    const title = img.attr('alt') || img.attr('title') || a.text().trim() || '精彩视频'
                    const pic = img.attr('data-src') || img.attr('data-original') || img.attr('src') || ''
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
            }
        })

        // 兜底提取：如果未触发正则，则对主流 WP 视频主题的 class（.post, .video-block）进行地毯式扫描
        if (list.length === 0) {
            $('article, .post, .pin-item, .video-item').each((_, el) => {
                const item = $(el)
                const a = item.find('a').first()
                const img = item.find('img').first()
                const href = a.attr('href')
                
                if (href && href !== '#') {
                    const fullHref = href.startsWith('http') ? href : `${$base_url}${href}`
                    list.push({
                        vod_id: fullHref,
                        vod_name: img.attr('alt') || img.attr('title') || item.text().trim() || '精彩视频',
                        vod_pic: img.attr('data-src') || img.attr('src') || '',
                        ext: { url: fullHref }
                    })
                }
            })
        }
        return jsonify({ list })
    } catch (e) {
        return jsonify({ list: [] })
    }
}

// 3. 解析播放列表（直通你给出的详情页）
async function getTracks(ext) {
    const args = argsify(ext)
    const { url } = args
    if (!url) return jsonify({ code: 0, msg: 'Missing URL' })

    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        const $ = cheerio.load(html)
        
        // 获取页面标题
        const title = $('.entry-title').first().text().trim() || $('h1').first().text().trim() || $('title').text().trim()
        
        // 直接将当前详情页丢作为播放源轨道
        const tracks = [{ name: '立即播放高清 MP4 直链', url: url }]
        return jsonify({
            code: 1,
            msg: 'success',
            id: url,
            title,
            list: [{ title: '云点播独家线路', tracks }],
        })
    } catch (e) {
        return jsonify({ code: 0, msg: e.toString() })
    }
}

// 4. 底层视频流提取：无缝接入 vstor.top 的 MP4 提取技术
async function getPlayinfo(ext) {
    const args = argsify(ext)
    const url = args.url
    if (!url) return jsonify({ urls: [] })

    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        
        // 核心：精准捕捉你之前抓到的 `vstor.top` 后端独立 CDN 的原生 MP4 视频流链接
        const vstorMatch = html.match(/(https?:\/\/[^\s"'`<>]+?\.vstor\.[^\s"'`<>]*?\.mp4[^\s"'`<>]*)/i)
        if (vstorMatch) {
            return jsonify({
                urls: [vstorMatch[1]],
                headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
            })
        }
        
        // 泛匹配：如果没有命中 vstor 节点，捕获页面内任何形式的独立加密 MP4 静态直链
        const generalMp4Match = html.match(/(https?:\/\/[^\s"'`<>]+?\.(?:mp4)[^\s"'`<>]*)/i)
        if (generalMp4Match) {
            return jsonify({
                urls: [generalMp4Match[1]],
                headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
            })
        }
        
        // 终极兜底：丢给 XPTV 系统层原生组件强制拦截
        return jsonify({
            urls: [url],
            headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
        })
    } catch (e) {
        return jsonify({ urls: [url] })
    }
}

// 5. WP 标准搜索
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
            if (href && img.length > 0 && /\/\d{4}\/\d{2}\/\d{2}\//.test(href)) {
                const title = img.attr('alt') || a.text().trim()
                list.push({
                    vod_id: href,
                    vod_name: title,
                    vod_pic: img.attr('src') || '',
                    ext: { url: href.startsWith('http') ? href : `${$base_url}${href}` }
                })
            }
        })
        return jsonify({ code: 1, list })
    } catch (e) {
        return jsonify({ code: 0, list: [] })
    }
}
