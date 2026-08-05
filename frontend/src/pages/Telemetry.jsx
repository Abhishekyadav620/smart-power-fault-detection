import React, { useState, useEffect } from 'react';
import { Search, Filter, Radio, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { Loader2 } from 'lucide-react';

const Telemetry = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTelemetry = async () => {
    try {
      const res = await api.getTelemetry();
      if (res.data && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch telemetry", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = data.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      (item.poleId && item.poleId.toLowerCase().includes(term)) ||
      (item.deviceId && item.deviceId.toLowerCase().includes(term)) ||
      (item.event && item.event.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center space-x-3 text-textmain mb-2">
        <Radio size={28} className="text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">Live Telemetry Feed</h2>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl shadow-soft flex flex-col overflow-hidden">
        
        <div className="p-4 border-b border-border flex justify-between items-center bg-background">
          <div className="relative w-72">
             <input 
               type="text" 
               placeholder="Search by Pole ID, Device..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm text-textmain placeholder-secondary"
             />
             <Search className="w-4 h-4 text-secondary absolute left-3 top-3" />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-border bg-card rounded-lg text-sm font-semibold hover:bg-gray-50 text-secondary shadow-sm transition-colors">
            <Filter size={16} />
            <span>Filter Feed</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto relative">
          {loading && data.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-background text-secondary uppercase sticky top-0 border-b border-border text-[10px] font-bold tracking-wider z-10">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Pole ID</th>
                  <th className="px-6 py-4">Device ID</th>
                  <th className="px-6 py-4">Event Type</th>
                  <th className="px-6 py-4">Voltage</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr key={row._id || row.id} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-textmain">
                      {new Date(row.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-primary flex items-center">
                      <Zap size={14} className="mr-2" /> {row.poleId}
                    </td>
                    <td className="px-6 py-4 font-mono text-secondary">{row.deviceId}</td>
                    <td className="px-6 py-4">
                       <span className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full w-fit text-[11px] font-bold uppercase tracking-wider ${
                         row.event === 'power_lost' || row.event === 'sensor_failure' || row.event === 'voltage_drop'
                           ? 'bg-red-100 text-red-700' 
                           : 'bg-green-100 text-green-700'
                       }`}>
                          {(row.event === 'power_lost' || row.event === 'sensor_failure' || row.event === 'voltage_drop') ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                          <span>{row.event.replace('_', ' ')}</span>
                       </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-textmain">{row.voltage !== null && row.voltage !== undefined ? `${row.voltage}V` : '---'}</td>
                  </tr>
                ))}
                {filteredData.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-secondary">
                      No telemetry data found.
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

export default Telemetry;
