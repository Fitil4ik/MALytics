const EventEmitter = require('events');
const { logger } = require('./logger');

class SafeEventBus extends EventEmitter {
    emit(eventName, ...args) {
        const listeners = this.listeners(eventName);
        
        if (listeners.length === 0 && eventName === 'error') {
            logger.error(`[EventBus] Увага: Неперехоплена помилка - ${args[0]}`);
            return false;
        }

        let handled = false;
        for (const listener of listeners) {
            try {
                listener.apply(this, args);
                handled = true;
            } catch (err) {
                this.emit('error', err);
            }
        }
        return handled;
    }
}

const eventBus = new SafeEventBus();

eventBus.on('error', (err) => {
    logger.error(`[EventBus] Помилка в одному зі слухачів: ${err.message}`);
});

eventBus.on('error', (err) => {
    logger.error(`[EventBus] Помилка в одному зі слухачів: ${err.message}`);
});

function updateCache({ username, responseData, cache }) {
    cache.set(username, { data: responseData, timestamp: Date.now() });
    logger.debug(`[GetCache] Дані для ${username} успішно збережено в кеш.`);
}

function logAnalytics({ responseData }) {
    const topGenres = responseData.top_genres;
    if (Array.isArray(topGenres) && topGenres.length) {
        logger.debug(`[CalcPref] Жанри за пріоритетом (всього знайдено ${topGenres.length}):`);
        topGenres.slice(0, 10).forEach(g => {
            logger.debug(`- ${g.name}: ${g.weightedRank} (Середній: ${g.rawAverage}, кількість: ${g.count})`);
        });
    } else {
        logger.debug(`[CalcPref] Статистика жанрів недоступна.`);
    }
}

eventBus.on('profile_ready', updateCache);
eventBus.on('profile_ready', logAnalytics);

module.exports = eventBus;