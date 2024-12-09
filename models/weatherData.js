const mongoose = require("mongoose");

// Define the schema
const weatherDataSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  deviceName: {
    type: String,
    required: true,
  },
  precipitation: {
    type: Number, // Number is used for double in Mongoose
    required: true,
  },
  time: {
    type: Date,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  atmosphericPressure: {
    type: Number,
    required: true,
  },
  maxWindSpeed: {
    type: Number,
    required: true,
  },
  solarRadiation: {
    type: Number,
    required: true,
  },
  vaporPressure: {
    type: Number,
    required: true,
  },
  humidity: {
    type: Number,
    required: true,
  },
  windDirection: {
    type: Number,
    required: true,
  },
});

// Create the model
const Weather = mongoose.model("Weather", weatherDataSchema, "weather_data");

// Export the model
module.exports = Weather;
