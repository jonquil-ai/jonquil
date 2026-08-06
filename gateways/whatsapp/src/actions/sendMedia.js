module.exports = {
    name: 'send_media',
    execute: async (payload, { sock, universalMsg, rawMsg, log }) => {
        try {
            log.info('ACTION', `Sending media (${payload.mediaType || 'image'})...`);
            
            const mediaType = payload.mediaType || 'image';
            const caption = payload.caption || "";
            let mediaContent = {};

            if (payload.buffer) {
                const buffer = Buffer.isBuffer(payload.buffer) ? payload.buffer : Buffer.from(payload.buffer, 'base64');
                mediaContent[mediaType] = buffer;
            } else if (payload.url) {
                mediaContent[mediaType] = { url: payload.url };
            } else {
                log.error('ACTION', 'No buffer or url provided for send_media!');
                return;
            }

            if (caption) mediaContent.caption = caption;

            await sock.sendMessage(universalMsg.chatId, mediaContent, { quoted: rawMsg });
            log.success('ACTION', `Media (${mediaType}) sent successfully.`);
        } catch (error) {
            log.error('ACTION', 'send_media error:', error.message);
        }
    }
};