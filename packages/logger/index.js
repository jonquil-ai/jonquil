// packages/logger/index.js
const util = require('util');

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m"
};

const timestamp = () => `\x1b[90m[${new Date().toLocaleTimeString()}]\x1b[0m`;
const tag = (label, color) => `${color}[${label.toUpperCase()}]${colors.reset}`;

const printObjects = (args) => {
    args.forEach(arg => {
        if (typeof arg === 'object' && arg !== null) {
            console.log(util.inspect(arg, { colors: true, depth: null, compact: false }));
        }
    });
};

const logger = {

    _print: (category, color, message, args, context = null) => {
        const textArgs = args.filter(a => typeof a !== 'object').join(' ');
        const finalMessage = textArgs ? `${message} ${textArgs}` : message;

        let prefix = "";

        if (context) {
            
            const name = context.senderName || 'unknown';
            const platform = context.platform || 'test-cli';
            const id = context.messageId ? context.messageId.substring(0, 6) : '---';
            prefix = `\x1b[36m[${name} | ${id} | ${platform}]\x1b[0m `;
        }

        console.log(`${timestamp()} ${tag(category, color)} ${prefix}${finalMessage}`);
        
        const objArgs = args.filter(a => typeof a === 'object');
        printObjects(objArgs);
    },

    info: (cat, msg, ...args) => logger._print(cat, colors.blue, msg, args),
    success: (cat, msg, ...args) => logger._print(cat, colors.green, msg, args),
    warn: (cat, msg, ...args) => logger._print(cat, colors.yellow, msg, args),
    error: (cat, msg, ...args) => {
        console.error(`${timestamp()} ${tag(cat, colors.red)} ${msg}`);
        args.forEach(arg => console.error(arg));
    },

    with: (contextObj) => {
        return {
            info: (cat, msg, ...args) => logger._print(cat, colors.blue, msg, args, contextObj),
            success: (cat, msg, ...args) => logger._print(cat, colors.green, msg, args, contextObj),
            warn: (cat, msg, ...args) => logger._print(cat, colors.yellow, msg, args, contextObj),
            error: (cat, msg, ...args) => logger._print(cat, colors.red, msg, args, contextObj),
        };
    }
};

module.exports = logger;