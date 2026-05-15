const BiDirectionalPriorityQueue = require('./bdpq');
const getList = require('./getList');
const calcPrefLogged = require('./calcPref');
const { logger } = require('./logger');

async function collectUserData(username, malClient, type = 'anime') {
    logger.info(`[collectUserData] Початок завантаження профілю: ${username} (${type})...`);
    const bdpq = new BiDirectionalPriorityQueue();
    const allMedia = [];

    try {
        for await (const media of getList(username, malClient, type)) {  
            bdpq.enqueue(media, media.score);
            allMedia.push(media);
        }
        
        logger.info(`[collectUserData] Успіх! Всього зібрано для ${username} (${type}): ${allMedia.length}.`);
        
        const topGenres = await calcPrefLogged(allMedia);
        
        return {
            username: username,
            total: allMedia.length,
            top_genres: topGenres,
            list: allMedia,
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