const { UnifiedEvent, EventTypes } = require('@jonquil-ai/shared');

async function handle(sock, calls, eventBus) {
    for (const call of calls) {
        const unifiedEvent = new UnifiedEvent({
            id: call.id,
            type: EventTypes.SYS_CALL_OFFER,
            platform: 'whatsapp',
            timestamp: new Date((call.date || Date.now() / 1000) * 1000).toISOString(),
            chat: { id: call.chatId, isGroup: false },
            author: { id: call.from },
            call: {
                isVideo: call.isVideo || false,
                status: call.status || 'offer' // offer, timeout, reject, relaylatency
            }
        });

        eventBus(unifiedEvent, call);
    }
}

module.exports = { handle };