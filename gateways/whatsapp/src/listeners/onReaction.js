const { UnifiedEvent, EventTypes } = require('@jonquil-ai/shared');

async function handle(sock, reactionEvent, eventBus) {
    const reaction = reactionEvent.reaction;
    const isRemoval = !reaction.text;
    
    const eventType = isRemoval ? EventTypes.ACTION_REACT_REMOVE : EventTypes.ACTION_REACT_ADD;
    const targetId = reaction.key.id; 
    const senderId = reaction.key.participant || reactionEvent.key.remoteJid;
    const chatId = reactionEvent.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');

    const unifiedEvent = new UnifiedEvent({
        type: eventType,
        platform: 'whatsapp',
        chat: { id: chatId, isGroup: isGroup },
        author: { id: senderId },
        reference: { targetId: targetId },
        reaction: { emoji: isRemoval ? null : reaction.text }
    });

    eventBus(unifiedEvent, reactionEvent);
}

module.exports = { handle };