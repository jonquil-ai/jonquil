const { SystemEvents } = require('@jonquil-ai/shared');

const INTENTS = [
    { regex: /^(ACCEPT|AGREE|I AGREE|YES)$/i, systemEvent: SystemEvents.TOS_APPROVE }
];

function detectSystemEvent(text) {
    if (!text) return null;
    const cleanText = text.trim();
    for (const intent of INTENTS) {
        if (intent.regex.test(cleanText)) return intent.systemEvent;
    }
    return null;
}
module.exports = { detectSystemEvent };