// Super Vtrahe Raw Penetration Source
// URL: https://super.vtrahe.to/

const $base_url = 'https://super.vtrahe.to'
const $headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer': `${$base_url}/`,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

const cheerio = createCheerio()

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
        
        // 尝试抓取基础卡片布局
        $('a').each((_, el) => {
            const a = $(el)
            const href = a.attr('href') || ''
            const img = a.find('img').first()
            
            if (href && img.length > 0) {
                if (href === '/' || href.includes('/categories/') || href.includes('javascript:')) return
                
                const title = img.attr('alt') || img.attr('title') || a.text().trim() || '观看视频'
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

        // 🚨 终极降级策略：如果被盾拦截返回空，我们直接提供一个【强制跳转真实网页】的无盾卡片
        if (list.length === 0) {
            list.push({
                vod_id: url,
                vod_name: '点此播放（如提示防爬，请在弹出的网页内滑块验证）',
                vod_pic: 'https://img.icons8.com/clouds/200/play.png',
                ext: { url: url }
            })
        }
        
        return jsonify({ list })
    } catch (e) {
        return jsonify({ list: [] })
    }
}

async function getTracks(ext) {
    const args = argsify(ext)
    const { url } = args
    if (!url) return jsonify({ code: 0, msg: 'Missing URL' })

    // 绕过繁琐的标题查找，直接下发原始页面轨道，避免因为找不到网页标题而报错卡死
    const tracks = [{ name: '▶️ 高清路线（独立解码）', url: url }]
    return jsonify({
        code: 1,
        msg: 'success',
        id: url,
        title: '视频正片',
        list: [{ title: '播放源', tracks }],
    })
}

async function getPlayinfo(ext) {
    const args = argsify(ext)
    const url = args.url
    if (!url) return jsonify({ urls: [] })

    try {
        const { data: html = '' } = await $fetch.get(url, { headers: $headers })
        
        // 精准捕捉你提供过的那个含有 Token 签名的 vstor.top CDN 独立 MP4 直链
        const mp4Match = html.match(/(https?:\/\/[^\s"'`<>]+?\.vstor\.[^\s"'`<>]*?\.mp4[^\s"'`<>]*)/i)
        if (mp4Match) {
            return jsonify({
                urls: [mp4Match[1]],
                headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
            })
        }
        
        // 泛提取：只要页面上出现任何 mp4/m3u8 链接全部暴力捕获
        const generalMatch = html.match(/(https?:\/\/[^\s"'`<>]+?\.(?:mp4|m3u8)[^\s"'`<>]*)/i)
        if (generalMatch) {
            return jsonify({
                urls: [generalMatch[1]],
                headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
            })
        }
    } catch (e) {}

    // 【致命一击】如果上面代码都没拿到直链（因为网站盾还没过），直接把当前播放页面丢给 XPTV 系统引擎。
    // 这时候 XPTV 播放器会强制拉起一个内置浏览器弹窗，如果遇到人机验证，你就手动在弹窗里点一下（比如滑块），
    // 只要你验证通过，网站就会释放你发给我的那个 `.mp4` 文件，播放器侦测到后就会自动开始播放。
    return jsonify({
        urls: [url],
        headers: [{ 'User-Agent': $headers['User-Agent'], 'Referer': `${$base_url}/` }]
    })
}

async function search(ext) {
    const args = argsify(ext)
    const keyword = args.text || ''
    if (!keyword) return jsonify({ code: 0, msg: 'Missing keyword' })

    return jsonify({ code: 1, list: [] })
}
