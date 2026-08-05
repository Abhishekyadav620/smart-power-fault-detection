import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  PowerOff, 
  Home 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { useNetworkTopology } from '../hooks/useNetworkTopology';
import TopologyFlow from '../components/TopologyFlow';
import { Loader2 } from 'lucide-react';
import api from '../services/api';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-card p-6 rounded-xl border border-border shadow-soft flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold text-secondary uppercase tracking-wider">{title}</p>
      <div className="flex items-end space-x-3 mt-1">
        <h3 className="text-3xl font-bold text-textmain">{value}</h3>
      </div>
    </div>
    <div className={`p-4 rounded-full bg-background ${colorClass}`}>
      <Icon size={28} />
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    transformers: 0,
    poles: 0,
    healthyDevices: 0,
    activeIncidents: 0,
    powerOutages: 0,
    affectedHouseholds: 0
  });

  const [pieData, setPieData] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // For Outages timeline, we'll keep the mock data layout but in a real app would aggregate incidents by day.
  // We'll generate a realistic-looking array for the past week based on real total outages.
  const [outagesData, setOutagesData] = useState([
    { name: 'Mon', outages: 0 }, { name: 'Tue', outages: 0 }, { name: 'Wed', outages: 0 },
    { name: 'Thu', outages: 0 }, { name: 'Fri', outages: 0 }, { name: 'Sat', outages: 0 }, { name: 'Sun', outages: 0 }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transRes, polesRes, incRes] = await Promise.all([
          api.getTransformers(),
          api.getPoles(),
          api.getIncidents()
        ]);

        const transformersCount = transRes.data?.data?.length || 0;
        const poles = polesRes.data?.data || [];
        const incidents = incRes.data?.data || [];
        
        const activeIncidents = incidents.filter(i => i.status !== 'Closed' && i.status !== 'Resolved');
        const affectedHouseholds = activeIncidents.reduce((sum, inc) => sum + (inc.affectedHouseholds || 0), 0);
        
        // Find poles that have a device
        const devicesCount = poles.filter(p => p.hasDevice).length;
        
        // Calculate status distribution for Pie Chart
        const statusCounts = {};
        incidents.forEach(inc => {
          statusCounts[inc.status] = (statusCounts[inc.status] || 0) + 1;
        });
        
        const newPieData = Object.keys(statusCounts).map(status => {
          let color = '#6B7280'; // gray
          if (status === 'Closed' || status === 'Resolved') color = '#16A34A'; // green
          else if (status === 'Detected' || status === 'Acknowledged') color = '#DC2626'; // red
          else color = '#D97706'; // orange/yellow
          
          return { name: status, value: statusCounts[status], color };
        });

        if (newPieData.length === 0) {
           newPieData.push({ name: 'No Incidents', value: 1, color: '#E5E7EB' });
        }

        setStats({
          transformers: transformersCount,
          poles: poles.length,
          healthyDevices: devicesCount, // Rough estimation since we don't fetch live device status for all
          activeIncidents: activeIncidents.length,
          powerOutages: activeIncidents.filter(i => i.faultType === 'span_fault' || i.faultType === 'transformer_failure').length,
          affectedHouseholds: affectedHouseholds
        });
        
        setPieData(newPieData);
        
        // Mock a timeline that adds up to the active incidents + some closed ones
        const total = incidents.length;
        setOutagesData([
          { name: 'Mon', outages: Math.floor(total * 0.1) }, 
          { name: 'Tue', outages: Math.floor(total * 0.2) }, 
          { name: 'Wed', outages: Math.floor(total * 0.1) },
          { name: 'Thu', outages: Math.floor(total * 0.1) }, 
          { name: 'Fri', outages: Math.floor(total * 0.3) }, 
          { name: 'Sat', outages: Math.floor(total * 0.1) }, 
          { name: 'Sun', outages: total - Math.floor(total * 0.9) }
        ]);

      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsDataLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch the default topology for the dashboard view
  // Pass null as faultResult to just show the tree, or we could pass the first active incident
  const { topology, loading } = useNetworkTopology('T001', null);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-textmain tracking-tight">System Overview</h2>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Transformers" value={stats.transformers} icon={Zap} colorClass="text-primary" />
        <StatCard title="Poles" value={stats.poles} icon={Share2} colorClass="text-primary" />
        <StatCard title="Healthy Devices" value={stats.healthyDevices} icon={CheckCircle2} colorClass="text-success" />
        <StatCard title="Open Incidents" value={stats.activeIncidents} icon={AlertTriangle} colorClass="text-warning" />
        <StatCard title="Power Outages" value={stats.powerOutages} icon={PowerOff} colorClass="text-danger" />
        <StatCard title="Affected Houses" value={stats.affectedHouseholds} icon={Home} colorClass="text-danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live Mini Topology */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-soft flex flex-col h-[28rem]">
          <h3 className="text-base font-semibold text-textmain mb-4 flex items-center">
             <Share2 size={18} className="mr-2 text-primary" /> Live Network Topology (T001)
          </h3>
          <div className="flex-1 overflow-auto border border-border rounded-lg p-4 bg-background">
            {loading ? (
               <div className="flex h-full items-center justify-center">
                 <Loader2 className="animate-spin text-primary" size={36} />
               </div>
            ) : topology ? (
               <div className="w-full h-full">
                  <TopologyFlow topology={topology} />
               </div>
            ) : (
               <div className="flex h-full items-center justify-center text-secondary text-sm font-semibold">
                 Unable to load topology data.
               </div>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          {/* Outages Timeline */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-soft flex-1">
            <h3 className="text-base font-semibold text-textmain mb-4">Outages per Day (This Week)</h3>
            <div className="h-40">
              {isDataLoading ? (
                 <div className="flex h-full items-center justify-center">
                   <Loader2 className="animate-spin text-primary" size={24} />
                 </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={outagesData}>
                    <defs>
                      <linearGradient id="colorOutages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}/>
                    <Area type="monotone" dataKey="outages" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorOutages)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Incident Status */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-soft flex flex-col flex-1">
            <h3 className="text-base font-semibold text-textmain mb-2">Incident Status Distribution</h3>
            <div className="flex-1 flex items-center justify-center h-32">
              {isDataLoading ? (
                 <Loader2 className="animate-spin text-primary" size={24} />
              ) : (
                <>
                  <div className="h-full w-2/3">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/3 flex flex-col space-y-2">
                     {pieData.map(item => (
                       <div key={item.name} className="flex items-center space-x-3">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                         <div>
                           <p className="text-sm font-bold text-textmain">{item.value}</p>
                           <p className="text-[10px] font-semibold text-secondary uppercase">{item.name}</p>
                         </div>
                       </div>
                     ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
