const { UniversalMessage } = require('@jonquil-ai/shared');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

function extractText(messageObj) {
    if (!messageObj) return "";
    return messageObj.conversation || 
           messageObj.extendedTextMessage?.text || 
           messageObj.imageMessage?.caption || 
           messageObj.videoMessage?.caption || "";
}

async function parseBaileysMessage(rawMsg, platformName, logger) {
    if (!rawMsg.message) return null;

    const messageId = rawMsg.key.id;
    const chatId = rawMsg.key.remoteJid;
    const senderId = rawMsg.key.participant || rawMsg.key.remoteJid;
    const senderName = rawMsg.pushName || "Guest";
    const isGroup = chatId.endsWith('@g.us');
    
    const text = extractText(rawMsg.message);
    const messageType = Object.keys(rawMsg.message)[0];
    const hasMedia = ['imageMessage', 'videoMessage', 'stickerMessage'].includes(messageType);

    let mediaData = null;
    let mediaMime = null;

    if (hasMedia) {
        try {
            const buffer = await downloadMediaMessage(rawMsg, 'buffer', {}, { logger });
            mediaData = buffer.toString('base64');
            mediaMime = rawMsg.message[messageType].mimetype;
        } catch (e) {
            logger.error('PARSER', 'Media could not be downloaded:', e.message);
        }
    }

    let quotedMessage = null;
    let mentions = [];
    
    const contextInfo = rawMsg.message.extendedTextMessage?.contextInfo || 
                        rawMsg.message.imageMessage?.contextInfo || 
                        rawMsg.message.videoMessage?.contextInfo;

    if (contextInfo) {
        if (contextInfo.mentionedJid) mentions = contextInfo.mentionedJid;

        if (contextInfo.quotedMessage) {
            const qMsgType = Object.keys(contextInfo.quotedMessage)[0];
            let qMediaData = null;
            let qMediaMime = null;

            // quoted medias
            if (['imageMessage', 'videoMessage', 'stickerMessage'].includes(qMsgType)) {
                try {

                    const fakeMsg = { message: contextInfo.quotedMessage };
                    const qBuffer = await downloadMediaMessage(fakeMsg, 'buffer', {}, { logger });
                    qMediaData = qBuffer.toString('base64');
                    qMediaMime = contextInfo.quotedMessage[qMsgType].mimetype;
                } catch (e) {
                    logger.error('PARSER', 'The quoted media could not be downloaded:', e.message);
                }
            }


            quotedMessage = {
                senderId: contextInfo.participant,
                senderName: contextInfo.participant === senderId ? "Itself" : contextInfo.participant.split('@')[0],
                text: extractText(contextInfo.quotedMessage),
                mediaData: qMediaData,
                mediaMime: qMediaMime
            };
        }
    }

    if (!text.trim() && !hasMedia && !quotedMessage) return null;

    const timestamp = new Date(rawMsg.messageTimestamp * 1000).toISOString();

    return new UniversalMessage({
        platform: platformName,
        messageId, chatId, senderId, senderName, isGroup, text, hasMedia,
        mediaData, mediaMime, quotedMessage, mentions, timestamp
    });
}

module.exports = { parseBaileysMessage };