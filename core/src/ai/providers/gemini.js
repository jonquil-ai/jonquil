const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiProvider {
    constructor() {
        if (!process.env.GEMINI_KEY) throw new Error("GEMINI_KEY is missing!");
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
    }

    // uppercase for geminiSDK
    _formatTools(universalTools) {
        if (!universalTools || universalTools.length === 0) return undefined;
        
        const formattedTools = universalTools.map(tool => {
            const formattedProperties = {};
            for (const [key, val] of Object.entries(tool.parameters.properties)) {
                formattedProperties[key] = {
                    type: val.type.toUpperCase(), // "string" -> "STRING"
                    description: val.description
                };
            }
            return {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: tool.parameters.type.toUpperCase(), // "object" -> "OBJECT"
                    properties: formattedProperties,
                    required: tool.parameters.required
                }
            };
        });

        return [{ functionDeclarations: formattedTools }];
    }

    // format history array for geminiSDK
    _formatHistory(universalHistory) {
        return universalHistory.filter(msg => msg.role !== 'system').map(msg => {
            if (msg.role === 'user') return { role: 'user', parts: [{ text: msg.content }] };
            if (msg.role === 'assistant') {
                if (msg.toolCalls) {
                    return { 
                        role: 'model', 
                        parts: msg.toolCalls.map(tc => {
                            const part = { 
                                functionCall: { name: tc.name, args: tc.args } 
                            };
                            // !! send with thought_signature
                            const sig = tc.thoughtSignature || tc.thought_signature;
                            if (sig) {
                                part.thoughtSignature = sig;
                            }
                            return part;
                        }) 
                    };
                }
                return { role: 'model', parts: [{ text: msg.content }] };
            }
            if (msg.role === 'tool') {
                return { role: 'user', parts: [{ functionResponse: { name: msg.name, response: msg.content } }] };
            }
        });
    }

    // main func
    async generate(history, tools) {
        const systemMsg = history.find(m => m.role === 'system');
        const systemInstruction = systemMsg ? systemMsg.content : "";

        const model = this.genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            systemInstruction: systemInstruction,
            tools: this._formatTools(tools),
        });

        const contents = this._formatHistory(history);
        
        const result = await model.generateContent({ contents });
        const response = result.response;

        const output = {
            text: response.text() || null,
            toolCalls: []
        };

        const candidate = response.candidates && response.candidates[0];
        const parts = candidate?.content?.parts || [];

        // !! keep the gemini's thought_signature
        if (response.functionCalls()) {
            output.toolCalls = parts
                .filter(part => part.functionCall)
                .map(part => {
                    const tc = {
                        name: part.functionCall.name,
                        args: part.functionCall.args
                    };
                    // camelCase or snake_case, check it all
                    const sig = part.thoughtSignature || part.thought_signature;
                    if (sig) {
                        tc.thoughtSignature = sig;
                    }
                    return tc;
                });
        }

        return output;
    }
}

module.exports = new GeminiProvider();