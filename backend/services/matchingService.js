const natural = require('natural');
const User = require('../models/User');

class MatchingService {
    constructor() {
        this.tfidf = new natural.TfIdf();
        this.tokenizer = new natural.WordTokenizer();
        this.subjects = [
            'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
            'English', 'History', 'Geography', 'Economics', 'Business Studies'
        ];
        this.synonyms = {
            'math': ['mathematics', 'maths', 'calc', 'algebra', 'geometry'],
            'cs': ['computer science', 'programming', 'coding', 'software'],
            'eng': ['english', 'language', 'writing', 'literature'],
            'sci': ['science', 'physics', 'chemistry', 'biology']
        };
    }

    // Normalize subject names and expand synonyms
    normalizeSubject(subject) {
        subject = subject.toLowerCase().trim();
        // Check for synonyms
        for (const [key, values] of Object.entries(this.synonyms)) {
            if (values.includes(subject)) {
                return key;
            }
        }
        return subject;
    }

    // Calculate compatibility score between two users based on teaching/learning preferences
    calculateCompatibility(user1, user2) {
        let score = 0;
        const matches = [];
        
        // Calculate teaching/learning compatibility
        // User1 teaches what User2 wants to learn
        for (const teach of user1.subjectsToTeach || []) {
            const learnMatch = (user2.subjectsToLearn || []).find(
                learn => this.normalizeSubject(learn.subject) === this.normalizeSubject(teach.subject)
            );
            if (learnMatch) {
                // Higher score for better proficiency match
                const proficiencyScore = 1 - (Math.abs(teach.proficiency - learnMatch.proficiency) / 5);
                const matchScore = 0.7 + (0.3 * proficiencyScore);
                matches.push({
                    subject: teach.subject,
                    type: 'teach',
                    score: matchScore,
                    user1Proficiency: teach.proficiency,
                    user2Proficiency: learnMatch.proficiency
                });
                score += matchScore;
            }
        }
        
        // User2 teaches what User1 wants to learn
        for (const teach of user2.subjectsToTeach || []) {
            const learnMatch = (user1.subjectsToLearn || []).find(
                learn => this.normalizeSubject(learn.subject) === this.normalizeSubject(teach.subject)
            );
            if (learnMatch) {
                const proficiencyScore = 1 - (Math.abs(teach.proficiency - learnMatch.proficiency) / 5);
                const matchScore = 0.7 + (0.3 * proficiencyScore);
                matches.push({
                    subject: teach.subject,
                    type: 'learn',
                    score: matchScore,
                    user1Proficiency: learnMatch.proficiency,
                    user2Proficiency: teach.proficiency
                });
                score += matchScore;
            }
        }
        
        // Add bonus for mutual teaching/learning interests
        const mutualTeaching = (user1.subjectsToTeach || []).some(t1 => 
            (user2.subjectsToTeach || []).some(t2 => 
                this.normalizeSubject(t1.subject) === this.normalizeSubject(t2.subject)
            )
        );
        
        if (mutualTeaching) {
            score += 0.5; // Bonus for having subjects they can learn together
        }
        
        // Normalize score to 0-1 range
        const maxPossibleScore = (user1.subjectsToTeach?.length || 0) + (user2.subjectsToTeach?.length || 0) + 0.5;
        const normalizedScore = maxPossibleScore > 0 ? Math.min(1, score / maxPossibleScore) : 0;
        
        return {
            score: normalizedScore,
            matches,
            mutualSubjects: this.findMutualSubjects(user1, user2)
        };
    }
    
    // Find mutual subjects between two users
    findMutualSubjects(user1, user2) {
        const user1Subjects = new Set((user1.subjectsToTeach || []).map(s => this.normalizeSubject(s.subject)));
        const user2Subjects = new Set((user2.subjectsToTeach || []).map(s => this.normalizeSubject(s.subject)));
        
        // Find intersection of subjects
        const mutual = [];
        for (const subject of user1Subjects) {
            if (user2Subjects.has(subject)) {
                mutual.push(subject);
            }
        }
        return mutual;
    }
    
    // Find matches for a user with detailed compatibility scoring
    async findMatches(userId, limit = 20) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');
            
            // Get all active users who aren't the current user
            const potentialMatches = await User.find({
                _id: { $ne: userId },
                status: { $ne: 'blocked' },
                isProfileComplete: true
            }).select('-password');
            
            // Calculate compatibility with each potential match
            const matchesWithScores = await Promise.all(
                potentialMatches.map(async (matchUser) => {
                    const compatibility = this.calculateCompatibility(user, matchUser);
                    
                    // Skip if no compatibility
                    if (compatibility.score <= 0) return null;
                    
                    // Get match history
                    const existingMatch = user.matches.find(m => m.user.toString() === matchUser._id.toString());
                    
                    return {
                        user: matchUser,
                        score: compatibility.score,
                        matches: compatibility.matches,
                        mutualSubjects: compatibility.mutualSubjects,
                        status: existingMatch?.status || 'new',
                        lastContact: existingMatch?.lastContact
                    };
                })
            );
            
            // Filter out nulls and sort by score (highest first)
            return matchesWithScores
                .filter(match => match !== null)
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
                
        } catch (error) {
            console.error('Error in findMatches:', error);
            throw error;
        }
    }

    
    // Vectorize user profile for ML-based matching
    vectorizeProfile(user) {
        // Clear previous TF-IDF documents
        this.tfidf = new natural.TfIdf();
        
        // Add user's teaching and learning subjects to TF-IDF
        const teachingSubjects = (user.subjectsToTeach || []).map(s => s.subject);
        const learningSubjects = (user.subjectsToLearn || []).map(s => s.subject);
        
        // Combine all subjects for vectorization
        const allText = [...teachingSubjects, ...learningSubjects].join(' ');
        
        // Add document to TF-IDF
        this.tfidf.addDocument(allText);
        
        // Return a simple vector representation
        // In a real implementation, you'd want a more sophisticated vectorization
        return {
            teaching: teachingSubjects,
            learning: learningSubjects,
            interests: user.interests || []
        };
    }
    
    // Find matches using ML-based approach (alternative implementation)
    async findMLMatches(userId, limit = 20) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');
            
            // Get all active users who aren't the current user
            const potentialMatches = await User.find({
                _id: { $ne: userId },
                status: { $ne: 'blocked' },
                isProfileComplete: true
            })
                .select('-password')
                .limit(50); // Limit to prevent overload

            // Vectorize current user's profile
            const userVector = this.vectorizeProfile(user);

            // Calculate match scores using vector similarity
            const matches = await Promise.all(potentialMatches.map(async match => {
                const matchVector = this.vectorizeProfile(match);

                // Simple similarity calculation
                const teachingMatch = matchVector.teaching.some(subject =>
                    userVector.learning.includes(subject)
                );
                const learningMatch = matchVector.learning.some(subject =>
                    userVector.teaching.includes(subject)
                );

                
                const score = (teachingMatch ? 0.5 : 0) + (learningMatch ? 0.5 : 0);
                
                return score > 0 ? {
                    user: match,
                    score: score,
                    isTeachingMatch: teachingMatch,
                    isLearningMatch: learningMatch
                } : null;
            }));
            
            // Filter out nulls and sort by score (highest first)
            return matches
                .filter(match => match !== null)
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
                
        } catch (error) {
            console.error('Error in findMLMatches:', error);
            throw error;
        }
    }

    // Calculate TF-IDF based similarity
    calculateTFIDFSimilarity(doc1, doc2) {
        try {
            const terms = new Set([...doc1.split(' '), ...doc2.split(' ')]);
            let dotProduct = 0;
            let norm1 = 0;
            let norm2 = 0;

            terms.forEach(term => {
                const tfidf1 = this.tfidf.tfidf(term, 0);
                const tfidf2 = this.tfidf.tfidf(term, 1);
                dotProduct += tfidf1 * tfidf2;
                norm1 += tfidf1 * tfidf1;
                norm2 += tfidf2 * tfidf2;
            });

            // Avoid division by zero
            if (norm1 === 0 || norm2 === 0) return 0;
            
            return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        } catch (error) {
            console.error('Error calculating TF-IDF similarity:', error);
            return 0;
        }
    }
}

// Export singleton instance
module.exports = new MatchingService();
