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
    white: "\x1b[37m",
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
    _print: (category, color, message, args) => {
        const textArgs = args.filter(a => typeof a !== 'object').join(' ');
        const finalMessage = textArgs ? `${message} ${textArgs}` : message;
        console.log(`${timestamp()} ${tag(category, color)} ${finalMessage}`);
        
        const objArgs = args.filter(a => typeof a === 'object');
        printObjects(objArgs);
    },

    info: (category, message, ...args) => logger._print(category, colors.blue, message, args),
    success: (category, message, ...args) => logger._print(category, colors.green, message, args),
    warn: (category, message, ...args) => logger._print(category, colors.yellow, message, args),
    error: (category, message, ...args) => {
        console.error(`${timestamp()} ${tag(category, colors.red)} ${message}`);
        args.forEach(arg => console.error(arg));
    },
    debug: (category, message, ...args) => {
        // todo: is process.env.DEBUG true?
        console.log(`${timestamp()} ${tag(category, colors.magenta)} ${colors.dim}${message}${colors.reset}`);
        args.forEach(arg => console.log(util.inspect(arg, { colors: true, compact: true })));
    }
};

module.exports = logger;