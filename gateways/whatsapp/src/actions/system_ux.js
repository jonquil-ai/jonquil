const { SystemActions } = require('@jonquil-ai/shared');

module.exports = {
    name: 'system_ux',
    execute: async (payload, { sock, universalMsg, rawMsg, log }) => {
        const { actionType, data } = payload;
        const tosUrl = process.env.TOS_URL || "http://example.com/terms";

        switch (actionType) {
            case SystemActions.SHOW_TOS_PROMPT_DM:
                await sock.sendMessage(universalMsg.chatId, { text: `Hi! I'm Jonquil 🌼\nTo use my services, please read and accept our Terms of Service (${tosUrl}).\n\nReply with 'ACCEPT' to continue.` });
                break;
                
            case SystemActions.SHOW_TOS_PROMPT_GROUP:
                const groupId = data.groupId;
                const targetUserId = universalMsg.senderId;
                const targetUserName = universalMsg.senderName;
                try {
                    const groupMetadata = await sock.groupMetadata(groupId);
                    await sock.sendMessage(targetUserId, { text: `Hi ${targetUserName}! I'm Jonquil 🌼, the assistant in the *"${groupMetadata.subject}"* group.\n\nYou called me there, but to use my services, you need to accept our Terms of Service (${tosUrl}).\n\nIf you agree, please reply here with 'ACCEPT'.` });
                    log.info('UX', `group contextual tos prompt sent to dm: ${groupMetadata.subject}`);
                } catch (err) {
                    await sock.sendMessage(targetUserId, { text: `Hi! You called me in a group, but to use my services, you need to accept our Terms of Service (${tosUrl}).\n\nPlease reply here with 'ACCEPT'.` });
                }
                break;

            case SystemActions.TOS_APPROVED_SUCCESS:
                await sock.sendMessage(universalMsg.chatId, { text: "✅ Awesome! You've accepted the terms. How can I help you today?" }, { quoted: rawMsg });
                break;
                
            default:
                log.warn('UX', `unknown system action: ${actionType}`);
        }
    }
};