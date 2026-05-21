const getList = require('./getList');
const calcPrefLogged = require('./calcPref');
const { logger } = require('./logger');

async function collectUserData(username, malClient, type = 'anime') {
    logger.info(`[collectUserData] Початок завантаження профілю: ${username} (${type})...`);
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
            allMedia.push(media);
        }
        
        logger.info(`[collectUserData] Успіх! Всього зібрано для ${username} (${type}): ${allMedia.length}.`);
        
        if (allMedia.length === 0) {
            return { username, total: 0, top_genres: [], picture: userPicture, list: [], stats: {} };
        }

        const topGenres = await calcPrefLogged(allMedia);
        
        let highest = allMedia[0];
        let lowest = allMedia[0];

        for (let i = 1; i < allMedia.length; i++) {
            if (allMedia[i].score > highest.score) {
                highest = allMedia[i];
            }
            if (allMedia[i].score > 0 && (lowest.score === 0 || allMedia[i].score < lowest.score)) {
                lowest = allMedia[i];
            }
        }

        return {
            username: username,
            total: allMedia.length,
            top_genres: topGenres,
            picture: userPicture,
            list: allMedia,
            stats: {
                highest_rated: highest && highest.score > 0 ? highest : null,
                lowest_rated: lowest && lowest.score > 0 ? lowest : null,
                first_added: allMedia[0] || null, 
                last_added: allMedia[allMedia.length - 1] || null
            }
        };

    } catch (error) {
        logger.error(`[collectUserData] Критична помилка при зборі даних для ${username}: ${error.message}`);
        throw error;
    }
}

module.exports = collectUserData;