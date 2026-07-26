const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const { getFromScreenCache } = require('../cache');

module.exports = {
    name: 'sticker',

    execute: async (payload, { sock, universalMsg, rawMsg, log }) => {
        try {
            log.info('ACTION', 'Sticker production is starting....');
            
            let targetMsg = rawMsg; 

            if (payload.targetId) {
                targetMsg = getFromScreenCache(payload.targetId);
                
                if (!targetMsg) {
                    const contextInfo = rawMsg.message?.extendedTextMessage?.contextInfo || rawMsg.message?.imageMessage?.contextInfo;
                    if (contextInfo?.quotedMessage && contextInfo.stanzaId === payload.targetId) {
                        targetMsg = { message: contextInfo.quotedMessage };
                    } else {
                        log.warn('ACTION', 'The targeted message (ID) was not found in the cache!');
                        return;
                    }
                }
            }

            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: log, reuploadRequest: sock.updateMediaMessage });

            if (!buffer) {
                log.warn('ACTION', 'No media found for the sticker..');
                return;
            }

            const stickerBuffer = await sharp(buffer)
                .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .webp()
                .toBuffer();

            await sock.sendMessage(universalMsg.chatId, { sticker: stickerBuffer });
            log.success('ACTION', 'The sticker was successfully created and sent!');
        } catch (error) {
            log.error('ACTION', 'Sticker error:', error.message);
        }
    }
};