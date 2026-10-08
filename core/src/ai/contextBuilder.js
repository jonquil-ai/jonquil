const fs = require('fs');
const path = require('path');

const soulPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'SOUL.md'), 'utf-8');
const rulesPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'RULES.md'), 'utf-8');
const ghostPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'GHOST.md'), 'utf-8');

class ContextBuilder {
    static buildSystemInstruction(platform, timestamp) {
        const dateObj = new Date(timestamp);
        const timeStr = dateObj.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' });

        let finalInstruction = `${soulPrompt}\n\n${rulesPrompt}\n\n`;

        const isGhostModeEnabled = true; // todo
        if (isGhostModeEnabled) {
            finalInstruction += `${ghostPrompt}\n\n`;
        }

        finalInstruction += `[Current Platform]: ${platform}\n[Current Time]: ${timeStr}`;

        return finalInstruction;
    }

    static buildUserPrompt(event) {
        const isGroup = event.chat?.isGroup ?? event.isGroup ?? false;
        const chatType = isGroup ? "Group Chat" : "Direct Message (DM)";
        const senderName = event.author?.name || event.senderName || "Unknown";
        const messageId = event.id || event.messageId || "---";
        const text = event.message?.text || event.text || "";

        let quoteContext = "";
        if (event.reference?.replyToId) {
            quoteContext = `\n(Replying to MsgID: ${event.reference.replyToId})`;
        } else if (event.quotedMessage) {
            quoteContext = `\n(Quoted MsgID: ${event.quotedMessage.messageId} | ${event.quotedMessage.senderName}): "${event.quotedMessage.text}"`;
        }

        let mediaTag = "";
        const mediaType = event.media?.type || event.mediaType;
        if (mediaType) {
            mediaTag = `\n[Media]: User sent a/an [${mediaType.toUpperCase()}].`;
        }

        return `[MsgID: ${messageId}] [User: ${senderName}] [Environment: ${chatType}]${quoteContext}\n[Message]: ${text}${mediaTag}`;
    }

    static extractUserMedia(event) {
        if (event.media?.data) {
            return { data: event.media.data, mimeType: event.media.mime };
        }
        if (event.mediaData) {
            return { data: event.mediaData, mimeType: event.mediaMime };
        }
        return null;
    }
}

module.exports = ContextBuilder;