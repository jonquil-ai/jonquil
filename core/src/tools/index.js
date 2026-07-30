const fs = require('fs');
const path = require('path');
const logger = require('@jonquil-ai/logger');

const capabilities = new Map();

const items = fs.readdirSync(__dirname);

for (const item of items) {
    if (item === 'index.js') continue;

    const fullPath = path.join(__dirname, item);
    const stat = fs.statSync(fullPath);

    let moduleItem = null;

    if (stat.isFile() && item.endsWith('.js')) {
        moduleItem = require(fullPath);
    } else if (stat.isDirectory()) {
        const indexPath = path.join(fullPath, 'index.js');
        if (fs.existsSync(indexPath)) {
            moduleItem = require(indexPath);
        }
    }

    if (moduleItem && moduleItem.schema && moduleItem.schema.name) {
        capabilities.set(moduleItem.schema.name, moduleItem);
    }
}

logger.success('CORE', `${capabilities.size} Skills (Tools/Actions) have been loaded.`);

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