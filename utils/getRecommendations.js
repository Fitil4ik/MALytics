const { logger } = require('./logger');
const { withRetry } = require('./retry');

async function getRecommendations(username, userAnimeList, userTopGenres, top1000Anime, proxyClient) {
    if (!top1000Anime || top1000Anime.length === 0) {
        logger.error('[getRecommendations] База Топ-1000 порожня!');
        return [];
    }

    const WEIGHT_GENRES = 0.6; 
    const WEIGHT_RANK = 0.4;   
    const watchedIds = new Set(userAnimeList.map(a => Number(a.id)));
    const top5Genres = userTopGenres.slice(0, 5).map(g => g.name);

    const candidates = [];
    const MAX_MATCH_SCORE = 15; 

    for (const anime of top1000Anime) {
        if (watchedIds.has(anime.id)) continue;

        let matchScore = 0;
        anime.genres.forEach(genre => {
            const index = top5Genres.indexOf(genre);
            if (index !== -1) matchScore += (5 - index);
        });

        if (matchScore > 0) {
            const genreScore = (matchScore / MAX_MATCH_SCORE) * 100;
            const safeRank = anime.rank || 1000; 
            const rankScore = ((1000 - safeRank) / 1000) * 100;
            candidates.push({ ...anime, matchScore, finalScore: (genreScore * WEIGHT_GENRES) + (rankScore * WEIGHT_RANK) });
        }
    }

    candidates.sort((a, b) => b.finalScore - a.finalScore);

    const finalRecommendations = [];
    logger.debug(`[getRecommendations] Починаємо перевірку сиквелів для ${username}...`);

    for (const anime of candidates) {
        if (finalRecommendations.length >= 5) break;

        try {
            const response = await withRetry(() => proxyClient.request({
                url: `https://api.myanimelist.net/v2/anime/${anime.id}?fields=related_anime`,
                method: 'GET'
            }), 2, 1000);

            const details = response.data && response.data.related_anime ? response.data : response;
            
            let hasUnseenPrequel = false;

            if (details && details.related_anime) {
                for (const rel of details.related_anime) {
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
                logger.debug(`[getRecommendations] Відкинуто: ${anime.title}`);
                continue; 
            }

            logger.debug(`[getRecommendations] Схвалено: ${anime.title}`);
            finalRecommendations.push(anime);

        } catch (error) {
            logger.error(`[getRecommendations] Помилка перевірки ${anime.title}: ${error.message}`);
            continue; 
        }
    }
    logger.info(`[getRecommendations] Рекомендації для ${username} сформовано.`);
    return finalRecommendations;
}

module.exports = getRecommendations;