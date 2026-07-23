const logger = require('@jonquil-ai/logger');
const { toolSchemas, executeTool } = require('../tools');
const activeProvider = require('./providers/gemini');

async function handleMessageWithAI(universalMessage) {
    const userPrompt = `[Username: ${universalMessage.senderName}]: ${universalMessage.text}`;

    // memory
    const history = [
        {
            role: "system",
            content: `Your name is Jonquil. You're a smart, slightly humorous, and skilled AI that helps people in WhatsApp groups or private messages. If a user asks you for precise information, like the weather, be sure to use the relevant tool. Read the data from the tool and convey it to the user in a natural and friendly manner.`
        },
        {
            role: "user",
            content: userPrompt
        }
    ];

    logger.info('AI', `Jonquil is thinking... Message: "${universalMessage.text}"`);

    // agent loop
    let loopCount = 0;
    const MAX_LOOPS = 3;

    while (loopCount < MAX_LOOPS) {

        const aiResponse = await activeProvider.generate(history, toolSchemas);

        // if process completed -> exit loop
        if (aiResponse.text && (!aiResponse.toolCalls || aiResponse.toolCalls.length === 0)) {
            logger.success('AI', `Jonquil response: ${aiResponse.text.substring(0, 50)}...`);
            return aiResponse.text;
        }

        // if ai called a tool
        if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
            // save toolcall to memory
            history.push({
                role: 'assistant',
                toolCalls: aiResponse.toolCalls
            });

            // run all toolcalls
            for (const call of aiResponse.toolCalls) {
                logger.info('AI', `Tool call: ${call.name}`);
                
                // run tool
                const apiResult = await executeTool(call.name, call.args);
                
                // save output to mem
                history.push({
                    role: 'tool',
                    name: call.name,
                    content: apiResult
                });
            }
        }
        
        loopCount++;
    }

    return "I've done too much work and I'm tired right now, please ask again."; // Max loop protection
}

module.exports = handleMessageWithAI;