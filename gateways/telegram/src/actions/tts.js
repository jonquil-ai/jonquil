const axios = require('axios');

module.exports = {
    name: 'tts',
    execute: async (payload, { ctx, log }) => {
        try {
            log.info('TG_ACTION', `Downloading audio (Google TTS)...`);
            const lang = payload.lang || 'tr';
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(payload.text)}&tl=${lang}&client=tw-ob`;
            
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            const replyOptions = {};
            if (payload.targetId) {
                replyOptions.reply_parameters = { message_id: parseInt(payload.targetId) };
            }

            await ctx.replyWithVoice({ source: buffer }, replyOptions);
            log.success('TG_ACTION', `Voice message sent successfully.`);
        } catch (error) {
            log.error('TG_ACTION', 'tts error:', error.message);
        }
    }
};