require('dotenv').config();
const express = require('express');
const cors = require('cors');
const calcPref = require('./utils/calcPref');
const { logger, withLogging } = require('./utils/logger');
const httpClient = require('./utils/proxy/httpClient');
const malAuthProxy = require('./utils/proxy/malProxy');
const RateLimitProxy = require('./utils/proxy/rateLimitProxy');
const eventBus = require('./utils/eventManager');
const collectUserData = require('./utils/collectUserData');
const cron = require('node-cron');
const fetchTopAnime = require('./utils/fetchAnimeTop');

const app = express();
const PORT = 8000;
const cache = new Map();
const cacheLife = 1000 * 600;
const cached = require('./utils/getCache')((username) => collectUserData(username, malClient), cache, cacheLife);

const baseClient = new httpClient();
const authClient = new malAuthProxy(baseClient, process.env.MAL_CLIENT_ID);
const malClient = new RateLimitProxy(authClient);

app.use(cors());
app.use(express.static('public'));

const calcPrefLogged = withLogging(calcPref, 'DEBUG');

let globalTop1000 = [];
async function updateTopAnime() {
    const data = await fetchTopAnime(malClient);
    if (data && data.length > 0) {
        globalTop1000 = data;
        cache.set('TOP_1000', { data: globalTop1000, timestamp: Date.now() });
        logger.debug('База топ-1000 успішно оновлена та збережена в пам\'яті.');
    }
}

cron.schedule('0 10 * * *', () => {
    logger.info('Запуск завдання за розкладом: Оновлення бази Топ-1000...');
    updateTopAnime();
});

app.get('/get_list', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    try {
        const responseData = await cached(username);
        malClient.setCooldown(5000);
        res.json(responseData);
        } 
        catch (error) {
        logger.error(`Помилка: ${error.response?.status || error.message}`);
        const status = error.response?.status || 500;
        res.status(status).json({
            error: "Error fetching data from MyAnimeList",
            details: error.message
        });
    }
});

app.listen(PORT, async () => {
    console.log(`Сервер MALytics запущено на http://127.0.0.1:${PORT}`);
    await updateTopAnime();
});