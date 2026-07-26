const { UniversalMessage } = require('@jonquil-ai/shared');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

function extractText(messageObj) {
    if (!messageObj) return "";
    return messageObj.conversation || 
           messageObj.extendedTextMessage?.text || 
           messageObj.imageMessage?.caption || 
           messageObj.videoMessage?.caption || "";
}

async function fetchMedia(msgObject, msgType, logger) {
    try {
        const buffer = await downloadMediaMessage(msgObject, 'buffer', {}, { logger });
        return {
            mediaData: buffer.toString('base64'),
            mediaMime: msgObject.message[msgType].mimetype,
            mediaType: msgType.replace('Message', '')
        };
    } catch (e) {
        logger.error('PARSER', 'Media could not be downloaded:', e.message);
        return null;
    }
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
    const hasMedia = ['imageMessage', 'videoMessage', 'stickerMessage', 'audioMessage'].includes(messageType);


    let mediaObj = hasMedia ? await fetchMedia(rawMsg, messageType, logger) : null;


    let quotedMessage = null;
    let mentions = [];
    const contextInfo = rawMsg.message.extendedTextMessage?.contextInfo || 
                        rawMsg.message.imageMessage?.contextInfo || 
                        rawMsg.message.videoMessage?.contextInfo;

    if (contextInfo) {
        if (contextInfo.mentionedJid) mentions = contextInfo.mentionedJid;

        if (contextInfo.quotedMessage) {
            const qMsgType = Object.keys(contextInfo.quotedMessage)[0];
            const isQuotedMedia = ['imageMessage', 'videoMessage', 'stickerMessage', 'audioMessage'].includes(qMsgType);
            
            const qMediaObj = isQuotedMedia ? await fetchMedia({ message: contextInfo.quotedMessage }, qMsgType, logger) : null;

            quotedMessage = {
                messageId: contextInfo.stanzaId,
                senderId: contextInfo.participant,
                senderName: contextInfo.participant === senderId ? "Itself" : contextInfo.participant.split('@')[0],
                text: extractText(contextInfo.quotedMessage),
                mediaType: qMediaObj?.mediaType || null,
                mediaData: qMediaObj?.mediaData || null,
                mediaMime: qMediaObj?.mediaMime || null
            };
        }
    }

    if (!text.trim() && !hasMedia && !quotedMessage) return null;

    const timestamp = new Date(rawMsg.messageTimestamp * 1000).toISOString();

    return new UniversalMessage({
        platform: platformName,
        messageId, chatId, senderId, senderName, isGroup, text, hasMedia,
        mediaType: mediaObj?.mediaType, 
        mediaData: mediaObj?.mediaData, 
        mediaMime: mediaObj?.mediaMime, 
        quotedMessage, mentions, timestamp
    });
}

module.exports = { parseBaileysMessage };