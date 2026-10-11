const { UnifiedEvent, EventTypes } = require('@jonquil-ai/shared');
const axios = require('axios');

async function fetchTelegramMedia(ctx, fileId) {
    try {
        const link = await ctx.telegram.getFileLink(fileId);
        const response = await axios.get(link.href, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        return buffer.toString('base64');
    } catch (e) {
        return null;
    }
}

async function parseTelegramMessage(ctx, platformName) {
    const msg = ctx.message;
    if (!msg) return null;

    // 1. root - metas
    const messageId = msg.message_id.toString();
    const chatId = msg.chat.id.toString();
    const senderId = msg.from.id.toString();
    const senderName = msg.from.first_name || msg.from.username || "Guest";
    const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
    const timestamp = new Date(msg.date * 1000).toISOString();

    // 2. text - mentions
    const text = msg.text || msg.caption || undefined;
    let mentions = [];
    if (msg.entities) {
        msg.entities.forEach(entity => {
            if (entity.type === 'mention') {
                const mentionText = (msg.text || msg.caption).substring(entity.offset, entity.offset + entity.length);
                mentions.push(mentionText);
            }
        });
    }

    // 3. media
    let mediaObj = undefined;
    if (msg.photo || msg.video || msg.sticker || msg.voice || msg.audio) {
        let type = null, mime = null;
        if (msg.photo) { type = 'image'; mime = 'image/jpeg'; }
        else if (msg.video) { type = 'video'; mime = 'video/mp4'; }
        else if (msg.sticker) { type = 'sticker'; mime = 'image/webp'; }
        else if (msg.voice || msg.audio) { type = 'audio'; mime = msg.voice ? 'audio/ogg' : (msg.audio.mime_type || 'audio/mp3'); }
        
        const fileId = msg.voice ? msg.voice.file_id : (msg.audio ? msg.audio.file_id : (msg.photo ? msg.photo[msg.photo.length - 1].file_id : null));
        
        mediaObj = {
            type: type,
            mime: mime,
            data: fileId ? await fetchTelegramMedia(ctx, fileId) : null,
            isVoiceNote: !!msg.voice
        };
    }

    // 4. metadatas - refs
    let referenceObj = {};
    if (msg.reply_to_message) {
        referenceObj.replyToId = msg.reply_to_message.message_id.toString();
    }
    if (msg.forward_date) {
        referenceObj.isForwarded = true;
    }

    return new UnifiedEvent({
        id: messageId,
        type: EventTypes.MSG_USER,
        platform: platformName,
        timestamp: timestamp,
        chat: { id: chatId, isGroup: isGroup },
        author: { id: senderId, name: senderName },
        message: text || mentions.length > 0 ? { text: text, mentions: mentions.length > 0 ? mentions : undefined } : undefined,
        media: mediaObj,
        reference: Object.keys(referenceObj).length > 0 ? referenceObj : undefined
    });
}

module.exports = { parseTelegramMessage };