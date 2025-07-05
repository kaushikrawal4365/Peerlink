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
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Get all users except the current user
    const allUsers = await User.find({ 
      _id: { $ne: currentUserId },
      isProfileComplete: true // Only match with users who have completed their profile
    }).select('name email bio subjectsToTeach subjectsToLearn');

    const matches = [];

    for (const user of allUsers) {
      // Convert subjects to lowercase for case-insensitive comparison
      const userTeach = user.subjectsToTeach.map(s => s.toLowerCase().trim());
      const userLearn = user.subjectsToLearn.map(s => s.toLowerCase().trim());
      const currentTeach = currentUser.subjectsToTeach.map(s => s.toLowerCase().trim());
      const currentLearn = currentUser.subjectsToLearn.map(s => s.toLowerCase().trim());

      // Find common subjects
      const commonTeach = userTeach.filter(subject => currentLearn.includes(subject));
      const commonLearn = userLearn.filter(subject => currentTeach.includes(subject));

      // Calculate match score (simple count of matching subjects)
      const score = commonTeach.length + commonLearn.length;

      // Only include if there's at least one match in both directions
      if (commonTeach.length > 0 && commonLearn.length > 0) {
        // Check if this user already has a match record with the current user
        const existingMatch = currentUser.matches.find(
          match => match.userId.toString() === user._id.toString()
        );

        // If no existing match or the previous match was rejected
        if (!existingMatch || existingMatch.status !== 'rejected') {
          matches.push({
            userId: user._id,
            name: user.name,
            email: user.email,
            bio: user.bio,
            score,
            commonSubjects: {
              theyTeach: commonTeach,
              theyLearn: commonLearn
            },
            status: existingMatch?.status || 'pending'
          });
        }
      }
    }

    // Sort by score in descending order
    return matches.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error in findMatches:', error);
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

    // Update current user's match status
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      throw new Error('One or both users not found');
    }

    // Update or create match in current user's matches
    const existingMatchIndex = currentUser.matches.findIndex(
      match => match.userId.toString() === targetUserId
    );

    const matchData = {
      userId: targetUserId,
      status,
      matchDate: new Date(),
      matchScore: 0, // This would be calculated based on your scoring logic
      commonSubjects: {
        teach: [],
        learn: []
      }
    };

    if (existingMatchIndex >= 0) {
      currentUser.matches[existingMatchIndex] = matchData;
    } else {
      currentUser.matches.push(matchData);
    }

    await currentUser.save();
    return { success: true, status };
  } catch (error) {
    console.error('Error in updateMatchStatus:', error);
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
    const user = await User.findById(userId).populate({
      path: 'matches.userId',
      select: 'name email bio subjectsToTeach subjectsToLearn',
      match: { 'matches.status': 'accepted' }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user.matches
      .filter(match => match.status === 'accepted')
      .map(match => ({
        ...match.userId.toObject(),
        matchDate: match.matchDate
      }));
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
