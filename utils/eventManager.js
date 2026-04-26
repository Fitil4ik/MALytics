const EventEmitter = require('events');
const { logger } = require('./logger');

class SafeEventBus extends EventEmitter {
    emit(eventName, ...args) {
        const listeners = this.listeners(eventName);
        
        if (listeners.length === 0 && eventName === 'error') {
            logger.error(`[EventBus] Увага: Неперехоплена помилка - ${args[0]}`);
            return false;
        }

        let handled = false;
        for (const listener of listeners) {
            try {
                listener.apply(this, args);
                handled = true;
            } catch (err) {
                this.emit('error', err);
            }
        }
        return handled;
    }
}

const eventBus = new SafeEventBus();

module.exports = eventBus;