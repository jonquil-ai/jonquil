const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiProvider {
    constructor() {
        if (!process.env.GEMINI_KEY) throw new Error("GEMINI_KEY is missing!");
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

        this.modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";
        this.enableVision = process.env.ENABLE_VISION === 'true';
    }

    _formatTools(universalTools) {
        if (!universalTools || universalTools.length === 0) return undefined;
        
        const formattedTools = universalTools.map(tool => {
            const formattedProperties = {};
            for (const [key, val] of Object.entries(tool.parameters.properties)) {
                formattedProperties[key] = {
                    type: val.type.toUpperCase(), 
                    description: val.description
                };
            }
            return {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: tool.parameters.type.toUpperCase(), 
                    properties: formattedProperties,
                    required: tool.parameters.required
                }
            };
        });

        return [{ functionDeclarations: formattedTools }];
    }

    _formatHistory(universalHistory) {
        return universalHistory.filter(msg => msg.role !== 'system').map(msg => {
            if (msg.role === 'user') {
                const parts = [{ text: msg.content }];
                
                if (this.enableVision && msg.media && msg.media.data) {
                    parts.push({
                        inlineData: {
                            data: msg.media.data,
                            mimeType: msg.media.mimeType
                        }
                    });
                }
                return { role: 'user', parts };
            }
            if (msg.role === 'assistant') {
                if (msg.toolCalls) {
                    const parts = [];

                    if (msg.content) {
                        parts.push({ text: msg.content });
                    }
                    
                    parts.push(...msg.toolCalls.map(tc => {
                        const part = { functionCall: { name: tc.name, args: tc.args } };
                        const sig = tc.thoughtSignature || tc.thought_signature;
                        if (sig) part.thoughtSignature = sig;
                        return part;
                    }));
                    
                    return { role: 'model', parts: parts };
                }
                return { role: 'model', parts: [{ text: msg.content }] };
            }
            if (msg.role === 'tool') {
                return { role: 'user', parts: [{ functionResponse: { name: msg.name, response: msg.content } }] };
            }
        });
    }

    async generate(history, tools) {
        const systemMsg = history.find(m => m.role === 'system');
        const systemInstruction = systemMsg ? systemMsg.content : "";

        const model = this.genAI.getGenerativeModel({
            model: this.modelName,
            systemInstruction: systemInstruction,
            tools: this._formatTools(tools),
        });

        const contents = this._formatHistory(history);
        
        const result = await model.generateContent({ contents });
        const response = result.response;

        const output = { text: response.text() || null, toolCalls: [] };
        const candidate = response.candidates && response.candidates[0];
        const parts = candidate?.content?.parts || [];

        if (response.functionCalls()) {
            output.toolCalls = parts.filter(part => part.functionCall).map(part => {
                const sig = part.thoughtSignature || part.thought_signature;
                const tc = { name: part.functionCall.name, args: part.functionCall.args, id: sig || Math.random().toString(36).substring(7) };
                if (sig) tc.thoughtSignature = sig;
                return tc;
            });
        }
        return output;
    }
}

module.exports = new GeminiProvider();