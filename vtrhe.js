// Super Vtrahe Intelligent Adaptive XPTV Source
// URL: https://super.vtrahe.to/

const $base_url = 'https://super.vtrahe.to'
const $headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer': `${$base_url}/`,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
}

const cheerio = createCheerio()

// 1. 动态获取配置与分类
async function getConfig() {
    let tabs = [{ name: '首页', ext: { id: '/' } }]
    try {
        const { data: html = '' } = await $fetch.get($base_url, { headers: $headers })
        const $ = cheerio.load(html)
        const discoveredTabs = []
        
        // 智能嗅探导航栏中的分类链接
        $('a').each((_, el) => {
            const href = $(el).attr('href') || ''
            const text = $(el).text().trim()
            
            // 过滤出包含影视、分类、国家、类型的常见路由特征
            if (href && text && text.length <= 4 && !text.includes('首页') && !text.includes('登录')) {
                if (href.startsWith('/') || href.includes($base_url)) {
                    const id = href.replace($base_url, '')
                    if (id && id !== '/' && !discoveredTabs.some(t => t.ext.id === id)) {
                        discoveredTabs.push({ name: text, ext: { id: id } })
                    }
                }
            }
        })
        if (discoveredTabs.length > 0) tabs = discoveredTabs.slice(0, 8) // 最多取前8个有效分类
    } catch (e) {
        // 降级兜底方案
        tabs = [
            { name: '电影', ext: { id: '/movies' } },
            { name: '剧集', ext: { id: '/tv' } },
            { name: '最新', ext: { id: '/latest' } }
        ]
    }

    return jsonify({ ver: 1, title: 'Super Vtrahe', site: $base_url, tabs })
}

// 2. 自适应海报卡片抓取
async function getCards(ext) {
    ext = argsify(ext)
    let { id = '/', page = 1 } = ext
    
    // 分页路径自适应（支持 /page/2 或 ?page=2）
    let url = id.startsWith('http') ? id : `${$base_url}${id}`
    if (page > 1) {
        url = url.includes('?') ? `${url}&page=${page}` : `${url.replace(/\/$/, '')}/page/${page}`
    }
    
    const { data: html = '' } = await $fetch.get(url, { headers: $headers })
    const $ = cheerio.load(html)
    const list = []
    
    // 算法：寻找包含 <a> 且内含 <img> 的容器，通常影视站的海报都是这种结构
    $('a').each((_, el) => {
        const a = $(el)
        const href = a.attr('href') || ''
        const img = a.find('img').first()
        
        if (href && img.length > 0) {
            // 排除非详情页链接（如分类、关于、标签等）
            if (href.includes('javascript:') || href === '/' || href.includes('/category/')) return
            
            const title = img.attr('alt') || img.attr('title') || a.text().trim() || '未命名影片'
            const pic = img.attr('data-src') || img.attr('data-original') || img.attr('src') || ''
            const fullHref = href.startsWith('http') ? href : `${$base_url}${href}`
            
            // 查重，避免同一个卡片因为多个链接重复添加
            if (title && !list.some(item => item.vod_id === fullHref)) {
                list.push({
                    vod_id: fullHref,
                    vod_name: title,
                    vod_pic: pic,
                    ext: { url: fullHref }
                })
            }
        }
    })

    return jsonify({ list })
}

// 3. 自适应剧集与正片嗅探
async function getTracks(ext) {
    const args = argsify(ext)
    const { url } = args
    if (!url) return jsonify({ code: 0, msg: 'Missing URL' })

    const { data: html = '' } = await $fetch.get(url, { headers: $headers })
    const $ = cheerio.load(html)
    
    const title = $('h1').first().text().trim() || $('title').text().replace(/-.*/, '').trim()
    const tracks = []
    
    // 策略A：寻找带有播放、集数、Episode、Server等关键词附近的链接
    $('a').each((_, el) => {
        const a = $(el)
        const href = a.attr('href') || ''
        const text = a.text().trim()
        
        if (href && (href.includes('/play/') || href.includes('watch') || /\d+/.test(text))) {
            if (text.length < 15) { // 过滤掉过长的描述文本
                const fullUrl = href.startsWith('http') ? href : `${$base_url}${href}`
                if (!tracks.some(t => t.url === fullUrl)) {
                    tracks.push({ name: text || `正片/第${tracks.length + 1}集`, url: fullUrl })
                }
            }
        }
    })

    // 策略B：如果在A中没找到（单片单页电影），直接将当前详情页作为播放页投喂
    if (tracks.length === 0) {
        tracks.push({ name: '正片', url: url })
    }

    return jsonify({
        code: 1,
        msg: 'success',
        id: url,
        title,
        list: [{ title: '智能解析线路', tracks }],
    })
}

// 4. 播放视频流解析
async function getPlayinfo(ext) {
    const args = argsify(ext)
    const url = args.url
    if (!url) return jsonify({ urls: [] })

    // 大多数影视站播放页会直接通过 iframe 或 script 载入 .m3u8/.mp4
    const { data: html = '' } = await $fetch.get(url, { headers: $headers })
    
    // 正则直接从源代码硬抽视频流媒体链接
    const m3u8Match = html.match(/(https?:\/\/[^\s"'`<>]+?\.(?:m3u8|mp4)[^\s"'`<>]*)/i)
    if (m3u8Match) {
        return jsonify({
            urls: [m3u8Match[1]],
            headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
        })
    }

    // 如果未在源码中直接发现流媒体，则原样丢给XPTV的内置内核去尝试抓包
    return jsonify({
        urls: [url],
        headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
    })
}

// 5. 搜索功能
async function search(ext) {
    const args = argsify(ext)
    const keyword = args.text || args.wd || ''
    if (!keyword) return jsonify({ code: 0, msg: 'Missing keyword' })

    // 影视站最通用的三种搜索路径变体格式尝试
    const searchUrls = [
        `${$base_url}/index.php/vod/search.html?wd=${encodeURIComponent(keyword)}`,
        `${$base_url}/search/${encodeURIComponent(keyword)}`,
        `${$base_url}/?s=${encodeURIComponent(keyword)}`
    ]
    
    let html = ''
    for (const sUrl of searchUrls) {
        try {
            const res = await $fetch.get(sUrl, { headers: $headers })
            if (res.data && res.data.includes(keyword)) {
                html = res.data
                break
            }
        } catch(e){}
    }

    const $ = cheerio.load(html || '')
    const list = []

    $('a').each((_, el) => {
        const a = $(el)
        const href = a.attr('href') || ''
        const img = a.find('img').first()
        if (href && img.length > 0 && !href.includes('/category/')) {
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
}
