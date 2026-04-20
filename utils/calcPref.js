const BiDirectionalPriorityQueue = require('./bdpq');
function calcPref(allAnime) {
    const genreStats = {};
    let globalTotalScore = 0;
    let globalCount = 0;

    allAnime.forEach(anime => {
        if (!anime || typeof anime !== 'object') return;
        const score = Number(anime.score) || 0;
        if (score === 0) return;
        globalTotalScore += score;
        globalCount++;
        const genres = Array.isArray(anime.genres) ? anime.genres : [];
        genres.forEach(genre => {
            if (!genreStats[genre]) {
                genreStats[genre] = { totalScore: 0, count: 0 };
            }
            genreStats[genre].totalScore += score;
            genreStats[genre].count += 1;
        });
    });

    if (globalCount === 0) return [];
    const globalAvg = globalTotalScore / globalCount;
    const K = 35; 
    const bdpq = new BiDirectionalPriorityQueue();
    let uniqueGenres = 0;
    Object.keys(genreStats).forEach(genre => {
        const stats = genreStats[genre];
        const weightedScore = (stats.totalScore + K * globalAvg) / (stats.count + K);
        const genreData = {
            name: genre,
            rawAverage: Math.round((stats.totalScore / stats.count) * 100) / 100,
            weightedRank: Math.round(weightedScore * 100) / 100,
            count: stats.count
        };
        bdpq.enqueue(genreData, genreData.weightedRank);
        uniqueGenres++;
    });
    const genreAverages = [];
    for (let i = 0; i < uniqueGenres; i++) {
        genreAverages.push(bdpq.dequeue('highest'));
    }
    return genreAverages
}
module.exports = calcPref;