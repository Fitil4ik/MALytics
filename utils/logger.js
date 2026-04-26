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
    return function (...args) {
        const reqLevel = Levels[level];
        const currentLevel = Levels[Config.LEVEL];
        const isErrorLevel = level === 'ERROR';

        if (currentLevel <= reqLevel && !isErrorLevel) {
            const safeArgs = args.map(a => typeof a === 'object' ? '[Object/Array]' : a);
            logger[level.toLowerCase()](`Виклик [${fn.name}] з аргументами: ${safeArgs.join(', ')}`);
        }

        const start = performance.now();
        try {
            const result = fn(...args);

            if (result instanceof Promise) {
                return result.then(res => {
                    if (currentLevel <= reqLevel && !isErrorLevel) {
                        logger[level.toLowerCase()](`[${fn.name}] виконано за ${(performance.now() - start).toFixed(2)}ms`);
                    }
                    return res;
                }).catch(err => {
                    if (currentLevel <= Levels.ERROR) logger.error(`[${fn.name}] Помилка: ${err.message}`);
                    throw err;
                });
            }

            if (currentLevel <= reqLevel && !isErrorLevel) {
                logger[level.toLowerCase()](`[${fn.name}] виконано за ${(performance.now() - start).toFixed(2)}ms`);
            }
            return result;

            } catch (err) {
            if (currentLevel <= Levels.ERROR) logger.error(`[${fn.name}] Помилка: ${err.message}`);
            throw err;
        }
    };
}

module.exports = { logger, withLogging, Config };