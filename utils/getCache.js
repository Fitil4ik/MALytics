const eventBus = require('./eventManager');
const { logger } = require('./logger');

function getCache(fn, cache, cacheLife) {
    return async function (...args) {
        const data = args[0];
        const cached = cache.get(data);
    
        if (cached) {
            const age = Date.now() - cached.timestamp;
            if (age < cacheLife) {
                logger.info(`[Cache] Знайдено кешовані дані для ${data} (${(age / 1000).toFixed(1)}s)`);
                return cached.data;
            } else {
                cache.delete(data);
            }
        }
        
        const result = await fn(...args);
        eventBus.emit('profile_ready', { username: data, responseData: result, cache: cache });
        return result;
    }
 }
module.exports = getCache;