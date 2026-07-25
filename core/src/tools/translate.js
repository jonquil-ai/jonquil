const { translate } = require('google-translate-api-x');
const logger = require('@jonquil-ai/logger');

module.exports = {
    category: 'tool',
    platforms: ['all'],
    schema: {
        name: "translate_text",
        description: "It translates texts from one language to another. To avoid confusion with homonyms, you can specify the source language (from).",
        parameters: {
            type: "object",
            properties: {
                text: { type: "string", description: "Text to be translated" },
                to: { type: "string", description: "Target language code (e.g., en, tr, de, es)" },
                from: { type: "string", description: "Source language code. If you understand the language from the context, be sure to specify it. If you are unsure, you can leave it as 'auto'. (e.g., en, fr, auto)" }
            },
            required: ["text", "to"]
        }
    },
    execute: async (args) => {
        const fromLang = args.from || 'auto';
        logger.info('TOOL', `translate_text running: [${fromLang} -> ${args.to}] Text: "${args.text.substring(0,15)}..."`);
        
        try {

            const res = await translate(args.text, { from: fromLang, to: args.to, autoCorrect: true });
            
            return { 
                success: true, 
                original: args.text, 
                translated: res.text, 
                detectedSource: res.from.language.iso, 
                requestedSource: fromLang 
            };
        } catch (error) {
            logger.error('TOOL', `Translate error: ${error.message}`);
            return { success: false, error: "Translation failed." };
        }
    }
};