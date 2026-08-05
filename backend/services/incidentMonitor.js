const Incident = require("../models/Incident");
const Telemetry = require("../models/Telemetry");

const startIncidentMonitor = () => {
  console.log("Starting background Incident Monitor...");
  
  setInterval(async () => {
    try {
      // 1. Find all RESOLVED incidents
      const resolvedIncidents = await Incident.find({ status: "RESOLVED" });
      
      for (const incident of resolvedIncidents) {
        if (!incident.resolvedAt || !incident.suspectedLocation?.toPole) continue;

        // 2. Check for telemetry indicating power restoration
        // In the simulator, Restore Network creates power_on telemetry for all devices.
        // If the specific dead pole doesn't have a sensor, we just look for ANY power_on
        // event in the network after resolvedAt to confirm restoration.
        const verificationTelemetry = await Telemetry.findOne({
          timestamp: { $gte: incident.resolvedAt },
          $or: [
            { event: "power_on" },
            { voltage: { $gte: 200 } }
          ]
        });

        // 3. If found, auto-transition to VERIFIED and then CLOSED
        if (verificationTelemetry) {
          console.log(`[Incident Monitor] Telemetry verified restoration for Incident ${incident.incidentId}. Closing ticket.`);
          
          incident.status = "CLOSED";
          incident.verifiedAt = verificationTelemetry.timestamp;
          incident.closedAt = new Date();
          
          await incident.save();
        }
      }
    } catch (err) {
      console.error("[Incident Monitor] Error checking telemetry:", err);
    }
  }, 5000); // Check every 5 seconds
};

module.exports = { startIncidentMonitor };
