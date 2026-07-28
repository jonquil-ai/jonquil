require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('@jonquil-ai/logger');
const handleMessageWithAI = require('./ai/index');
const { enqueueTask } = require('./ai/queue');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 3000;

app.post('/api/chat', (req, res) => {
    const incomingData = req.body;
    let messagesBatch = Array.isArray(incomingData) ? incomingData : [incomingData];

    const validMessages = messagesBatch.filter(m => m && (m.text || m.hasMedia));
    
    if (validMessages.length === 0) {
        return res.status(400).json({ error: "Invalid message format" });
    }

    const chatId = validMessages[0].chatId;

    enqueueTask(chatId, async () => {
        try {
            const replyObj = await handleMessageWithAI(validMessages);
            res.json({ success: true, reply: replyObj });
        } catch (error) {
            logger.error('CORE', 'Server error', error);
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: "Jonquil is currently unavailable." });
            }
        }
    });
});

app.listen(PORT, () => {
    logger.success('SYSTEM', `Jonquil is running on port "${PORT}"!`);
});