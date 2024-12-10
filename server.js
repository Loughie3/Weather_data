const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const Weather = require("./models/weatherData");

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

//Retrieve a single record
app.get("/weathers/:id", async (req, res) => {
  try {
    const weather = await Weather.findById(req.params.id); // Use findById
    if (!weather) {
      return res.status(404).json({ message: "Weather data not found" }); // Handle case where document is not found
    }
    res.status(200).json(weather); // Return the specific document
  } catch (error) {
    res.status(500).json({ message: error.message }); // Handle errors
  }
});

// Route to retrieve all records, with a limit of 10
app.get("/weathers", async (req, res) => {
  try {
    const weatherData = await Weather.find().limit(10); // Fetch two documents
    res.status(200).json(weatherData); // Return the two documents
  } catch (error) {
    res.status(500).json({ message: error.message }); // Handle errors
  }
});

//Create a single record to the database
app.post("/createWeathers", async (req, res) => {
  try {
    // Add a generated `_id` if it's not provided in the request body
    if (!req.body._id) {
      req.body._id = new mongoose.Types.ObjectId();
    }
    // Create a new Weather document from the request body
    const weatherData = new Weather(req.body);

    // Save the document to the database
    const savedWeather = await weatherData.save();

    // Send the saved document back as a response
    res.status(201).json(savedWeather);
  } catch (error) {
    // Log and return any errors
    console.error("Error saving weather data:", error.message);
    res.status(500).json({ message: error.message });
  }
});

//Create Multiple records
app.post("/createMultipleWeathers", async (req, res) => {
  try {
    // Use insertMany to create multiple records from the request body
    const weatherData = await Weather.insertMany(req.body);

    // Respond with the created records
    res.status(201).json({
      message: "Weather data inserted successfully",
      data: weatherData,
    });
  } catch (error) {
    // Handle errors
    console.error("Error inserting multiple weather records:", error.message);
    res.status(500).json({ message: error.message });
  }
});

//Replace Record using PUT
app.put("/replaceWeathers/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from the request parameters
    const newWeatherData = req.body; // Get the new weather data from the request body

    // Replace the existing record with the new one
    const updatedWeather = await Weather.findOneAndReplace(
      { _id: id }, // Match by _id
      newWeatherData, // Replace with this data
      { returnDocument: "after" } // Return the updated document
    );

    // Check if the record exists
    if (!updatedWeather) {
      return res.status(404).json({ message: "Weather record not found" });
    }

    res.status(200).json({
      message: "Weather record replaced successfully",
      data: updatedWeather,
    });
  } catch (error) {
    console.error("Error replacing weather record:", error.message);
    res.status(500).json({ message: error.message });
  }
});

//Update Record using PATCH
app.patch("/updateWeathers/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from the request parameters
    const updates = req.body; // Get the fields to update from the request body

    // Use findByIdAndUpdate to update the document
    const updatedWeather = await Weather.findByIdAndUpdate(
      id, // Match by _id
      { $set: updates }, // Use $set to apply partial updates
      { new: true, runValidators: true } // Return the updated document and run validators
    );

    // Check if the record exists
    if (!updatedWeather) {
      return res.status(404).json({ message: "Weather record not found" });
    }

    res.status(200).json({
      message: "Weather record updated successfully",
      data: updatedWeather,
    });
  } catch (error) {
    console.error("Error updating weather record:", error.message);
    res.status(500).json({ message: error.message });
  }
});

//Replace multiple records using PUT
app.put("/replaceMultipleWeathers", async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res
        .status(400)
        .json({ message: "Request body must be an array of objects" });
    }

    const results = await Promise.all(
      req.body.map(async (record) => {
        const { _id, ...updateFields } = record; // Extract _id and the fields to replace
        if (!_id) {
          throw new Error("Each record must include an '_id' field");
        }

        // Replace the document using findByIdAndReplace or equivalent
        return Weather.findOneAndReplace(
          { _id }, // Match by _id
          updateFields, // Replace with new data
          { returnDocument: "after" } // Return the updated document
        );
      })
    );

    res.status(200).json({
      message: "Weather records replaced successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error replacing multiple weather records:", error.message);
    res.status(500).json({ message: error.message });
  }
});

//Update Multiple Records using Patch
app.patch("/updateMultipleWeathers", async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res
        .status(400)
        .json({ message: "Request body must be an array of objects" });
    }

    // Iterate through the request body and update each record
    const updatePromises = req.body.map(async (record) => {
      const { _id, ...updateFields } = record; // Extract _id and the fields to update
      if (!_id) {
        throw new Error("Each record must include an '_id'");
      }

      // Update the document with partial updates
      return Weather.findByIdAndUpdate(
        _id, // Match by _id
        { $set: updateFields }, // Use $set to apply partial updates
        { new: true, runValidators: true } // Return the updated document and run validators
      );
    });

    // Await all updates and return the results
    const results = await Promise.all(updatePromises);

    res.status(200).json({
      message: "Weather records updated successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error updating multiple weather records:", error.message);
    res.status(500).json({ message: error.message });
  }
});

//Delete record
app.delete("/deleteWeathers/:id", async (req, res) => {
  try {
    const { id } = req.params; // Extract the ID from the request parameters

    // Find and delete the record by ID
    const deletedWeather = await Weather.findByIdAndDelete(id);

    // If no record is found, return a 404 error
    if (!deletedWeather) {
      return res.status(404).json({ message: "Weather record not found" });
    }

    // Return success response
    res.status(200).json({
      message: "Weather record deleted successfully",
      data: deletedWeather,
    });
  } catch (error) {
    console.error("Error deleting weather record:", error.message);
    res.status(500).json({ message: error.message });
  }
});

//Delete Multiple Records
app.delete("/deleteMultipleWeathers", async (req, res) => {
  try {
    const { _id } = req.body; // Extract the `_id` array from the request body

    if (!_id || !Array.isArray(_id)) {
      return res
        .status(400)
        .json({ message: "An array of `_id` values must be provided" });
    }

    // Delete records matching the provided IDs
    const result = await Weather.deleteMany({ _id: { $in: _id } });

    res.status(200).json({
      message: "Weather records deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting multiple weather records:", error.message);
    res.status(500).json({ message: error.message });
  }
});

app.get("/weathersProjection/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Fetch the weather record with projection
    const weather = await Weather.findById(id, {
      Precipitation: 1, // Include precipitation
      Latitude: 1, // Include latitude
      Longitude: 1, // Include longitude
      _id: 1,
    });

    console.log("Projected weather document:", weather);

    // Check if the record exists
    if (!weather) {
      return res.status(404).json({ message: "Weather record not found" });
    }

    res.status(200).json({
      message: "Weather record retrieved with projection",
      data: weather,
    });
  } catch (error) {
    console.error(
      "Error retrieving weather record with projection:",
      error.message
    );
    res.status(500).json({ message: error.message });
  }
});

// MongoDB connection
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/weather_db")

  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch((error) => console.error("Error connecting to MongoDB:", error));
