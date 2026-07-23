require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('@jonquil-ai/logger');
const handleMessageWithAI = require('./ai/index');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/api/chat', async (req, res) => {
    // req.body, packages/shared/UniversalMessage
    const universalMessage = req.body;

    if (!universalMessage || !universalMessage.text) {
        return res.status(400).json({ error: "Invalid message format" });
    }

    try {

        const replyText = await handleMessageWithAI(universalMessage);
        
        // todo: gateway actions support
        res.json({
            success: true,
            reply: replyText
        });
    } catch (error) {
        logger.error('CORE', 'Server error', error);
        res.status(500).json({ success: false, error: "Jonquil is currently unavailable." });
    }
});

app.listen(PORT, () => {
    logger.success('SYSTEM', `Jonquil is running on port "${PORT}"!`);
});