const { logger } = require('./logger');
const axios = require('axios');
require('dotenv').config();

class MALAuthProxy {
    constructor() {
        this.clientId = process.env.MAL_CLIENT_ID;
        this.cooldownUntil = 0; 
    }

    async get(url, config = {}) {
        const now = Date.now();
        if (now < this.cooldownUntil) {
            const waitTime = this.cooldownUntil - now;
            logger.debug(`[PROXY RATE LIMIT] Глобальний кулдаун. Чекаємо ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        logger.debug(`[PROXY] Відправка запиту до: ${url}`);
        
        try {
            const proxyConfig = {
                ...config,
                headers: {
                    ...config.headers,
                    'X-MAL-CLIENT-ID': this.clientId,
                    'User-Agent': 'MALytics_Proxy/1.0'
                }
            };
            return await axios.get(url, proxyConfig);
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

module.exports = new MALAuthProxy();