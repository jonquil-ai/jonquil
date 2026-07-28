const fs = require('fs');
const path = require('path');
const readline = require('readline');
const logger = require('@jonquil-ai/logger');
const { CoreClient } = require('@jonquil-ai/shared');
const { parseExportLine } = require('./parser');

const core = new CoreClient('http://localhost:3000/api/chat');
const chatFilePath = path.join(__dirname, '../chat.txt');

if (!fs.existsSync(chatFilePath)) {
    logger.error('SIMULATOR', 'chat.txt missing!');
    process.exit(1);
}

const fileStream = fs.createReadStream(chatFilePath);
const rlFile = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

const rlConsole = readline.createInterface({ input: process.stdin, output: process.stdout });

async function runSimulation() {
    logger.info('SIMULATOR', 'Connected!');
    logger.info('SIMULATOR', 'Press [ENTER] to send the next message.\n');

    for await (const line of rlFile) {
        const universalMsg = parseExportLine(line);
        
        if (!universalMsg) continue;

        await new Promise(resolve => rlConsole.question(`\x1b[33mNext Message: [${universalMsg.senderName}] ${universalMsg.text}\x1b[0m (Press ENTER to send)`, resolve));

        const log = logger.with(universalMsg);
        log.info('SIM_GATEWAY', `Message sent.`);
        console.log("--------------------------------------------------\n");

        core.sendMessage(universalMsg).then(response => {
            if (!response) return;

            if (response.text) {
                log.success('SIM_GATEWAY', `Jonquil Response: ${response.text}`);
            }

            if (response.actions && response.actions.length > 0) {
                for (const action of response.actions) {
                    log.debug('SIM_GATEWAY', `[Action Triggered]: ${action.type}`, action.payload);
                }
            }
        }).catch(error => {
            log.error('SIM_GATEWAY', 'Core error:', error.message);
        });
    }

    logger.success('SIMULATOR', 'Simulation has ended.');
    process.exit(0);
}

runSimulation();