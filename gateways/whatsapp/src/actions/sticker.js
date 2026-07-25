const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

module.exports = {
    name: 'sticker',
    execute: async (payload, { sock, universalMsg, rawMsg, log }) => {
        try {
            log.info('ACTION', 'Sticker production is starting....');
            
             const contextInfo = rawMsg.message?.extendedTextMessage?.contextInfo || 
                                rawMsg.message?.imageMessage?.contextInfo;
            
            const isQuotedImage = !!contextInfo?.quotedMessage?.imageMessage;
            
            const targetMsg = isQuotedImage 
                ? { message: contextInfo.quotedMessage } // quoted img
                : rawMsg; // direct img

            // download img
            const buffer = await downloadMediaMessage(
                targetMsg,
                'buffer',
                {},
                { logger: log, reuploadRequest: sock.updateMediaMessage }
            );

            if (!buffer) {
                log.warn('ACTION', 'No suitable media was found for the sticker.');
                return;
            }

            // convert to sticker format -> 512x512 webp
            const stickerBuffer = await sharp(buffer)
                .resize(512, 512, { 
                    fit: 'contain', // no crop
                    background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent bg
                })
                .webp()
                .toBuffer();

            // send sticker
            await sock.sendMessage(
                universalMsg.chatId, 
                { sticker: stickerBuffer },
                { quoted: rawMsg }
            );

            log.success('ACTION', 'The sticker was successfully created and sent.!');
        } catch (error) {
            log.error('ACTION', 'Sticker Error:', error.message);
        }
    }
};