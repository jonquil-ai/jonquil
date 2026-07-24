const axios = require('axios');
const logger = require('@jonquil-ai/logger');

module.exports = {
    category: 'tool',
    platforms: ['all'],
    schema: {
        name: "get_currency_rate",
        description: "It retrieves exchange rates and currency conversions. (e.g., How much is 50 USD in TRY, or what is the EUR exchange rate?)",
        parameters: {
            type: "object",
            properties: {
                amount: { type: "number", description: "Amount of currency (If not specified, assume 1)" },
                base: { type: "string", description: "Base currency code (e.g., USD, EUR, TRY)" },
                target: { type: "string", description: "Target currency code (e.g., USD, EUR, TRY)" }
            },
            required: ["base", "target"]
        }
    },
    execute: async (args) => {
        logger.info('TOOL', `currency running: ${args.amount || 1} ${args.base} -> ${args.target}`);
        try {
            const amount = args.amount || 1;
            const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${args.base.toUpperCase()}`);
            const rate = res.data.rates[args.target.toUpperCase()];
            if (!rate) return { success: false, error: "Target currency not found." };
            
            return { success: true, base: args.base, target: args.target, amount, rate, calculatedResult: (amount * rate).toFixed(2) };
        } catch (error) {
            logger.error('TOOL', `Currency error: ${error.message}`);
            return { success: false, error: "Currency rate information could not be retrieved." };
        }
    }
};