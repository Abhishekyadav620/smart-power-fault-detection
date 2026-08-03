const TELEMETRY_EVENTS = Object.freeze([
  "power_on",
  "power_lost",
  "voltage_drop",
  "sensor_failure",
]);

const INCIDENT_STATUS = Object.freeze([
  "Open",
  "Assigned",
  "Resolved",
]);

module.exports = {
  TELEMETRY_EVENTS,
  INCIDENT_STATUS,
};