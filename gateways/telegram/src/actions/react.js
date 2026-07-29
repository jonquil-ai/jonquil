module.exports = {
    name: 'react',
    execute: async (payload, { ctx, log }) => {
        try {
            await ctx.telegram.setMessageReaction(ctx.chat.id, parseInt(payload.targetId), [{ type: 'emoji', emoji: payload.emoji }]);
            log.success('TG_ACTION', `react: ${payload.emoji}`);
        } catch (error) {
            log.error('TG_ACTION', 'react error:', error.message);
        }
    }
};