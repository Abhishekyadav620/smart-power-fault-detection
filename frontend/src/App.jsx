import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import Network from './pages/Network';
import Transformers from './pages/Transformers';
import Poles from './pages/Poles';
import FaultSimulator from './pages/FaultSimulator';
import Telemetry from './pages/Telemetry';
import Incidents from './pages/Incidents';
import Settings from './pages/Settings';
import AISuggestions from './pages/AISuggestions';
import Reports from './pages/Reports';

const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-full text-secondary">
    <h1 className="text-4xl font-bold text-primary mb-2">404</h1>
    <p>The page you are looking for does not exist.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="network" element={<Network />} />
          <Route path="transformers" element={<Transformers />} />
          <Route path="poles" element={<Poles />} />
          <Route path="telemetry" element={<Telemetry />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="simulator" element={<FaultSimulator />} />
          <Route path="settings" element={<Settings />} />
          <Route path="ai-suggestions" element={<AISuggestions />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
