const express = require("express");

const router = express.Router();

const {
  getAllIncidents,
  getIncidentById,
  updateIncident,
} = require("../controllers/incidentController");

// Incident collection routes.
router.get("/", getAllIncidents);
router.get("/:id", getIncidentById);
router.patch("/:id", updateIncident);

module.exports = router;