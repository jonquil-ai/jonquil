require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const { Telegraf } = require('telegraf');
const logger = require('@jonquil-ai/logger');
const { CoreClient, MessageBatcher } = require('@jonquil-ai/shared');

const config = require('../config.json');
const { parseTelegramMessage } = require('./parser');
const { executeAction } = require('./actions');

const maxLogLength = parseInt(process.env.MAX_LOG_LENGTH) || 100;

const core = new CoreClient(config.coreUrl);

if (!process.env.TG_BOT_TOKEN) {
    logger.error('TG_GATEWAY', 'TG_BOT_TOKEN missing!');
    process.exit(1);
}
const bot = new Telegraf(process.env.TG_BOT_TOKEN);

const batcher = new MessageBatcher(3000, async (chatId, batch) => {
    const universalMessages = batch.map(b => b.universalMsg);
    const lastCtx = batch[batch.length - 1].rawMsg;
    const lastUniversalMsg = universalMessages[universalMessages.length - 1];

    const log = logger.with(lastUniversalMsg);
    log.info('TG_GATEWAY', `${batch.length} messages are being sent to AI...`);

    try {
        const response = await core.sendMessage(universalMessages);
        if (!response) return;

        // text msg
        if (response.text) {
            if (config.readOnly) {
                log.warn('TG_GATEWAY', `[READ-ONLY] Message Sending Blocked: ${response.text.substring(0, 50)}`);
            } else {

                await lastCtx.sendChatAction('typing');
                setTimeout(async () => {
                    // quote last msg
                    await lastCtx.reply(response.text, { reply_parameters: { message_id: lastCtx.message.message_id } });
                    log.success('TG_GATEWAY', `Sent: ${response.text.substring(0, maxLogLength)}...`);
                }, 1500);
            }
        }

        // actions
        if (response.actions && response.actions.length > 0) {
            for (const action of response.actions) {
                if (config.readOnly) {
                    log.warn('TG_GATEWAY', `[READ-ONLY MODE] Action Sending Blocked: ${action.type}`);
                } else {
                    log.info('TG_GATEWAY', `Action: ${action.type}`);
                    await executeAction(action.type, action.payload, { ctx: lastCtx, log });
                }
            }
        }
    } catch (error) {
        log.error('TG_GATEWAY', 'Core error:', error.message);
    }
});

// msg listener
bot.on('message', async (ctx) => {
    // FIX: Added await here for async parseTelegramMessage
    const universalMsg = await parseTelegramMessage(ctx, config.platform);
    if (!universalMsg) return;

    const tempLog = logger.with(universalMsg);
    const logPreview = universalMsg.text ? universalMsg.text.substring(0, maxLogLength) : `[Media: ${universalMsg.mediaType || 'audio'}]`;
    tempLog.info('TG_GATEWAY', `[Added to queue]: ${logPreview}`);

    batcher.add(universalMsg.chatId, universalMsg, ctx);
});

// start bot
bot.launch(() => {
    logger.success('TG_GATEWAY', 'Connected to Telegram successfully!');
});

// graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));