const fs = require('fs');

const Config = {
    LEVEL: 'DEBUG',
    transports: [
        { type: 'console', level: 'INFO' },
        { type: 'file', path: './debug.log', level: 'DEBUG' }
    ]
};

const Levels = { DEBUG: 1, INFO: 2, ERROR: 3 };
const getIsoTime = () => new Date().toISOString();
const printLog = (level, msg) => {
    if (Levels[Config.LEVEL] <= Levels[level]) {
        const logString = `[${level}] ${getIsoTime()} - ${msg}`;

        Config.transports.forEach(transport => {
            if (Levels[transport.level || Config.LEVEL] <= Levels[level]) {
                if (transport.type === 'console') {
                    console[level === 'ERROR' ? 'error' : 'log'](logString);
                } else if (transport.type === 'file' && transport.path) {
                    try {
                        fs.appendFileSync(transport.path, logString + '\n');
                    } catch (err) {
                        console.error(`[LOGGER ERROR] Не вдалося записати лог у файл ${transport.path}:`, err.message);
                    }
                }
            }
        });
    }
};

const logger = {
    debug: (msg) => printLog('DEBUG', msg),
    info: (msg) => printLog('INFO', msg),
    error: (msg) => printLog('ERROR', msg)
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
            const result = fn.apply(this, args);

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