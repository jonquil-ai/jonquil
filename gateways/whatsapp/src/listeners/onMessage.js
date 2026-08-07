const { UnifiedEvent, EventTypes } = require('@jonquil-ai/shared');
const { extractMedia } = require('../utils/mediaHandler');

function unwrapMessage(msgObj) {
    let content = msgObj;
    let keys = Object.keys(content);
    let type = keys.find(k => !['messageContextInfo', 'senderKeyDistributionMessage'].includes(k)) || keys[0];

    if (['ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2', 'documentWithCaptionMessage'].includes(type)) {
        content = content[type].message;
        if (!content) return { realType: 'unknown', realContent: {} };
        
        keys = Object.keys(content);
        type = keys.find(k => !['messageContextInfo', 'senderKeyDistributionMessage'].includes(k)) || keys[0];
    }
    return { realType: type, realContent: content };
}

async function handle(sock, rawMsg, eventBus) {
    if (rawMsg.key.fromMe || !rawMsg.message) return;

    const { realType: messageType, realContent: msgContent } = unwrapMessage(rawMsg.message);
    if (['senderKeyDistributionMessage', 'reactionMessage', 'unknown', 'secretEncryptedMessage'].includes(messageType)) return;
    
    const chatId = rawMsg.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    const senderId = rawMsg.key.participant || chatId;
    const senderName = rawMsg.pushName || undefined;
    const platformEventId = rawMsg.key.id;
    const timestamp = new Date((rawMsg.messageTimestamp || Date.now() / 1000) * 1000).toISOString();

    let eventType = EventTypes.MSG_USER;
    let messageObj = {};
    let mediaObj = null;
    let referenceObj = {};

    if (messageType === 'protocolMessage') {
        if (msgContent.protocolMessage?.type === 0) { // revoke
            eventType = EventTypes.SYS_MSG_REVOKE;
            referenceObj.targetId = msgContent.protocolMessage.key.id;
        } else if (msgContent.protocolMessage?.type === 14) { // edit -> todo: fix
            eventType = EventTypes.SYS_MSG_EDIT;
            referenceObj.targetId = msgContent.protocolMessage.key.id;
            const editedMsg = msgContent.protocolMessage.editedMessage;
            messageObj.text = editedMsg?.conversation || editedMsg?.extendedTextMessage?.text || undefined;
        }
    }
    else if (messageType === 'editedMessage') { // edit -> todo: fix
        eventType = EventTypes.SYS_MSG_EDIT;
        referenceObj.targetId = msgContent.editedMessage.message.protocolMessage.key.id;
        const editedMsg = msgContent.editedMessage.message.protocolMessage.editedMessage;
        messageObj.text = editedMsg?.conversation || editedMsg?.extendedTextMessage?.text || undefined;
    }
    // medias
    else if (['imageMessage', 'videoMessage', 'stickerMessage', 'audioMessage', 'documentMessage'].includes(messageType)) {
        messageObj.text = msgContent[messageType].caption || undefined;
        mediaObj = await extractMedia(rawMsg, messageType); 
    }
    // polls
    else if (messageType === 'pollCreationMessage' || messageType === 'pollCreationMessageV3') {
        const pollInfo = msgContent[messageType];
        messageObj.poll = { question: pollInfo.name, options: pollInfo.options.map(opt => opt.optionName) };
    }
    // poll votes
    else if (messageType === 'pollUpdateMessage') {
        eventType = EventTypes.ACTION_POLL_VOTE;
        referenceObj.targetId = msgContent.pollUpdateMessage.pollCreationMessageKey.id;
    }
    // locations
    else if (messageType === 'locationMessage' || messageType === 'liveLocationMessage') {
        const locInfo = msgContent[messageType];
        messageObj.location = { lat: locInfo.degreesLatitude, lng: locInfo.degreesLongitude, name: locInfo.name || locInfo.address || undefined };
    }
    // v-cards
    else if (messageType === 'contactMessage') {
        messageObj.contacts = [msgContent.contactMessage.vcard];
    }
    // messages
    else {
        messageObj.text = msgContent.conversation || msgContent.extendedTextMessage?.text || undefined;
    }

    // metadata -
    const contextInfo = msgContent[messageType]?.contextInfo || null;
    if (contextInfo) {
        if (contextInfo.stanzaId) referenceObj.replyToId = contextInfo.stanzaId;
        if (contextInfo.isForwarded) referenceObj.isForwarded = true;
        if (contextInfo.forwardingScore > 1) referenceObj.isForwardedManyTimes = true;
        if (contextInfo.mentionedJid && contextInfo.mentionedJid.length > 0) {
            messageObj.mentions = contextInfo.mentionedJid;
        }
    }

    const unifiedEvent = new UnifiedEvent({
        id: platformEventId, type: eventType, platform: 'whatsapp', timestamp: timestamp,
        chat: { id: chatId, isGroup: isGroup },
        author: { id: senderId, name: senderName },
        message: Object.keys(messageObj).length > 0 ? messageObj : undefined,
        media: mediaObj || undefined,
        reference: Object.keys(referenceObj).length > 0 ? referenceObj : undefined
    });

    if (unifiedEvent.isEmpty() && !unifiedEvent.isSystemEvent())  return;
    
    eventBus(unifiedEvent, rawMsg);
}

module.exports = { handle };