const User = require('../models/User');
const { calculateBestMatches } = require('../utils/mlMatches');

const getMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const allUsers = await User.find({ _id: { $ne: currentUser._id } });

    const matches = await calculateBestMatches(currentUser, allUsers);

    res.json(matches.filter(m => m.matchScore > 0.2)); // Filter low-quality matches
  } catch (err) {
    console.error("❌ Error calculating matches:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getMatches };
