const { logger } = require('./logger');
const { withRetry } = require('./retry');

async function fetchTopAnime(proxyClient, type = 'anime') {
    logger.info(`[fetchAnimeTop] Завантаження Топ-1000 ${type} з MAL...`);
    const topMedia = [];
    const limit = 100;
    
    try {
        for (let offset = 0; offset < 1000; offset += limit) {
            const url = `https://api.myanimelist.net/v2/${type}/ranking`;
            const params = {
                ranking_type: 'all',
                limit: limit,
                offset: offset,
                fields: 'genres,alternative_titles,main_picture,synopsis'
            };
            const query = new URLSearchParams(params).toString();

            logger.debug(`[fetchAnimeTop] Завантаження топ-1000 ${type} (позиції ${offset + 1}-${offset + limit})...`);
            const response = await withRetry(() => proxyClient.request({
                url: `${url}?${query}`,
                method: 'GET'
            }), 3, 2000);
            
            const nodes = response.data || [];
            if (nodes.length === 0) break;

            for (const item of nodes) {
                const enTitle = item.node.alternative_titles?.en;
                const finalTitle = (enTitle && enTitle.trim()) ? enTitle : item.node.title;
                
                topMedia.push({
                    rank: item.ranking?.rank,
                    id: item.node.id,
                    title: finalTitle,
                    genres: item.node.genres ? item.node.genres.map(g => g.name) : [],
                    picture: item.node.main_picture?.large || item.node.main_picture?.medium || '',
                    synopsis: item.node.synopsis || 'Опис відсутній.'
                });
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        logger.info(`[fetchAnimeTop] Успіх! Завантажено топ-${topMedia.length} ${type}.`);
        return topMedia;

    } catch (error) {
        logger.error(`[fetchAnimeTop] Помилка при завантаженні топ-1000 ${type}: ${error.message}`);
        return null;
    }
}

module.exports = fetchTopAnime;