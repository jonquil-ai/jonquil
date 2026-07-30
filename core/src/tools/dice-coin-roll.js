const logger = require('@jonquil-ai/logger');

module.exports = {
    category: 'tool',
    platforms: ['all'],
    schema: {
        name: "dice_coin_rolling",
        description: "It is used for rolling dice or flipping a coin. Call it when the user is undecided or wants a game of chance.",
        parameters: {
            type: "object",
            properties: {
                action: { 
                    type: "string", 
                    description: "Which game of chance: 'dice' or 'coin'?" 
                },
                count: { 
                    type: "number", 
                    description: "How many times it will be applied (e.g., 2 dice or 3 coins). If not specified, the default is 1." 
                }
            },
            required: ["action"]
        }
    },
    execute: async (args) => {
        const count = args.count || 1;
        const action = args.action;
        
        logger.info('TOOL', `random_chance running: ${action} (${count} times)`);
        
        let results = [];
        
        try {
            if (action === 'dice') {
                // Rolling the dice
                for (let i = 0; i < count; i++) {
                    results.push(Math.floor(Math.random() * 6) + 1);
                }
            } else if (action === 'coin') {
                // heads or tails
                const sides = ['Heads', 'Tails'];
                for (let i = 0; i < count; i++) {
                    results.push(sides[Math.floor(Math.random() * 2)]);
                }
            } else {
                return { success: false, error: "Unknown action. Please use 'dice' or 'coin'." };
            }
            
            // Sonucu AI'a geri döndür
            return { 
                success: true, 
                action: action,
                count: count,
                results: results,
                total: action === 'dice' ? results.reduce((a, b) => a + b, 0) : undefined
            };
        } catch (error) {
            logger.error('TOOL', `change tool error: ${error.message}`);
            return { success: false, error: "There was a problem during the dice/coin roll." };
        }
    }
};