module.exports = {
    name: 'react',
    execute: async (payload, { sock, universalMsg, log }) => {
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
            log.success('ACTION', `react: ${payload.emoji}`);
        } catch (error) {
            log.error('ACTION', 'react', error.message);
        }
    }
};