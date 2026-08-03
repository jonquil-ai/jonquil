const { SystemActions } = require('@jonquil-ai/shared');
const { t } = require('@jonquil-ai/l10n');

module.exports = {
    name: 'system_ux',
    execute: async (payload, { ctx, log }) => {
        const { actionType } = payload;
        const tosUrl = process.env.TOS_URL || "http://example.com/terms";

        switch (actionType) {
            case SystemActions.SHOW_TOS_PROMPT_DM:
                await ctx.reply(t('SHOW_TOS_PROMPT_DM_TG', { tosUrl }));
                break;
            case SystemActions.SHOW_TOS_PROMPT_GROUP:
                await ctx.reply(t('SHOW_TOS_PROMPT_GROUP_FALLBACK', { tosUrl }));
                break;
            case SystemActions.TOS_APPROVED_SUCCESS:
                await ctx.reply(t('TOS_APPROVED_SUCCESS'));
                break;
            default:
                log.warn('TG_ACTION', `unknown system action: ${actionType}`);
        }
    }
};