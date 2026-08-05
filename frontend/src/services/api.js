import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.getPoles = () => api.get('/poles');
api.getTransformers = () => api.get('/transformers');
api.simulateFault = (data) => api.post('/simulator/fault', data);
api.restorePower = () => api.post('/simulator/restore');
api.getTelemetry = () => api.get('/telemetry');
api.getIncidents = () => api.get('/incidents');
api.updateIncident = (id, data) => api.patch(`/incidents/${id}`, data);
api.getAiExplanation = (data) => api.post('/ai/suggestions', data);

export default api;
