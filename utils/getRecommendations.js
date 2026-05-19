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

const BATCH_SIZE = 5;

for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    if (finalRecommendations.length >= 5) break;

    const batch = candidates.slice(i, i + BATCH_SIZE);
    
    const batchResults = await Promise.all(batch.map(async (item) => {
        try {
            const response = await withRetry(() => proxyClient.request({
                url: `https://api.myanimelist.net/v2/${type}/${item.id}?fields=${relatedField}`,
                method: 'GET'
            }), 2, 1000);

            const details = response.data && response.data[relatedField] ? response.data : response;
            let hasUnseenPrequel = false;

            if (details && details[relatedField]) {
                hasUnseenPrequel = details[relatedField].some(rel => 
                    ['prequel', 'parent_story', 'full_story'].includes(rel.relation_type) && 
                    !watchedIds.has(Number(rel.node.id))
                );
            }
            
            return { item, hasUnseenPrequel, success: true };
        } catch (error) {
            logger.error(`[getRecommendations] Помилка перевірки ${item.title}: ${error.message}`);
            return { item, success: false };
        }
    }));

    for (const res of batchResults) {
        if (res.success && !res.hasUnseenPrequel) {
            logger.debug(`[getRecommendations] Схвалено: ${res.item.title}`);
            finalRecommendations.push(res.item);
            if (finalRecommendations.length >= 5) break; 
        } else if (res.success) {
            logger.debug(`[getRecommendations] Відкинуто (є приквел): ${res.item.title}`);
        }
    }
}
    logger.info(`[getRecommendations] Рекомендації для ${username} сформовано.`);
    return finalRecommendations;
}

module.exports = getRecommendations;