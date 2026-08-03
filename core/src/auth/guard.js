const prisma = require('../db');
const logger = require('@jonquil-ai/logger');
const { SystemEvents, SystemActions } = require('@jonquil-ai/shared');

const tosWarnedGroups = new Set();

async function resolveIdentity(universalMsg) {
    const { platform, senderId, isGroup, quotedMessage, chatId, systemEvent } = universalMsg;

    let identity = await prisma.platformIdentity.findUnique({
        where: { platform_realId: { platform: platform, realId: senderId } },
        include: { user: { include: { tosAcceptances: true } } }
    });

    if (!identity) {
        const cleanId = senderId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
        const uid = `guest_${platform}_${cleanId}`; 
        
        const newUser = await prisma.user.create({
            data: { uid, role: "GUEST", identities: { create: { platform, realId: senderId } } },
            include: { tosAcceptances: true }
        });
        identity = { user: newUser };
        logger.info('AUTH', `new guest provisioned: ${uid}`);
    }

    const user = identity.user;
    const isTosAccepted = user.tosAcceptances && user.tosAcceptances.length > 0;

    if (process.env.REQUIRE_TOS === 'true' && !isTosAccepted) {

        if (systemEvent === SystemEvents.TOS_APPROVE) {
            const sourceGroupId = quotedMessage ? quotedMessage.remoteJid : null;
            await prisma.tosAcceptance.create({ data: { userId: user.id, platform, groupId: sourceGroupId } });
            
            logger.success('AUTH', `tos approved by: ${user.uid}`);
            return { isTosBlocked: true, systemAction: SystemActions.TOS_APPROVED_SUCCESS };
        }

        if (isGroup) {
            if (!tosWarnedGroups.has(chatId)) {
                tosWarnedGroups.add(chatId);
                setTimeout(() => tosWarnedGroups.delete(chatId), 15 * 60 * 1000);
                return { isTosBlocked: true, systemAction: SystemActions.SHOW_TOS_PROMPT_GROUP, systemPayload: { groupId: chatId } };
            }
            return { isTosBlocked: true, systemAction: SystemActions.IGNORE };
        } else {
            return { isTosBlocked: true, systemAction: SystemActions.SHOW_TOS_PROMPT_DM };
        }
    }

    return { isTosBlocked: false, uid: user.uid, role: user.role, personaSettings: user.personaSettings };
}

module.exports = { resolveIdentity };