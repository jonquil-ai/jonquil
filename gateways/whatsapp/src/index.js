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

        logger.info('WA_GATEWAY', `Incoming Message [${universalMsg.senderName}]: ${universalMsg.text}`);

        const universalResponse = await core.sendMessage(universalMsg);
        if (!universalResponse) return;

        // text msg from jonquil
        if (universalResponse.text) {
            await sock.sendPresenceUpdate('composing', universalMsg.chatId);
            setTimeout(async () => {
                await sock.sendPresenceUpdate('paused', universalMsg.chatId);
                await sock.sendMessage(universalMsg.chatId, { text: universalResponse.text }, { quoted: rawMsg });
            }, 1500);
        }

        // action call from jonquil
        if (universalResponse.actions && universalResponse.actions.length > 0) {
            for (const action of universalResponse.actions) {
                await executeAction(action.type, action.payload, { sock, universalMsg, logger });
            }
        }
    });
}

connectToWhatsApp();