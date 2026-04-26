const { logger } = require('../logger');

class HTTPclient {
    async request(req) {
        const { url, method, headers } = req;
        const response = await fetch(url, { method, headers });
        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`[HTTP ERROR] ${method} ${url} — Status: ${response.status}, Response: ${errorText}`);
            const error = new Error(`HTTP error! Status: ${response.status}`);
            error.status = response.status;
            throw error;
        }
        return await response.json();
    }
}
module.exports = HTTPclient;