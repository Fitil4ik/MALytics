const BiDirectionalPriorityQueue = require('./bdpq');
const getList = require('./getList');
const calcPrefLogged = require('./calcPref');
const { logger } = require('./logger');

async function collectUserData(username, malClient) {
    logger.info(`Початок завантаження профілю: ${username}...`);
    const bdpq = new BiDirectionalPriorityQueue();
    const allAnime = [];

    try {
        for await (const anime of getList(username, malClient)) {  
            bdpq.enqueue(anime, anime.score);
            allAnime.push(anime);
        }
        
        logger.info(`Успіх! Всього зібрано для ${username}: ${allAnime.length}.`);
        
        const topGenres = await calcPrefLogged(allAnime);
        
        return {
            username: username,
            total: allAnime.length,
            top_genres: topGenres,
            list: allAnime,
            stats: {
                highest_rated: bdpq.peek('highest') || null,
                lowest_rated: bdpq.peek('lowest') || null,
                first_added: bdpq.peek('oldest') || null,
                last_added: bdpq.peek('newest') || null
            }
        };

    } catch (error) {
        logger.error(`[collectUserData] Критична помилка при зборі даних для ${username}: ${error.message}`);
        throw error;
    }
}

module.exports = collectUserData;