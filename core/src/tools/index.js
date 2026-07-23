const fs = require('fs');
const path = require('path');
const logger = require('@jonquil-ai/logger');

const toolsRegistry = new Map();
const toolSchemas = [];

const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== 'index.js');

for (const file of files) {
    const tool = require(path.join(__dirname, file));
    if (tool.schema && tool.schema.name) {
        toolsRegistry.set(tool.schema.name, tool);
        toolSchemas.push(tool.schema);
    }
}

logger.success('CORE', `${toolsRegistry.size} number of tools are ready.`);

async function executeTool(name, args) {
    const tool = toolsRegistry.get(name);
    if (!tool) {
        return { error: `Tool ${name} not found.` };
    }
    return await tool.execute(args);
}

module.exports = {
    toolSchemas,
    executeTool
};