const Config = {
    LEVEL: 'INFO' 
};

const Levels = { DEBUG: 1, INFO: 2, ERROR: 3 };
const getIsoTime = () => new Date().toISOString();
const logger = {
    debug: (msg) => { if (Levels[Config.LEVEL] <= Levels.DEBUG) console.log(`[DEBUG] ${getIsoTime()} - ${msg}`); },
    info: (msg) => { if (Levels[Config.LEVEL] <= Levels.INFO) console.log(`[INFO] ${getIsoTime()} - ${msg}`); },
    error: (msg) => { if (Levels[Config.LEVEL] <= Levels.ERROR) console.error(`[ERROR] ${getIsoTime()} - ${msg}`); }
};

function withLogging(fn, level = 'INFO') {
    return async function (...args) {
        const reqLevel = Levels[level];
        const currentLevel = Levels[Config.LEVEL];

        if (currentLevel <= reqLevel) {
            const safeArgs = args.map(a => typeof a === 'object' ? '[Object/Array]' : a);
            logger[level.toLowerCase()](`Виклик [${fn.name}] з аргументами: ${safeArgs.join(', ')}`);
        }

        const start = performance.now();
        try {
            const result = await fn(...args);
            const end = performance.now();
            
            if (currentLevel <= reqLevel) {
                logger[level.toLowerCase()](`[${fn.name}] успішно виконано за ${(end - start).toFixed(2)}ms`);
            }
            return result;
        } catch (err) {
            logger.error(`[${fn.name}] впала з помилкою: ${err.message}`);
            throw err;
        }
    };
}

module.exports = { logger, withLogging, Config };