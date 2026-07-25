const logger = require('@jonquil-ai/logger');

module.exports = {
    category: 'action',
    platforms: ['whatsapp', 'telegram'],
    schema: {
        name: "send_voice_message",
        description: "It converts the text into a voice recording and sends it to the user.",
        parameters: {
            type: "object",
            properties: {
                text: { type: "string", description: "Text to be converted into speech" },
                lang: { type: "string", description: "Language code (e.g., tr, en, es)" }
            },
            required: ["text", "lang"]
        }
    },
    execute: async (args, messageContext) => {
        logger.info('ACTION', `tts running... Text: ${args.text.substring(0, 20)}...`);
        return {
            success: true,
            gatewayAction: {
                type: 'tts',
                payload: { text: args.text, lang: args.lang, targetId: messageContext.messageId }
            }
        };
    }
};