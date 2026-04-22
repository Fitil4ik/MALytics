const getList = require('./utils/getList');
const express = require('express');
const cors = require('cors');
const calcPref = require('./utils/calcPref');
const { logger, withLogging } = require('./utils/logger');
const malProxy = require('./utils/malProxy');
const BiDirectionalPriorityQueue = require('./utils/bdpq');
const eventBus = require('./utils/eventManager');

const app = express();
const PORT = 8000;
const cache = new Map();
const cacheLife = 1000 * 600;

app.use(cors());
app.use(express.static('public'));

const calcPrefLogged = withLogging(calcPref, 'DEBUG');

app.get('/get_list', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    const cached = require('./utils/getCache')(username, cache, cacheLife, res);
    if (cached) return;

    logger.info(`Початок завантаження профілю: ${username}...`);

    try {
        const bdpq = new BiDirectionalPriorityQueue();
        const allAnime = [];
        for await (const anime of getList(username)) {  
            bdpq.enqueue(anime, anime.score);
            allAnime.push(anime);
        }
         logger.info(`Успіх! Всього зібрано для ${username}: ${allAnime.length}.`);
        const topGenres = await calcPrefLogged(allAnime);
        const responseData = {
            username: username,
            total: allAnime.length,
            top_genres: topGenres,
            list: allAnime,
            stats: {
                highest_rated: bdpq.peek('highest'),
                lowest_rated: bdpq.peek('lowest'),
                first_added: bdpq.peek('oldest'),
                last_added: bdpq.peek('newest')
            }
        };
        eventBus.emit('profile_ready', { username, responseData, cache });
        malProxy.setCooldown(5000);
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

app.listen(PORT, () => {
    console.log(`Сервер MALytics запущено на http://127.0.0.1:${PORT}`);
});