/**
 * This structure is the "Data Transfer Object" (DTO) that messages 
 * from all platforms (WA, Telegram) will use when being transmitted 
 * to the CORE (Jonquil) service.
 */
class UniversalMessage {
    constructor({ platform, messageId, chatId, senderId, senderName, isGroup, text, hasMedia = false, quotedMessage = null }) {
        this.platform = platform;
        this.messageId = messageId;
        this.chatId = chatId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.isGroup = isGroup;
        this.text = text || "";
        this.hasMedia = hasMedia;
        this.quotedMessage = quotedMessage;
    }
    isEmpty() { return !this.text && !this.hasMedia; }
}

class UniversalResponse {
    constructor({ text = null, actions = [] }) {
        this.text = text; 
        this.actions = actions; 
    }
}

module.exports = { UniversalMessage, UniversalResponse };