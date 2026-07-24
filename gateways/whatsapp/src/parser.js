const { UniversalMessage } = require('@jonquil-ai/shared');

function parseBaileysMessage(rawMsg, platformName) {
    if (!rawMsg.message) return null;

    const messageId = rawMsg.key.id;
    const chatId = rawMsg.key.remoteJid;
    const senderId = rawMsg.key.participant || rawMsg.key.remoteJid;
    const senderName = rawMsg.pushName || "Guest";
    const isGroup = chatId.endsWith('@g.us');

    const messageType = Object.keys(rawMsg.message)[0];
    let text = "";
    let hasMedia = false;

    if (messageType === 'conversation') text = rawMsg.message.conversation;
    else if (messageType === 'extendedTextMessage') text = rawMsg.message.extendedTextMessage.text;
    else if (messageType === 'imageMessage' || messageType === 'videoMessage') {
        hasMedia = true;
        text = rawMsg.message[messageType].caption || "";
    }

    if (!text.trim() && !hasMedia) return null;

    return new UniversalMessage({
        platform: platformName,
        messageId, 
        chatId, 
        senderId, 
        senderName, 
        isGroup, 
        text, 
        hasMedia
    });
}

module.exports = { parseBaileysMessage };