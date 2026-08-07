const { UnifiedEvent, EventTypes } = require('@jonquil-ai/shared');

async function handleParticipants(sock, update, eventBus) {
    const chatId = update.id;
    const action = update.action; 
    
    let eventType = EventTypes.SYS_GROUP_JOIN;
    if (action === 'remove') eventType = EventTypes.SYS_GROUP_LEAVE;
    else if (action === 'promote') eventType = EventTypes.SYS_GROUP_PROMOTE;
    else if (action === 'demote') eventType = EventTypes.SYS_GROUP_DEMOTE;

    const targets = update.participants.map(p => typeof p === 'object' ? (p.id || p.jid) : p);

    const unifiedEvent = new UnifiedEvent({
        type: eventType,
        platform: 'whatsapp',
        chat: { id: chatId, isGroup: true },
        author: { id: update.author || "System" },
        group: {
            action: action,
            targetAuthors: targets
        }
    });
    
    eventBus(unifiedEvent, update);
}

async function handleMetadata(sock, updates, eventBus) {
    for (const update of updates) {
        const unifiedEvent = new UnifiedEvent({
            type: EventTypes.SYS_GROUP_UPDATE,
            platform: 'whatsapp',
            chat: { id: update.id, isGroup: true },
            author: { id: update.author || "System" },
            group: {
                action: 'metadata_update',
                changes: {
                    subject: update.subject || undefined,
                    desc: update.desc || undefined,
                    announce: update.announce !== undefined ? update.announce : undefined,
                    restrict: update.restrict !== undefined ? update.restrict : undefined
                }
            }
        });
        eventBus(unifiedEvent, update);
    }
}

module.exports = { handleParticipants, handleMetadata };