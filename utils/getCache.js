const eventBus = require('./eventManager');
const { logger } = require('./logger');

function getCache(fn, cache, cacheLife) {
    return async function (...args) {
        const data = args[0];
        const cached = cache.get(data);

        if (cached) {
            const age = Date.now() - cached.timestamp;
            if (age < cacheLife) {
                logger.info(`[Cache] Знайдено кеш для ${data} (${(age / 1000).toFixed(1)}s)`);
                return cached.data;
            }
        }

        try {
            const result = await fn(...args);
            eventBus.emit('profile_ready', { username: data, responseData: result, cache: cache });
            return result;
        } catch (error) {
            logger.error(`[Cache] Помилка при отриманні кешу:', ${error.message}`);
            throw error;
        }
    }
}
module.exports = getCache;