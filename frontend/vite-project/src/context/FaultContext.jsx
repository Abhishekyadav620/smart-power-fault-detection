import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '../api/client'

const FaultContext = createContext(null)

export function FaultProvider({ children }) {
  const [transformers, setTransformers] = useState([])
  const [poles, setPoles] = useState([])
  const [incidents, setIncidents] = useState([])
  const [telemetry, setTelemetry] = useState([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)

  const [selectedTransformerId, setSelectedTransformerId] = useState('')
  const [selectedFaultType, setSelectedFaultType] = useState('span_fault')
  const [faultResult, setFaultResult] = useState(null)
  const [latestIncident, setLatestIncident] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const [tRes, pRes, iRes, telRes] = await Promise.all([
        api.getTransformers(),
        api.getPoles(),
        api.getIncidents(),
        api.getTelemetry(),
      ])
      setTransformers(tRes.data || [])
      setPoles(pRes.data || [])
      setIncidents(iRes.data || [])
      setTelemetry(telRes.data || [])

      if (!selectedTransformerId && tRes.data?.length) {
        setSelectedTransformerId(tRes.data[0].transformerId)
      }

      if (iRes.data?.length) {
        setLatestIncident(iRes.data[0])
      }
    } catch {
      /* backend may be offline */
    } finally {
      setLoading(false)
    }
  }, [selectedTransformerId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const injectFault = async () => {
    if (!selectedTransformerId) return
    setSimulating(true)
    try {
      const res = await api.simulateFault({
        transformerId: selectedTransformerId,
        faultType: selectedFaultType,
      })
      setFaultResult(res.data)

      const [iRes, telRes] = await Promise.all([
        api.getIncidents(),
        api.getTelemetry(),
      ])
      setIncidents(iRes.data || [])
      setTelemetry(telRes.data || [])

      const incidentId = res.data?.incidentId
      if (incidentId) {
        const full = await api.getIncident(incidentId)
        setLatestIncident(full.data)
      } else if (iRes.data?.length) {
        setLatestIncident(iRes.data[0])
      }
    } catch (err) {
      alert(err.message || 'Fault simulation failed')
    } finally {
      setSimulating(false)
    }
  }

  const restoreNetwork = async () => {
    setSimulating(true)
    try {
      await api.restoreNetwork()
      setFaultResult(null)
      await refresh()
    } catch (err) {
      alert(err.message || 'Restore failed')
    } finally {
      setSimulating(false)
    }
  }

  const resolveIncident = async (incidentId) => {
    try {
      const res = await api.updateIncident(incidentId, { status: 'Resolved' })
      setLatestIncident(res.data)
      const iRes = await api.getIncidents()
      setIncidents(iRes.data || [])
    } catch (err) {
      alert(err.message || 'Failed to resolve incident')
    }
  }

  const transformerPoles = poles.filter(
    (p) => p.transformerId === selectedTransformerId
  )

  const stats = {
    transformers: transformers.length,
    poles: poles.length,
    healthyDevices: poles.filter((p) => p.hasDevice).length,
    activeIncidents: incidents.filter((i) => i.status !== 'Resolved').length,
    affectedHouseholds: faultResult?.affectedHouseholds
      ?? incidents
        .filter((i) => i.status !== 'Resolved')
        .reduce((s, i) => s + (i.affectedHouseholds || 0), 0),
  }

  return (
    <FaultContext.Provider
      value={{
        transformers,
        poles,
        incidents,
        telemetry,
        loading,
        simulating,
        selectedTransformerId,
        setSelectedTransformerId,
        selectedFaultType,
        setSelectedFaultType,
        faultResult,
        latestIncident,
        transformerPoles,
        stats,
        injectFault,
        restoreNetwork,
        resolveIncident,
        refresh,
      }}
    >
      {children}
    </FaultContext.Provider>
  )
}

export function useFault() {
  const ctx = useContext(FaultContext)
  if (!ctx) throw new Error('useFault must be used within FaultProvider')
  return ctx
}
