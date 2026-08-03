export const FAULT_TYPE_OPTIONS = [
  { value: 'span_fault', label: 'Wire Break' },
  { value: 'transformer_failure', label: 'Transformer Failure' },
  { value: 'feeder_failure', label: 'Feeder Failure' },
  { value: 'sensor_failure', label: 'Sensor Failure' },
  { value: 'load_shedding', label: 'Load Shedding' },
]

export function faultTypeLabel(type) {
  const map = {
    span_fault: 'Wire Break',
    broken_edge: 'Wire Break',
    transformer_failure: 'Transformer Failure',
    feeder_failure: 'Feeder Failure',
    sensor_failure: 'Sensor Failure',
    load_shedding: 'Load Shedding',
  }
  return map[type] || type
}

export function eventLabel(event) {
  const map = {
    power_on: 'Power ON',
    power_lost: 'Power LOST',
    voltage_drop: 'Voltage Drop',
    sensor_failure: 'Sensor Failure',
  }
  return map[event] || event
}

export function eventStatus(event) {
  if (event === 'power_on') return 'healthy'
  if (event === 'sensor_failure' || event === 'voltage_drop') return 'warning'
  return 'fault'
}

export function statusColor(status) {
  if (status === 'Resolved') return 'healthy'
  if (status === 'Assigned') return 'warning'
  return 'fault'
}

export function priorityFromHouseholds(count) {
  if (count >= 200) return 'Critical'
  if (count >= 100) return 'High'
  if (count >= 50) return 'Medium'
  return 'Low'
}
