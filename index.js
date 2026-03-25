require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 8000;
const cache = new Map();
const cacheLife = 1000*600; // 10 min

app.use(cors());

const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID;

app.get('/get_list', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }
    const cached = cache.get(username);
    if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < cacheLife) {
            console.log(`Знайдено кешовані дані для ${username} (${(age/1000).toFixed(1)}s)`);
            return res.json(cached.data);
        }
        else {
            cache.delete(username);
        }
    }

    let allAnime = [];
    let currentUrl = `https://api.myanimelist.net/v2/users/${username}/animelist`;

    let params = {
        status: 'completed',
        limit: 100,
        fields: 'list_status{score},genres'
    };

    const headers = { 'X-MAL-CLIENT-ID': MAL_CLIENT_ID };

    try {
        while (currentUrl) {
            console.log(`--> Завантаження сторінки... Всього отримано: ${allAnime.length}`);

            const response = await axios.get(currentUrl, { 
                headers, 
                params: params || {} 
            });

            const data = response.data;
            const nodes = data.data || [];

            if (nodes.length === 0) break;

            const batch = nodes.map(item => {
                const node = item.node;
                return {
                    id: node.id,
                    title: node.title,
                    score: item.list_status?.score || 0,
                    genres: node.genres ? node.genres.map(g => g.name) : []
                };
            });

            allAnime = allAnime.concat(batch);

            currentUrl = data.paging?.next || null;
            params = null; 
        }

        console.log(`Успіх! Всього зібрано: ${allAnime.length}`);

        res.json({
            username: username,
            total: allAnime.length,
            list: allAnime
        });
        cache.set(username, { data: {username, total: allAnime.length, list: allAnime}, timestamp: Date.now() });

    } catch (error) {
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