const axios = require('axios');

module.exports = {
    name: 'tts',

    execute: async (payload, { sock, universalMsg, rawMsg, log }) => {
        try {
            log.info('ACTION', `Downloading audio file (Google TTS)...`);
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(payload.text)}&tl=${payload.lang}&client=tw-ob`;
            
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            await sock.sendMessage(
                universalMsg.chatId, 
                {
                    audio: buffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                }, 
                { quoted: rawMsg }
            );

            log.success('ACTION', `Voice message sent.`);
        } catch (error) {
            log.error('ACTION', `Voice message failed:`, error.message);
        }
    }
};