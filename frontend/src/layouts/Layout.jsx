import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Network, 
  Activity, 
  Radio, 
  AlertTriangle,
  Settings,
  Bell,
  Search,
  Zap,
  Menu,
  X,
  BrainCircuit,
  FileText
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Network', path: '/network', icon: <Network size={20} /> },
    { name: 'Fault Simulator', path: '/simulator', icon: <Activity size={20} /> },
    { name: 'Telemetry', path: '/telemetry', icon: <Radio size={20} /> },
    { name: 'Incidents', path: '/incidents', icon: <AlertTriangle size={20} /> },
    { name: 'AI Suggestions', path: '/ai-suggestions', icon: <BrainCircuit size={20} /> },
    { name: 'Reports', path: '/reports', icon: <FileText size={20} /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-soft flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center px-6 border-b border-border bg-card">
          <div className="flex items-center space-x-3 text-primary">
            <Zap size={24} className="text-primary fill-primary" />
            <span className="text-xl font-bold tracking-tight">GridGuard</span>
          </div>
          <button className="ml-auto lg:hidden text-secondary" onClick={toggleSidebar}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                 if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-secondary hover:bg-gray-50 hover:text-textmain'
                }`
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-secondary hover:bg-gray-50 hover:text-textmain'
              }`
            }
          >
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

const Topbar = ({ toggleSidebar }) => {
  return (
    <header className="h-16 bg-card border-b border-border shadow-soft flex items-center justify-between px-4 lg:px-8 z-30 relative">
      <div className="flex items-center">
        <button className="p-2 mr-4 text-secondary hover:bg-gray-100 rounded-lg lg:hidden" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        
        <div className="hidden md:flex items-center bg-background border border-border rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <Search size={18} className="text-secondary mr-2" />
          <input 
            type="text" 
            placeholder="Search nodes, incidents..." 
            className="bg-transparent border-none outline-none text-sm w-64 text-textmain placeholder-secondary"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 lg:space-x-6">
        <button className="relative p-2 text-secondary hover:bg-gray-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-card"></span>
        </button>
        
        <div className="flex items-center space-x-3 pl-3 lg:pl-6 border-l border-border cursor-pointer">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-textmain leading-tight">Admin User</p>
            <p className="text-xs text-secondary font-medium">Control Room HQ</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
            AU
          </div>
        </div>
      </div>
    </header>
  );
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-textmain font-sans overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
