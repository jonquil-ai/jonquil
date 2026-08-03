const axios = require('axios');

module.exports = {
    name: 'send_media',
    execute: async (payload, { sock, universalMsg, rawMsg, log }) => {
        try {
            log.info('ACTION', `Sending media (${payload.mediaType || 'image'})...`);
            
            const mediaType = payload.mediaType || 'image';
            const caption = payload.caption || "";
            let mimeType = payload.mimeType || payload.mimetype;
            let mediaContent = {};

            if (payload.buffer) {
                const buffer = Buffer.isBuffer(payload.buffer) ? payload.buffer : Buffer.from(payload.buffer, 'base64');
                mediaContent[mediaType] = buffer;
            } else if (payload.url) {
                if (mediaType === 'audio') {

                    const res = await axios.get(payload.url, { responseType: 'arraybuffer' });
                    mediaContent[mediaType] = Buffer.from(res.data);


                    const headerContentType = res.headers['content-type'];
                    if (headerContentType) {
                        if (headerContentType.includes('m4a') || headerContentType.includes('aac') || headerContentType.includes('mp4')) {
                            mimeType = 'audio/mp4';
                        } else if (headerContentType.includes('mpeg') || headerContentType.includes('mp3')) {
                            mimeType = 'audio/mpeg';
                        } else {
                            mimeType = headerContentType;
                        }
                        mimeType = 'audio/mp4';
                        // todo: fix dynamic content-type header reading -> (audio/x-m4p)
                    
                    }
                } else {
                    mediaContent[mediaType] = { url: payload.url };
                }
            } else {
                log.error('ACTION', 'No buffer or url provided for send_media!');
                return;
            }

            // default fallback mimeType
            if (!mimeType) {
                mimeType = mediaType === 'audio' ? 'audio/mp4' : undefined;
            }

            mediaContent.mimetype = mimeType;

            // seperate caption
            if (mediaType === 'audio') {
                if (caption) {
                    await sock.sendMessage(universalMsg.chatId, { text: caption }, { quoted: rawMsg });
                }
                await sock.sendMessage(universalMsg.chatId, mediaContent);
            } else {
                if (caption) mediaContent.caption = caption;
                await sock.sendMessage(universalMsg.chatId, mediaContent, { quoted: rawMsg });
            }

            log.success('ACTION', `Media (${mediaType}) sent successfully with mimetype: ${mimeType}`);
        } catch (error) {
            log.error('ACTION', 'send_media error:', error.message);
        }
    }
};