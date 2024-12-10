const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User"); // Adjust the path to your User model

async function hashPasswords() {
  await mongoose.connect("mongodb://127.0.0.1:27017/weather_db");

  const users = await User.find();
  for (const user of users) {
    if (!user.password.startsWith("$2b$")) {
      user.password = await bcrypt.hash(user.password, 10);
      await user.save();
      console.log(`Password hashed for user: ${user.username}`);
    }
  }

  console.log("Password hashing complete.");
  await mongoose.disconnect();
}

hashPasswords().catch(console.error);
