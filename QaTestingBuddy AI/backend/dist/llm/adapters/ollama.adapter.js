"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaAdapter = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let OllamaAdapter = class OllamaAdapter {
    constructor() {
        this.baseUrl = 'http://localhost:11434';
    }
    async testConnection(config) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/tags`, {
                timeout: 5000,
            });
            if (response.data && response.data.models) {
                const models = response.data.models.map((model) => model.name);
                return { success: true, models };
            }
            else {
                return { success: false, error: 'Unexpected response format' };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || error.message || 'Connection failed'
            };
        }
    }
    async generateText(prompt, config) {
        try {
            const payload = {
                model: config.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: config.temperature || 0.7,
                    num_predict: config.maxTokens || 2048,
                },
            };
            const response = await axios_1.default.post(`${this.baseUrl}/api/generate`, payload, {
                timeout: 30000,
            });
            if (response.data && response.data.response) {
                return { success: true, text: response.data.response };
            }
            else {
                return { success: false, error: 'No response generated' };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || error.message || 'Generation failed'
            };
        }
    }
};
exports.OllamaAdapter = OllamaAdapter;
exports.OllamaAdapter = OllamaAdapter = __decorate([
    (0, common_1.Injectable)()
], OllamaAdapter);
//# sourceMappingURL=ollama.adapter.js.map