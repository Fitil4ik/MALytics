const malProxy = require('./malProxy');
const { logger } = require('./logger');

async function fetchTopAnime() {
    logger.info('Завантаження Топ-1000 аніме з MAL...');
    const topAnime = [];
    const limit = 100;
    
    try {
        for (let offset = 0; offset < 1000; offset += limit) {
            const url = 'https://api.myanimelist.net/v2/anime/ranking';
            const params = {
                ranking_type: 'all',
                limit: limit,
                offset: offset,
                fields: 'genres,alternative_titles'
            };

            logger.debug(`Завантаження топ-1000 (позиції ${offset + 1}-${offset + limit})...`);
            const response = await malProxy.get(url, { params });
            
            const nodes = response.data.data || [];
            if (nodes.length === 0) break;

            for (const item of nodes) {
                const enTitle = item.node.alternative_titles?.en;
                const finalTitle = (enTitle && enTitle.trim()) ? enTitle : item.node.title;
                
                topAnime.push({
                    rank: item.ranking?.rank,
                    id: item.node.id,
                    title: finalTitle,
                    genres: item.node.genres ? item.node.genres.map(g => g.name) : []
                });
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        logger.info(`Успіх! Завантажено Топ-${topAnime.length} аніме.`);
        return topAnime;

    } catch (error) {
        logger.error(`Помилка при завантаженні Топ-1000: ${error.message}`);
        return null;
    }
}

module.exports = fetchTopAnime;