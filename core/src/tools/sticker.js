const logger = require('@jonquil-ai/logger');

module.exports = {
    category: 'action',
    platforms: ['whatsapp'],
    schema: {
        name: "make_a_sticker",
        description: "Converts a photo that a user has posted or quoted into a WhatsApp sticker. Use it when the user selects \"make this a sticker\".",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    },

    execute: async (args, messageContext) => {
        logger.info('ACTION', `make_a_sticker running...`);
        
        return {
            success: true,
            gatewayAction: {
                type: 'sticker',
                payload: { 
                    targetId: messageContext.messageId 
                }
            }
        };
    }
};