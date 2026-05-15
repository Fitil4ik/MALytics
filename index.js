require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { logger } = require('./utils/logger');
const httpClient = require('./utils/proxy/httpClient');
const malAuthProxy = require('./utils/proxy/malProxy');
const RateLimitProxy = require('./utils/proxy/rateLimitProxy');
const collectUserData = require('./utils/collectUserData');
const cron = require('node-cron');
const fetchTopAnime = require('./utils/fetchAnimeTop');
const getRecommendations = require('./utils/getRecommendations');

const app = express();
const PORT = 8000;
const cache = new Map();
const cacheLife = 1000 * 600;
const cached = require('./utils/getCache')((key) => {
    const parts = key.split(':::');
    const type = parts.pop();
    const username = parts.join(':::');
    return collectUserData(username, malClient, type || 'anime');
}, cache, cacheLife);

const baseClient = new httpClient();
const authClient = new malAuthProxy(baseClient, process.env.MAL_CLIENT_ID);
const malClient = new RateLimitProxy(authClient);

app.use(cors());
app.use(express.static('public'));

let globalTop1000Anime = [];
let globalTop1000Manga = [];

async function updateAllTops() {
    globalTop1000Anime = await fetchTopAnime(malClient, 'anime');
    globalTop1000Manga = await fetchTopAnime(malClient, 'manga');
    
    if (globalTop1000Anime && globalTop1000Anime.length > 0) {
        cache.set('TOP_1000_anime', { data: globalTop1000Anime, timestamp: Date.now() });
        logger.debug('[fetchTopAnime] База Топ-1000 аніме успішно оновлена.');
    }
    if (globalTop1000Manga && globalTop1000Manga.length > 0) {
        cache.set('TOP_1000_manga', { data: globalTop1000Manga, timestamp: Date.now() });
        logger.debug('[fetchTopAnime] База Топ-1000 манги успішно оновлена.');
    }
}

cron.schedule('0 10 * * *', () => {
    logger.info('Запуск завдання за розкладом: Оновлення бази Топ-1000...');
    updateAllTops();
});

app.get('/get_list', async (req, res) => {
    const { username, type = 'anime' } = req.query;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    try {
        const cacheKey = `${username}:::${type}`;
        const responseData = await cached(cacheKey);
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

app.get('/get_recommendations', async (req, res) => {
    const { username, type = 'anime' } = req.query;
    if (!username) return res.status(400).json({ error: "Username is required" });

    try {
        const cacheKey = `${username}:::${type}`;
        const cachedData = cache.get(cacheKey);
        if (!cachedData) {
            return res.status(400).json({ error: "Дані не знайдені. Спочатку завантажте список." });
        }

        const responseData = cachedData.data;
        const topData = (type === 'manga') ? globalTop1000Manga : globalTop1000Anime;

        const recommendations = await getRecommendations(
            responseData.username, 
            responseData.list, 
            responseData.top_genres, 
            topData,
            malClient,
            type
        );

        res.json({ recommendations });
    } catch (error) {
        logger.error(`[getRecommendations] Помилка: ${error.message}`);
        res.status(500).json({ error: "Помилка генерації рекомендацій" });
    }
});

app.listen(PORT, async () => {
    console.log(`Сервер MALytics запущено на http://127.0.0.1:${PORT}`);
    await updateAllTops();
});