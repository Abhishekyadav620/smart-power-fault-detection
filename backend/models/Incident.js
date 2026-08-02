const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
    },

    transformerId: {
      type: String,
      required: true,
    },

    feederId: {
      type: String,
      required: true,
    },

    suspectedLocation: {
      fromPole: {
        type: String,
        required: true,
      },
      toPole: {
        type: String,
        required: true,
      },
    },

    faultType: {
      type: String,
      enum: [
        "broken_edge",
        "transformer_failure",
        "sensor_failure",
      ],
      required: true,
    },

    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    affectedHouseholds: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Open", "Assigned", "Resolved"],
      default: "Open",
    },

    detectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Incident", incidentSchema);