const { logger } = require('../logger');

class MALAuthProxy {
    constructor(httpClient, clientId) {
        this.httpClient = httpClient;
        this.clientId = clientId;
    }

    async request(req) {
        logger.debug(`[PROXY] Відправка запиту до: ${req.url}`);
        try {
            const proxyReq = {
                ...req,
                headers: {
                    ...req.headers,
                    'X-MAL-CLIENT-ID': this.clientId,
                    'User-Agent': 'MALytics_Proxy/1.0'
                }
            };
            return await this.httpClient.request(proxyReq);
        } catch (error) {
            logger.error(`[PROXY ERROR] Помилка запиту — Статус: ${error.response?.status}`);
            throw error; 
        }
    }

    setCooldown(ms) {
        this.cooldownUntil = Date.now() + ms;
        logger.debug(`[PROXY] Активовано кулдаун на ${ms}ms для наступних запитів.`);
    }
}

module.exports = MALAuthProxy;