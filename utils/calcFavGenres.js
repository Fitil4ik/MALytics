function calcFavGenres(allAnime) {
    const genreCounts = {};
    allAnime.forEach(anime => {
        anime.genres.forEach(genre => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
    });
    return Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
}
module.exports = calcFavGenres;