
const { ChromaClient } = require('chromadb');
const embeddingService = require('./embeddings');

class ChromaVectorService {
    constructor() {
        this.client = null;
        this.collection = null;
        this.connected = false;
        this.embeddingFunction = null; // Initialize after connection
    }

    async connect() {
        try {
            console.log('Connecting to ChromaDB at localhost:8000...');
            this.client = new ChromaClient({
                host: "localhost",
                port: 8000
            });
            
            // Create collection without embedding function first
            this.collection = await this.client.getOrCreateCollection({
                name: "lawyers"
            });
            
            this.connected = true;
            console.log('Successfully connected to ChromaDB and initialized lawyers collection');
        } catch (error) {
            console.error('Failed to connect to ChromaDB:', error);
            this.connected = false;
        }
    }

    async disconnect() {
        if (this.connected) {
            this.connected = false;
        }
    }

    // Store lawyer with manual embedding creation
    async storeLawyerVector(lawyerId, lawyerData) {
        if (!this.connected) return false;
        
        try {
            console.log('Storing lawyer vector for ID:', lawyerId);
            const document = this.buildLawyerDocument(lawyerData);
            const embedding = await embeddingService.createEmbedding(document);
            
            await this.collection.upsert({
                ids: [lawyerId],
                documents: [document],
                embeddings: [embedding],
                metadatas: [{
                    specializations: lawyerData.specializations.join(','),
                    experience: lawyerData.experience,
                    rating: lawyerData.rating,
                    casesWon: lawyerData.casesWon
                }]
            });
            return true;
        } catch (error) {
            console.error('Error storing lawyer:', error);
            return false;
        }
    }

    // Find lawyers for case with manual embedding
    async findLawyersForCase(caseDescription, limit = 10) {
        if (!this.connected) return [];
        
        try {
            const queryEmbedding = await embeddingService.createEmbedding(caseDescription);
            
            const results = await this.collection.query({
                queryEmbeddings: [queryEmbedding],
                nResults: limit
            });
            
            return this.formatResults(results);
        } catch (error) {
            console.error('Error finding lawyers for case:', error);
            return [];
        }
    }

    // Find similar lawyers with manual embedding
    async findSimilarLawyers(targetLawyerId, limit = 5) {
        if (!this.connected) return [];
        
        try {
            // Get target lawyer's document
            const targetResult = await this.collection.get({
                ids: [targetLawyerId],
                include: ['documents']
            });
            
            if (!targetResult.documents || targetResult.documents.length === 0) {
                return [];
            }
            
            // Create embedding for target lawyer and find similar
            const queryEmbedding = await embeddingService.createEmbedding(targetResult.documents[0]);
            
            const results = await this.collection.query({
                queryEmbeddings: [queryEmbedding],
                nResults: limit + 1
            });
            
            return this.filterResults(results, targetLawyerId).slice(0, limit);
        } catch (error) {
            console.error('Error finding similar lawyers:', error);
            return [];
        }
    }

    // Simplified helper methods
    buildLawyerDocument(lawyerData) {
        return `Lawyer specializing in ${lawyerData.specializations.join(', ')} with ${lawyerData.experience} years experience. Rating: ${lawyerData.rating}. Cases won: ${lawyerData.casesWon}`;
    }

    formatResults(results) {
        if (!results.ids || !results.ids[0]) return [];
        
        return results.ids[0].map((id, i) => ({
            lawyerId: id,
            similarity: 1 - (results.distances[0][i] || 0),
            specializations: results.metadatas[0][i].specializations.split(','),
            experience: results.metadatas[0][i].experience,
            rating: results.metadatas[0][i].rating,
            casesWon: results.metadatas[0][i].casesWon
        }));
    }

    filterResults(results, excludeId) {
        if (!results.ids || !results.ids[0]) return [];
        
        return results.ids[0]
            .map((id, i) => ({
                lawyerId: id,
                similarity: 1 - (results.distances[0][i] || 0),
                specializations: results.metadatas[0][i].specializations.split(','),
                experience: results.metadatas[0][i].experience,
                rating: results.metadatas[0][i].rating,
                casesWon: results.metadatas[0][i].casesWon
            }))
            .filter(result => result.lawyerId !== excludeId);
    }
}

module.exports = new ChromaVectorService();