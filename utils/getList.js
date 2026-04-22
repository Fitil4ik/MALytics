const malProxy = require('./malProxy'); 
const { logger } = require('./logger');

async function* getList(username) {
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
            const response = await malProxy.get(currentUrl, {
                params: params || {}
            });

        const nodes = response.data.data || [];
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

            currentUrl = response.data.paging?.next || null;
            params = null;
            page++;
        }
        catch (error) {
            throw error;
        }
    }
}
module.exports = getList;