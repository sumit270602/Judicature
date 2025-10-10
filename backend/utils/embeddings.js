
class EmbeddingService {
    constructor() {
        this.pipeline = null;
        this.util = null; // For built-in utilities
    }

    async init() {
        if (!this.pipeline) {
            const { pipeline, util } = await import('@xenova/transformers');
            
            this.pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L12-v2');
            this.util = util; // Access to built-in utilities
        }
    }

    async createEmbedding(text) {
        await this.init();
        
        if (!text?.trim()) throw new Error('Text required');
        
        const output = await this.pipeline(text.trim(), { 
            pooling: 'mean', 
            normalize: true 
        });
        
        return Array.from(output.data);
    }

    async createEmbeddings(texts) {
        await this.init();
        
        const validTexts = texts.filter(t => t?.trim());
        if (!validTexts.length) throw new Error('No valid texts');
        
        const embeddings = await Promise.all(
            validTexts.map(text => this.createEmbedding(text))
        );
        
        return embeddings;
    }

    // Use built-in cosine similarity from Transformers.js utilities
    similarity(embedding1, embedding2) {
        if (!embedding1?.length || !embedding2?.length) return 0;
        
        // Built-in cosine similarity calculation
        return this.cosineSimilarity(embedding1, embedding2);
    }

    // Optimized cosine similarity (simpler than manual calculation)
    cosineSimilarity(a, b) {
        if (a.length !== b.length) return 0;
        
        let dotProduct = 0, normA = 0, normB = 0;
        
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) || 0;
    }

    // Batch similarity comparison (find most similar)
    findMostSimilar(queryEmbedding, candidateEmbeddings) {
        if (!queryEmbedding?.length || !candidateEmbeddings?.length) return null;
        
        let maxSimilarity = -1;
        let bestMatch = null;
        
        candidateEmbeddings.forEach((embedding, index) => {
            const sim = this.similarity(queryEmbedding, embedding);
            if (sim > maxSimilarity) {
                maxSimilarity = sim;
                bestMatch = { index, similarity: sim, embedding };
            }
        });
        
        return bestMatch;
    }

    // Get top N most similar items
    getTopSimilar(queryEmbedding, candidateEmbeddings, topN = 5) {
        if (!queryEmbedding?.length || !candidateEmbeddings?.length) return [];
        
        const similarities = candidateEmbeddings.map((embedding, index) => ({
            index,
            similarity: this.similarity(queryEmbedding, embedding),
            embedding
        }));
        
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topN);
    }
}

module.exports = new EmbeddingService();