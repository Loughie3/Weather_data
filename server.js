const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const Weather = require("./models/weatherData");
const { authenticate, authorize } = require("./middleware/auth");
const User = require("./models/User");
const bcrypt = require("bcrypt");

require("dotenv").config();

const app = express();

const corsOptions = {
  origin: ["https://www.test-cors.org"], // Specify allowed origin
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight request handling

app.use(express.json());

// Routes
app.use("/auth", authRoutes); // All authentication-related routes

// Retrieve a single record
app.get(
  "/weathers/:id",
  authenticate,
  authorize(["teacher", "user"]), // Only teachers and users can access
  async (req, res) => {
    try {
      const weather = await Weather.findById(req.params.id);
      if (!weather) {
        return res.status(404).json({ message: "Weather data not found" });
      }
      res.status(200).json(weather);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Retrieve all records (limit 10)
app.get(
  "/weathers",
  authenticate,
  authorize(["teacher", "user"]), // Only teachers and users can access
  async (req, res) => {
    try {
      const weatherData = await Weather.find().limit(10);
      res.status(200).json(weatherData);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Create a single record
app.post(
  "/createWeathers",
  authenticate,
  authorize(["teacher", "sensor"]), // Only teachers and sensors can create
  async (req, res) => {
    try {
      if (!req.body._id) {
        req.body._id = new mongoose.Types.ObjectId();
      }
      const weatherData = new Weather(req.body);
      const savedWeather = await weatherData.save();
      res.status(201).json(savedWeather);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Create multiple records
app.post(
  "/createMultipleWeathers",
  authenticate,
  authorize(["teacher", "sensor"]), // Only teachers and sensors can create
  async (req, res) => {
    try {
      const weatherData = await Weather.insertMany(req.body);
      res.status(201).json({
        message: "Weather data inserted successfully",
        data: weatherData,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Replace a single record
app.put(
  "/replaceWeathers/:id",
  authenticate,
  authorize(["teacher"]), // Only teachers can replace
  async (req, res) => {
    try {
      const { id } = req.params;
      const newWeatherData = req.body;
      const updatedWeather = await Weather.findOneAndReplace(
        { _id: id },
        newWeatherData,
        { returnDocument: "after" }
      );
      if (!updatedWeather) {
        return res.status(404).json({ message: "Weather record not found" });
      }
      res.status(200).json({
        message: "Weather record replaced successfully",
        data: updatedWeather,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update a single record
app.patch(
  "/updateWeathers/:id",
  authenticate,
  authorize(["teacher"]), // Only teachers can update
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedWeather = await Weather.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );
      if (!updatedWeather) {
        return res.status(404).json({ message: "Weather record not found" });
      }
      res.status(200).json({
        message: "Weather record updated successfully",
        data: updatedWeather,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update multiple records
app.patch(
  "/updateMultipleWeathers",
  authenticate,
  authorize(["teacher"]), // Only teachers can update
  async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res
          .status(400)
          .json({ message: "Request body must be an array of objects" });
      }
      const updatePromises = req.body.map(async (record) => {
        const { _id, ...updateFields } = record;
        if (!_id) {
          throw new Error("Each record must include an '_id'");
        }
        return Weather.findByIdAndUpdate(
          _id,
          { $set: updateFields },
          { new: true, runValidators: true }
        );
      });
      const results = await Promise.all(updatePromises);
      res.status(200).json({
        message: "Weather records updated successfully",
        data: results,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete a single record
app.delete(
  "/deleteWeathers/:id",
  authenticate,
  authorize(["teacher"]), // Only teachers can delete
  async (req, res) => {
    try {
      const { id } = req.params;
      const deletedWeather = await Weather.findByIdAndDelete(id);
      if (!deletedWeather) {
        return res.status(404).json({ message: "Weather record not found" });
      }
      res.status(200).json({
        message: "Weather record deleted successfully",
        data: deletedWeather,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete multiple records
app.delete(
  "/deleteMultipleWeathers",
  authenticate,
  authorize(["teacher"]), // Only teachers can delete
  async (req, res) => {
    try {
      const { _id } = req.body;
      if (!_id || !Array.isArray(_id)) {
        return res
          .status(400)
          .json({ message: "An array of `_id` values must be provided" });
      }
      const result = await Weather.deleteMany({ _id: { $in: _id } });
      res.status(200).json({ message: "Weather records deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Fetch specific fields (projection)
app.get(
  "/weathersProjection/:id",
  authenticate,
  authorize(["teacher", "user"]), // Only teachers and users can read
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const weather = await Weather.findById(id, {
        precipitation: 1,
        latitude: 1,
        longitude: 1,
        _id: 1,
      });
      if (!weather) {
        return res.status(404).json({ message: "Weather record not found" });
      }
      res.status(200).json({
        message: "Weather record retrieved with projection",
        data: weather,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

//Add a new user
app.post("/addUser", authenticate, authorize(["teacher"]), async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate required fields
    if (!username || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Ensure the role is valid
    const validRoles = ["teacher", "user", "sensor"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      password: hashedPassword,
      role,
      lastLogin: null, // Optional: Explicitly set to null (default is also null)
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Send the response
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: savedUser._id,
        username: savedUser.username,
        role: savedUser.role,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/weather_db")
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch((error) => console.error("Error connecting to MongoDB:", error));
