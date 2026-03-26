import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Package, 
  Activity, 
  Store, 
  CheckCircle2, 
  Clock,
  DollarSign,
  UserCheck,
  Truck,
  Layers,
  ClipboardList,
  Navigation
} from 'lucide-react';
import { dataStore, STORAGE_KEYS } from '../utils/dataStore';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, staff: 0, lowStock: 0 });
  const [distStats, setDistStats] = useState({ totalRequests: 0, pending: 0, inTransit: 0, fleetActive: 0 });
  const [outletInfo, setOutletInfo] = useState(null);

  const refreshData = () => {
    // Standard Stats
    const sales = dataStore.getScopedData(STORAGE_KEYS.SALES, user.outletId);
    const inventory = dataStore.getScopedData(STORAGE_KEYS.INVENTORY, user.outletId);
    const users = dataStore.getUsers().filter(u => user.role === 'Admin' ? true : u.outletId === user.outletId);
    
    // Logistics Stats
    const requests = dataStore.get(STORAGE_KEYS.SUPPLY_REQUESTS);
    const fleet = dataStore.getFleet();

    if (user.outletId) {
      const outlets = dataStore.get(STORAGE_KEYS.OUTLETS);
      setOutletInfo(outlets.find(o => o.id === user.outletId));
    }

    setStats({
      revenue: sales.reduce((sum, s) => sum + s.total, 0),
      orders: sales.length,
      staff: users.length,
      lowStock: inventory.filter(i => i.status === 'Low Stock').length
    });

    setDistStats({
      totalRequests: requests.length,
      pending: requests.filter(r => r.status === 'Pending' || r.status === 'Accepted').length,
      inTransit: requests.filter(r => r.status === 'Sent' || r.status === 'Arrived').length,
      fleetActive: fleet.filter(f => f.status !== 'Available').length
    });
  };

  useEffect(() => {
    refreshData();
    const handleSync = () => refreshData();
    window.addEventListener('datastore-update', handleSync);
    return () => window.removeEventListener('datastore-update', handleSync);
  }, [user.outletId]);

  const isDistManager = user.role === 'Distribution Manager';

  // Metrics configurations based on role
  const metrics = isDistManager ? [
    { label: 'Total Supply Orders', value: distStats.totalRequests, icon: ClipboardList, trend: 'Lifetime', color: 'text-amber-500' },
    { label: 'Pending Dispatch', value: distStats.pending, icon: Clock, trend: 'Warehouse', color: 'text-amber-500' },
    { label: 'Active Fleet Units', value: distStats.fleetActive, icon: Truck, trend: 'Movement', color: 'text-amber-500' },
    { label: 'In-Transit Orders', value: distStats.inTransit, icon: Navigation, trend: 'Real-time', color: 'text-success' },
  ] : [
    { label: 'Cumulative Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, trend: '+12.4%', color: 'text-success' },
    { label: 'Transaction Volume', value: stats.orders, icon: ShoppingBag, trend: '+5.2%', color: 'text-amber-500' },
    { label: 'Personnel Count', value: stats.staff, icon: Users, trend: 'Stable', color: 'text-amber-500' },
    { label: 'Inventory Health', value: stats.lowStock, icon: Package, trend: stats.lowStock > 3 ? 'Critical' : 'Good', color: stats.lowStock > 3 ? 'text-danger' : 'text-success' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold font-heading">
            {isDistManager ? 'Supply Chain Command' : (user.role === 'Admin' ? 'Executive Hub Overview' : `${outletInfo?.name || 'Outlet Terminal'}`)}
          </h2>
          <p className="text-slate-400">Welcome back, {user?.name}. {isDistManager ? 'Logistics network is stable.' : 'System operational.'}</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-card py-2 px-4 flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${user.role === 'Admin' ? 'bg-amber-500' : 'bg-success'} shadow-glow`} />
             <span className="text-xs font-bold uppercase tracking-widest">{user.role} Control</span>
          </div>
        </div>
      </header>

      {/* Primary Metrics */}
      <div className="grid grid-cols-4 gap-6">
        {metrics.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card group hover:border-amber-500/30 transition-all duration-300">
               <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-white-5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon size={24} className={stat.color} />
                 </div>
                 <span className={`text-[10px] font-bold px-2 py-1 rounded bg-black/40 ${stat.trend === 'Critical' ? 'text-danger' : 'text-success'}`}>{stat.trend}</span>
               </div>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
               <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Role-Specific Context */}
        <div className="col-span-2 glass-card space-y-6">
           <div className="flex justify-between items-center">
             <h3 className="text-xl font-bold flex items-center gap-2"><Activity size={20} className="text-amber-500" /> Operational Context</h3>
             <button className="text-xs text-slate-500 hover:text-white uppercase font-bold tracking-widest">Live Logs</button>
           </div>
           
           <div className="space-y-4">
              {isDistManager ? (
                <>
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500"><Truck size={20}/></div>
                      <div>
                        <p className="text-sm font-bold">Logistics Network Performance</p>
                        <p className="text-[10px] text-slate-500">Fleet availability is currently at <b>{Math.round((3-distStats.fleetActive)/3*100)}%</b>.</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white-5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500"><Package size={20}/></div>
                      <div>
                        <p className="text-sm font-bold">Unfulfilled Requests</p>
                        <p className="text-[10px] text-slate-500">There are {distStats.pending} orders awaiting warehouse authorization.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500"><UserCheck size={20}/></div>
                      <div>
                        <p className="text-sm font-bold">Managerial Presence Confirmed</p>
                        <p className="text-[10px] text-slate-500">Security scan verified for {user.name}.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600">{new Date().toLocaleTimeString()}</span>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white-5 border border-white/5 flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500"><Store size={20}/></div>
                      <div>
                        <p className="text-sm font-bold">Outlet Synchronization</p>
                        <p className="text-[10px] text-slate-500">Global terminal health: Optimal.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600">Continuous Sync</span>
                  </div>
                </>
              )}
           </div>
        </div>

        {/* Territory Status */}
        <div className="glass-card bg-amber-500/5 border-amber-500/10 flex flex-col justify-center items-center text-center p-8 space-y-4">
           {isDistManager ? (
             <>
               <Truck size={48} className="text-amber-500" />
               <h4 className="text-xl font-bold">Global Logistics</h4>
               <p className="text-xs text-slate-400">You are monitoring the supply chain health of the entire territorial network.</p>
             </>
           ) : (user.role === 'Admin' ? (
             <>
               <Store size={48} className="text-amber-500" />
               <h4 className="text-xl font-bold">Territorial Network</h4>
               <p className="text-xs text-slate-400">You are overseeing the entire Bakery ERP infrastructure from the central hub.</p>
             </>
           ) : (
             <>
               <CheckCircle2 size={48} className="text-success" />
               <h4 className="text-xl font-bold">Outlet Scoped</h4>
               <p className="text-xs text-slate-400">All data shown is strictly limited to the ecosystem of <b>{outletInfo?.name || 'this location'}</b>.</p>
             </>
           ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
