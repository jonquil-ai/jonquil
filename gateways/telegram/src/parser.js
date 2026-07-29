const { UniversalMessage } = require('@jonquil-ai/shared');

function parseTelegramMessage(ctx, platformName) {
    const msg = ctx.message;
    if (!msg) return null;

    // metas
    const messageId = msg.message_id.toString();
    const chatId = msg.chat.id.toString();
    const senderId = msg.from.id.toString();
    const senderName = msg.from.first_name || msg.from.username || "Guest";
    const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

    // text
    const text = msg.text || msg.caption || "";

    // media
    const hasMedia = !!(msg.photo || msg.video || msg.sticker || msg.voice || msg.audio);
    let mediaType = null;
    if (msg.photo) mediaType = 'image';
    else if (msg.video) mediaType = 'video';
    else if (msg.sticker) mediaType = 'sticker';
    else if (msg.voice || msg.audio) mediaType = 'audio';

    // quoted msg
    let quotedMessage = null;
    if (msg.reply_to_message) {
        const qMsg = msg.reply_to_message;
        const qHasMedia = !!(qMsg.photo || qMsg.video || qMsg.sticker || qMsg.voice || qMsg.audio);
        let qMediaType = null;
        if (qMsg.photo) qMediaType = 'image';
        else if (qMsg.video) qMediaType = 'video';
        else if (qMsg.sticker) qMediaType = 'sticker';
        else if (qMsg.voice || qMsg.audio) qMediaType = 'audio';

        quotedMessage = {
            messageId: qMsg.message_id.toString(),
            senderId: qMsg.from.id.toString(),
            senderName: qMsg.from.id === ctx.botInfo.id ? "Itself" : (qMsg.from.first_name || "Guest"),
            text: qMsg.text || qMsg.caption || "",
            mediaType: qMediaType
            // todo: download medias
        };
    }

    const timestamp = new Date(msg.date * 1000).toISOString();

    // mentions
    let mentions = [];
    if (msg.entities) {
        msg.entities.forEach(entity => {
            if (entity.type === 'mention') {
                const mentionText = text.substring(entity.offset, entity.offset + entity.length);
                mentions.push(mentionText);
            }
        });
    }

    return new UniversalMessage({
        platform: platformName,
        messageId, chatId, senderId, senderName, isGroup, text, hasMedia, mediaType, quotedMessage, mentions, timestamp
    });
}

module.exports = { parseTelegramMessage };