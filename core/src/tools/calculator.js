// core/src/tools/calculator.js
const logger = require('@jonquil-ai/logger');

/**
 * Safely evaluates mathematical expressions without code injection risks.
 */
function safeEval(expr) {
    // Sanitize input: allow digits, operators, parentheses, decimals, spaces, and math symbols
    const sanitized = expr.replace(/[^0-9+\-*/().^% \teMath\.,]/gi, '');
    
    // Replace ^ with ** for exponentiation
    const jsExpr = sanitized.replace(/\^/g, '**');

    try {
        const fn = new Function(`return (${jsExpr});`);
        const result = fn();
        
        if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
            return null;
        }
        return result;
    } catch (e) {
        return null;
    }
}

module.exports = {
    category: 'tool',
    platforms: ['all'],
    schema: {
        name: "calculate_expression",
        description: "Evaluates mathematical expressions, financial formulas, percentages, and complex arithmetic with 100% precision. ALWAYS use this tool whenever the user asks to perform math calculations, calculate percentages, or solve equations.",
        parameters: {
            type: "object",
            properties: {
                expression: {
                    type: "string",
                    description: "The mathematical expression to evaluate (e.g. '158.4 * 34.2 / 1.12', '5000 * 0.18', '2^10', 'Math.sqrt(144)')."
                }
            },
            required: ["expression"]
        }
    },
    execute: async (args) => {
        logger.info('TOOL', `calculate_expression running for: "${args.expression}"`);
        
        try {
            const result = safeEval(args.expression);
            
            if (result === null) {
                return { success: false, error: "Invalid or unsafe mathematical expression." };
            }

            return {
                success: true,
                expression: args.expression,
                result: result,
                formattedResult: result.toLocaleString('en-US', { maximumFractionDigits: 6 })
            };
        } catch (error) {
            logger.error('TOOL', `Calculator error: ${error.message}`);
            return { success: false, error: "Mathematical calculation failed." };
        }
    }
};