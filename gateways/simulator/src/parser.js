const { UniversalMessage } = require('@jonquil-ai/shared');

// WhatsApp Export Regex
// iOS format: [28.07.2026 01:10:05] User: Msg
// Android format: 28.07.2026 01:10 - User: Msg
const waExportRegex = /^\[?(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}[, ]+\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(?:-)?\s*(.+?):\s(.*)$/;

function parseExportLine(line) {
    const match = line.match(waExportRegex);
    if (!match) return null;

    const rawDate = match[1];
    const senderName = match[2].trim();
    const text = match[3].trim();

    const messageId = 'SIM_' + Math.random().toString(36).substring(2, 10).toUpperCase();

    return new UniversalMessage({
        platform: 'sim',
        messageId: messageId,
        chatId: 'sim_group_test',
        senderId: senderName.toLowerCase() + '@sim.whatsapp',
        senderName: senderName,
        isGroup: true,
        text: text,
        timestamp: new Date().toISOString()
    });
}

module.exports = { parseExportLine };