const express = require("express");

const router = express.Router();

const {
  getAllTelemetry,
  getTelemetryByPole,
  createTelemetry,
} = require("../controllers/telemetryController");

// Telemetry collection routes.
router.get("/", getAllTelemetry);
router.get("/pole/:poleId", getTelemetryByPole);
router.post("/", createTelemetry);

module.exports = router;