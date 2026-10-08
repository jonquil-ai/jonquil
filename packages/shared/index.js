// packages/shared/index.js

/**
 * EVENT TYPES 
 */
const EventTypes = {
    // MESSAGING
    MSG_USER: 'MSG_USER',                 
    MSG_AI: 'MSG_AI',                     
    MSG_SYSTEM: 'MSG_SYSTEM',             
    
    // MESSAGE STATUSES
    SYS_MSG_REVOKE: 'SYS_MSG_REVOKE',     
    SYS_MSG_EDIT: 'SYS_MSG_EDIT',         
    SYS_MSG_READ: 'SYS_MSG_READ',         
    SYS_MSG_DELIVERED: 'SYS_MSG_DELIVERED',
    
    // USER STASUSES
    SYS_PRESENCE_ONLINE: 'SYS_PRESENCE_ONLINE',
    SYS_PRESENCE_OFFLINE: 'SYS_PRESENCE_OFFLINE',
    SYS_PRESENCE_TYPING: 'SYS_PRESENCE_TYPING',         
    SYS_PRESENCE_RECORDING: 'SYS_PRESENCE_RECORDING',   
    SYS_PRESENCE_PAUSED: 'SYS_PRESENCE_PAUSED',         

    // ACTIONS
    ACTION_REACT_ADD: 'ACTION_REACT_ADD',       
    ACTION_REACT_REMOVE: 'ACTION_REACT_REMOVE', 
    ACTION_POLL_VOTE: 'ACTION_POLL_VOTE', 

    // GROUP EVENTS
    SYS_GROUP_JOIN: 'SYS_GROUP_JOIN',           
    SYS_GROUP_LEAVE: 'SYS_GROUP_LEAVE',         
    SYS_GROUP_PROMOTE: 'SYS_GROUP_PROMOTE',     
    SYS_GROUP_DEMOTE: 'SYS_GROUP_DEMOTE',       
    SYS_GROUP_UPDATE: 'SYS_GROUP_UPDATE',       

    // VOICE CALLS
    SYS_CALL_OFFER: 'SYS_CALL_OFFER', 

    // AI
    AI_THOUGHT: 'AI_THOUGHT',             
    TOOL_CALL: 'TOOL_CALL',               
    TOOL_RES: 'TOOL_RES',                 

    // SECURITY AND ID
    SYS_TOS_ACCEPT: 'SYS_TOS_ACCEPT',     
    SYS_TOS_DECLINE: 'SYS_TOS_DECLINE',   
    
    // SYSTEM
    SYS_EVENT: 'SYS_EVENT' 
};

/**
 *
 * UNIFIED EVENT (DTO)
 *
 */
class UnifiedEvent {
    constructor(data = {}) {
        this.id = data.id || `EV_${Date.now()}`;             
        this.platform = data.platform || 'whatsapp';
        this.type = data.type || EventTypes.MSG_USER;    
        this.timestamp = data.timestamp || new Date().toISOString();

        this.chat = data.chat ? {
            id: data.chat.id || null,
            name: data.chat.name || null,
            isGroup: data.chat.isGroup || false,
        } : undefined;
        
        this.author = data.author ? {
            id: data.author.id || undefined,
            name: data.author.name || undefined, 
        } : undefined;

        this.message = data.message ? {
            text: data.message.text || undefined,       
            mentions: data.message.mentions?.length > 0 ? data.message.mentions : undefined, 
            location: data.message.location || undefined, 
            poll: data.message.poll || undefined,       
            contacts: data.message.contacts?.length > 0 ? data.message.contacts : undefined
        } : undefined;

        this.media = data.media ? {
            type: data.media.type || null,     
            mime: data.media.mime || null,     
            isVoiceNote: data.media.isVoiceNote || false, 
            duration: data.media.duration || undefined,
            data: data.media.data || null      
        } : undefined;

        this.reference = data.reference ? {
            replyToId: data.reference.replyToId || undefined,
            targetId: data.reference.targetId || undefined, 
            isForwarded: data.reference.isForwarded || false,
            isForwardedManyTimes: data.reference.isForwardedManyTimes || false
        } : undefined;

        this.reaction = data.reaction ? { emoji: data.reaction.emoji || null } : undefined;
        this.presence = data.presence ? { status: data.presence.status || null } : undefined;
        
        this.group = data.group ? {
            action: data.group.action || null,             
            targetAuthors: data.group.targetAuthors?.length > 0 ? data.group.targetAuthors : undefined, 
            changes: data.group.changes || undefined       
        } : undefined;

        this.call = data.call ? {
            isVideo: data.call.isVideo || false,
            status: data.call.status || 'missed'
        } : undefined;

        this.system = data.system ? {
            action: data.system.action || 'info', 
            error: data.system.error || undefined, 
            log: data.system.log || undefined
        } : undefined;

        this._clean(this);
    }

    _clean(obj) {
        Object.keys(obj).forEach(key => {
            if (obj[key] === undefined) {
                delete obj[key];
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                this._clean(obj[key]);
                if (Object.keys(obj[key]).length === 0) {
                    delete obj[key];
                }
            }
        });
    }

    isEmpty() {
        return !this.message && 
               !this.media && 
               !this.reaction && 
               !this.presence && 
               !this.group && 
               !this.call && 
               !this.system && 
               !this.reference; 
    }

    isSystemEvent() {
        return this.type.startsWith('SYS_') || this.type.startsWith('ACTION_');
    }
}


/**
 * CORE CLIENT
 * Desc
 */
class CoreClient {
    constructor(url) {
        this.url = url;
    }

    async sendMessage(payload) {
        try {
            const response = await fetch(this.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            return data.reply; // returns -> { text, actions } 
        } catch (error) {
            console.error('[CORE_CLIENT] Error communicating with Core:', error.message);
            return null;
        }
    }
}

/**
 * MESSAGE BATCHER
 * Desc
 */
class MessageBatcher {
    constructor(delayMs, callback) {
        this.delayMs = delayMs;
        this.callback = callback;
        this.batches = new Map();
        this.timers = new Map();
    }

    add(chatId, item) {
        if (!this.batches.has(chatId)) {
            this.batches.set(chatId, []);
        }
        this.batches.get(chatId).push(item);

        if (this.timers.has(chatId)) {
            clearTimeout(this.timers.get(chatId));
        }

        this.timers.set(chatId, setTimeout(() => {
            const batch = this.batches.get(chatId);
            this.batches.delete(chatId);
            this.timers.delete(chatId);
            this.callback(chatId, batch);
        }, this.delayMs));
    }
}

class UniversalResponse {
    constructor({ text = null, actions = [] } = {}) {
        this.text = text;
        this.actions = actions;
    }
}

module.exports = {
    EventTypes,
    UnifiedEvent,
    CoreClient,
    MessageBatcher,
    UniversalResponse
};