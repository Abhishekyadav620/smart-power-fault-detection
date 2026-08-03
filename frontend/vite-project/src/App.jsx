import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { FaultProvider } from './context/FaultContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import NetworkMap from './pages/NetworkMap'
import Incidents from './pages/Incidents'
import TelemetryPage from './pages/TelemetryPage'

export default function App() {
  return (
    <BrowserRouter>
      <FaultProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="network" element={<NetworkMap />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="telemetry" element={<TelemetryPage />} />
          </Route>
        </Routes>
      </FaultProvider>
    </BrowserRouter>
  )
}
