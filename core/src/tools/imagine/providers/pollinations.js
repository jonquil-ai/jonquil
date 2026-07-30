const logger = require('@jonquil-ai/logger');

module.exports = {
    name: 'pollinations',
    generate: async (prompt) => {
        logger.info('TOOL', `Pollinations generating image: "${prompt.substring(0, 30)}..."`);
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;
        
        return { success: true, url: imageUrl, provider: 'pollinations' };
    }
};