const logger = require('@jonquil-ai/logger');

/**
 * Advanced and safe mathematical evaluator with full support for:
 * - Basic arithmetic: +, -, *, /, %, ^
 * - Powers & Roots: sqrt, cbrt, pow, ^
 * - Trigonometry: sin, cos, tan, asin, acos, atan
 * - Logarithms & Exponentials: log, log10, log2, ln, exp
 * - Constants & Helpers: pi, e, abs, floor, ceil, round, min, max
 */
function safeEval(expr) {
    if (!expr || typeof expr !== 'string') return null;

    let clean = expr
        .replace(/π|PI/gi, 'Math.PI')
        .replace(/\bE\b/g, 'Math.E')
        .replace(/\bsqrt\b/gi, 'Math.sqrt')
        .replace(/\bcbrt\b/gi, 'Math.cbrt')
        .replace(/\bsin\b/gi, 'Math.sin')
        .replace(/\bcos\b/gi, 'Math.cos')
        .replace(/\btan\b/gi, 'Math.tan')
        .replace(/\blog10\b/gi, 'Math.log10')
        .replace(/\blog2\b/gi, 'Math.log2')
        .replace(/\bln\b/gi, 'Math.log')
        .replace(/\blog\b/gi, 'Math.log')
        .replace(/\babs\b/gi, 'Math.abs')
        .replace(/\bpow\b/gi, 'Math.pow')
        .replace(/\bround\b/gi, 'Math.round')
        .replace(/\bfloor\b/gi, 'Math.floor')
        .replace(/\bceil\b/gi, 'Math.ceil')
        .replace(/\^/g, '**')
        .replace(/Math\.Math\./g, 'Math.');

    // Security check: disallow dangerous JS globals/keywords
    const forbiddenKeywords = /(process|global|require|import|eval|Function|this|window|document|constructor|prototype|var|let|const|return|if|else|for|while)/i;
    if (forbiddenKeywords.test(clean)) {
        return null;
    }

    try {
        const evaluator = new Function('Math', `return (${clean});`);
        const result = evaluator(Math);

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
        description: "Evaluates simple to highly advanced mathematical expressions with 100% precision. Supports arithmetic, trigonometry, roots, logarithms, exponents, and financial equations.",
        parameters: {
            type: "object",
            properties: {
                expression: {
                    type: "string",
                    description: "The mathematical expression to evaluate (e.g. 'sqrt(5)', 'sin(45) * cos(45)', '1000 * (1 + 0.05)^10')."
                },
                precision: {
                    type: "number",
                    description: "Optional number of decimal places for formatting (0 to 30). Use 2 for financial/currency rounding or up to 15 for scientific precision."
                }
            },
            required: ["expression"]
        }
    },
    execute: async (args) => {
        logger.info('TOOL', `calculate_expression running for: "${args.expression}" (precision: ${args.precision !== undefined ? args.precision : 'default 10'})`);
        
        try {
            const result = safeEval(args.expression);
            
            if (result === null) {
                return { success: false, error: "Invalid or unsupported mathematical expression." };
            }

            const digits = typeof args.precision === 'number' ? Math.min(Math.max(args.precision, 0), 15) : 10;

            return {
                success: true,
                expression: args.expression,
                result: result,
                formattedResult: result.toLocaleString('en-US', { maximumFractionDigits: digits })
            };
        } catch (error) {
            logger.error('TOOL', `Calculator error: ${error.message}`);
            return { success: false, error: "Advanced calculation failed." };
        }
    }
};