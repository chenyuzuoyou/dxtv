const cheerio = createCheerio()

const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
}

let appConfig = {
    ver: 1,
    title: 'Super Vtrahe',
    site: 'https://super.vtrahe.to',
    tabs: [
        { name: '首页', ext: { id: 'home' } },
        { name: 'Full HD', ext: { id: 'fullhd', url: '/fullhd/' } },
        { name: '4K', ext: { id: '4k', url: '/ultra-hd-4k-porn/' } },
        { name: 'Азиатки', ext: { id: 'asian', url: '/aziatskoe-porno/' } },
        { name: 'Анал', ext: { id: 'anal', url: '/analnoe-porno/' } },
        { name: 'Большие сиськи', ext: { id: 'bigboobs', url: '/bolshie-siski/' } },
        { name: 'Русское', ext: { id: 'russian', url: '/russkoe-porno/' } },
        { name: 'Зрелые', ext: { id: 'mature', url: '/zrelye-zhenshhiny/' } },
    ],
}

async function getVideosByCategory(ext) {
    return await getCards(ext)
}

async function getConfig() {
    return jsonify(appConfig)
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    let page = parseInt(ext.page) || 1
    let baseUrl = ext.url ? `${appConfig.site}${ext.url}` : `${appConfig.site}/`

    let url = baseUrl
    if (page > 1) {
        url += `page/${page}/`
    }

    try {
        const { data } = await $fetch.get(url, { headers })

        // 强力匹配视频标题链接（根据网站实际HTML）
        let elems = $html.elements(data, 'a[href*="/20"]')  // 匹配年份格式的视频链接

        elems.forEach((el) => {
            let href = $html.attr(el, 'href')
            let title = $html.text(el).trim()

            if (href && title.length > 10) {   // 标题足够长才是视频
                if (!href.startsWith('http')) {
                    href = appConfig.site + (href.startsWith('/') ? '' : '/') + href
                }

                cards.push({
                    vod_id: href,
                    vod_name: title,
                    vod_pic: '',
                    vod_remarks: 'FULL HD',
                    ext: { url: href }
                })
            }
        })

        // 备用方案：抓取所有可能的大链接
        if (cards.length < 5) {
            elems = $html.elements(data, 'h2 a, .entry-title a, article a')
            elems.forEach((el) => {
                let href = $html.attr(el, 'href')
                let title = $html.text(el).trim()
                if (href && title.length > 15 && !cards.some(c => c.vod_name === title)) {
                    if (!href.startsWith('http')) href = appConfig.site + href
                    cards.push({
                        vod_id: href,
                        vod_name: title,
                        vod_pic: '',
                        vod_remarks: '',
                        ext: { url: href }
                    })
                }
            })
        }

    } catch (e) {
        console.error('getCards Error:', e)
    }

    return jsonify({ list: cards })
}

async function getTracks(ext) {
    ext = argsify(ext)
    let list = []
    let url = ext.url

    try {
        const { data } = await $fetch.get(url, { headers })
        let m3u8 = data.match(/https?:\/\/[^\s'"]+\.m3u8[^\s'"]*/i)?.[0] || url

        list.push({
            title: "默认线路",
            tracks: [{ name: "在线播放", ext: { url: m3u8 } }]
        })
    } catch (e) {}

    return jsonify({ list })
}

async function getPlayinfo(ext) {
    ext = argsify(ext)
    let url = ext.url
    try {
        const { data } = await $fetch.get(url, { headers })
        let m3u8 = data.match(/https?:\/\/[^\s'"]+\.m3u8[^\s'"]*/i)?.[0] || url
        return jsonify({ urls: [m3u8] })
    } catch (e) {
        return jsonify({ urls: [url] })
    }
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []
    let keyword = encodeURIComponent(ext.text || '')
    if (!keyword) return jsonify({ list: [] })

    const url = `${appConfig.site}/?s=${keyword}`

    try {
        const { data } = await $fetch.get(url, { headers })
        let elems = $html.elements(data, 'a[href*="/20"]')

        elems.forEach((el) => {
            let href = $html.attr(el, 'href')
            let title = $html.text(el).trim()
            if (href && title.length > 10) {
                if (!href.startsWith('http')) href = appConfig.site + href
                cards.push({
                    vod_id: href,
                    vod_name: title,
                    vod_pic: '',
                    vod_remarks: '',
                    ext: { url: href }
                })
            }
        })
    } catch (e) {}

    return jsonify({ list: cards })
}