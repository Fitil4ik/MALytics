require('dotenv').config();
const getList = require('./utils/getList');
const express = require('express');
const cors = require('cors');
const calcPref = require('./utils/calcPref');

const app = express();
const PORT = 8000;
const cache = new Map();
const cacheLife = 1000 * 600;

app.use(cors());
app.use(express.static('public'));

app.get('/get_list', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    const cached = require('./utils/getCache')(username, cache, cacheLife, res);
    if (cached) return;

    try {
        const bdpq = await getList(username);
        const allAnime = Array.from(bdpq.bundleMap.values()).map(bundle => bundle.title);
        const topGenres = calcPref(allAnime);
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
        console.log(`Успіх! Всього зібрано для ${username}: ${allAnime.length}. Всього жанрів: ${topGenres.length}`);
        if (Array.isArray(topGenres) && topGenres.length) {
            console.log('Жанри за пріоритетом:');
            topGenres.slice(0, 10).forEach(g => {
                console.log(`- ${g.name}: ${g.weightedRank} (Середній: ${g.rawAverage}, кількість: ${g.count})`);
            });
        } else {
            console.log('Статистика жанрів недоступна.');
        }
        
        cache.set(username, { data: responseData, timestamp: Date.now() });
        res.json(responseData);
        } 
        catch (error) {
        console.error("Помилка API:", error.response?.status || error.message);
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