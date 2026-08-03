const { SystemActions } = require('@jonquil-ai/shared');

module.exports = {
    name: 'system_ux',
    execute: async (payload, { ctx, log }) => {
        const { actionType } = payload;
        const tosUrl = process.env.TOS_URL || "http://example.com/terms";

        switch (actionType) {
            case SystemActions.SHOW_TOS_PROMPT_DM:
                await ctx.reply(`Hi! I'm Jonquil 🌼\nTo use my services, please read and accept our Terms of Service (${tosUrl}).\n\nReply with 'ACCEPT' or click /accept to continue.`);
                break;
            case SystemActions.SHOW_TOS_PROMPT_GROUP:
                await ctx.reply("Hi! To chat with me, you need to accept our Terms of Service. Please send me a DM with /accept.");
                break;
            case SystemActions.TOS_APPROVED_SUCCESS:
                await ctx.reply("✅ Awesome! You've accepted the terms. How can I help you today?");
                break;
            default:
                log.warn('TG_ACTION', `unknown system action: ${actionType}`);
        }
    }
};