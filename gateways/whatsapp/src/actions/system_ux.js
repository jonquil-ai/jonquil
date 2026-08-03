const { SystemActions } = require('@jonquil-ai/shared');
const { t } = require('@jonquil-ai/l10n');

module.exports = {
    name: 'system_ux',
    execute: async (payload, { sock, universalMsg, rawMsg, log }) => {
        const { actionType, data } = payload;
        const tosUrl = process.env.TOS_URL || "http://example.com/terms";

        switch (actionType) {
            case SystemActions.SHOW_TOS_PROMPT_DM:
                await sock.sendMessage(universalMsg.chatId, {
                    text: t('SHOW_TOS_PROMPT_DM', { tosUrl }) });
                break;

            case SystemActions.SHOW_TOS_PROMPT_GROUP:
                const groupId = data?.groupId;
                const targetUserId = universalMsg.senderId;
                const targetUserName = universalMsg.senderName;
                try {
                    const groupMetadata = await sock.groupMetadata(groupId);
                    await sock.sendMessage(targetUserId, {
                        text: t('SHOW_TOS_PROMPT_GROUP', { userName: targetUserName, groupName: groupMetadata.subject, tosUrl })
                    });
                } catch (err) {
                    await sock.sendMessage(targetUserId, { text: t('SHOW_TOS_PROMPT_GROUP_FALLBACK', { tosUrl }) });
                }
                break;

            case SystemActions.TOS_APPROVED_SUCCESS:
                await sock.sendMessage(universalMsg.chatId, { text: t('TOS_APPROVED_SUCCESS') }, { quoted: rawMsg });
                break;

            default:
                log.warn('UX', `unknown system action: ${actionType}`);
        }
    }
};