const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const logger = require('@jonquil-ai/logger');
const { CoreClient } = require('@jonquil-ai/shared');

const config = require('../config.json');
const { parseBaileysMessage } = require('./parser');
const { executeAction } = require('./actions');

const core = new CoreClient(config.coreUrl);

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/../auth_session');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: [config.botName, "Chrome", "1.0.0"]
    });

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

        const universalMsg = parseBaileysMessage(rawMsg, config.platform);
        if (!universalMsg) return;

        const log = logger.with(universalMsg);

        log.info('WA_GATEWAY', `Incoming: ${universalMsg.text.substring(0, 50)}...`);

        try {
            const response = await core.sendMessage(universalMsg);
            if (!response) return;

            if (response.text) {
                await sock.sendPresenceUpdate('composing', universalMsg.chatId);
                setTimeout(async () => {
                    await sock.sendPresenceUpdate('paused', universalMsg.chatId);
                    await sock.sendMessage(universalMsg.chatId, { text: response.text }, { quoted: rawMsg });
                    log.success('WA_GATEWAY', `Sent: ${response.text.substring(0, 50)}...`);
                }, 1500);
            }

            if (response.actions && response.actions.length > 0) {
                for (const action of response.actions) {
                    log.info('WA_GATEWAY', `Action : ${action.type}`);
                    await executeAction(action.type, action.payload, { sock, universalMsg, log });
                }
            }
        } catch (error) {
            log.error('WA_GATEWAY', 'Core servisiyle iletişim kurulamadı:', error.message);
        }
    });
}

connectToWhatsApp();