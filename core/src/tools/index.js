// core/src/tools/index.js
const fs = require('fs');
const path = require('path');
const logger = require('@jonquil-ai/logger');

const capabilities = new Map();

const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== 'index.js');

for (const file of files) {
    const item = require(path.join(__dirname, file));
    if (item.schema && item.schema.name) {
        capabilities.set(item.schema.name, item);
    }
}

logger.success('CORE', `${capabilities.size} Skills (Tools/Actions) have been loaded.`);

// filtering skills
function getSchemasForPlatform(platformName) {
    const schemas = [];
    capabilities.forEach((item) => {
        if (item.platforms.includes('all') || item.platforms.includes(platformName)) {
            schemas.push(item.schema);
        }
    });
    return schemas;
}

async function executeCapability(name, args, context) {
    const item = capabilities.get(name);
    
    if (!item) return { success: false, error: `Action not found: ${name}.` };

    if (!item.platforms.includes('all') && !item.platforms.includes(context.platform)) {
        return { success: false, error: `This action is not supported on platform '${context.platform}'.` };
    }

    return await item.execute(args, context);
}

module.exports = { getSchemasForPlatform, executeCapability };