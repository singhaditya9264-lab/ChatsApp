const User = require("../models/User");

// Get all users except logged-in user
const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user },
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
};