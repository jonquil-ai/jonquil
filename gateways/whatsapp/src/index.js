require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const logger = require('@jonquil-ai/logger');
const config = require('.././config.json');

const { registerListeners } = require('./listeners');

const eventBusCallback = (unifiedEvent, rawMsg) => {
    const log = logger.with(unifiedEvent);
    
    log.dump(`DTO: ${unifiedEvent.type}`, unifiedEvent);
};

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/../auth_session');
    const { version, isLatest } = await fetchLatestBaileysVersion();

    logger.info('WA_GATEWAY', `Starting Baileys v${version.join('.')} (Latest: ${isLatest})`);

    const sock = makeWASocket({
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