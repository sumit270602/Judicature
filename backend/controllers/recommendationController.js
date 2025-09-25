const User = require('../models/User');
const chromaService = require('../utils/chroma');

// Recommend lawyers based on case type
const recommendLawyersForCase = async (req, res) => {
    try {
        const { caseType, caseDescription } = req.body;
        console.log('Received lawyer recommendation request:', { caseType, caseDescription });
        
        if (!caseType) {
            console.log('No case type provided');
            return res.status(400).json({ error: 'Case type is required' });
        }

        // Create case description for ChromaDB
        const caseText = `${caseType} ${caseDescription || ''}`.trim();
        
        // ChromaDB handles embedding and similarity search automatically
        const recommendations = await chromaService.findLawyersForCase(caseText, 10);
        
        // If ChromaDB returns no results, fall back to simple database query
        if (recommendations.length === 0) {
            console.log('ChromaDB returned no results, falling back to database query');
            
            // Simple fallback: find verified lawyers who have related practice areas
            const practiceAreaMap = {
                'civil': ['civil', 'property', 'other'],
                'criminal': ['criminal', 'other'],
                'family': ['family', 'other'],
                'corporate': ['corporate', 'other'],
                'other': ['civil', 'criminal', 'family', 'corporate', 'property', 'labor', 'tax', 'constitutional', 'intellectual', 'other']
            };
            
            // Make case type matching case-insensitive
            const normalizedCaseType = caseType.toLowerCase();
            const relevantAreas = practiceAreaMap[normalizedCaseType] || practiceAreaMap['other'];
            
            const fallbackLawyers = await User.find({
                role: 'lawyer',
                isActive: true,
                verificationStatus: 'verified',
                practiceAreas: { $in: relevantAreas }
            }).select('-password').limit(10);
            
            if (fallbackLawyers.length === 0) {
                console.log('No verified lawyers found, trying to find any lawyers...');
                
                // Try to find any lawyers (even unverified) as a last resort
                const anyLawyers = await User.find({
                    role: 'lawyer',
                    isActive: true
                }).select('-password').limit(5);
                
                if (anyLawyers.length === 0) {
                    return res.json({ 
                        lawyers: [], 
                        message: 'No lawyers found in the system. Please contact support to add lawyers.' 
                    });
                }
                
                // Convert unverified lawyers to recommendation format
                const unverifiedRecommendations = anyLawyers.map(lawyer => ({
                    lawyer: lawyer,
                    similarity: 0.6, // Lower similarity for unverified
                    specializations: lawyer.practiceAreas || ['General Practice'],
                    experience: lawyer.experience || 1,
                    rating: 3.5, // Default rating for unverified
                    casesWon: 5 // Default cases won
                }));
                
                return res.json({
                    caseType: normalizedCaseType,
                    lawyers: unverifiedRecommendations,
                    count: unverifiedRecommendations.length,
                    message: `Found ${unverifiedRecommendations.length} lawyer${unverifiedRecommendations.length > 1 ? 's' : ''} (some may be pending verification).`
                });
            }
            
            // Convert to recommendation format
            const fallbackRecommendations = fallbackLawyers.map(lawyer => ({
                lawyer: lawyer,
                similarity: 0.8, // Default similarity
                specializations: lawyer.practiceAreas || [],
                experience: lawyer.experience || 0,
                rating: 4.0, // Default rating
                casesWon: 10 // Default cases won
            }));
            
            return res.json({
                caseType,
                lawyers: fallbackRecommendations,
                count: fallbackRecommendations.length,
                message: `Found ${fallbackRecommendations.length} verified lawyer${fallbackRecommendations.length > 1 ? 's' : ''} for your case (database search).`
            });
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

// Recommend lawyers based on selected service
const recommendLawyersForService = async (req, res) => {
    try {
        const { serviceId, serviceCategory, serviceType, caseDescription, priority } = req.body;
        
        if (!serviceCategory && !serviceType && !serviceId) {
            return res.status(400).json({ error: 'Service category, type, or ID is required' });
        }

        // Import LegalService model
        const LegalService = require('../models/LegalService');
        
        // Build query for services
        let serviceQuery = { isActive: true };
        if (serviceId) {
            serviceQuery._id = serviceId;
        } else {
            if (serviceCategory) serviceQuery.category = serviceCategory;
            if (serviceType) serviceQuery.serviceType = serviceType;
        }

        // Find lawyers who offer this service
        const services = await LegalService.find(serviceQuery)
            .populate('lawyer', '-password')
            .limit(20);

        if (services.length === 0) {
            console.log('No services found, falling back to general lawyer search');
            
            // Fallback: find verified lawyers with related practice areas
            const categoryToPracticeArea = {
                'personal_family': ['family', 'other'],
                'criminal_property': ['criminal', 'property', 'other'],
                'civil_debt': ['civil', 'other'],
                'corporate_law': ['corporate', 'other'],
                'others': ['civil', 'criminal', 'family', 'corporate', 'property', 'labor', 'tax', 'constitutional', 'intellectual', 'other']
            };
            
            const relevantAreas = serviceCategory ? 
                (categoryToPracticeArea[serviceCategory] || ['other']) : 
                ['civil', 'criminal', 'family', 'corporate', 'other'];
            
            const fallbackLawyers = await User.find({
                role: 'lawyer',
                isActive: true,
                verificationStatus: 'verified',
                practiceAreas: { $in: relevantAreas }
            }).select('-password').limit(10);
            
            if (fallbackLawyers.length === 0) {
                return res.json({ 
                    lawyers: [], 
                    message: 'No verified lawyers found for this service. Please try again later.' 
                });
            }
            
            // Convert to service recommendation format
            const fallbackRecommendations = fallbackLawyers.map(lawyer => ({
                lawyer: lawyer,
                services: [], // No specific services
                avgRating: 4.0,
                experience: lawyer.experience || 0,
                specializations: lawyer.practiceAreas || [],
                casesWon: 10,
                responseTime: '24 hours',
                similarity: 0.7
            }));
            
            return res.json({
                serviceCategory,
                serviceType,
                lawyers: fallbackRecommendations,
                count: fallbackRecommendations.length,
                message: `Found ${fallbackRecommendations.length} verified lawyer${fallbackRecommendations.length > 1 ? 's' : ''} (general search).`
            });
        }

        // Group services by lawyer and calculate recommendations
        const lawyerRecommendations = {};
        
        for (const service of services) {
            const lawyer = service.lawyer;
            
            // Only include verified lawyers who can take cases
            if (!lawyer || !lawyer.canTakeCases()) continue;
            
            const lawyerId = lawyer._id.toString();
            
            if (!lawyerRecommendations[lawyerId]) {
                lawyerRecommendations[lawyerId] = {
                    lawyer: lawyer,
                    services: [],
                    avgRating: lawyer.rating || 0,
                    experience: lawyer.experience || 0,
                    specializations: lawyer.practiceAreas || [],
                    casesWon: lawyer.casesWon || 0,
                    responseTime: '24 hours', // Default
                    similarity: 1.0 // Perfect match since they offer the exact service
                };
            }
            
            lawyerRecommendations[lawyerId].services.push({
                id: service._id,
                title: service.title,
                description: service.description,
                pricing: service.pricing,
                estimatedDuration: service.estimatedDuration,
                category: service.category,
                serviceType: service.serviceType
            });
        }

        // Convert to array and sort by rating and experience
        const recommendedLawyers = Object.values(lawyerRecommendations)
            .sort((a, b) => {
                // Priority: rating > experience > number of services
                if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
                if (b.experience !== a.experience) return b.experience - a.experience;
                return b.services.length - a.services.length;
            });

        const message = recommendedLawyers.length === 0 ? 
            'No verified lawyers found offering this service.' :
            `Found ${recommendedLawyers.length} verified lawyer${recommendedLawyers.length > 1 ? 's' : ''} offering this service.`;

        res.json({
            serviceCategory,
            serviceType,
            lawyers: recommendedLawyers,
            count: recommendedLawyers.length,
            message
        });

    } catch (error) {
        console.error('Error finding lawyers for service:', error);
        res.status(500).json({ error: 'Failed to find lawyers for service' });
    }
};

module.exports = {
    recommendLawyersForCase,
    getSimilarLawyers,
    updateLawyerVector,
    recommendLawyersForService
};