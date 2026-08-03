const fs = require('fs');
const path = require('path');

const soulPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'SOUL.md'), 'utf-8');
const rulesPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'RULES.md'), 'utf-8');
const ghostPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'GHOST.md'), 'utf-8');

class ContextBuilder {

    static buildSystemInstruction(platform, timestamp, personaSettings) {
        const dateObj = new Date(timestamp);
        const timeStr = dateObj.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' });
        
        let finalInstruction = `${soulPrompt}\n\n${rulesPrompt}\n\n`;

       const isGhostModeEnabled = true; // todo
       if (isGhostModeEnabled) {
           finalInstruction += `${ghostPrompt}\n\n`;
       }

       // inject db persona overrides if present
       if (personaSettings) {
           finalInstruction += `[USER SPECIFIC PERSONA SETTINGS]:\n${personaSettings}\n\n`;
       }

        finalInstruction += `[Current Platform]: ${platform}\n[Current Time]: ${timeStr}`;
        
        return finalInstruction;
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

        const roleTag = universalMessage.role ? ` [Role: ${universalMessage.role}]` : "";
        
        return `[MsgID: ${universalMessage.messageId}] [User: ${universalMessage.senderName}]${roleTag} [Environment: ${chatType}]${quoteContext}\n[Message]: ${universalMessage.text}${mediaTag}`;    }

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