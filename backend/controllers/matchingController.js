const User = require('../models/User');

// Find potential matches based on subjects
exports.findPotentialMatches = async (userId) => {
  try {
    // Get current user's subjects
    const currentUser = await User.findById(userId).select('subjectsToTeach subjectsToLearn matches');
    
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Find users who want to learn what current user can teach
    // and can teach what current user wants to learn
    const potentialMatches = await User.find({
      $and: [
        { _id: { $ne: userId } }, // Not the current user
        { 'subjectsToLearn': { $in: currentUser.subjectsToTeach } }, // They want to learn what I teach
        { 'subjectsToTeach': { $in: currentUser.subjectsToLearn } }  // They teach what I want to learn
      ]
    }).select('name email subjectsToTeach subjectsToLearn profileImage');

    // Filter out already matched users
    const matchedUserIds = currentUser.matches.map(match => match.userId);
    return potentialMatches.filter(user => !matchedUserIds.includes(user._id));
    
  } catch (error) {
    console.error('Error finding potential matches:', error);
    throw error;
  }
};

// Create a match between two users
exports.createMatch = async (userId1, userId2) => {
  try {
    // Add each user to the other's matches
    await Promise.all([
      User.findByIdAndUpdate(userId1, {
        $addToSet: { 
          matches: { userId: userId2 } 
        }
      }),
      User.findByIdAndUpdate(userId2, {
        $addToSet: { 
          matches: { userId: userId1 } 
        }
      })
    ]);

    return { success: true, message: 'Match created successfully' };
  } catch (error) {
    console.error('Error creating match:', error);
    throw error;
  }
};

// Check if two users are a mutual match
exports.checkMutualMatch = async (userId1, userId2) => {
  try {
    const user1 = await User.findOne({
      _id: userId1,
      'matches.userId': userId2
    });
    
    const user2 = await User.findOne({
      _id: userId2,
      'matches.userId': userId1
    });

    return { isMatch: !!(user1 && user2) };
  } catch (error) {
    console.error('Error checking mutual match:', error);
    throw error;
  }
};
