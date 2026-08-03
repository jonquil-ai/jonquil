/**
 * This structure is the "Data Transfer Object" (DTO) that messages 
 * from all platforms (WA, Telegram) will use when being transmitted 
 * to the CORE (Jonquil) service.
 */
class UniversalMessage {
    constructor({ platform, messageId, chatId, senderId, senderName, isGroup, text, hasMedia = false, mediaData = null, mediaMime = null, mediaType = null, quotedMessage = null, mentions = [], timestamp = null, systemEvent = null }) {        this.platform = platform;
        this.messageId = messageId;
        this.chatId = chatId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.isGroup = isGroup;
        this.text = text || "";
        this.hasMedia = hasMedia;
        this.mediaData = mediaData;
        this.mediaMime = mediaMime;
        this.mediaType = mediaType; // 'image', 'video', 'sticker', 'audio'
        this.quotedMessage = quotedMessage;
        this.mentions = mentions;
        this.timestamp = timestamp || new Date().toISOString();
        this.systemEvent = systemEvent;
    }
    isEmpty() { return !this.text && !this.hasMedia && !this.systemEvent; }
}

class UniversalResponse {
    constructor({ text = null, actions = [], systemAction = null, systemPayload = null }) {
        this.text = text;
        this.actions = actions;
        this.systemAction = systemAction;
        this.systemPayload = systemPayload; 
    }
}

/**
 * The common client that all gateways will use to connect to Jonquil.
 */
class CoreClient {
    constructor(coreUrl = 'http://localhost:3000/api/chat') {
        this.coreUrl = coreUrl;
    }

    async sendMessage(universalMessage) {
        try {
            const response = await fetch(this.coreUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(universalMessage)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            return new UniversalResponse(data.reply);
        } catch (error) {
            console.error("[CORE_CLIENT] Jonquil is unreachable:", error.message);
            return null;
        }
    }
}


/**
 * A "Message Debouncer" that all Gateways can use in common.
 * It holds incoming messages for a specific period and sends 
 * them to the callback as an array.
 */
class MessageBatcher {
    constructor(delayMs = 3000, onBatchReady) {
        this.delayMs = delayMs;
        this.onBatchReady = onBatchReady;
        this.queues = new Map();
        this.timers = new Map();
    }

    add(chatId, universalMsg, rawMsg) {
        if (!this.queues.has(chatId)) {
            this.queues.set(chatId, []);
        }
        
        this.queues.get(chatId).push({ universalMsg, rawMsg });

        if (this.timers.has(chatId)) {
            clearTimeout(this.timers.get(chatId));
        }

        this.timers.set(chatId, setTimeout(() => {
            const batch = this.queues.get(chatId);
            this.queues.delete(chatId);
            this.timers.delete(chatId);
            
            this.onBatchReady(chatId, batch);
        }, this.delayMs));
    }
}


const SystemEvents = {
    TOS_APPROVE: 'TOS_APPROVE'
};

const SystemActions = {
    SHOW_TOS_PROMPT_DM: 'SHOW_TOS_PROMPT_DM',
    SHOW_TOS_PROMPT_GROUP: 'SHOW_TOS_PROMPT_GROUP',
    TOS_APPROVED_SUCCESS: 'TOS_APPROVED_SUCCESS',
    IGNORE: 'IGNORE'
};

module.exports = {
    UniversalMessage,
    UniversalResponse,
    CoreClient,
    MessageBatcher,
    SystemEvents,
    SystemActions
};