import React, { useState, useEffect } from 'react';
import { ShieldAlert, Zap, Cpu, Activity, Info, MapPin } from 'lucide-react';
import api from '../services/api';
import { useNetworkTopology } from '../hooks/useNetworkTopology';
import TopologyFlow from '../components/TopologyFlow';

const FaultSimulator = () => {
  const [transformers, setTransformers] = useState([]);
  const [selectedTransformer, setSelectedTransformer] = useState('');
  const [faultType, setFaultType] = useState('span_fault');

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  // Fetch transformers on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const transRes = await api.getTransformers();
        if (transRes.data && transRes.data.data) {
          setTransformers(transRes.data.data);
          if (transRes.data.data.length > 0) {
            setSelectedTransformer(transRes.data.data[0].transformerId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch transformers", err);
      }
    };
    fetchData();
  }, []);

  // Pass the backend result to the topology hook to visualize
  const { topology, loading, error } = useNetworkTopology(
    selectedTransformer || null,
    simulationResult // Pass the entire result instead of a single pole ID
  );

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!selectedTransformer || !faultType) return;

    setIsSimulating(true);
    setSimulationResult(null);
    try {
      const res = await api.simulateFault({
        transformerId: selectedTransformer,
        faultType: faultType
      });
      if (res.data && res.data.success) {
        setSimulationResult(res.data.data);
      }
    } catch (err) {
      console.error("Simulation failed", err);
      alert("Simulation failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRestore = async () => {
    setIsSimulating(true);
    try {
      await api.restorePower();
      alert("Network power successfully restored! Live telemetry has been dispatched.");
      setSimulationResult(null);
      fetchTopology();
    } catch (err) {
      console.error("Failed to restore", err);
      alert("Failed to restore power.");
    } finally {
      setIsSimulating(false);
    }
  };

  const renderTopology = () => {
    if (!topology) return null;
    return <TopologyFlow topology={topology} />;
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center space-x-3 text-textmain mb-2">
        <Zap size={28} className="text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">Fault Simulator</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* Controls & Result Panel */}
        <div className="lg:col-span-1 flex flex-col space-y-6 min-h-0 overflow-y-auto pr-2">

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col shrink-0">
            <h3 className="text-lg font-bold text-textmain mb-6 flex items-center">
              <Cpu className="text-primary mr-2" size={20} />
              Simulation Parameters
            </h3>

            <form className="space-y-5" onSubmit={handleSimulate}>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2 uppercase tracking-wider text-[11px]">
                  Select Target Transformer
                </label>
                <select
                  value={selectedTransformer}
                  onChange={(e) => {
                    setSelectedTransformer(e.target.value);
                    setSimulationResult(null);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-textmain font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {transformers.map(t => (
                    <option key={t.transformerId} value={t.transformerId}>
                      Transformer {t.transformerId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2 uppercase tracking-wider text-[11px]">
                  Fault Type
                </label>
                <select
                  value={faultType}
                  onChange={(e) => setFaultType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-textmain font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-danger"
                >
                  <option value="span_fault">Wire Break (Random Span)</option>
                  <option value="transformer_failure">Transformer Failure</option>
                  <option value="feeder_failure">Feeder Failure</option>
                </select>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  disabled={isSimulating}
                  className={`w-full font-bold py-3 px-4 rounded-lg shadow transition-colors flex justify-center items-center ${isSimulating ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-danger text-white hover:bg-red-700'}`}
                >
                  {isSimulating ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> Injecting Fault...</>
                  ) : (
                    'Simulate Fault'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={isSimulating}
                  className={`w-full font-bold py-3 px-4 rounded-lg shadow transition-colors flex justify-center items-center ${isSimulating ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  {isSimulating ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> Processing...</>
                  ) : (
                    'Restore Network'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Localization Result Card */}
          {simulationResult && (
            <div className="bg-white border border-red-200 rounded-xl shadow-sm p-6 shrink-0 border-t-4 border-t-danger">
              <h3 className="text-lg font-bold text-danger mb-4 flex items-center">
                <ShieldAlert className="mr-2" size={20} />
                Localization Result
              </h3>

              <div className="space-y-4">
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <span className="block text-[10px] uppercase font-bold text-red-800 tracking-wider mb-1">Fault Type</span>
                  <span className="font-mono font-bold text-danger">
                    {simulationResult.faultType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {simulationResult.faultLocation && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="block text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">Last Live Pole</span>
                      <span className="font-mono font-bold text-success">{simulationResult.faultLocation.fromPole || 'N/A'}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="block text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">First Dead Pole</span>
                      <span className="font-mono font-bold text-danger">{simulationResult.faultLocation.toPole || 'N/A'}</span>
                    </div>
                  </div>
                )}

                {simulationResult.faultLocation?.fromPole && simulationResult.faultLocation?.toPole && (
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <span className="block text-[10px] uppercase font-bold text-orange-800 tracking-wider mb-1">Detected Span</span>
                    <span className="font-mono font-bold text-orange-700">
                      {simulationResult.faultLocation.fromPole} → {simulationResult.faultLocation.toPole}
                    </span>
                  </div>
                )}

                {simulationResult.coordinates && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="block text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">Coordinates</span>
                      <span className="font-mono font-bold text-textmain text-xs">
                        {simulationResult.coordinates.latitude?.toFixed(6)}° N, {simulationResult.coordinates.longitude?.toFixed(6)}° E
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="block text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">Pincode</span>
                      <span className="font-mono font-bold text-textmain">{simulationResult.pincode}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="block text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">Affected Poles</span>
                    <span className="font-bold text-textmain">{simulationResult.affectedPoles?.length || 0}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="block text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">Affected Houses</span>
                    <span className="font-bold text-textmain">{simulationResult.affectedHouseholds || 0}</span>
                  </div>
                </div>

                {simulationResult.incidentId && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-blue-800 tracking-wider mb-1">Generated Incident</span>
                      <span className="font-mono font-bold text-primary">{simulationResult.incidentId}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] uppercase font-bold text-blue-800 tracking-wider mb-1">Confidence</span>
                      <span className="font-bold text-primary">{simulationResult.confidence}%</span>
                    </div>
                  </div>
                )}

                {simulationResult.detectionReason && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="block text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">Detection Reason</span>
                    <span className="text-xs text-textmain leading-relaxed">
                      {simulationResult.detectionReason}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Visualization Panel */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden min-h-[500px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="text-base font-bold text-textmain flex items-center">
              <Activity className="text-primary mr-2" size={18} />
              Network Visualization
            </h3>
          </div>

          <div className="flex-1 p-6 bg-white relative h-full min-h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-danger p-4 text-center">Error: {error}</div>
            ) : topology ? (
              <div className="w-full h-full">
                {renderTopology()}
              </div>
            ) : (
              <div className="text-secondary p-4 text-center">No topology available.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FaultSimulator;
