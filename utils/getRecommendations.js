const { logger } = require('./logger');
const { withRetry } = require('./retry');

async function getRecommendations(username, userList, userTopGenres, top1000Data, proxyClient, type = 'anime') {
    if (!top1000Data || top1000Data.length === 0) {
        logger.error(`[getRecommendations] База Топ-1000 ${type} порожня!`);
        return [];
    }

    const WEIGHT_GENRES = 0.6; 
    const WEIGHT_RANK = 0.4;   
    const watchedIds = new Set(userList.map(a => Number(a.id)));
    const top5Genres = userTopGenres.slice(0, 5).map(g => g.name);

    const candidates = [];
    const MAX_MATCH_SCORE = 15; 

    for (const item of top1000Data) {
        if (watchedIds.has(item.id)) continue;

        let matchScore = 0;
        item.genres.forEach(genre => {
            const index = top5Genres.indexOf(genre);
            if (index !== -1) matchScore += (5 - index);
        });

        if (matchScore > 0) {
            const genreScore = (matchScore / MAX_MATCH_SCORE) * 100;
            const safeRank = item.rank || 1000; 
            const rankScore = ((1000 - safeRank) / 1000) * 100;
            candidates.push({ ...item, matchScore, finalScore: (genreScore * WEIGHT_GENRES) + (rankScore * WEIGHT_RANK) });
        }
    }

    candidates.sort((a, b) => b.finalScore - a.finalScore);

    const finalRecommendations = [];
    logger.debug(`[getRecommendations] Починаємо перевірку сиквелів для ${username} (${type})...`);
    const relatedField = type === 'manga' ? 'related_manga' : 'related_anime';

    for (const item of candidates) {
        if (finalRecommendations.length >= 5) break;

        try {
            const response = await withRetry(() => proxyClient.request({
                url: `https://api.myanimelist.net/v2/${type}/${item.id}?fields=${relatedField}`,
                method: 'GET'
            }), 2, 1000);

            const details = response.data && response.data[relatedField] ? response.data : response;
            
            let hasUnseenPrequel = false;

            if (details && details[relatedField]) {
                for (const rel of details[relatedField]) {
                    if (['prequel', 'parent_story', 'full_story'].includes(rel.relation_type)) {
                        const relId = Number(rel.node.id);
                        if (!watchedIds.has(relId)) {
                            hasUnseenPrequel = true;
                            break;
                        }
                    }
                }
            }

            if (hasUnseenPrequel) {
                logger.debug(`[getRecommendations] Відкинуто: ${item.title}`);
                continue; 
            }

            logger.debug(`[getRecommendations] Схвалено: ${item.title}`);
            finalRecommendations.push(item);

        } catch (error) {
            logger.error(`[getRecommendations] Помилка перевірки ${item.title}: ${error.message}`);
            continue; 
        }
    }
    logger.info(`[getRecommendations] Рекомендації для ${username} сформовано.`);
    return finalRecommendations;
}

module.exports = getRecommendations;