const logger = require('@jonquil-ai/logger');
const { encode } = require('gpt-tokenizer');

const sessions = new Map();

const MAX_CONTEXT_TOKENS = parseInt(process.env.AI_MAX_CONTEXT_TOKENS) || 8000;

function getSessionHistory(chatId) {
    if (!sessions.has(chatId)) {
        sessions.set(chatId, []);
    }
    return sessions.get(chatId);
}

function calculateTokens(turn) {

    const contentStr = typeof turn.content === 'object' ? JSON.stringify(turn.content) : (turn.content || "");
    

    let toolStr = "";
    if (turn.toolCalls) {
        toolStr = turn.toolCalls.map(tc => `${tc.name} ${JSON.stringify(tc.args)}`).join(" ");
    }

    const fullText = `${turn.role} ${contentStr} ${toolStr}`;
    return encode(fullText).length;
}

function getTotalTokens(history) {
    return history.reduce((acc, turn) => acc + calculateTokens(turn), 0);
}

function saveToSession(chatId, newTurns) {
    const history = getSessionHistory(chatId);
    
    history.push(...newTurns);

    let currentTokens = getTotalTokens(history);

    if (currentTokens > MAX_CONTEXT_TOKENS) {
        logger.info('MEMORY', `[${chatId}] Token limit exceeded. (${currentTokens} > ${MAX_CONTEXT_TOKENS}). Clearing...`);
        
        let sliceIndex = 0;

        while (currentTokens > MAX_CONTEXT_TOKENS && sliceIndex < history.length) {
            currentTokens -= calculateTokens(history[sliceIndex]);
            sliceIndex++;
        }

        while (sliceIndex < history.length && history[sliceIndex].role !== 'user') {
            sliceIndex++;
        }

        if (sliceIndex > 0) {
            history.splice(0, sliceIndex);
            logger.debug('MEMORY', `[${chatId}] Memory cleared. Current Tokens: ${getTotalTokens(history)}`);
        }
    }
}

function clearSession(chatId) {
    sessions.delete(chatId);
    logger.info('MEMORY', `Clear message history for '${chatId}'`);
}

module.exports = {
    getSessionHistory,
    saveToSession,
    clearSession
};