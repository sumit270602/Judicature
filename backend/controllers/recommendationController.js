const User = require('../models/User');
const chromaService = require('../utils/chroma');

// Recommend lawyers based on case type
const recommendLawyersForCase = async (req, res) => {
    try {
        const { caseType, caseDescription } = req.body;
        
        if (!caseType) {
            return res.status(400).json({ error: 'Case type is required' });
        }

        // Create case description for ChromaDB
        const caseText = `${caseType} ${caseDescription || ''}`.trim();
        
        // ChromaDB handles embedding and similarity search automatically
        const recommendations = await chromaService.findLawyersForCase(caseText, 10);
        
        if (recommendations.length === 0) {
            return res.json({ lawyers: [], message: 'No lawyers found in recommendation system' });
        }

        // Get full lawyer details from MongoDB - only verified lawyers who can take cases
        const lawyersWithProfiles = [];
        for (const rec of recommendations) {
            const lawyerProfile = await User.findById(rec.lawyerId).select('-password');
            if (lawyerProfile && lawyerProfile.canTakeCases()) {
                lawyersWithProfiles.push({
                    lawyer: lawyerProfile,
                    similarity: rec.similarity,
                    specializations: rec.specializations,
                    experience: rec.experience,
                    rating: rec.rating,
                    casesWon: rec.casesWon
                });
            }
        }

        // Add message if no verified lawyers found
        const message = lawyersWithProfiles.length === 0 ? 
            'No verified lawyers found for this case type. All recommended lawyers must be verified to take cases.' :
            `Found ${lawyersWithProfiles.length} verified lawyer${lawyersWithProfiles.length > 1 ? 's' : ''} for your case.`;

        res.json({
            caseType,
            lawyers: lawyersWithProfiles,
            count: lawyersWithProfiles.length,
            message
        });

    } catch (error) {
        console.error('Error recommending lawyers:', error);
        res.status(500).json({ error: 'Failed to get lawyer recommendations' });
    }
};

// Get similar lawyers based on a lawyer's profile
const getSimilarLawyers = async (req, res) => {
    try {
        const { lawyerId } = req.params;
        
        if (!lawyerId) {
            return res.status(400).json({ error: 'Lawyer ID is required' });
        }

        // Check if lawyer exists in MongoDB
        const targetLawyer = await User.findById(lawyerId).select('-password');
        if (!targetLawyer || targetLawyer.role !== 'lawyer') {
            return res.status(404).json({ error: 'Lawyer not found' });
        }

        // Use ChromaDB vector search
        const similarLawyers = await chromaService.findSimilarLawyers(lawyerId, 8);
        
        if (similarLawyers.length === 0) {
            return res.json({ 
                targetLawyer: targetLawyer,
                similarLawyers: [], 
                message: 'No similar lawyers found' 
            });
        }

        // Get full profiles for similar lawyers - only verified lawyers who can take cases
        const recommendations = [];
        for (const similar of similarLawyers) {
            const lawyerProfile = await User.findById(similar.lawyerId).select('-password');
            if (lawyerProfile && lawyerProfile.canTakeCases()) {
                recommendations.push({
                    lawyer: lawyerProfile,
                    similarity: similar.similarity,
                    specializations: similar.specializations,
                    experience: similar.experience,
                    rating: similar.rating,
                    casesWon: similar.casesWon
                });
            }
        }

        res.json({
            targetLawyer: targetLawyer,
            similarLawyers: recommendations,
            count: recommendations.length
        });

    } catch (error) {
        console.error('Error finding similar lawyers:', error);
        res.status(500).json({ error: 'Failed to find similar lawyers' });
    }
};

// Update lawyer vector when profile changes
const updateLawyerVector = async (lawyerId, lawyerData) => {
    try {
        // ChromaDB handles embeddings automatically, just store lawyer data
        const success = await chromaService.storeLawyerVector(lawyerId, {
            specializations: lawyerData.specializations || [],
            experience: lawyerData.experience || 0,
            rating: lawyerData.rating || 0,
            casesWon: lawyerData.casesWon || 0
        });
        
        if (success) {
            console.log(`Updated vector for lawyer ${lawyerId}`);
        } else {
            console.warn(`Failed to update vector for lawyer ${lawyerId}`);
        }
        
    } catch (error) {
        console.error('Error updating lawyer vector:', error);
    }
};

module.exports = {
    recommendLawyersForCase,
    getSimilarLawyers,
    updateLawyerVector
};