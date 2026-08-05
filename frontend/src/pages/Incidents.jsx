import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Search, CheckCircle2, ShieldAlert, FileWarning, Briefcase, Wrench, Zap, Flag, Loader2, ArrowLeft, Cpu, Activity, Clock, Server } from 'lucide-react';
import api from '../services/api';
import { useNetworkTopology } from '../hooks/useNetworkTopology';
import RecursivePoleNode from '../components/RecursivePoleNode';

const IncidentDetails = ({ incident, onBack }) => {
  const [updating, setUpdating] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState('');

  const timelineStages = [
    { num: 1, label: 'Detected', icon: FileWarning, timeField: 'detectedAt' },
    { num: 2, label: 'Acknowledged', icon: Zap, timeField: 'acknowledgedAt' },
    { num: 3, label: 'Crew Assigned', icon: Briefcase, timeField: 'crewAssignedAt' },
    { num: 4, label: 'Resolved', icon: Wrench, timeField: 'resolvedAt' },
    { num: 5, label: 'Verified', icon: ShieldAlert, timeField: 'verifiedAt' },
    { num: 6, label: 'Closed', icon: Flag, timeField: 'closedAt' },
  ];

  const getStageNumber = (status) => {
    switch (status) {
      case 'DETECTED': return 1;
      case 'ACKNOWLEDGED': return 2;
      case 'CREW ASSIGNED': return 3;
      case 'RESOLVED': return 4;
      case 'VERIFIED': return 5;
      case 'CLOSED': return 6;
      default: return 1; // Fallback
    }
  };

  const currentStageNum = getStageNumber(incident.status);

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'CREW ASSIGNED') {
        payload.assignedCrew = selectedCrew;
      }
      await api.updateIncident(incident.incidentId, payload);
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 -m-6 p-6 overflow-y-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center text-primary font-bold hover:text-blue-800 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-border">
           <ArrowLeft size={18} className="mr-2" /> Back to List
        </button>
        <div className="flex items-center space-x-2">
           <ShieldAlert size={24} className="text-danger" />
           <h2 className="text-2xl font-bold tracking-tight text-textmain">Incident Tracking</h2>
        </div>
        <div className="w-[120px]"></div> {/* Spacer */}
      </div>

      {/* Ticket Workflow Timeline */}
      <div className="bg-white p-6 rounded-xl border border-border shadow-sm mb-6 shrink-0 relative overflow-hidden">
         <div className="relative flex justify-between items-start w-full px-8 pb-6 pt-2">
             <div className="absolute top-8 left-12 right-12 h-1 bg-gray-200 z-0"></div>
             <div 
               className="absolute top-8 left-12 h-1 bg-green-500 z-0 transition-all duration-1000 ease-in-out" 
               style={{ width: `${(Math.max(currentStageNum - 1, 0) / (timelineStages.length - 1)) * 100}%` }}
             ></div>

             {timelineStages.map((stage) => {
               const isCompleted = stage.num < currentStageNum || incident.status === 'CLOSED';
               const isCurrent = stage.num === currentStageNum && incident.status !== 'CLOSED';
               const Icon = stage.icon;
               
               let circleClasses = 'bg-gray-100 text-gray-400';
               if (isCompleted) circleClasses = 'bg-green-500 text-white';
               else if (isCurrent) circleClasses = 'bg-blue-500 text-white ring-4 ring-blue-500/20 scale-110';
               
               return (
                 <div key={stage.num} className="relative z-10 flex flex-col items-center">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500 ${circleClasses}`}>
                     <Icon size={20} />
                   </div>
                   <p className={`mt-3 text-[11px] uppercase tracking-wider font-bold max-w-[80px] text-center ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-secondary'}`}>
                     {stage.label}
                   </p>
                   {incident[stage.timeField] && (
                     <p className="mt-1 text-[10px] text-gray-500 text-center w-24">
                       {new Date(incident[stage.timeField]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </p>
                   )}
                 </div>
               );
             })}
         </div>
      </div>

      <div className="flex-1 flex flex-col justify-start items-center pt-2 gap-6 pb-8">
           
           {/* Action Controls */}
           {currentStageNum < 5 && (
             <div className="bg-white p-6 rounded-xl border border-border shadow-sm w-full max-w-2xl text-center">
               <h3 className="font-bold text-textmain mb-4 text-lg border-b pb-3">Action Required</h3>
               
               {(incident.status === 'DETECTED' || incident.status === 'Open') && (
                 <div>
                   <p className="text-secondary text-sm mb-4">A new fault has been automatically detected and localized. Please acknowledge the incident to begin resolution.</p>
                   <button disabled={updating} onClick={() => handleUpdateStatus('ACKNOWLEDGED')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors disabled:opacity-50">
                     {updating ? 'Processing...' : 'Acknowledge Incident'}
                   </button>
                 </div>
               )}

               {incident.status === 'ACKNOWLEDGED' && (
                 <div>
                   <p className="text-secondary text-sm mb-4">The incident is acknowledged. Assign a field crew to dispatch them to the fault location.</p>
                   <div className="flex justify-center items-center space-x-4">
                     <select value={selectedCrew} onChange={(e) => setSelectedCrew(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                       <option value="">-- Select Crew --</option>
                       <option value="Crew Alpha (North)">Crew Alpha (North)</option>
                       <option value="Crew Bravo (South)">Crew Bravo (South)</option>
                       <option value="Emergency Response Team">Emergency Response Team</option>
                     </select>
                     <button disabled={updating || !selectedCrew} onClick={() => handleUpdateStatus('CREW ASSIGNED')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors disabled:opacity-50">
                       {updating ? 'Assigning...' : 'Assign Crew'}
                     </button>
                   </div>
                 </div>
               )}

               {incident.status === 'CREW ASSIGNED' && (
                 <div>
                   <p className="text-secondary text-sm mb-4">Crew <strong>{incident.assignedCrew}</strong> is currently on site. Once they report the physical repair is complete, mark it as resolved.</p>
                   <button disabled={updating} onClick={() => handleUpdateStatus('RESOLVED')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors disabled:opacity-50">
                     {updating ? 'Processing...' : 'Mark Repair Completed'}
                   </button>
                 </div>
               )}

               {incident.status === 'RESOLVED' && (
                 <div className="flex flex-col items-center">
                   <p className="text-secondary text-sm mb-4">Repair marked as completed. Waiting for the affected poles to power on and transmit live voltage telemetry...</p>
                   <div className="flex items-center text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-lg">
                     <Loader2 className="animate-spin mr-2" size={18} /> Automatically Verifying Restoration...
                   </div>
                 </div>
               )}
             </div>
           )}

           {/* Incident Summary */}
           <div className="bg-white p-8 rounded-xl border border-border shadow-sm w-full max-w-2xl">
             <h3 className="font-bold text-textmain flex items-center mb-6 pb-4 border-b border-gray-100 text-lg">
                <FileWarning className="mr-3 text-primary" size={22} /> Incident Summary
             </h3>
             <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
                <div><p className="text-[11px] text-secondary font-bold uppercase tracking-wider mb-1">Incident ID</p><p className="font-mono font-bold text-base">{incident.incidentId}</p></div>
                <div><p className="text-[11px] text-secondary font-bold uppercase tracking-wider mb-1">Status</p><p className="font-bold text-primary text-base">{incident.status}</p></div>
                <div><p className="text-[11px] text-secondary font-bold uppercase tracking-wider mb-1">Transformer</p><p className="font-bold text-base">{incident.transformerId}</p></div>
                <div><p className="text-[11px] text-secondary font-bold uppercase tracking-wider mb-1">Fault Type</p><p className="font-bold uppercase text-danger text-base">{incident.faultType.replace('_', ' ')}</p></div>
                {incident.assignedCrew && (
                  <div><p className="text-[11px] text-secondary font-bold uppercase tracking-wider mb-1">Assigned Crew</p><p className="font-bold text-blue-700 text-base">{incident.assignedCrew}</p></div>
                )}
                <div><p className="text-[11px] text-secondary font-bold uppercase tracking-wider mb-1">Detection Time</p><p className="font-mono text-sm">{new Date(incident.detectedAt).toLocaleString()}</p></div>
                <div><p className="text-[11px] text-secondary font-bold uppercase tracking-wider mb-1">Priority</p>
                   <span className={`px-2 py-0.5 rounded text-xs font-bold ${incident.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{incident.priority}</span>
                </div>
                <div className="col-span-2"><p className="text-[11px] text-secondary font-bold uppercase tracking-wider mb-1">Detected Fault Span</p><p className="font-mono text-sm font-bold text-orange-700">{incident.suspectedLocation?.fromPole} → {incident.suspectedLocation?.toPole}</p></div>
             </div>
           </div>
      </div>
    </div>
  );
};


const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingIncident, setTrackingIncident] = useState(null);

  const fetchIncidents = async () => {
    try {
      const res = await api.getIncidents();
      if (res.data && res.data.data) {
        setIncidents(res.data.data);
        setTrackingIncident(prev => {
          if (prev) {
            const updated = res.data.data.find(i => i.incidentId === prev.incidentId);
            return updated || prev;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Failed to fetch incidents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 3000); // Polling faster to catch auto-close
    return () => clearInterval(interval);
  }, [trackingIncident]); 

  if (trackingIncident) {
    return <IncidentDetails incident={trackingIncident} onBack={() => setTrackingIncident(null)} />;
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center space-x-3 text-textmain mb-2">
        <ShieldAlert size={28} className="text-danger" />
        <h2 className="text-2xl font-bold tracking-tight">Incident Lifecycle Management</h2>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl shadow-soft overflow-hidden flex flex-col p-6">
        
        {/* Incident List */}
        <div className="overflow-x-auto border border-border rounded-lg shadow-sm flex-1 relative">
          {loading && incidents.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <table className="w-full text-sm text-left bg-card relative">
              <thead className="bg-background text-secondary uppercase border-b border-border text-[10px] font-bold tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Incident ID</th>
                  <th className="px-6 py-4">Transformer</th>
                  <th className="px-6 py-4">Fault Span</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Current Stage</th>
                  <th className="px-6 py-4">Affected Houses</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr 
                    key={inc.incidentId} 
                    className="border-b border-border last:border-0 transition-colors hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-textmain">{inc.incidentId}</td>
                    <td className="px-6 py-4 font-bold text-primary">{inc.transformerId}</td>
                    <td className="px-6 py-4 font-mono text-secondary">{inc.suspectedLocation?.fromPole} → {inc.suspectedLocation?.toPole}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide font-bold ${inc.priority === 'Critical' ? 'bg-red-100 text-red-700' : inc.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {inc.priority}
                       </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-textmain">
                      <span className={`flex items-center ${inc.status === 'Closed' ? 'text-success' : 'text-textmain'}`}>
                         {inc.status === 'Closed' && <CheckCircle2 size={14} className="mr-1" />} {inc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-textmain font-bold">{inc.affectedHouseholds}</td>
                    <td className="px-6 py-4">
                       <div className="flex space-x-4 text-xs font-bold uppercase tracking-wider">
                         <button className="text-primary hover:text-blue-800 flex items-center bg-blue-50 px-3 py-1.5 rounded border border-blue-100 transition-colors" onClick={() => setTrackingIncident(inc)}>
                           <Search size={14} className="mr-1"/> Track
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
                {incidents.length === 0 && !loading && (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-secondary">
                      No active incidents.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};

export default Incidents;
