import dotenv from 'dotenv';

dotenv.config();

export const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
export const OPENAI_URL = process.env.OPENAI_URL || 'https://api.openai.com/v1/chat/completions';
export const LMSTUDIO_URL = process.env.LMSTUDIO_URL || '';
export const GROK_URL = process.env.GROK_URL || '';
export const PORT = process.env.PORT || '4000';
