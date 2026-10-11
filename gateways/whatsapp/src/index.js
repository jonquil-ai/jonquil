require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const logger = require('@jonquil-ai/logger');
const { MessageBatcher, CoreClient } = require('@jonquil-ai/shared');
const config = require('../config.json');

const { registerListeners } = require('./listeners');
const { executeAction } = require('./actions');

const maxLogLength = parseInt(process.env.MAX_LOG_LENGTH) || 100;
const core = new CoreClient(config.coreUrl);

// 3 seconds batcher
const batcher = new MessageBatcher(3000, async (chatId, batch) => {
    const unifiedEvents = batch.map(b => b.unifiedEvent);
    const lastRawMsg = batch[batch.length - 1].rawMsg;
    const lastEvent = unifiedEvents[unifiedEvents.length - 1];

    const log = logger.with(lastEvent);
    log.info('WA_GATEWAY', `${batch.length} messages are being sent to AI...`);

    try {
        const response = await core.sendMessage(unifiedEvents);
        if (!response) return;

        // send text msg
        if (response.text) {
            if (config.readOnly) {
                log.warn('WA_GATEWAY', `[READ-ONLY] Blocked: ${response.text.substring(0, 50)}`);
            } else {
                await sock.sendMessage(chatId, { text: response.text }, { quoted: lastRawMsg });
                log.success('WA_GATEWAY', `Sent: ${response.text.substring(0, maxLogLength)}...`);
            }
        }

        // run actions
        if (response.actions && response.actions.length > 0) {
            for (const action of response.actions) {
                if (config.readOnly) {
                    log.warn('WA_GATEWAY', `[READ-ONLY] Action Blocked: ${action.type}`);
                } else {
                    log.info('WA_GATEWAY', `Action: ${action.type}`);
                    await executeAction(action.type, action.payload, { sock, universalMsg: lastEvent, rawMsg: lastRawMsg, log });
                }
            }
        }
    } catch (error) {
        log.error('WA_GATEWAY', 'Core error:', error.message);
    }
});

let sock;

const eventBusCallback = (unifiedEvent, rawMsg) => {
    // add only user msgs
    if (unifiedEvent.type === 'MSG_USER') {
        const tempLog = logger.with(unifiedEvent);
        const textPreview = unifiedEvent.message?.text || `[Media: ${unifiedEvent.media?.type || 'unknown'}]`;
        tempLog.info('WA_GATEWAY', `[Added to queue]: ${textPreview}`);

        batcher.add(unifiedEvent.chat.id, { unifiedEvent, rawMsg });
    }
};

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/../auth_session');
    const { version, isLatest } = await fetchLatestBaileysVersion();

    logger.info('WA_GATEWAY', `Starting Baileys v${version.join('.')} (Latest: ${isLatest})`);

    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: [config.botName, "Chrome", "2.0.0"],
        markOnlineOnConnect: true
    });

    registerListeners(sock, eventBusCallback);

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) qrcode.generate(qr, { small: true });
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            logger.success('WA_GATEWAY', 'Connected to WhatsApp successfully!');
        }
    });
}

connectToWhatsApp();