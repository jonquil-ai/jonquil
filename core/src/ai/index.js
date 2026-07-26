const fs = require('fs');
const path = require('path');
const logger = require('@jonquil-ai/logger');
const { UniversalResponse } = require('@jonquil-ai/shared');
const { getSchemasForPlatform, executeCapability } = require('../tools');
const activeProvider = require('./providers/gemini');
const { getSessionHistory, saveToSession } = require('./memory');


const maxLogLength = process.env.MAX_LOG_LENGTH;

const soulPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'SOUL.md'), 'utf-8');
const rulesPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'RULES.md'), 'utf-8');

function parseAIOutput(rawOutput) {
    if (!rawOutput) return { thought: null, text: null, isSilent: true };

    let text = rawOutput;
    let thought = null;

    const thoughtMatch = text.match(/<thought>([\s\S]*?)<\/thought>/);
    if (thoughtMatch) {
        thought = thoughtMatch[1].trim();
        text = text.replace(/<thought>[\s\S]*?<\/thought>/, '').trim(); 
    }

    const isSilent = text === '<SILENCE>' || text === '';
    if (isSilent) text = null;

    return { thought, text, isSilent };
}

async function handleMessageWithAI(universalMessage) {
    const log = logger.with(universalMessage);
    const availableSchemas = getSchemasForPlatform(universalMessage.platform);

    const chatType = universalMessage.isGroup ? "Group Chat" : "Direct Message (DM)";
    const dateObj = new Date(universalMessage.timestamp);
    const timeStr = dateObj.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' });
    

   let quoteContext = "";
   if (universalMessage.quotedMessage) {
       let qMediaTag = universalMessage.quotedMessage.hasMedia ? ` [Attached Media: ${universalMessage.quotedMessage.mediaType}]` : "";
       quoteContext = `\n(Quoted MsgID: ${universalMessage.quotedMessage.messageId} | ${universalMessage.quotedMessage.senderName}): "${universalMessage.quotedMessage.text}"${qMediaTag}`;
   }

   let mediaTag = "";
   let userMedia = null;
   if (universalMessage.hasMedia) {
       userMedia = { data: universalMessage.mediaData, mimeType: universalMessage.mediaMime };
       mediaTag = `\n[Media]: User sent a/an [${universalMessage.mediaType.toUpperCase()}].`;
   }

   if (!userMedia && universalMessage.quotedMessage && universalMessage.quotedMessage.hasMedia) {
       userMedia = { data: universalMessage.quotedMessage.mediaData, mimeType: universalMessage.quotedMessage.mediaMime };
   }

   const systemInstruction = `${soulPrompt}\n\n${rulesPrompt}\n\n[Current Platform]: ${universalMessage.platform}\n[Current Time]: ${timeStr}`;
   

   const userPrompt = `[MsgID: ${universalMessage.messageId}] [User: ${universalMessage.senderName}]${quoteContext}\n[Message]: ${universalMessage.text}${mediaTag}`;

   const sessionHistory = getSessionHistory(universalMessage.chatId);

    const history = [
        { role: "system", content: systemInstruction },
        ...sessionHistory,
        { role: "user", content: userPrompt, media: userMedia } 
    ];



    log.info('AI', `Incoming Request: ${universalMessage.text.substring(0, maxLogLength)}`);

    let loopCount = 0;
    const MAX_LOOPS = 3;
    const pendingGatewayActions = [];

    while (loopCount < MAX_LOOPS) {
        const aiResponse = await activeProvider.generate(history, availableSchemas);

        if (aiResponse.text && (!aiResponse.toolCalls || aiResponse.toolCalls.length === 0)) {
            
            const { thought, text, isSilent } = parseAIOutput(aiResponse.text);

            if (thought) log.debug('AI', `Jonquil Thought: ${thought}`);

            if (isSilent) {
                log.info('AI', `Jonquil didn't speak.`);
                return new UniversalResponse({ text: null, actions: pendingGatewayActions });
            }

            log.success('AI', `Jonquil Response: ${text.substring(0, maxLogLength).replace(/\n/g, ' ')}`);
            
            saveToSession(universalMessage.chatId, userPrompt, text);
            
            return new UniversalResponse({
                text: text,
                actions: pendingGatewayActions
            });
        }

        if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
            history.push({ role: 'assistant', toolCalls: aiResponse.toolCalls });

            for (const call of aiResponse.toolCalls) {

                log.info('AI', `Tool call: ${call.name}`);

                const apiResult = await executeCapability(call.name, call.args, universalMessage);

                if (apiResult.gatewayAction) {
                    pendingGatewayActions.push(apiResult.gatewayAction);

                    history.push({ role: 'tool', name: call.name, content: { success: true, status: "Action forwarded." } });
                } else {
                    history.push({ role: 'tool', name: call.name, content: apiResult });
                }
            }
        }

        loopCount++;
    }


    return new UniversalResponse({ text: "I've done too much work and I'm tired right now, please ask again.", actions: pendingGatewayActions });
}

module.exports = handleMessageWithAI;