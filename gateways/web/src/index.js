require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('@jonquil-ai/logger');
const { CoreClient, UniversalMessage, SystemEvents } = require('@jonquil-ai/shared');
const config = require('../config.json');

const app = express();
const PORT = process.env.WEB_GATEWAY_PORT || config.port || 4000;
const core = new CoreClient(process.env.CORE_URL || config.coreUrl);

app.use(cors());
app.use(express.json());

// rate limiter
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: "Too many requests. Please wait a minute before sending another message."
    }
});

app.use('/api/send', limiter);

app.post('/api/send', async (req, res) => {
    const { text, sessionId, systemEvent } = req.body;

    // ensure either text or a strict system event is provided
    if ((!text || !text.trim()) && !systemEvent) {
        return res.status(400).json({ success: false, error: "missing required fields." });
    }

    const messageId = 'WEB_' + Math.random().toString(36).substring(2, 10).toUpperCase();

    // intent fallback for text input
    let finalSystemEvent = systemEvent || null;
    if (text) {
        const cleanText = text.trim().toUpperCase();
        if (cleanText === 'ACCEPT' || cleanText === 'AGREE') finalSystemEvent = SystemEvents.TOS_APPROVE;
    }

    const universalMsg = new UniversalMessage({
        platform: config.platform,
        messageId: messageId,
        chatId: sessionId,
        senderId: sessionId,
        senderName: "Web Guest",
        isGroup: false,
        text: (text || "").trim(),
        systemEvent: finalSystemEvent
    });

    const log = logger.with(universalMsg);
    if (finalSystemEvent) log.info('WEB_GATEWAY', `system event triggered: ${finalSystemEvent}`);
    else log.info('WEB_GATEWAY', `message received: "${text.substring(0, 30)}..."`);

    try {
        const response = await core.sendMessage(universalMsg);

        if (!response) {
            log.error('WEB_GATEWAY', 'Core returned empty response');
            return res.status(503).json({ success: false, error: "Jonquil is currently unavailable." });
        }

        log.success('WEB_GATEWAY', 'Core response successfully returned to web client.');
        return res.json({ success: true, reply: response });
    } catch (error) {
        log.error('WEB_GATEWAY', 'Error sending message to Core:', error.message);
        return res.status(500).json({ success: false, error: "Failed to process request." });
    }
});

app.listen(PORT, () => {
    logger.success('WEB_GATEWAY', `Web Gateway is running on port ${PORT}`);
});