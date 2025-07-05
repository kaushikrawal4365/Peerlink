/**
 * Match Utility Functions
 * 
 * This module provides functions to find and manage matches between users
 * based on their teaching and learning subjects.
 */

const User = require('../models/User');

/**
 * Find potential matches for a user
 * @param {string} currentUserId - ID of the current user
 * @returns {Promise<Array>} - Array of potential matches with scores
 */
async function findMatches(currentUserId) {
  try {
    console.log('🔍 Finding matches for user:', currentUserId);
    
    // 1. Get current user with basic info
    const currentUser = await User.findById(currentUserId)
      .select('subjectsToTeach subjectsToLearn matches')
      .lean();

    if (!currentUser) {
      console.error('❌ User not found:', currentUserId);
      throw new Error('User not found');
    }
    
    // 2. Initialize empty arrays if they don't exist
    if (!Array.isArray(currentUser.subjectsToTeach)) currentUser.subjectsToTeach = [];
    if (!Array.isArray(currentUser.subjectsToLearn)) currentUser.subjectsToLearn = [];
    
    console.log('📚 Current user subjects - Teach:', currentUser.subjectsToTeach);
    console.log('📖 Current user subjects - Learn:', currentUser.subjectsToLearn);

    // 3. Get all potential matches (users who completed profile)
    const allUsers = await User.find({ 
      _id: { $ne: currentUserId },
      isProfileComplete: true
    }).select('name email bio subjectsToTeach subjectsToLearn')
      .lean();

    console.log(`🔍 Found ${allUsers.length} potential match candidates`);
    
    const matches = [];

    // 4. Simple matching logic
    for (const user of allUsers) {
      try {
        // Initialize arrays if they don't exist
        const userSubjectsToTeach = Array.isArray(user.subjectsToTeach) ? user.subjectsToTeach : [];
        const userSubjectsToLearn = Array.isArray(user.subjectsToLearn) ? user.subjectsToLearn : [];
        
        // Extract subject names (safely)
        const userTeachSubjects = userSubjectsToTeach
          .filter(s => s && s.subject)
          .map(s => s.subject.toString().toLowerCase().trim());
          
        const userLearnSubjects = userSubjectsToLearn
          .filter(s => s && s.subject)
          .map(s => s.subject.toString().toLowerCase().trim());

        // Current user's subjects (already initialized as arrays)
        const currentTeachSubjects = currentUser.subjectsToTeach
          .filter(s => s && s.subject)
          .map(s => s.subject.toString().toLowerCase().trim());
          
        const currentLearnSubjects = currentUser.subjectsToLearn
          .filter(s => s && s.subject)
          .map(s => s.subject.toString().toLowerCase().trim());

        // Find matching subjects (case-insensitive)
        const commonTeach = userTeachSubjects.filter(subject => 
          currentLearnSubjects.includes(subject)
        );
        
        const commonLearn = userLearnSubjects.filter(subject =>
          currentTeachSubjects.includes(subject)
        );

        // Calculate match score
        const score = commonTeach.length + commonLearn.length;

        // Only include if there's at least one match in either direction
        if (score > 0) {
          // Check for existing match status
          const existingMatch = Array.isArray(currentUser.matches) 
            ? currentUser.matches.find(m => 
                m && m.userId && m.userId.toString() === user._id.toString()
              )
            : null;

          // Skip if previously rejected
          if (existingMatch && existingMatch.status === 'rejected') {
            continue;
          }

          matches.push({
            userId: user._id,
            name: user.name || 'Anonymous',
            email: user.email || '',
            bio: user.bio || '',
            score,
            commonSubjects: {
              theyTeach: commonTeach,
              theyLearn: commonLearn
            },
            status: (existingMatch && existingMatch.status) || 'pending',
            lastActive: user.lastActive || null
          });
        }
      } catch (error) {
        console.error(`⚠️ Error processing user ${user?._id || 'unknown'}:`, error.message);
        continue; // Skip to next user if there's an error
      }
    }

    console.log(`✅ Found ${matches.length} valid matches`);
    
    // Sort by score (highest first) and then by last active time (most recent first)
    return matches.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.lastActive || 0) - new Date(a.lastActive || 0);
    });
    
  } catch (error) {
    console.error('❌ Error in findMatches:', {
      message: error.message,
      stack: error.stack,
      userId: currentUserId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Update match status between two users
 * @param {string} currentUserId - ID of the current user
 * @param {string} targetUserId - ID of the user being matched with
 * @param {string} status - New status ('accepted' or 'rejected')
 * @returns {Promise<Object>} - Updated match information
 */
async function updateMatchStatus(currentUserId, targetUserId, status) {
  try {
    if (!['accepted', 'rejected'].includes(status)) {
      throw new Error('Invalid status. Must be "accepted" or "rejected"');
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update current user's match status
      const [currentUser, targetUser] = await Promise.all([
        User.findById(currentUserId).session(session),
        User.findById(targetUserId).session(session)
      ]);

      if (!currentUser || !targetUser) {
        throw new Error('One or both users not found');
      }

      // Update or create match in current user's matches
      const existingMatchIndex = currentUser.matches.findIndex(
        match => match.userId.toString() === targetUserId
      );

      const matchData = {
        userId: targetUser._id,
        status,
        matchedAt: new Date()
      };

      if (existingMatchIndex !== -1) {
        currentUser.matches[existingMatchIndex] = matchData;
      } else {
        currentUser.matches.push(matchData);
      }

      // Check if target user has already accepted the current user
      const targetUserMatchIndex = targetUser.matches.findIndex(
        match => match.userId.toString() === currentUserId
      );

      let isMutualMatch = false;
      
      if (status === 'accepted' && targetUserMatchIndex !== -1 && 
          targetUser.matches[targetUserMatchIndex].status === 'accepted') {
        isMutualMatch = true;
      }

      // Save both users in transaction
      await currentUser.save({ session });
      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        status: isMutualMatch ? 'matched' : status,
        isMutual: isMutualMatch,
        users: [
          {
            userId: currentUser._id,
            name: currentUser.name,
            email: currentUser.email
          },
          {
            userId: targetUser._id,
            name: targetUser.name,
            email: targetUser.email
          }
        ]
      };

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error updating match status:', error);
    throw error;
  }
}

/**
 * Get all accepted matches for a user
 * @param {string} userId - ID of the user
 * @returns {Promise<Array>} - List of accepted matches
 */
async function getAcceptedMatches(userId) {
  try {
    // Get user with populated matches
    const user = await User.findById(userId)
      .select('subjectsToTeach subjectsToLearn matches')
      .populate('matches.userId', 'name email bio')
      .lean();

    if (!user) {
      throw new Error('User not found');
    }

    // Filter accepted matches and get user details
    const acceptedMatches = [];
    
    for (const match of user.matches) {
      if (match.status === 'accepted' && match.userId) {
        const matchedUser = await User.findById(match.userId._id)
          .select('name email bio subjectsToTeach subjectsToLearn')
          .lean();

        if (matchedUser) {
          // Find common subjects
          const userTeachSubjects = (matchedUser.subjectsToTeach || []).map(s => s.subject?.toLowerCase().trim());
          const userLearnSubjects = (matchedUser.subjectsToLearn || []).map(s => s.subject?.toLowerCase().trim());
          
          const commonTeach = userTeachSubjects.filter(subject => 
            (user.subjectsToLearn || []).some(s => s.subject?.toLowerCase().trim() === subject)
          );
          
          const commonLearn = userLearnSubjects.filter(subject =>
            (user.subjectsToTeach || []).some(s => s.subject?.toLowerCase().trim() === subject)
          );

          acceptedMatches.push({
            userId: matchedUser._id,
            name: matchedUser.name,
            email: matchedUser.email,
            bio: matchedUser.bio,
            matchedAt: match.matchedAt || new Date(),
            commonSubjects: {
              theyTeach: commonTeach,
              theyLearn: commonLearn
            },
            lastMessage: match.lastMessage // Include last message if exists
          });
        }
      }
    }

    // Sort by most recent match first
    return acceptedMatches.sort((a, b) => b.matchedAt - a.matchedAt);
  } catch (error) {
    console.error('Error in getAcceptedMatches:', error);
    throw error;
  }
}

module.exports = {
  findMatches,
  updateMatchStatus,
  getAcceptedMatches
};
