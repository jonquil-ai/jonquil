const { UnifiedEvent, EventTypes } = require('@jonquil-ai/shared');

async function handle(sock, presenceUpdate, eventBus) {
    const chatId = presenceUpdate.id;
    const isGroup = chatId.endsWith('@g.us');

    for (const [senderId, data] of Object.entries(presenceUpdate.presences)) {
        const status = data.lastKnownPresence; 
        
        let eventType = EventTypes.SYS_PRESENCE_OFFLINE;
        if (status === 'available') eventType = EventTypes.SYS_PRESENCE_ONLINE;
        else if (status === 'composing') eventType = EventTypes.SYS_PRESENCE_TYPING;
        else if (status === 'recording') eventType = EventTypes.SYS_PRESENCE_RECORDING;
        else if (status === 'paused') eventType = EventTypes.SYS_PRESENCE_PAUSED;

        const unifiedEvent = new UnifiedEvent({
            type: eventType,
            platform: 'whatsapp',
            chat: { id: chatId, isGroup: isGroup },
            author: { id: senderId },
            presence: { status: status }
        });

        eventBus(unifiedEvent, presenceUpdate);
    }
}

module.exports = { handle };