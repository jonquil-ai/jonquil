const { UniversalMessage } = require('@jonquil-ai/shared');

function extractText(messageObj) {
    if (!messageObj) return "";
    return messageObj.conversation || 
           messageObj.extendedTextMessage?.text || 
           messageObj.imageMessage?.caption || 
           messageObj.videoMessage?.caption || "";
}

function parseBaileysMessage(rawMsg, platformName) {
    if (!rawMsg.message) return null;

    const messageId = rawMsg.key.id;
    const chatId = rawMsg.key.remoteJid;
    const senderId = rawMsg.key.participant || rawMsg.key.remoteJid;
    const senderName = rawMsg.pushName || "Guest";
    const isGroup = chatId.endsWith('@g.us');
    
    const text = extractText(rawMsg.message);
    const messageType = Object.keys(rawMsg.message)[0];
    const hasMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage'].includes(messageType);

    if (!text.trim() && !hasMedia) return null;

    let quotedMessage = null;
    let mentions = [];
    
    const contextInfo = rawMsg.message.extendedTextMessage?.contextInfo || 
                        rawMsg.message.imageMessage?.contextInfo || 
                        rawMsg.message.videoMessage?.contextInfo;

    if (contextInfo) {
        // get mentions
        if (contextInfo.mentionedJid) {
            mentions = contextInfo.mentionedJid;
        }

        // get quoted msgs
        if (contextInfo.quotedMessage) {
            quotedMessage = {
                senderId: contextInfo.participant,
                senderName: contextInfo.participant === senderId ? "Itself" : contextInfo.participant.split('@')[0],
                text: extractText(contextInfo.quotedMessage)
            };
        }
    }

    const timestamp = new Date(rawMsg.messageTimestamp * 1000).toISOString();

    return new UniversalMessage({
        platform: platformName,
        messageId, chatId, senderId, senderName, isGroup, text, hasMedia,
        quotedMessage, mentions, timestamp
    });
}

module.exports = { parseBaileysMessage };