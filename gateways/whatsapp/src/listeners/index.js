const onMessage = require('./onMessage');
const onPresence = require('./onPresence');
const onReaction = require('./onReaction');
const onGroup = require('./onGroup');
const onCall = require('./onCall');

function registerListeners(sock, eventBus) {
    sock.ev.on('messages.upsert', async (payload) => {
        if (payload.type === 'notify') {
            for (const msg of payload.messages) await onMessage.handle(sock, msg, eventBus);
        }
    });

    sock.ev.on('messages.reaction', async (reactions) => {
        for (const reaction of reactions) await onReaction.handle(sock, reaction, eventBus);
    });

    sock.ev.on('presence.update', async (presenceUpdate) => {
        await onPresence.handle(sock, presenceUpdate, eventBus);
    });

    sock.ev.on('group-participants.update', async (groupUpdate) => {
        await onGroup.handleParticipants(sock, groupUpdate, eventBus);
    });

    sock.ev.on('groups.update', async (groupMetaUpdate) => {
        await onGroup.handleMetadata(sock, groupMetaUpdate, eventBus);
    });

    sock.ev.on('call', async (calls) => {
        await onCall.handle(sock, calls, eventBus);
    });

}

module.exports = { registerListeners };