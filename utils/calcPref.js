const BiDirectionalPriorityQueue = require('./bdpq');
function calcPref(allMedia) {
    const genreStats = {};
    let globalTotalScore = 0;
    let globalCount = 0;

    const ENABLE_DROPPED_PENALTY = true; 
    allMedia.forEach(media => {
        if (!media || typeof media !== 'object') return;
        const baseScore = Number(media.score) || 0;
        if (baseScore === 0) return;
        let effectiveScore = baseScore;
        if (ENABLE_DROPPED_PENALTY && media.status === 'dropped') {
            effectiveScore = baseScore * 0.75; 
        }
        globalTotalScore += effectiveScore;
        globalCount++;
        const genres = Array.isArray(media.genres) ? media.genres : [];
        genres.forEach(genre => {
            if (!genreStats[genre]) {
                genreStats[genre] = { totalScore: 0, count: 0 };
            }
            genreStats[genre].totalScore += effectiveScore;
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