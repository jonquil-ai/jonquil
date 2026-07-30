const logger = require('@jonquil-ai/logger');
const pollinations = require('./providers/pollinations');
const hf = require('./providers/hf');

module.exports = {
    category: 'action',
    platforms: ['whatsapp', 'telegram'],
    schema: {
        name: "generate_image",
        description: "Generates an image from a text description (prompt) and sends it to the chat. Use when user asks to draw, generate, or visualize something.",
        parameters: {
            type: "object",
            properties: {
                prompt: { type: "string", description: "Detailed English description of the image to generate" },
                display_message: { type: "string", description: 'A natural confirmation message to be shown to the user (such as "I am starting to draw").' }
            },
            required: ["prompt"]
        }
    },
    execute: async (args, messageContext) => {
        logger.info('ACTION', `generate_image running... Prompt: "${args.prompt}"`);

        const providerName = process.env.IMAGE_PROVIDER || 'pollinations';
        let result;

        if (providerName === 'hf') {
            result = await hf.generate(args.prompt);
        } else {
            result = await pollinations.generate(args.prompt);
        }

        if (!result.success) {
            return { success: false, error: result.error };
        }

        return {
            success: true,
            gatewayAction: {
                type: 'send_media',
                payload: {
                    mediaType: 'image',
                    url: result.url || null,
                    buffer: result.buffer || null,
                    caption: `🎨 "${args.prompt}"`
                }
            }
        };
    }
};