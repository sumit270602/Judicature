const User = require('../models/User');
const chromaService = require('./chroma');

// Initialize ChromaDB with existing lawyer data from MongoDB
const initializeLawyerVectors = async () => {
    try {
        console.log('Initializing lawyer vectors in ChromaDB...');
        
        // Get all lawyers from MongoDB
        const lawyers = await User.find({ role: 'lawyer' });
        
        if (lawyers.length === 0) {
            console.log('No lawyers found in MongoDB');
            return;
        }
        
        let initialized = 0;
        for (const lawyer of lawyers) {
            try {
                // ChromaDB handles embedding creation automatically
                const success = await chromaService.storeLawyerVector(lawyer._id.toString(), {
                    specializations: lawyer.specializations || [],
                    experience: lawyer.experience || 0,
                    rating: lawyer.rating || 0,
                    casesWon: lawyer.casesWon || 0
                });
                
                if (success) {
                    initialized++;
                    console.log(`✅ Stored lawyer: ${lawyer.name}`);
                } else {
                    console.warn(`Failed to store lawyer: ${lawyer.name}`);
                }
                
            } catch (error) {
                console.error(`Error processing lawyer ${lawyer._id}:`, error);
            }
        }
        
        console.log(`Successfully initialized ${initialized}/${lawyers.length} lawyer vectors`);
        return initialized;
        
    } catch (error) {
        console.error('Error initializing lawyer vectors:', error);
        return 0;
    }
};

// Sync a single lawyer's vector
async function syncLawyerVector(lawyerId) {
    try {
        const lawyer = await User.findById(lawyerId).select('-password');
        if (!lawyer || lawyer.role !== 'lawyer') {
            return false;
        }
        
        // ChromaDB handles embedding creation automatically
        const success = await chromaService.storeLawyerVector(lawyerId, {
            specializations: lawyer.specializations || [],
            experience: lawyer.experience || 0,
            rating: lawyer.rating || 0,
            casesWon: lawyer.casesWon || 0
        });
        
        return success;
        
    } catch (error) {
        console.error('Error syncing lawyer vector:', error);
        return false;
    }
}

module.exports = {
    initializeLawyerVectors,
    syncLawyerVector
};