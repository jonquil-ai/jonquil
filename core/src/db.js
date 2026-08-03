require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');
const logger = require('@jonquil-ai/logger');

// resolve absolute path for self-hosting safety
const rawUrl = process.env.DATABASE_URL || 'file:./system.db';
const relativePath = rawUrl.replace('file:', '');
const absoluteDbPath = path.resolve(__dirname, '../../', relativePath);

const adapter = new PrismaBetterSqlite3({ url: `file:${absoluteDbPath}` });

const prisma = new PrismaClient({
    adapter,
    log: process.env.AI_DEBUG_MODE === 'true' ? ['error', 'warn'] : ['error'],
});

logger.success('DATABASE', 'system database connected successfully.');

module.exports = prisma;