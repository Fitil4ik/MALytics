const { logger } = require('./logger');

/**
 * @param {Function} fn
 * @param {number} retries
 * @param {number} delay
 */
async function withRetry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            const isLastAttempt = i === retries - 1;
            if (isLastAttempt) throw error;

            logger.error(`[Retry] Спроба ${i + 1}/${retries} не вдалася: ${error.message}. Повтор через ${delay}ms...`);
            
            await new Promise(res => setTimeout(res, delay));
            delay *= 2; 
        }
    }
}

module.exports = { withRetry };