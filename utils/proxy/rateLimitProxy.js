const { logger } = require('../logger');

class RateLimitProxy {
    constructor(httpClient) {
        this.httpClient = httpClient;
        this.cooldownUntil = 0;
    }
    async request(req) {
        const now = Date.now();
        if (now < this.cooldownUntil) {
            const waitTime = this.cooldownUntil - now;
            logger.debug(`[RateLimitProxy] Захист від спаму. Чекаємо ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        return await this.httpClient.request(req);
    }
    setCooldown(ms) {
        this.cooldownUntil = Date.now() + ms;
        logger.debug(`[RateLimitProxy] Активовано глобальний кулдаун на ${ms}ms.`);
    }
}

module.exports = RateLimitProxy;