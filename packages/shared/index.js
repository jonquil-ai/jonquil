/**
 * This structure is the "Data Transfer Object" (DTO) that messages 
 * from all platforms (WA, Telegram) will use when being transmitted 
 * to the CORE (Jonquil) service.
 */
class UniversalMessage {
    constructor({ platform, messageId, chatId, senderId, senderName, isGroup, text, hasMedia = false, quotedMessage = null, mentions = [], timestamp = null }) {
        this.platform = platform;
        this.messageId = messageId;
        this.chatId = chatId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.isGroup = isGroup;
        this.text = text || "";
        this.hasMedia = hasMedia;
        this.quotedMessage = quotedMessage;
        this.mentions = mentions;
        this.timestamp = timestamp || new Date().toISOString();
    }
    isEmpty() { return !this.text && !this.hasMedia; }
}

class UniversalResponse {
    constructor({ text = null, actions = [] }) {
        this.text = text;
        this.actions = actions;
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

module.exports = {
    UniversalMessage,
    UniversalResponse,
    CoreClient
};
