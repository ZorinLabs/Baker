import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  User, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Package, 
  ShieldCheck,
  ArrowRightCircle,
  Undo2,
  Store,
  ChevronRight,
  Plus,
  Trash2,
  Zap,
  Activity,
  History,
  Anchor,
  Box,
  Key,
  ShieldAlert,
  Settings2,
  MoreVertical
} from 'lucide-react';
import { dataStore, STORAGE_KEYS } from '../utils/dataStore';

const Distribution = ({ user, notify, ask }) => {
  const [fleet, setFleet] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [allCommands, setAllCommands] = useState([]);
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, REGISTRY, LOADING, DOCKYARD
  
  // Forms
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ name: '', plate: '', type: 'Heavy Truck' });

  useEffect(() => {
    refreshData();
    const handleSync = () => refreshData();
    window.addEventListener('datastore-update', handleSync);
    return () => window.removeEventListener('datastore-update', handleSync);
  }, [user]);

  const refreshData = () => {
    const data = dataStore.getFleet();
    setFleet(data);
    
    const allUsers = dataStore.getUsers();
    setDrivers(allUsers.filter(u => u.role === 'Driver'));

    const hubCommands = dataStore.get(STORAGE_KEYS.COMMAND_HUB);
    setAllCommands(hubCommands);
  };

  const handleAddVehicle = (e) => {
    e.preventDefault();
    const vehicle = {
      id: `VEH-${Math.floor(Math.random() * 9000 + 1000)}`,
      ...newVehicle,
      status: 'Awaiting Pilot',
      driverId: null,
      driverName: null,
      loadedOrders: []
    };
    const updated = [...fleet, vehicle];
    dataStore.saveFleet(updated);
    setFleet(updated);
    setShowAddVehicle(false);
    setNewVehicle({ name: '', plate: '', type: 'Heavy Truck' });
    notify(`Logistics Unit ${vehicle.id} has been registered and inducted into the fleet.`, 'success', 'Registry Updated');
  };

  const removeVehicle = (truckId) => {
    ask(`Are you sure you want to decommission fleet unit ${truckId}? This action cannot be undone.`, () => {
      const updated = fleet.filter(f => f.id !== truckId);
      dataStore.saveFleet(updated);
      setFleet(updated);
      notify(`Fleet unit ${truckId} has been successfully decommissioned and removed from registry.`, 'success', 'Unit Decommissioned');
    }, 'Confirm Decommission');
  };

  const assignPilot = (truckId, driverId) => {
    const selectedDriver = drivers.find(d => d.id === parseInt(driverId));
    const updated = fleet.map(f => {
      if (f.id === truckId) {
        return { 
          ...f, 
          driverId: selectedDriver ? selectedDriver.id : null, 
          driverName: selectedDriver ? selectedDriver.name : null,
          status: selectedDriver ? 'Ready' : 'Awaiting Pilot'
        };
      }
      return f;
    });
    dataStore.saveFleet(updated);
    setFleet(updated);
    notify(`Pilot ${selectedDriver?.name || 'Deassigned'} has assumed command of ${truckId}.`, 'success', 'Pilot Assigned');
  };

  const loadOrderToVehicle = (truckId, cmdId) => {
    const truck = fleet.find(f => f.id === truckId);
    if (!truck) return;

    const updated = fleet.map(f => {
      if (f.id === truckId) {
        return { 
          ...f, 
          loadedOrders: [...f.loadedOrders, cmdId],
          status: 'In Dockyard'
        };
      }
      return f;
    });
    dataStore.saveFleet(updated);
    dataStore.updateCommand(cmdId, { status: 'PE-LOADED', carrierId: truckId });
    setFleet(updated);
    // refresh command state immediately
    const hubCommands = dataStore.get(STORAGE_KEYS.COMMAND_HUB);
    setAllCommands(hubCommands);
    notify(`Mission ${cmdId} transferred to ${truckId} loading manifold. Unit moved to Dockyard.`, 'success', 'Payload Loaded');
  };

  const deployVehicle = (truckId) => {
    const truck = fleet.find(t => t.id === truckId);
    if (!truck || truck.loadedOrders.length === 0) return;

    ask(`Final Authorization for ${truckId} Deployment? Payload will be marked In-Transit.`, () => {
      const updated = fleet.map(f => f.id === truckId ? { ...f, status: 'Departed' } : f);
      dataStore.saveFleet(updated);
      
      truck.loadedOrders.forEach(cid => {
        dataStore.updateCommand(cid, { status: 'PE-SENT' });
      });

      refreshData();
      notify(`Logistics Mission ${truckId} has cleared the Dockyard. Signals transmitted.`, 'success', 'Mission Deployed');
    }, 'Dockyard Deployment Authorized');
  };

  const confirmDelivery = (cmdId) => {
    // Driver side
    const cmd = allCommands.find(c => c.id === cmdId);
    ask(`Terminate transit and confirm PHYSICAL HANDOVER for ${cmdId}?`, () => {
      dataStore.updateCommand(cmdId, { status: 'PE-ARRIVED' });
      refreshData();
      notify(`Handover signal sent. Awaiting Site Manager confirmation.`, 'success', 'Deliveries Logged');
    });
  };

  const reportBaseReturn = (truckId) => {
    ask(`Confirm vehicle ${truckId} has physically returned to Warehouse Hub?`, () => {
      const updated = fleet.map(f => f.id === truckId ? { 
        ...f, 
        status: 'Ready', // Still has pilot for the day
        loadedOrders: []
      } : f);
      dataStore.saveFleet(updated);
      refreshData();
      notify(`Logistics unit ${truckId} is docked and available for next mission.`, 'success', 'Hub Return Confirmed');
    });
  };

  const isAdminOrDM = user.role === 'Admin' || user.role === 'Distribution Manager';
  const isDriver = user.role === 'Driver';
  const myTruck = isDriver ? fleet.find(f => f.driverName === user.name) : null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black flex items-center gap-4 tracking-tighter uppercase"><Truck className="text-amber-500" /> Logistics Hub</h2>
          <div className="flex gap-6 mt-4">
             {isAdminOrDM && (
               <>
                 <button onClick={() => setActiveTab('DASHBOARD')} className={`text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b-2 transition-all ${activeTab === 'DASHBOARD' ? 'border-amber-500 text-white' : 'border-transparent text-slate-500 hover:text-white'}`}>Active View</button>
                 <button onClick={() => setActiveTab('REGISTRY')} className={`text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b-2 transition-all ${activeTab === 'REGISTRY' ? 'border-amber-500 text-white' : 'border-transparent text-slate-500 hover:text-white'}`}>Fleet Registry</button>
               </>
             )}
          </div>
        </div>
        {isAdminOrDM && activeTab === 'REGISTRY' && (
           <button onClick={() => setShowAddVehicle(true)} className="btn-primary flex items-center gap-2">
              <Plus size={18}/> New Fleet Unit
           </button>
        )}
      </header>

      {/* ADMIN/DM VIEWS */}
      {isAdminOrDM && (
        <div className="space-y-12">
           
           {activeTab === 'REGISTRY' && (
              <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-left-4">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 flex items-center gap-2"><Settings2 size={14}/> Fleet Maintenance & Pilot Log</h3>
                 <div className="glass-card p-0 overflow-hidden">
                    <table className="w-full text-left">
                       <thead className="bg-white-5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">
                          <tr>
                             <th className="p-6">Vehicle Intelligence</th>
                             <th className="p-6">ID & Status</th>
                             <th className="p-6">Assigned Daily Pilot</th>
                             <th className="p-6 text-right">Registry Control</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {fleet.map(truck => (
                            <tr key={truck.id} className="hover:bg-white-5 transition-all group">
                               <td className="p-6">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-500 border border-white/10"><Truck size={24}/></div>
                                     <div>
                                        <p className="font-black text-white uppercase tracking-tighter text-lg">{truck.name}</p>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{truck.type} • {truck.plate || 'NO PLATE'}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="p-6 font-mono">
                                  <p className="text-xs text-white/40 mb-1">{truck.id}</p>
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${truck.status === 'Ready' ? 'bg-success/10 border-success/20 text-success' : 'bg-warning/10 border-warning/20 text-warning'}`}>{truck.status}</span>
                               </td>
                               <td className="p-6">
                                  <select 
                                     value={truck.driverId || ''} 
                                     onChange={(e) => assignPilot(truck.id, e.target.value)}
                                     disabled={truck.status === 'Departed'}
                                     className="bg-white-5 border border-white/10 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-amber-500 transition-all appearance-none text-white w-64"
                                  >
                                     <option value="">AWAITING PILOT...</option>
                                     {drivers.map(d => <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>)}
                                  </select>
                               </td>
                               <td className="p-6 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => removeVehicle(truck.id)} className="text-slate-500 hover:text-danger"><Trash2 size={20}/></button>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

           {activeTab === 'DASHBOARD' && (
              <div className="grid grid-cols-2 gap-10 animate-in fade-in duration-1000">
                 {/* Loading Bay */}
                 <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 flex items-center gap-2"><Box size={14}/> Warehouse Loading Bay</h3>
                    <div className="space-y-4">
                       {/* Show Ready Vehicles */}
                       {fleet.filter(f => f.status === 'Ready').length > 0 ? (
                         fleet.filter(f => f.status === 'Ready').map(truck => (
                            <div key={truck.id} className="glass-card hover:border-amber-500/30 transition-all p-8 space-y-6">
                               <div className="flex justify-between items-center">
                                  <h4 className="text-2xl font-black uppercase tracking-tighter text-white">{truck.name} <span className="block text-[10px] text-slate-500">{truck.id}</span></h4>
                                  <div className="px-3 py-1 bg-success/10 text-success text-[10px] font-black rounded-full border border-success/20">PILOT: {truck.driverName}</div>
                               </div>
                               
                               <div className="space-y-2 pt-4 border-t border-white/5">
                                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Available Payload Orders</p>
                                  <div className="grid grid-cols-1 gap-2">
                                     {allCommands.filter(c => c.status === 'REQ-AUTHORIZED').map(cmd => (
                                        <button 
                                          key={cmd.id}
                                          onClick={() => loadOrderToVehicle(truck.id, cmd.id)}
                                          className="p-3 text-[10px] font-black uppercase text-left bg-white-5 rounded-xl border border-white/5 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all flex justify-between items-center group"
                                        >
                                           <span>{cmd.id} - {cmd.outletName}</span>
                                           <Plus size={14} className="text-amber-500 opacity-0 group-hover:opacity-100" />
                                        </button>
                                     ))}
                                     {allCommands.filter(c => c.status === 'REQ-AUTHORIZED').length === 0 && (
                                        <p className="text-[10px] italic text-slate-700 p-4">Terminal has no authorized payloads ready for loading.</p>
                                     )}
                                  </div>
                               </div>
                            </div>
                         ))
                       ) : (
                         <div className="p-20 text-center glass-card border-dashed opacity-20 italic uppercase tracking-widest text-[10px]">No units are READY. Assign pilots in Registry.</div>
                       )}
                    </div>
                 </div>

                 {/* Dockyard */}
                 <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] px-2 flex items-center gap-2"><Anchor size={14}/> Warehouse Dockyard</h3>
                    <div className="space-y-6">
                       {fleet.filter(f => f.status === 'In Dockyard').map(truck => (
                          <div key={truck.id} className="glass-card border-amber-500/20 bg-amber-500/5 p-10 space-y-8 animate-in zoom-in-95">
                             <div className="flex justify-between items-start">
                                <div>
                                   <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">UNIT STATUS: LOADED & READY</p>
                                   <h4 className="text-4xl font-black tracking-tighter uppercase">{truck.name}</h4>
                                   <p className="text-xs font-black text-slate-500 mt-2">PLATE: {truck.plate} • PILOT: {truck.driverName}</p>
                                </div>
                                <Box size={40} className="text-amber-500 opacity-20" />
                             </div>
                             
                             <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Manifest Signal Log</p>
                                {truck.loadedOrders.map(cid => (
                                   <div key={cid} className="p-3 bg-black/40 rounded-2xl border border-white/5 flex justify-between items-center text-[10px] font-black">
                                      <span className="text-white tracking-widest uppercase">{cid} - {allCommands.find(c => c.id === cid)?.outletName}</span>
                                      <span className="text-amber-500">PACKED</span>
                                   </div>
                                ))}
                             </div>

                             <button 
                               onClick={() => deployVehicle(truck.id)}
                               className="w-full py-6 bg-amber-500 text-black font-black uppercase text-xs tracking-[0.3em] rounded-3xl shadow-2xl shadow-amber-500/30 hover:scale-[1.03] transition-all flex items-center justify-center gap-4"
                             >
                                <Navigation size={24} /> AUTHORIZE DEPLOYMENT
                             </button>
                          </div>
                       ))}
                       {fleet.filter(f => f.status === 'In Dockyard').length === 0 && (
                          <div className="p-20 text-center glass-card opacity-10 italic uppercase tracking-widest text-xs">Dockyard Terminal Clear</div>
                       )}
                    </div>
                 </div>
              </div>
           )}
        </div>
      )}

      {/* DRIVER INTERFACE */}
      {isDriver && (
         <div className="max-w-3xl mx-auto space-y-10 animate-in slide-in-from-bottom-20 duration-1000">
            {myTruck ? (
               myTruck.status === 'Departed' ? (
                  <div className="space-y-10">
                    <div className="glass-card bg-amber-500 p-12 text-black rounded-[50px] shadow-2xl overflow-hidden relative group">
                       <div className="absolute top-0 right-0 w-80 h-80 bg-black/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
                       <div className="flex justify-between items-center relative z-10">
                          <div>
                             <h3 className="text-6xl font-black uppercase tracking-tighter italic leading-none">MISSION<br/>ACTIVE</h3>
                             <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60 mt-8">UNIT {myTruck.id} • {myTruck.name.toUpperCase()}</p>
                          </div>
                          <Navigation size={120} className="opacity-10 -rotate-12 absolute -right-6 -bottom-6" />
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.4em] px-4">TACTICAL MANIFEST</h4>
                       <div className="space-y-5">
                          {allCommands.filter(c => myTruck.loadedOrders.includes(c.id)).map(cmd => {
                             const isTerminal = ['PE-ARRIVED', 'REQ-PROCESSED', 'PE-COMPLAINT'].includes(cmd.status);
                             return (
                             <div key={cmd.id} className={`glass-card p-10 flex justify-between items-center border-white/5 shadow-2xl rounded-[40px] transition-opacity ${isTerminal ? 'opacity-30' : ''}`}>
                                <div className="flex items-center gap-10">
                                   <div className="w-20 h-20 rounded-[30px] bg-white-5 border border-white/10 flex items-center justify-center text-slate-700"><Store size={40}/></div>
                                   <div>
                                      <h5 className="text-3xl font-black uppercase tracking-tighter">{cmd.outletName}</h5>
                                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">COMMAND: {cmd.id}</p>
                                   </div>
                                </div>
                                {isTerminal ? (
                                   <div className="flex flex-col items-end gap-1">
                                      <div className={"flex items-center gap-2 font-black text-xs uppercase tracking-widest " + (cmd.status === 'PE-COMPLAINT' ? 'text-danger' : 'text-success')}>
                                         <ShieldCheck size={20}/> 
                                         {cmd.status === 'REQ-PROCESSED' ? 'VERIFIED BY SITE' : cmd.status === 'PE-COMPLAINT' ? 'INCIDENT LOGGED' : 'LOGGED'}
                                      </div>
                                   </div>
                                ) : (
                                   <button 
                                      onClick={() => confirmDelivery(cmd.id)}
                                      className="py-5 px-10 bg-amber-500 text-black rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                                   >
                                      CONFIRM DROP
                                   </button>
                                )}
                             </div>
                          )})}
                       </div>
                    </div>

                    <div className="pt-10 flex justify-center">
                       <button 
                         onClick={() => reportBaseReturn(myTruck.id)}
                         className="flex items-center gap-6 text-[12px] font-black text-slate-500 hover:text-white uppercase tracking-[0.5em] transition-all"
                       >
                          <div className="p-4 rounded-3xl bg-white-5 border border-white/10 shadow-inner"><Undo2 size={24}/></div>
                          REPORT HUB RETURN
                       </button>
                    </div>
                  </div>
               ) : (
                  <div className="glass-card flex flex-col items-center justify-center p-40 text-center space-y-12 rounded-[60px] border-dashed opacity-40">
                     <div className="w-40 h-40 bg-white-5 rounded-[50px] flex items-center justify-center text-slate-800 animate-pulse border border-white/10 shadow-inner"><Truck size={80} /></div>
                     <div className="space-y-2">
                        <h3 className="text-4xl font-black uppercase tracking-tighter">PILOT STANDBY</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.4em] px-20">Unit {myTruck.id} is docked at Warehouse.<br/>Awaiting Command assignment.</p>
                     </div>
                  </div>
               )
            ) : (
               <div className="glass-card flex flex-col items-center justify-center p-40 text-center space-y-12 rounded-[50px] opacity-20 italic">
                  <div className="w-32 h-32 bg-white-5 rounded-[40px] flex items-center justify-center"><User size={64}/></div>
                  <h3 className="text-3xl font-black uppercase tracking-widest">NO UNIT ASSIGNED</h3>
                  <p className="text-sm">Awaiting daily pilot assignment from Dist Manager.</p>
               </div>
            )}
         </div>
      )}

      {/* MODAL: ADD VEHICLE */}
      {showAddVehicle && (
         <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
            <div className="glass-card w-[500px] border-amber-500 p-12 space-y-8 animate-in zoom-in-95 shadow-2xl">
               <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-amber-500 text-black rounded-[40px] mx-auto flex items-center justify-center shadow-2xl shadow-amber-500/20"><Plus size={48}/></div>
                  <h3 className="text-4xl font-black tracking-tighter uppercase">Register Unit</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fleet Expansion Protocol</p>
               </div>
               <form onSubmit={handleAddVehicle} className="space-y-6">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Vehicle Classification</label>
                     <select 
                       value={newVehicle.type} 
                       onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}
                       className="w-full bg-[#1a1a1a] p-5 rounded-2xl border border-white/10 outline-none font-bold text-amber-500 uppercase text-xs"
                     >
                        <option value="Heavy Truck">Heavy Duty Truck</option>
                        <option value="Medium Van">Medium Delivery Van</option>
                        <option value="Express Scooter">Express Delivery Scooter</option>
                        <option value="Cargo Semi">Global Cargo Semi</option>
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Designated Name</label>
                     <input type="text" placeholder="e.g. Atlas-01" value={newVehicle.name} onChange={e => setNewVehicle({...newVehicle, name: e.target.value})} className="w-full bg-white-5 p-5 rounded-2xl border border-white/10 outline-none font-bold" required />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Hull Identification (Plate)</label>
                     <input type="text" placeholder="e.g. WP-BC-1234" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})} className="w-full bg-white-5 p-5 rounded-2xl border border-white/10 outline-none font-mono" required />
                  </div>
                  <button type="submit" className="w-full py-6 bg-amber-500 text-black font-black uppercase text-xs tracking-[0.2em] rounded-3xl shadow-2xl shadow-amber-500/30">Induct into Fleet</button>
                  <button type="button" onClick={() => setShowAddVehicle(false)} className="w-full text-[10px] font-black text-slate-500 uppercase tracking-widest">Abort Inductions</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default Distribution;
