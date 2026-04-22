const EventEmitter = require('events');
const { logger } = require('./logger');

const eventBus = new EventEmitter();

function updateCache({ username, responseData, cache }) {
    cache.set(username, { data: responseData, timestamp: Date.now() });
    logger.debug(`[Cache Manager] Дані для ${username} успішно збережено в кеш.`);
}

function logAnalytics({ responseData }) {
    const topGenres = responseData.top_genres;
    if (Array.isArray(topGenres) && topGenres.length) {
        logger.debug(`[Analytics] Жанри за пріоритетом (всього знайдено ${topGenres.length}):`);
        topGenres.slice(0, 10).forEach(g => {
            logger.debug(`- ${g.name}: ${g.weightedRank} (Середній: ${g.rawAverage}, кількість: ${g.count})`);
        });
    } else {
        logger.debug(`[Analytics] Статистика жанрів недоступна.`);
    }
}

eventBus.on('profile_ready', updateCache);
eventBus.on('profile_ready', logAnalytics);

module.exports = eventBus;