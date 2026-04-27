const { logger } = require('./logger');
const { withRetry } = require('./retry');   

async function* getList(username, malClient) {
    let currentUrl = `https://api.myanimelist.net/v2/users/${username}/animelist`;
    let params = {
        status: 'completed',
        limit: 100,
        fields: 'list_status{score},genres,alternative_titles'
    };

    let page = 1;

    while (currentUrl) {
        logger.debug(`--> Завантаження сторінки... ${page}...`);

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
            const enTitle = item.node.alternative_titles?.en;
            const finalTitle = (enTitle && enTitle.trim()) ? enTitle : item.node.title;
            const anime = {
                id: item.node.id,
                title: finalTitle,
                score: item.list_status?.score || 0,
                genres: item.node.genres ? item.node.genres.map(g => g.name) : []
            };
            yield anime;
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