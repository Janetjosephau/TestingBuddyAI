"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmAdapterFactory = void 0;
const common_1 = require("@nestjs/common");
const ollama_adapter_1 = require("./ollama.adapter");
let LlmAdapterFactory = class LlmAdapterFactory {
    constructor(ollamaAdapter) {
        this.ollamaAdapter = ollamaAdapter;
    }
    getAdapter(provider) {
        if (provider === 'ollama') {
            return this.ollamaAdapter;
        }
        throw new Error(`Unsupported LLM provider: ${provider}. Only Ollama is supported.`);
    }
};
exports.LlmAdapterFactory = LlmAdapterFactory;
exports.LlmAdapterFactory = LlmAdapterFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ollama_adapter_1.OllamaAdapter])
], LlmAdapterFactory);
//# sourceMappingURL=llm-adapter.factory.js.map