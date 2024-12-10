const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Store hashed passwords
  role: { type: String, enum: ["teacher", "user", "sensor"], required: true },
  lastLogin: { type: Date, default: null },
});

// Create the model
const User = mongoose.model("User", userSchema, "users");

// Export the model
module.exports = User;
