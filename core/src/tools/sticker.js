const log = require('@jonquil-ai/logger');


module.exports = {
    category: 'action',
    platforms: ['whatsapp'],
    schema: {
        name: "make_a_sticker",
        description: "Converts a photo that a user has posted or quoted into a WhatsApp sticker. Use it when the user selects \"make this a sticker\".",
        parameters: {
            type: "object",
            properties: {
                message_id: { type: "string", description: "The MsgID of the media to be used for the sticker." }
            },
            required: []
        }
    },

    execute: async (args, messageContext) => {
        log.info('ACTION', `make_a_sticker running...`);

        let target = args.message_id || messageContext.messageId;
        if (!args.message_id && messageContext.quotedMessage) {
            target = messageContext.quotedMessage.messageId;
        }

        return { success: true, gatewayAction: { type: 'sticker', payload: { targetId: target } } };
    }
};