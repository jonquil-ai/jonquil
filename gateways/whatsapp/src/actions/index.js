const fs = require('fs');
const path = require('path');
const logger = require('@jonquil-ai/logger');

const actions = new Map();

const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== 'index.js');

for (const file of files) {
    const action = require(path.join(__dirname, file));
    if (action.name) {
        actions.set(action.name, action);
    }
}

logger.success('WA_GATEWAY', `${actions.size} number of Actions are ready.`);

async function executeAction(actionType, payload, context) {
    const action = actions.get(actionType);
    if (!action) {
        logger.warn('WA_GATEWAY', `Action not found: ${actionType}`);
        return;
    }
    await action.execute(payload, context);
}

module.exports = { executeAction };