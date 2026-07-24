const logger = require('@jonquil-ai/logger');
const { UniversalResponse } = require('@jonquil-ai/shared');
const { getSchemasForPlatform, executeCapability } = require('../tools');
const activeProvider = require('./providers/gemini');

async function handleMessageWithAI(universalMessage) {

    const log = logger.with(universalMessage);
    const availableSchemas = getSchemasForPlatform(universalMessage.platform);

    const userPrompt = `[Username: ${universalMessage.senderName}]: ${universalMessage.text}`;

    const history = [
        {
            role: "system",
            content: `Your name is Jonquil. You're a smart, slightly humorous, and skilled AI that helps people in WhatsApp groups or private messages. If a user asks you for precise information, like the weather, be sure to use the relevant tool. Read the data from the tool and convey it to the user in a natural and friendly manner.`
        },
        { role: "user", content: userPrompt }
    ];

    log.info('AI', `Incoming: ${universalMessage.text.substring(0, 50)}`);

    let loopCount = 0;
    const MAX_LOOPS = 3;
    const pendingGatewayActions = [];

    while (loopCount < MAX_LOOPS) {
        // send only avaliable schemas
        const aiResponse = await activeProvider.generate(history, availableSchemas);

        if (aiResponse.text && (!aiResponse.toolCalls || aiResponse.toolCalls.length === 0)) {
            log.success('AI', `Jonquil response: ${aiResponse.text.substring(0, 50)}...`);

            return new UniversalResponse({
                text: aiResponse.text,
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