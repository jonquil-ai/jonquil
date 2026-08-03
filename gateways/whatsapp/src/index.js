const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const logger = require('@jonquil-ai/logger');
const { CoreClient, MessageBatcher } = require('@jonquil-ai/shared');

const config = require('../config.json');
const { parseBaileysMessage } = require('./parser');
const { executeAction } = require('./actions');
const { saveToScreenCache } = require('./cache');

const maxLogLength = 999;

const core = new CoreClient(config.coreUrl);

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/../auth_session');

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`WA Version: v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: [config.botName, "Chrome", "1.0.0"]
    });

    const batcher = new MessageBatcher(3000, async (chatId, batch) => {
        const universalMessages = batch.map(b => b.universalMsg);
        const lastRawMsg = batch[batch.length - 1].rawMsg;
        const lastUniversalMsg = universalMessages[universalMessages.length - 1];
        
        const log = logger.with(lastUniversalMsg);
        log.info('WA_GATEWAY', `${batch.length} messages are being sent to AI...`);

        try {
            const response = await core.sendMessage(universalMessages);
            if (!response) return;

            if (response.systemAction) {
                log.info('WA_GATEWAY', `system action: ${response.systemAction}`);
                await executeAction('system_ux', { actionType: response.systemAction, data: response.systemPayload }, { sock, universalMsg: lastUniversalMsg, rawMsg: lastRawMsg, log });
                return; 
            }

            // process texts
            if (response.text) {
                if (config.readOnly) {
                    log.warn('WA_GATEWAY', `[READ-ONLY MODE] Message Sending Blocked: ${response.text.substring(0, 50)}...`);
                } else {
                    await sock.sendPresenceUpdate('composing', chatId);
                    setTimeout(async () => {
                        await sock.sendPresenceUpdate('paused', chatId);
                        // quote last msg
                        await sock.sendMessage(chatId, { text: response.text }, { quoted: lastRawMsg });
                        log.success('WA_GATEWAY', `Sent: ${response.text.substring(0, maxLogLength)}...`);
                    }, 1500);
                }
            }

            // process actiıns
            if (response.actions && response.actions.length > 0) {
                for (const action of response.actions) {
                    if (config.readOnly) {
                        log.warn('WA_GATEWAY', `[READ-ONLY MODE] Action Sending Blocked: ${action.type}`);
                    } else {
                        log.info('WA_GATEWAY', `Action : ${action.type}`);
                        await executeAction(action.type, action.payload, { sock, universalMsg: lastUniversalMsg, rawMsg: lastRawMsg, log });
                    }
                }
            }
        } catch (error) {
            log.error('WA_GATEWAY', 'Unable to connect Core:', error.message);
        }
    });

    // connection
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            logger.info("WA_GATEWAY", "Please scan the QR Code:");
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            logger.success('WA_GATEWAY', 'Connected to WhatsApp successfully!');
        }
    });

    // msg listener
    sock.ev.on('messages.upsert', async (m) => {
        const rawMsg = m.messages[0];
        if (!rawMsg.message || rawMsg.key.fromMe) return;

        saveToScreenCache(rawMsg);

        const universalMsg = await parseBaileysMessage(rawMsg, config.platform, logger);
        if (!universalMsg) return;

        const tempLog = logger.with(universalMsg);
        tempLog.info('WA_GATEWAY', `[Added to queue]: ${universalMsg.text.substring(0, maxLogLength)}`);

        

        batcher.add(universalMsg.chatId, universalMsg, rawMsg);
    });
}

connectToWhatsApp();