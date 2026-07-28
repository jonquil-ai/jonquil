const logger = require('@jonquil-ai/logger');

const chatQueues = new Map();
const isProcessing = new Map();

async function enqueueTask(chatId, task) {
    if (!chatQueues.has(chatId)) {
        chatQueues.set(chatId, []);
    }
    
    chatQueues.get(chatId).push(task);
    
    processNext(chatId);
}

async function processNext(chatId) {

    if (isProcessing.get(chatId)) return;

    const queue = chatQueues.get(chatId);
    if (!queue || queue.length === 0) return;

    isProcessing.set(chatId, true);
    

    const nextTask = queue.shift();

    try {
        await nextTask();
    } catch (error) {
        logger.error('QUEUE', `Task execution error for ${chatId}:`, error.message);
    } finally {

        isProcessing.set(chatId, false);     
        processNext(chatId);
    }
}

module.exports = { enqueueTask };