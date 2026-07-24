const logger = require('@jonquil-ai/logger');

module.exports = {
    category: 'action',
    platforms: ['whatsapp', 'telegram', 'discord'],
    
    schema: {
        name: "leave_reaction",
        description: "The user leaves an emoji (reaction) to the message.",
        parameters: {
            type: "object",
            properties: {
                emoji: { type: "string", description: "emoji_type: The one emoji you want to leave (example: 👍)" }
            },
            required: ["emoji"]
        }
    },

    execute: async (args, messageContext) => {
        logger.info('ACTION', `leave_reaction running. Emoji: ${args.emoji}`);
        
        return {
            success: true,
            gatewayAction: {
                type: 'react',
                payload: {
                    emoji: args.emoji,
                    targetId: messageContext.messageId 
                }
            }
        };
    }
};