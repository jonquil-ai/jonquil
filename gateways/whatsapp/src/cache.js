const logger = require('@jonquil-ai/logger');

const MAX_CACHE_SIZE = 50;
const screenCache = new Map();

function saveToScreenCache(rawMsg) {
    if (!rawMsg || !rawMsg.key || !rawMsg.key.id) return;
    
    screenCache.set(rawMsg.key.id, rawMsg);
    

    if (screenCache.size > MAX_CACHE_SIZE) {
        const firstKey = screenCache.keys().next().value;
        screenCache.delete(firstKey);
    }
}

function getFromScreenCache(messageId) {
    return screenCache.get(messageId) || null;
}

module.exports = {
    saveToScreenCache,
    getFromScreenCache
};