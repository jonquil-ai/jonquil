const log = require('@jonquil-ai/logger');

const sessions = new Map();

const MAX_HISTORY_LENGTH = process.env.AI_MAX_HISTORY_LENGTH || 30; 

function getSessionHistory(chatId) {
    if (!sessions.has(chatId)) {
        sessions.set(chatId, []);
    }
    return sessions.get(chatId);
}


function saveToSession(chatId, newTurns) {
    const history = getSessionHistory(chatId);
    
    history.push(...newTurns);

    if (history.length > MAX_HISTORY_LENGTH) {
        let sliceIndex = history.length - MAX_HISTORY_LENGTH;

        // slice the section up to the nearest user msg
        while (sliceIndex < history.length && history[sliceIndex].role !== 'user') {
            sliceIndex++;
        }

        history.splice(0, sliceIndex);
    }
}

// todo: clear msg history action
function clearSession(chatId) {
    sessions.delete(chatId);
    log.info('MEMORY', `Clear message history for '${chatId}'`);
}

module.exports = {
    getSessionHistory,
    saveToSession,
    clearSession
};