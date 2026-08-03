const Telemetry = require("../models/Telemetry");

const ALLOWED_EVENTS = new Set([
  "power_on",
  "power_lost",
  "voltage_drop",
  "sensor_failure",
]);

const getAllTelemetry = async (req, res) => {
  try {
    const telemetry = await Telemetry.find().sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: telemetry.length,
      data: telemetry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTelemetryByPole = async (req, res) => {
  try {
    const telemetry = await Telemetry.find({ poleId: req.params.poleId }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: telemetry.length,
      data: telemetry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createTelemetry = async (req, res) => {
  try {
    const { poleId, deviceId, event, voltage, timestamp } = req.body;

    if (!poleId || !deviceId || !event) {
      return res.status(400).json({
        success: false,
        message: "poleId, deviceId, and event are required",
      });
    }

    if (!ALLOWED_EVENTS.has(event)) {
      return res.status(400).json({
        success: false,
        message: `Invalid event value. Allowed values are: ${Array.from(ALLOWED_EVENTS).join(", ")}`,
      });
    }

    const telemetry = await Telemetry.create({
      poleId,
      deviceId,
      event,
      voltage: voltage ?? null,
      timestamp: timestamp || Date.now(),
    });

    res.status(201).json({
      success: true,
      data: telemetry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllTelemetry,
  getTelemetryByPole,
  createTelemetry,
};