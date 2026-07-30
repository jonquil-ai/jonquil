module.exports = {
    name: 'send_media',
    execute: async (payload, { ctx, log }) => {
        try {
            const mediaType = payload.mediaType || 'image';
            const caption = payload.caption || "";
            const replyOptions = {
                caption,
                reply_parameters: { message_id: ctx.message.message_id }
            };

            const source = payload.url 
                ? { url: payload.url } 
                : { source: Buffer.isBuffer(payload.buffer) ? payload.buffer : Buffer.from(payload.buffer, 'base64') };

            if (mediaType === 'image') {
                await ctx.replyWithPhoto(source, replyOptions);
            } else if (mediaType === 'video') {
                await ctx.replyWithVideo(source, replyOptions);
            } else if (mediaType === 'audio') {
                await ctx.replyWithAudio(source, replyOptions);
            } else {
                await ctx.replyWithDocument(source, replyOptions);
            }

            log.success('TG_ACTION', `send_media (${mediaType}) sent.`);
        } catch (error) {
            log.error('TG_ACTION', 'send_media error:', error.message);
        }
    }
};