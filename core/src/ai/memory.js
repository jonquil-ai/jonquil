const logger = require('@jonquil-ai/logger');

const sessions = new Map();

const MAX_HISTORY_LENGTH = 10; 

function getSessionHistory(chatId) {
    if (!sessions.has(chatId)) {
        sessions.set(chatId, []);
    }
    return sessions.get(chatId);
}

function saveToSession(chatId, userMessage, assistantMessage) {
    const history = getSessionHistory(chatId);
    
    history.push({ role: 'user', content: userMessage });
    if (assistantMessage) {
        history.push({ role: 'assistant', content: assistantMessage });
    }

    if (history.length > MAX_HISTORY_LENGTH) {
        history.splice(0, history.length - MAX_HISTORY_LENGTH);
    }
}

// todo: clear msg history action
function clearSession(chatId) {
    sessions.delete(chatId);
    logger.info('MEMORY', `Clear message history for '${chatId}'`);
}

module.exports = {
    getSessionHistory,
    saveToSession,
    clearSession
};