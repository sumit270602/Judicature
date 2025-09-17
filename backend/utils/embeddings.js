const { OpenAI } = require('openai');

class EmbeddingService {
    constructor() {
        this.openai = null; // Initialize lazily
    }

    getOpenAI() {
        if (!this.openai) {
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OPENAI_API_KEY environment variable is required');
            }
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
        }
        return this.openai;
    }

    async createEmbedding(text) {
        try {
            const openai = this.getOpenAI();
            const response = await openai.embeddings.create({
                model: "text-embedding-ada-002",
                input: text
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error('Error creating embedding:', error);
            throw error;
        }
    }

    async createEmbeddings(texts) {
        try {
            const openai = this.getOpenAI();
            const response = await openai.embeddings.create({
                model: "text-embedding-ada-002",
                input: texts
            });
            return response.data.map(item => item.embedding);
        } catch (error) {
            console.error('Error creating embeddings:', error);
            throw error;
        }
    }
}

module.exports = new EmbeddingService();