 function getCache(username, cache, cacheLife, res) {
    const cached = cache.get(username);
        if (cached) {
            const age = Date.now() - cached.timestamp;
            if (age < cacheLife) {
                console.log(`Знайдено кешовані дані для ${username} (${(age / 1000).toFixed(1)}s)`);
                console.log(`Кешований рейтинг жанрів для ${username}:`, JSON.stringify(cached.data.top_genres));
                return res.json(cached.data);
            } else {
                cache.delete(username);
            }
        }
    return null;
 }
module.exports = getCache;