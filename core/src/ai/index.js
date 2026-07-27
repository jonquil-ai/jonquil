const fs = require('fs');
const path = require('path');
const logger = require('@jonquil-ai/logger');
const { UniversalResponse } = require('@jonquil-ai/shared');

const { getSchemasForPlatform, executeCapability } = require('../tools');

const providerName = process.env.ACTIVE_PROVIDER || 'gemini';
const activeProvider = require(`./providers/${providerName}`);

const { getSessionHistory, saveToSession } = require('./memory');
const ContextBuilder = require('./contextBuilder');

const maxLogLength = process.env.MAX_LOG_LENGTH || 100;

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

    const systemInstruction = ContextBuilder.buildSystemInstruction(universalMessage.platform, universalMessage.timestamp);
    const userPrompt = ContextBuilder.buildUserPrompt(universalMessage);
    const userMedia = ContextBuilder.extractUserMedia(universalMessage);

    const sessionHistory = getSessionHistory(universalMessage.chatId);

    const history = [
        { role: "system", content: systemInstruction },
        ...sessionHistory,
        { role: "user", content: userPrompt, media: userMedia }
    ];

    log.dump('AI INPUT (HISTORY)', history);
    log.info('AI', `Incoming Request: ${universalMessage.text.substring(0, maxLogLength)}`);

    let loopCount = 0;
    const MAX_LOOPS = process.env.AI_MAX_LOOPS || 3;
    const pendingGatewayActions = [];

    const newTurns = [
        { role: "user", content: userPrompt, media: userMedia }
    ];

    while (loopCount < MAX_LOOPS) {
        const aiResponse = await activeProvider.generate(history, availableSchemas);
        log.dump(`AI OUTPUT (LOOP ${loopCount + 1})`, aiResponse);

        if (aiResponse.text && (!aiResponse.toolCalls || aiResponse.toolCalls.length === 0)) {
            const { thought, text, isSilent } = parseAIOutput(aiResponse.text);

            if (thought) log.debug('AI', `Jonquil Thought: ${thought}`);

            newTurns.push({ role: 'assistant', content: aiResponse.text });

            saveToSession(universalMessage.chatId, newTurns);

            if (isSilent) {
                log.info('AI', `Jonquil didn't speak.`);
                return new UniversalResponse({ text: null, actions: pendingGatewayActions });
            }

            log.success('AI', `Jonquil Response: ${text.substring(0, maxLogLength).replace(/\n/g, ' ')}`);
            return new UniversalResponse({ text: text, actions: pendingGatewayActions });
        }

        if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {

            const assistantToolTurn = { 
                role: 'assistant', 
                content: aiResponse.text || "", 
                toolCalls: aiResponse.toolCalls 
            };
            
            history.push(assistantToolTurn);
            newTurns.push(assistantToolTurn);

            for (const call of aiResponse.toolCalls) {
                log.info('AI', `Tool call: ${call.name}`);

                const apiResult = await executeCapability(call.name, call.args, universalMessage);

                let toolContent;
                if (apiResult.gatewayAction) {
                    pendingGatewayActions.push(apiResult.gatewayAction);
                    toolContent = { success: true, status: "Action forwarded." };
                } else {
                    toolContent = apiResult;
                }

                const toolTurn = { role: 'tool', id: call.id, name: call.name, content: toolContent };

                history.push(toolTurn);
                newTurns.push(toolTurn);
            }
        }
        loopCount++;
    }

    saveToSession(universalMessage.chatId, newTurns);
    return new UniversalResponse({ text: "I've done too much work and I'm tired right now, please ask again.", actions: pendingGatewayActions });
}

module.exports = handleMessageWithAI;