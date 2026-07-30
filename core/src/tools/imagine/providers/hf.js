const axios = require('axios');
const logger = require('@jonquil-ai/logger');

module.exports = {
    name: 'hf',
    generate: async (prompt) => {
        const hfKey = process.env.IMAGINE_HF_KEY;
        if (!hfKey) {
            return { success: false, error: "IMAGINE_HF_KEY missing in .env!" };
        }

        logger.info('TOOL', `HuggingFace generating image: "${prompt.substring(0, 30)}..."`);
        const model = process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-dev';

        try {
            const response = await axios.post(
                `https://api-inference.huggingface.co/models/${model}`,
                { inputs: prompt },
                {
                    headers: { Authorization: `Bearer ${hfKey}` },
                    responseType: 'arraybuffer'
                }
            );

            const buffer = Buffer.from(response.data);
            return { success: true, buffer: buffer, provider: 'huggingface' };
        } catch (error) {
            logger.error('TOOL', `HuggingFace error: ${error.message}`);
            return { success: false, error: "HuggingFace image generation failed." };
        }
    }
};