const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Request failed')
  return json
}

export const api = {
  getTransformers: () => request('/transformers'),
  getPoles: () => request('/poles'),
  getIncidents: () => request('/incidents'),
  getIncident: (id) => request(`/incidents/${id}`),
  updateIncident: (id, body) =>
    request(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getTelemetry: () => request('/telemetry'),
  getTelemetryByPole: (poleId) => request(`/telemetry/pole/${poleId}`),
  simulateFault: (body) =>
    request('/simulator/fault', { method: 'POST', body: JSON.stringify(body) }),
  restoreNetwork: () =>
    request('/simulator/restore', { method: 'POST' }),
}
