const axios = require('axios');
const logger = require('@jonquil-ai/logger');

module.exports = {
    category: 'tool',
    platforms: ['all'],
    schema: {
        name: "wikipedia_search",
        description: "Searching Wikipedia brings up summary information about people, places, or concepts.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search word or topic" },
                lang: { type: "string", description: "The language code to search for (e.g., tr, en). Default: en" }
            },
            required: ["query"]
        }
    },
    execute: async (args) => {
        const lang = args.lang || 'en';
        logger.info('TOOL', `wiki running. Query: ${args.query} (${lang})`);
        try {
            const searchRes = await axios.get(`https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(args.query)}&limit=1&format=json`);
            const title = searchRes.data[1][0];
            const link = searchRes.data[3][0];
            
            if (!title) return { success: false, error: "No results were found on Wikipedia." };

            const summaryRes = await axios.get(`https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&redirects=1&format=json&titles=${encodeURIComponent(title)}`);
            const pages = summaryRes.data.query.pages;
            const extract = pages[Object.keys(pages)[0]].extract;

            return { success: true, title, summary: extract.substring(0, 800), link };
        } catch (error) {
            logger.error('TOOL', `Wiki error: ${error.message}`);
            return { success: false, error: "Wikipedia is unreachable." };
        }
    }
};