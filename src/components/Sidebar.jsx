import React from 'react';
import { 
  BarChart3, 
  Package, 
  Wheat, 
  Truck, 
  ShoppingBag, 
  Store, 
  Settings,
  Users,
  LogOut,
  ShieldAlert,
  ClipboardList,
  Layers
} from 'lucide-react';
import { dataStore } from '../utils/dataStore';

const Sidebar = ({ activeTab, setActiveTab, user, onLogout }) => {
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['Admin', 'Manager', 'Cashier', 'Distribution Manager'] },
    { id: 'supply', label: 'Inventory', icon: Layers, roles: ['Admin', 'Manager'] },
    { id: 'production', label: 'Production', icon: Wheat, roles: ['Admin', 'Production Chef', 'Distribution Manager'] },
    { id: 'distribution', label: 'Logistics', icon: Truck, roles: ['Admin', 'Driver', 'Distribution Manager'] },
    { id: 'sales', label: 'Sales (POS)', icon: ShoppingBag, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'outlets', label: 'Outlet Hub', icon: Store, roles: ['Admin'] },
    { id: 'users', label: 'Personnel', icon: Users, roles: ['Admin', 'Manager'] },
    { id: 'reports', label: 'Reports', icon: ClipboardList, roles: ['Admin', 'Manager'] },
    { id: 'requests', label: 'Supply Requests', icon: ClipboardList, roles: ['Admin', 'Manager', 'Distribution Manager'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin', 'Manager', 'Cashier', 'Distribution Manager', 'Production Chef', 'Driver'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(user.role));
  const fleetInfo = (user.role === 'Admin' || user.role === 'Distribution Manager') ? dataStore.getFleet() : [];
  const loadedCount = fleetInfo.filter(f => f.status === 'Loading').length;

  return (
    <div className="sidebar relative glass border-r border-white/10 flex flex-col h-screen overflow-hidden">
      <div className="flex items-center gap-3 px-2 mb-10 group">
        <div className="w-10 h-10 rounded-xl bg-amber-500 shadow-lg shadow-amber-500/20 flex items-center justify-center transition-transform group-hover:scale-110">
          <Wheat className="text-black" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white m-0">BAKERY<span className="text-amber-500">ERP</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest p-0 m-0">{user.role}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-1 pr-4 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isLogistics = item.id === 'distribution';
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item w-full transition-all duration-300 ${activeTab === item.id ? 'active bg-white-5 text-amber-500 translation-x-2' : ''}`}
            >
              <div className="flex items-center gap-3 flex-1">
                <Icon size={20} className={activeTab === item.id ? 'text-amber-500' : 'text-slate-500'} />
                <span className="font-semibold text-sm">{item.label}</span>
                {isLogistics && loadedCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-md animate-pulse">
                    {loadedCount} Loaded
                  </span>
                )}
              </div>
              {activeTab === item.id && !isLogistics && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shadow-glow" />}
            </button>
          );
        })}
        {/* Mobile-Only Logout Button */}
        <button onClick={onLogout} className="nav-item mobile-logout text-danger transition-all duration-300">
          <div className="flex items-center gap-3 flex-1 text-danger">
            <LogOut size={20} />
            <span className="font-semibold text-sm">Logout</span>
          </div>
        </button>
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 space-y-4 px-2">
        <div className="p-4 rounded-2xl bg-white-5 border border-white/5 space-y-3">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-amber-500 text-xs">
                {user.name[0]}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate text-white">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.outletId || 'Central Hub'}</p>
              </div>
           </div>
           <button 
             onClick={onLogout}
             className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-danger/10 text-danger text-xs hover:bg-danger hover:text-white transition-all border border-danger/20"
           >
             <LogOut size={16} /> Logout Session
           </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
