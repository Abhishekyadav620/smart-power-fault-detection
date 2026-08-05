const Incident = require("../models/Incident");

const getAllIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ detectedAt: -1 });

    res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findOne({ incidentId: req.params.id });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateIncident = async (req, res) => {
  try {
    const allowedFields = [
      "status",
      "faultType",
      "confidence",
      "affectedHouseholds",
      "transformerId",
      "feederId",
      "suspectedLocation",
      "assignedCrew",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.status === "ACKNOWLEDGED") {
      updates.acknowledgedAt = Date.now();
    } else if (updates.status === "CREW ASSIGNED") {
      updates.crewAssignedAt = Date.now();
    } else if (updates.status === "RESOLVED") {
      updates.resolvedAt = Date.now();
    } else if (updates.status === "VERIFIED") {
      updates.verifiedAt = Date.now();
    } else if (updates.status === "CLOSED") {
      updates.closedAt = Date.now();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid incident fields provided for update",
      });
    }

    const incident = await Incident.findOneAndUpdate(
      { incidentId: req.params.id },
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllIncidents,
  getIncidentById,
  updateIncident,
};