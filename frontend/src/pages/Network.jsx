import React, { useState, useEffect } from 'react';
import { Network as NetworkIcon, X, Activity, Cpu, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useNetworkTopology } from '../hooks/useNetworkTopology';
import TopologyFlow from '../components/TopologyFlow';
import api from '../services/api';

const Network = () => {
  const [transformers, setTransformers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedTransformer, setSelectedTransformer] = useState('ALL');
  const [selectedPole, setSelectedPole] = useState(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transRes, incRes] = await Promise.all([
          api.getTransformers(),
          api.getIncidents()
        ]);
        if (transRes.data && transRes.data.data) {
          setTransformers(transRes.data.data);
        }
        if (incRes.data && incRes.data.data) {
          setIncidents(incRes.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
    
    // Poll incidents every 10 seconds to catch new ones from simulation
    const interval = setInterval(async () => {
      try {
        const incRes = await api.getIncidents();
        if (incRes.data && incRes.data.data) setIncidents(incRes.data.data);
      } catch (e) {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Pass active incident as faultResult to useNetworkTopology to visualize faults
  // We need to find the active incident for the selected transformer, if any.
  // If 'ALL' is selected, we could pass an array of faultResults, but useNetworkTopology currently expects one.
  // For 'ALL', we'll just let it visualize the first active incident for simplicity, or modify hook to accept array.
  const activeIncident = incidents.find(inc => inc.status !== 'Closed' && inc.status !== 'Resolved' && (selectedTransformer === 'ALL' || inc.transformerId === selectedTransformer));
  
  // Format incident to match faultResult expected by useNetworkTopology
  const faultResult = React.useMemo(() => {
    return activeIncident ? {
      faultLocation: {
        transformerId: activeIncident.transformerId,
        fromPole: activeIncident.suspectedLocation?.fromPole,
        toPole: activeIncident.suspectedLocation?.toPole
      }
    } : null;
  }, [activeIncident?.incidentId, activeIncident?.suspectedLocation?.toPole]);

  const { topology, loading, error } = useNetworkTopology(selectedTransformer, faultResult);

  const handleNodeClick = (node) => {
    setSelectedPole(node);
  };

  // When a pole with a fault is clicked, fetch AI explanation
  useEffect(() => {
    if (selectedPole && (selectedPole.faultDownstream || selectedPole.isFirstDeadPole)) {
       const activeInc = incidents.find(i => i.transformerId === selectedPole.transformerId && i.status !== 'Closed');
       if (activeInc) {
         setAiLoading(true);
         setAiExplanation('');
         api.getAiExplanation({
           faultData: {
             type: activeInc.faultType,
             fromPole: activeInc.suspectedLocation?.fromPole,
             toPole: activeInc.suspectedLocation?.toPole,
             affectedHouseholds: activeInc.affectedHouseholds
           }
         }).then(res => {
           if (res.data && res.data.success) {
             setAiExplanation(res.data.data);
           } else {
             setAiExplanation("AI explanation unavailable.");
           }
         }).catch(err => {
           setAiExplanation("AI explanation unavailable.");
         }).finally(() => {
           setAiLoading(false);
         });
       }
    } else {
       setAiExplanation('');
    }
  }, [selectedPole, incidents]);

  const renderTopology = () => {
    if (!topology) return null;
    return <TopologyFlow topology={topology} onNodeClick={handleNodeClick} />;
  };

  return (
    <div className="flex flex-col h-full space-y-6 relative overflow-hidden bg-gray-50 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-textmain tracking-tight flex items-center">
            <Activity className="mr-2 text-primary" size={24} />
            SCADA Network Topology
          </h2>
          <select
            value={selectedTransformer}
            onChange={(e) => {
              setSelectedTransformer(e.target.value);
              setSelectedPole(null);
            }}
            className="border border-border rounded-lg px-3 py-1.5 bg-white text-textmain font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Transformers</option>
            {transformers.length > 0 && transformers.map(t => (
              <option key={t.transformerId} value={t.transformerId}>
                Transformer {t.transformerId}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={`flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm flex transition-all duration-300 ${selectedPole ? 'w-2/3 pr-4' : 'w-full'}`}>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={36} />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-danger font-bold p-8">
            <span className="text-xl">Error Loading Topology</span>
            <span className="text-sm text-secondary font-normal mt-2">{error}</span>
          </div>
        ) : topology ? (
          <div className="p-6 h-full w-full bg-white rounded-xl">
             <div className="w-full h-full">
               {renderTopology()}
             </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-secondary">
            No topology data available.
          </div>
        )}
      </div>

      {/* Side Drawer for Pole Details */}
      <div className={`absolute top-0 right-0 h-full w-1/3 bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 z-10 ${selectedPole ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedPole && (
          <div className="flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-textmain flex items-center">
                <Cpu className="mr-2 text-primary" size={20} />
                Node Details: {selectedPole.poleId || selectedPole.transformerId}
              </h3>
              <button onClick={() => setSelectedPole(null)} className="p-1 rounded-md hover:bg-gray-200 text-secondary">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* Telemetry Highlight */}
              <div className="flex items-center space-x-4 p-4 rounded-xl border border-gray-100 bg-gray-50 shadow-sm">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedPole.faultDownstream ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                   <Activity size={24} />
                </div>
                <div>
                  <p className="text-sm text-secondary font-semibold">Voltage</p>
                  <p className={`text-2xl font-bold font-mono ${selectedPole.faultDownstream ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedPole.voltage ? `${selectedPole.voltage}V` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-5 gap-x-6 text-sm">
                <div>
                  <p className="text-secondary mb-1 font-semibold uppercase text-[10px] tracking-wider">Transformer</p>
                  <p className="font-bold text-primary">{selectedPole.transformerId}</p>
                </div>
                <div>
                  <p className="text-secondary mb-1 font-semibold uppercase text-[10px] tracking-wider">Status</p>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${selectedPole.faultDownstream ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {selectedPole.faultDownstream ? (selectedPole.isFirstDeadPole ? 'First Dead Pole' : 'Downstream Fault') : 'Healthy'}
                  </span>
                </div>
                {selectedPole.poleId && (
                  <>
                    <div>
                      <p className="text-secondary mb-1 font-semibold uppercase text-[10px] tracking-wider">Parent Pole</p>
                      <p className="font-mono font-bold text-textmain">{selectedPole.parentPoleId || 'Transformer Node'}</p>
                    </div>
                    <div>
                      <p className="text-secondary mb-1 font-semibold uppercase text-[10px] tracking-wider">Child Branches</p>
                      <p className="font-bold text-textmain">{selectedPole.children ? selectedPole.children.length : 0} nodes</p>
                    </div>
                    <div>
                      <p className="text-secondary mb-1 font-semibold uppercase text-[10px] tracking-wider">IOT Device</p>
                      {selectedPole.hasDevice ? (
                        <span className="font-mono font-bold text-primary">{selectedPole.deviceId}</span>
                      ) : (
                        <span className="font-semibold text-gray-400">No Device</span>
                      )}
                    </div>
                    <div>
                      <p className="text-secondary mb-1 font-semibold uppercase text-[10px] tracking-wider">Last Update</p>
                      <p className="text-xs text-textmain">
                        {selectedPole.lastUpdate ? new Date(selectedPole.lastUpdate).toLocaleTimeString() : 'N/A'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Localization Card - Appears if pole is part of a fault */}
              {(() => {
                const activeInc = incidents.find(i => i.transformerId === selectedPole.transformerId && i.status !== 'Closed');
                if ((selectedPole.faultDownstream || selectedPole.isLastLivePole || selectedPole.isAffected) && activeInc) {
                  return (
                    <div className="border border-red-200 bg-red-50 rounded-xl p-5 shadow-sm mt-6">
                      <h4 className="font-bold text-danger mb-4 flex items-center">
                        <AlertTriangle size={18} className="mr-2" />
                        Localization Result
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-red-100 pb-2">
                          <span className="text-red-800 font-semibold">Fault Type</span>
                          <span className="font-bold uppercase text-danger">{activeInc.faultType.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-2">
                          <span className="text-red-800 font-semibold">Detected Span</span>
                          <span className="font-mono font-bold">{activeInc.suspectedLocation?.fromPole} → {activeInc.suspectedLocation?.toPole}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-2">
                          <span className="text-red-800 font-semibold">Confidence</span>
                          <span className="text-success font-bold flex items-center"><ShieldCheck size={14} className="mr-1" /> {activeInc.confidence}%</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-2">
                          <span className="text-red-800 font-semibold">Affected Houses</span>
                          <span className="font-bold">{activeInc.affectedHouseholds}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-2">
                          <span className="text-red-800 font-semibold">Coordinates</span>
                          <span className="font-mono text-xs">{selectedPole.location?.coordinates ? `${selectedPole.location.coordinates[1].toFixed(4)}, ${selectedPole.location.coordinates[0].toFixed(4)}` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-2">
                          <span className="text-red-800 font-semibold">Reason</span>
                          <span className="text-xs text-right max-w-[150px] leading-tight">DFS topology trace indicates discontinuity</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* AI Assistant Panel */}
              {(() => {
                const activeInc = incidents.find(i => i.transformerId === selectedPole.transformerId && i.status !== 'Closed');
                if ((selectedPole.faultDownstream || selectedPole.isFirstDeadPole) && activeInc) {
                  return (
                    <div className="border border-purple-200 bg-purple-50 rounded-xl p-5 shadow-sm mt-4">
                      <h4 className="font-bold text-purple-700 mb-3 flex items-center">
                        <Sparkles size={18} className="mr-2" />
                        Gemini AI Assistant
                      </h4>
                      {aiLoading ? (
                        <div className="flex items-center space-x-2 text-purple-600 text-sm">
                          <Loader2 className="animate-spin" size={16} />
                          <span>Analyzing telemetry data...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-purple-900 leading-relaxed">
                          {aiExplanation || "AI explanation unavailable."}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Network;
