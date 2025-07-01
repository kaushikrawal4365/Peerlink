const natural = require('natural');
const User = require('../models/User');

class MatchingService {
    constructor() {
        this.tfidf = new natural.TfIdf();
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
        if (!subject) return '';
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
        if (user1.subjectsToTeach && user2.subjectsToLearn) {
            for (const teach of user1.subjectsToTeach) {
                const normalizedTeach = this.normalizeSubject(teach.subject);
                const learnMatch = user2.subjectsToLearn.find(
                    learn => this.normalizeSubject(learn.subject) === normalizedTeach
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
        }
        
        // User2 teaches what User1 wants to learn
        if (user2.subjectsToTeach && user1.subjectsToLearn) {
            for (const teach of user2.subjectsToTeach) {
                const normalizedTeach = this.normalizeSubject(teach.subject);
                const learnMatch = user1.subjectsToLearn.find(
                    learn => this.normalizeSubject(learn.subject) === normalizedTeach
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
        }
        
        // Add bonus for mutual teaching/learning interests
        if (user1.subjectsToTeach && user2.subjectsToTeach) {
            const mutualTeaching = user1.subjectsToTeach.some(t1 => 
                user2.subjectsToTeach.some(t2 => 
                    this.normalizeSubject(t1.subject) === this.normalizeSubject(t2.subject)
                )
            );
            
            if (mutualTeaching) {
                score += 0.5; // Bonus for having subjects they can learn together
            }
        }
        
        // Normalize score to 0-1 range
        const maxPossibleScore = ((user1.subjectsToTeach?.length || 0) + (user2.subjectsToTeach?.length || 0)) * 0.7 + 0.5;
        const normalizedScore = maxPossibleScore > 0 ? Math.min(1, score / maxPossibleScore) : 0;
        
        return {
            score: normalizedScore,
            matches,
            mutualSubjects: this.findMutualSubjects(user1, user2)
        };
    }
    
    // Find mutual subjects between two users
    findMutualSubjects(user1, user2) {
        if (!user1.subjectsToTeach || !user2.subjectsToTeach) return [];
        
        const user1Subjects = new Map(
            user1.subjectsToTeach.map(s => [this.normalizeSubject(s.subject), s.subject])
        );
        
        const mutual = [];
        
        for (const subject of user2.subjectsToTeach) {
            const normalized = this.normalizeSubject(subject.subject);
            if (user1Subjects.has(normalized)) {
                mutual.push(user1Subjects.get(normalized));
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
            const matchesWithScores = [];
            
            for (const matchUser of potentialMatches) {
                try {
                    const compatibility = this.calculateCompatibility(user, matchUser);
                    
                    // Skip if no compatibility
                    if (compatibility.score <= 0) continue;
                    
                    // Get match history
                    const existingMatch = user.matches?.find(m => 
                        m.user && m.user.toString() === matchUser._id.toString()
                    );
                    
                    matchesWithScores.push({
                        user: matchUser,
                        score: compatibility.score,
                        matches: compatibility.matches,
                        mutualSubjects: compatibility.mutualSubjects,
                        status: existingMatch?.status || 'new',
                        lastContact: existingMatch?.lastContact
                    });
                } catch (error) {
                    console.error(`Error calculating match for user ${matchUser._id}:`, error);
                }
            }
            
            // Sort by score (highest first) and limit results
            return matchesWithScores
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
                
        } catch (error) {
            console.error('Error in findMatches:', error);
            throw error;
        }
    }
}

module.exports = new MatchingService();
