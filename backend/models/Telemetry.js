const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema(
  {
    poleId: {
      type: String,
      required: true,
    },

    deviceId: {
      type: String,
      required: true,
    },

    event: {
      type: String,
      enum: [
        "power_on",
        "power_lost",
        "voltage_drop",
        "sensor_failure"
      ],
      required: true,
    },

    voltage: {
      type: Number,//it will tell whtehr the volatge is drop or up
      default: null,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Telemetry", telemetrySchema);

//will store raw data sent by IOT device