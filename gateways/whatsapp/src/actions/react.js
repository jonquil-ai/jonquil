module.exports = {
    name: 'react',
    execute: async (payload, { sock, universalMsg, logger }) => {
        try {
            await sock.sendMessage(universalMsg.chatId, {
                react: {
                    text: payload.emoji,
                    key: {
                        id: payload.targetId,
                        remoteJid: universalMsg.chatId,
                        participant: universalMsg.senderId
                    }
                }
            });
            logger.success('WA_ACTION.react', `Reaction sent: ${payload.emoji}`);
        } catch (error) {
            logger.error('WA_ACTION.react', 'Error:', error.message);
        }
    }
};