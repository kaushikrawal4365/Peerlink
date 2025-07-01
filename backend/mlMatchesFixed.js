// Improved version of mlMatches.js with better debugging and matching
const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
};

const calculateBestMatches = async (currentUser, allUsers) => {
  try {
    console.log('\n=== Starting match calculation ===');
    console.log(`Current user: ${currentUser.name} (${currentUser.email})`);
    console.log(`Potential matches to check: ${allUsers.length}`);

    if (!currentUser || !allUsers || !Array.isArray(allUsers)) {
      throw new Error('Invalid input parameters');
    }

    // Initialize empty arrays if they don't exist
    currentUser.subjectsToLearn = currentUser.subjectsToLearn || [];
    currentUser.subjectsToTeach = currentUser.subjectsToTeach || [];

    console.log('\n📚 Current user subjects:');
    console.log('Teaching:', currentUser.subjectsToTeach.map(s => `${s.subject} (${s.proficiency})`).join(', '));
    console.log('Learning:', currentUser.subjectsToLearn.map(s => `${s.subject} (${s.proficiency})`).join(', '));

    // Get unique subject list across all users
    const subjectSet = new Set();
    
    // Add current user's subjects
    currentUser.subjectsToLearn.forEach(s => s.subject && subjectSet.add(s.subject));
    currentUser.subjectsToTeach.forEach(s => s.subject && subjectSet.add(s.subject));
    
    // Add other users' subjects
    allUsers.forEach(user => {
      (user.subjectsToLearn || []).forEach(s => s.subject && subjectSet.add(s.subject));
      (user.subjectsToTeach || []).forEach(s => s.subject && subjectSet.add(s.subject));
    });
    
    const subjectList = Array.from(subjectSet);
    console.log('\n📋 All unique subjects:', subjectList.join(', '));

    // Vectorize user's subjects
    const vectorize = (user, type) => {
      const subjects = user[type] || [];
      return subjectList.map(subject => {
        const entry = subjects.find(s => s && s.subject === subject);
        return entry && entry.proficiency ? Number(entry.proficiency) : 0;
      });
    };

    const currentLearn = vectorize(currentUser, 'subjectsToLearn');
    const currentTeach = vectorize(currentUser, 'subjectsToTeach');

    // Calculate matches for each user
    const matches = [];
    
    for (const user of allUsers) {
      if (user._id.toString() === currentUser._id.toString()) continue;
      
      console.log(`\n🔍 Checking compatibility with ${user.name} (${user.email})`);
      
      const userTeach = vectorize(user, 'subjectsToTeach');
      const userLearn = vectorize(user, 'subjectsToLearn');

      // Calculate teaching and learning compatibility
      const teachMatch = cosineSimilarity(currentLearn, userTeach); // You learn, they teach
      const learnMatch = cosineSimilarity(currentTeach, userLearn); // You teach, they learn
      const score = (teachMatch + learnMatch) / 2;
      
      console.log(`- Teach match: ${teachMatch.toFixed(4)} (you learn, they teach)`);
      console.log(`- Learn match: ${learnMatch.toFixed(4)} (you teach, they learn)`);
      console.log(`- Average score: ${score.toFixed(4)}`);
      
      // Find common subjects
      const commonTeach = user.subjectsToTeach
        .filter(s => currentUser.subjectsToLearn.some(cs => cs.subject === s.subject));
      const commonLearn = user.subjectsToLearn
        .filter(s => currentUser.subjectsToTeach.some(cs => cs.subject === s.subject));
      
      console.log('- Common subjects they teach that you learn:', 
        commonTeach.map(s => s.subject).join(', ') || 'None');
      console.log('- Common subjects you teach that they learn:', 
        commonLearn.map(s => s.subject).join(', ') || 'None');
      
      // Include all matches for now (we'll filter later if needed)
      if (score > 0) {  // Lower threshold to see more matches
        matches.push({
          user: user._id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          matchScore: Number(score.toFixed(3)),
          commonSubjects: {
            theyTeach: commonTeach.map(s => ({
              subject: s.subject,
              theirProficiency: s.proficiency,
              yourTarget: currentUser.subjectsToLearn.find(cs => cs.subject === s.subject)?.proficiency || 0
            })),
            youTeach: commonLearn.map(s => ({
              subject: s.subject,
              theirTarget: s.proficiency,
              yourProficiency: currentUser.subjectsToTeach.find(cs => cs.subject === s.subject)?.proficiency || 0
            }))
          }
        });
        console.log('✅ Match included');
      } else {
        console.log('❌ Match score too low');
      }
    }
    
    // Sort by score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);
    
    console.log('\n🎉 Final matches:', matches.length);
    matches.forEach((match, i) => {
      console.log(`\n${i + 1}. ${match.name} (${match.email}) - Score: ${match.matchScore}`);
      if (match.commonSubjects.theyTeach.length > 0) {
        console.log('   They can teach you:', 
          match.commonSubjects.theyTeach.map(s => `${s.subject} (${s.theirProficiency})`).join(', '));
      }
      if (match.commonSubjects.youTeach.length > 0) {
        console.log('   You can teach them:', 
          match.commonSubjects.youTeach.map(s => `${s.subject} (${s.theirTarget})`).join(', '));
      }
    });
    
    return matches;
    
  } catch (error) {
    console.error('❌ Error in calculateBestMatches:', error);
    throw error;
  }
};

module.exports = { calculateBestMatches };
