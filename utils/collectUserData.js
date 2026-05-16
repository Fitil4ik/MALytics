const BiDirectionalPriorityQueue = require('./bdpq');
const getList = require('./getList');
const calcPrefLogged = require('./calcPref');
const { logger } = require('./logger');

async function collectUserData(username, malClient, type = 'anime') {
    logger.info(`[collectUserData] Початок завантаження профілю: ${username} (${type})...`);
    const bdpq = new BiDirectionalPriorityQueue();
    const allMedia = [];

   let userPicture = null;
   try {
            const jikanRes = await fetch(`https://api.jikan.moe/v4/users/${username}`);
            if (jikanRes.ok) {
                const jikanData = await jikanRes.json();
                if (jikanData.data?.images?.jpg?.image_url) {
                    userPicture = jikanData.data.images.jpg.image_url;
                }
            } else {
                logger.error(`[collectUserData] Jikan повернув статус ${jikanRes.status} для ${username}`);
            }
        } catch (picError) {
            logger.error(`[collectUserData] Не вдалося завантажити аватарку для ${username}: ${picError.message}`);
        }

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
            picture: userPicture,
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