const { logger } = require('./logger');
const { withRetry } = require('./retry');   

async function* getList(username, malClient, type = 'anime') {
    let currentUrl = `https://api.myanimelist.net/v2/users/${username}/${type}list`;
    let params = {
        limit: 100,
        nsfw: true,
        fields: 'list_status{score,status},genres,alternative_titles'
    };

    let page = 1;

    while (currentUrl) {
        logger.debug(`--> Завантаження сторінки ${type}... ${page}...`);

        try {
            let reqUrl = currentUrl;
            if (params) {
                const query = new URLSearchParams(params).toString();
                reqUrl = `${currentUrl}?${query}`;
            }
            const response = await withRetry(() => malClient.request({
                url: reqUrl, 
                method: 'GET'
            }));

        const nodes = response.data || [];
        if (nodes.length === 0) break;

        for (const item of nodes) {
            const rawStatus = item.list_status?.status;
                if (type === 'anime') {
                if (rawStatus !== 'completed') continue;
            } else if (type === 'manga') {
                if (!['completed', 'reading', 'dropped'].includes(rawStatus)) continue;
            }

            const enTitle = item.node.alternative_titles?.en;
            const finalTitle = (enTitle && enTitle.trim()) ? enTitle : item.node.title;
            const media = {
                id: item.node.id,
                title: finalTitle,
                score: item.list_status?.score || 0,
                status: rawStatus,
                genres: item.node.genres ? item.node.genres.map(g => g.name) : []
            };
            yield media;
        };

            currentUrl = response.paging?.next || null;
            params = null;
            page++;
        }
        catch (error) {
            throw error;
        }
    }
}
module.exports = getList;