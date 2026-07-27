const { Mistral } = require('@mistralai/mistralai');

class MistralProvider {
    constructor() {
        if (!process.env.MISTRAL_KEY) throw new Error("MISTRAL_KEY is missing!");
        this.client = new Mistral({ apiKey: process.env.MISTRAL_KEY });
        this.modelName = process.env.MISTRAL_MODEL || 'mistral-large-latest';
    }

    _formatTools(universalTools) {
        if (!universalTools || universalTools.length === 0) return undefined;
        return universalTools.map(tool => ({
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }
        }));
    }

    _formatHistory(universalHistory) {
        return universalHistory.map(msg => {
            if (msg.role === 'system') return { role: 'system', content: msg.content };
            if (msg.role === 'user') return { role: 'user', content: msg.content }; 
            if (msg.role === 'assistant') {
                if (msg.toolCalls) {
                    return {
                        role: 'assistant',
                        content: msg.content || "",
                        tool_calls: msg.toolCalls.map(tc => ({
                            id: tc.id, 
                            type: 'function',
                            function: { name: tc.name, arguments: JSON.stringify(tc.args) }
                        }))
                    };
                }
                return { role: 'assistant', content: msg.content };
            }
            if (msg.role === 'tool') {
                return {
                    role: 'tool',
                    tool_call_id: msg.id,
                    name: msg.name,
                    content: JSON.stringify(msg.content)
                };
            }
        }).filter(Boolean);
    }

    async generate(history, tools) {
        const messages = this._formatHistory(history);
        const formattedTools = this._formatTools(tools);

        const response = await this.client.chat.complete({
            model: this.modelName,
            messages: messages,
            tools: formattedTools,
            temperature: 0.7,
            tool_choice: "auto"
        });

        const choice = response.choices[0].message;
        const output = { text: choice.content || null, toolCalls: [] };

        if (choice.tool_calls && choice.tool_calls.length > 0) {
            output.toolCalls = choice.tool_calls.map(call => ({
                id: call.id, 
                name: call.function.name,
                args: JSON.parse(call.function.arguments)
            }));
        }

        return output;
    }
}

module.exports = new MistralProvider();