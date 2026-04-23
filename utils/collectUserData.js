const BiDirectionalPriorityQueue = require('./bdpq');
const getList = require('./getList');
const calcPrefLogged = require('./calcPref');
const { logger } = require('./logger');

async function collectUserData(username) {
    logger.info(`Початок завантаження профілю: ${username}...`);
    const bdpq = new BiDirectionalPriorityQueue();
        const allAnime = [];
        for await (const anime of getList(username)) {  
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
                highest_rated: bdpq.peek('highest'),
                lowest_rated: bdpq.peek('lowest'),
                first_added: bdpq.peek('oldest'),
                last_added: bdpq.peek('newest')
            }
        }
}
module.exports = collectUserData;