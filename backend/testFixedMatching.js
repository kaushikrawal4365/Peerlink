// Test script for the fixed matching logic
const { calculateBestMatches } = require('./mlMatchesFixed');

// Test users with matching subjects
const testUsers = [
  {
    _id: 'user1',
    name: 'User J',
    email: 'j@gmail.com',
    subjectsToTeach: [
      { subject: 'Mathematics', proficiency: 4 },
      { subject: 'Physics', proficiency: 3 }
    ],
    subjectsToLearn: [
      { subject: 'Chemistry', proficiency: 3 },
      { subject: 'Biology', proficiency: 2 }
    ]
  },
  {
    _id: 'user2',
    name: 'User L',
    email: 'l@gmail.com',
    subjectsToTeach: [
      { subject: 'Chemistry', proficiency: 4 },
      { subject: 'Biology', proficiency: 3 }
    ],
    subjectsToLearn: [
      { subject: 'Mathematics', proficiency: 3 },
      { subject: 'Physics', proficiency: 2 }
    ]
  }
];

// Run the test
(async () => {
  try {
    console.log('🚀 Starting matching test...');
    
    // Test matching in both directions
    console.log('\n===== Testing User J -> User L =====');
    const matchesJtoL = await calculateBestMatches(testUsers[0], [testUsers[1]]);
    
    console.log('\n===== Testing User L -> User J =====');
    const matchesLtoJ = await calculateBestMatches(testUsers[1], [testUsers[0]]);
    
    // Print final results
    console.log('\n🎯 Final Results:');
    console.log(`User J -> User L matches: ${matchesJtoL.length > 0 ? '✅' : '❌'}`);
    console.log(`User L -> User J matches: ${matchesLtoJ.length > 0 ? '✅' : '❌'}`);
    
    if (matchesJtoL.length === 0 || matchesLtoJ.length === 0) {
      console.log('\n🔍 Debugging info:');
      const j = testUsers[0];
      const l = testUsers[1];
      
      console.log('\n📚 Subject Analysis:');
      console.log(`${j.name} teaches:`, j.subjectsToTeach.map(s => `${s.subject} (${s.proficiency})`).join(', '));
      console.log(`${j.name} learns:`, j.subjectsToLearn.map(s => `${s.subject} (${s.proficiency})`).join(', '));
      console.log(`${l.name} teaches:`, l.subjectsToTeach.map(s => `${s.subject} (${s.proficiency})`).join(', '));
      console.log(`${l.name} learns:`, l.subjectsToLearn.map(s => `${s.subject} (${s.proficiency})`).join(', '));
      
      // Check for exact matches
      const jCanTeachL = j.subjectsToTeach.some(jt => 
        l.subjectsToLearn.some(ll => ll.subject === jt.subject)
      );
      
      const lCanTeachJ = l.subjectsToTeach.some(lt => 
        j.subjectsToLearn.some(jl => jl.subject === lt.subject)
      );
      
      console.log('\n🔍 Direct subject matches:');
      console.log(`- Can ${j.name} teach ${l.name}? ${jCanTeachL ? '✅' : '❌'}`);
      console.log(`- Can ${l.name} teach ${j.name}? ${lCanTeachJ ? '✅' : '❌'}`);
      
      if (jCanTeachL || lCanTeachJ) {
        console.log('\n⚠️  Potential matches exist but scoring might be too strict.');
        console.log('Try adjusting the threshold in mlMatchesFixed.js if needed.');
      }
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
})();
