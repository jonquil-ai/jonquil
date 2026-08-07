const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function extractMedia(rawMsg, messageType) {
    try {
        const msgObject = rawMsg.message[messageType];
        
        const buffer = await downloadMediaMessage(rawMsg, 'buffer', {}, { reuploadRequest: () => {} });
        
        if (!buffer) return null;

        return {
            type: messageType.replace('Message', ''), // image, video, audio, document, sticker
            mime: msgObject.mimetype || null,
            isVoiceNote: msgObject.ptt || false,
            duration: msgObject.seconds || undefined, 
            data: buffer.toString('base64')      
        };
    } catch (error) {
        return null;
    }
}

module.exports = { extractMedia };