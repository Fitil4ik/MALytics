require('dotenv').config();
const BiDirectionalPriorityQueue = require('./bdpq');
const axios = require('axios');
const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID;

async function* getList(username) {
    const bdpq = new BiDirectionalPriorityQueue();
    let currentUrl = `https://api.myanimelist.net/v2/users/${username}/animelist`;
    let params = {
        status: 'completed',
        limit: 100,
        fields: 'list_status{score},genres,alternative_titles'
    };
    const headers = { 'X-MAL-CLIENT-ID': MAL_CLIENT_ID };

    while (currentUrl) {
        console.log(`--> Завантаження сторінки... Всього отримано: ${bdpq.bundleMap.size}`);

        try {
            const response = await axios.get(currentUrl, {
                headers,
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
        }
        catch (error) {
            console.error("Помилка при отриманні даних:", error.response?.status || error.message);
            break;
        }
    }
}
module.exports = getList;