require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 8000;

app.use(cors());

const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID;

app.get('/get_list', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
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