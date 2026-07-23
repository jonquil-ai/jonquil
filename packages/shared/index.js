/**
 * This structure is the "Data Transfer Object" (DTO) that messages 
 * from all platforms (WA, Telegram) will use when being transmitted 
 * to the CORE (Jonquil) service.
 */
class UniversalMessage {
    constructor({
        platform,            // 'whatsapp', 'telegram', etc.
        messageId,           // platform's original message ID
        chatId,              // Group or DM ID
        senderId,            // sender's normalized number/ID
        senderName,          // sender's display name
        isGroup,             // is group message?
        text,                // content of the message (including media captions)
        hasMedia = false,    // is there any media?
        quotedMessage = null // the message being replied to (its content and ID, if any)
    }) {
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

    isEmpty() {
        return !this.text && !this.hasMedia;
    }
}

module.exports = {
    UniversalMessage
};