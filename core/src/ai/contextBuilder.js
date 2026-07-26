const fs = require('fs');
const path = require('path');

const soulPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'SOUL.md'), 'utf-8');
const rulesPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'RULES.md'), 'utf-8');

class ContextBuilder {
    static buildSystemInstruction(platform, timestamp) {
        const dateObj = new Date(timestamp);
        const timeStr = dateObj.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' });
        return `${soulPrompt}\n\n${rulesPrompt}\n\n[Current Platform]: ${platform}\n[Current Time]: ${timeStr}`;
    }

    static buildUserPrompt(universalMessage) {
        const chatType = universalMessage.isGroup ? "Group Chat" : "Direct Message (DM)";
        
        let quoteContext = "";
        if (universalMessage.quotedMessage) {
            let qMediaTag = universalMessage.quotedMessage.hasMedia ? ` [Attached Media: ${universalMessage.quotedMessage.mediaType}]` : "";
            quoteContext = `\n(Quoted MsgID: ${universalMessage.quotedMessage.messageId} | ${universalMessage.quotedMessage.senderName}): "${universalMessage.quotedMessage.text}"${qMediaTag}`;
        }

        let mediaTag = "";
        if (universalMessage.hasMedia) {
            mediaTag = `\n[Media]: User sent a/an [${universalMessage.mediaType.toUpperCase()}].`;
        }

        return `[MsgID: ${universalMessage.messageId}] [User: ${universalMessage.senderName}] [Environment: ${chatType}]${quoteContext}\n[Message]: ${universalMessage.text}${mediaTag}`;
    }

    static extractUserMedia(universalMessage) {
        if (universalMessage.hasMedia) {
            return { data: universalMessage.mediaData, mimeType: universalMessage.mediaMime };
        }
        if (universalMessage.quotedMessage && universalMessage.quotedMessage.hasMedia) {
            return { data: universalMessage.quotedMessage.mediaData, mimeType: universalMessage.quotedMessage.mediaMime };
        }
        return null;
    }
}

module.exports = ContextBuilder;