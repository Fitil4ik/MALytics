const { logger } = require('./logger');

function getRecommendations(username, userAnimeList, userTopGenres, top1000Anime) {
    if (!top1000Anime || top1000Anime.length === 0) {
        logger.error('[getRecommendations] База Топ-1000 порожня!');
        return [];
    }

    const watchedIds = new Set(userAnimeList.map(a => a.id));
    const top5Genres = userTopGenres.slice(0, 5).map(g => g.name);
    
    logger.debug(`[getRecommendations] Аналіз для ${username} за жанрами: ${top5Genres.join(', ')}`);

    const scoredAnime = [];
    for (const anime of top1000Anime) {
        if (watchedIds.has(anime.id)) continue;

        let matchScore = 0;
        anime.genres.forEach(genre => {
            const index = top5Genres.indexOf(genre);
            if (index !== -1) matchScore += (5 - index);
        });

        if (matchScore > 0) {
            scoredAnime.push({ ...anime, matchScore });
        }
    }

    scoredAnime.sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return a.rank - b.rank; 
    });

    logger.info(`[getRecommendations] Сформовано Топ-5 рекомендацій для користувача ${username}.`);
    return scoredAnime.slice(0, 5);
}

module.exports = getRecommendations;