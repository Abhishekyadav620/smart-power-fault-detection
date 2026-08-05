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

    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },

    pincode: {
      type: String,
      default: "N/A",
    },

    affectedPoles: [{
      type: String,
    }],

    detectionReason: {
      type: String,
    },

    affectedHouseholds: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["DETECTED", "ACKNOWLEDGED", "CREW ASSIGNED", "RESOLVED", "VERIFIED", "CLOSED"],
      default: "DETECTED",
    },

    assignedCrew: {
      type: String,
    },

    detectedAt: {
      type: Date,
      default: Date.now,
    },

    acknowledgedAt: {
      type: Date,
    },

    crewAssignedAt: {
      type: Date,
    },

    resolvedAt: {
      type: Date,
    },

    verifiedAt: {
      type: Date,
    },

    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Incident", incidentSchema);