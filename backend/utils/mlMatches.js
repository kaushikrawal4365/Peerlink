// Helper function to calculate cosine similarity between two vectors
const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += Math.pow(vecA[i], 2);
    normB += Math.pow(vecB[i], 2);
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const calculateBestMatches = async (currentUser, allUsers) => {
  try {
    console.log('\n=== Starting match calculation ===');
    
    if (!currentUser || !allUsers || !Array.isArray(allUsers)) {
      throw new Error('Invalid input parameters');
    }

    // Initialize empty arrays if they don't exist
    currentUser.subjectsToLearn = Array.isArray(currentUser.subjectsToLearn) 
      ? currentUser.subjectsToLearn 
      : [];
    currentUser.subjectsToTeach = Array.isArray(currentUser.subjectsToTeach) 
      ? currentUser.subjectsToTeach 
      : [];

    console.log(`Current user (${currentUser.name || currentUser.email}):`);
    console.log('- Teaching:', currentUser.subjectsToTeach.map(s => `${s.subject} (${s.proficiency})`).join(', '));
    console.log('- Learning:', currentUser.subjectsToLearn.map(s => `${s.subject} (${s.proficiency})`).join(', '));

    // Get unique subject list across all users
    const subjectSet = new Set();
    
    // Add current user's subjects
    currentUser.subjectsToLearn.forEach(s => s && s.subject && subjectSet.add(s.subject.trim().toLowerCase()));
    currentUser.subjectsToTeach.forEach(s => s && s.subject && subjectSet.add(s.subject.trim().toLowerCase()));
    
    // Add other users' subjects
    allUsers.forEach(user => {
      (user.subjectsToLearn || []).forEach(s => s && s.subject && subjectSet.add(s.subject.trim().toLowerCase()));
      (user.subjectsToTeach || []).forEach(s => s && s.subject && subjectSet.add(s.subject.trim().toLowerCase()));
    });
    
    const subjectList = Array.from(subjectSet);
    console.log('\n📋 All unique subjects:', Array.from(subjectSet).join(', '));

    // Vectorize user's subjects
    const vectorize = (user, type) => {
      const subjects = Array.isArray(user[type]) ? user[type] : [];
      return subjectList.map(subject => {
        const entry = subjects.find(s => s && s.subject && s.subject.trim().toLowerCase() === subject);
        const proficiency = entry && !isNaN(entry.proficiency) ? Number(entry.proficiency) : 0;
        return Math.min(5, Math.max(1, proficiency)); // Ensure between 1-5
      });
    };

    const currentLearn = vectorize(currentUser, 'subjectsToLearn');
    const currentTeach = vectorize(currentUser, 'subjectsToTeach');

    console.log('\n🔍 Current user vectors:');
    console.log('- Learning vector:', currentLearn);
    console.log('- Teaching vector:', currentTeach);

    // Calculate matches for each user
    const matches = [];
    
    for (const user of allUsers) {
      if (user._id.toString() === currentUser._id.toString()) continue;
      
      try {
        console.log(`\n🔍 Checking compatibility with ${user.name || user.email}`);
        
        const userTeach = vectorize(user, 'subjectsToTeach');
        const userLearn = vectorize(user, 'subjectsToLearn');
        
        console.log('- Their teaching vector:', userTeach);
        console.log('- Their learning vector:', userLearn);

        // Calculate teaching and learning compatibility
        const teachMatch = cosineSimilarity(currentLearn, userTeach); // You learn, they teach
        const learnMatch = cosineSimilarity(currentTeach, userLearn); // You teach, they learn
        const score = (teachMatch + learnMatch) / 2;
        
        console.log(`- Teach match: ${teachMatch.toFixed(4)} (you learn, they teach)`);
        console.log(`- Learn match: ${learnMatch.toFixed(4)} (you teach, they learn)`);
        console.log(`- Average score: ${score.toFixed(4)}`);
        
        // Find common subjects
        const commonTeach = (user.subjectsToTeach || []).filter(s => 
          s && s.subject && currentUser.subjectsToLearn.some(
            cs => cs && cs.subject && 
            cs.subject.trim().toLowerCase() === s.subject.trim().toLowerCase()
          )
        );
        
        const commonLearn = (user.subjectsToLearn || []).filter(s => 
          s && s.subject && currentUser.subjectsToTeach.some(
            cs => cs && cs.subject && 
            cs.subject.trim().toLowerCase() === s.subject.trim().toLowerCase()
          )
        );
        
        console.log('- Common subjects they teach that you learn:', 
          commonTeach.map(s => s.subject).join(', ') || 'None');
        console.log('- Common subjects you teach that they learn:', 
          commonLearn.map(s => s.subject).join(', ') || 'None');
        
        // Only include matches with some common subjects
        if (commonTeach.length > 0 || commonLearn.length > 0) {
          
          // Only include matches with score > 0.1
          if (score > 0.1) {
            const match = {
              user: user._id,
              name: user.name,
              email: user.email,
              bio: user.bio,
              matchScore: Number(score.toFixed(3)),
              commonSubjects: {
                theyTeach: commonTeach.map(s => ({
                  subject: s.subject,
                  theirProficiency: s.proficiency,
                  yourTarget: currentUser.subjectsToLearn.find(
                    cs => cs && cs.subject && 
                    cs.subject.trim().toLowerCase() === s.subject.trim().toLowerCase()
                  )?.proficiency || 0
                })),
                youTeach: commonLearn.map(s => ({
                  subject: s.subject,
                  theirTarget: s.proficiency,
                  yourProficiency: currentUser.subjectsToTeach.find(
                    cs => cs && cs.subject && 
                    cs.subject.trim().toLowerCase() === s.subject.trim().toLowerCase()
                  )?.proficiency || 0
                }))
              }
            };
            
            console.log(`✅ Match included with score: ${match.matchScore}`);
            matches.push(match);
          } else {
            console.log('❌ Score too low');
          }
        } else {
          console.log('❌ No common subjects');
        }
      } catch (err) {
        console.error(`Error processing user ${user._id || 'unknown'}:`, err);
      }
    }
    
    // Sort by score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);
    
    console.log(`\n🎯 Found ${matches.length} potential matches`);
    return matches;
  } catch (error) {
    console.error('❌ Error in calculateBestMatches:', error);
    console.error(error.stack);
    throw error;
  }
};

module.exports = { calculateBestMatches };