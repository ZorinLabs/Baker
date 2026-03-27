import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Send, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Package, 
  ArrowRight, 
  Plus, 
  X,
  Store,
  ArrowRightCircle,
  PackageCheck,
  PackagePlus,
  Truck,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { dataStore, STORAGE_KEYS } from '../utils/dataStore';

const SupplyRequests = ({ user, notify, ask }) => {
  const [commands, setCommands] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [newRequestItems, setNewRequestItems] = useState([]);
  const [isNewModal, setIsNewModal] = useState(false);
  const [processingCmd, setProcessingCmd] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [isComplaintModal, setIsComplaintModal] = useState(null);
  const [complaintText, setComplaintText] = useState('');
  const [fleet, setFleet] = useState([]);

  useEffect(() => {
    refreshData();
    const handleSync = () => refreshData();
    window.addEventListener('datastore-update', handleSync);
    return () => window.removeEventListener('datastore-update', handleSync);
  }, [user.outletId]);

  const refreshData = () => {
    // Only fetch commands relevant to Supply Requisition
    const allCommands = dataStore.get(STORAGE_KEYS.COMMAND_HUB);
    const isDistMgr = user.role === 'Admin' || user.role === 'Distribution Manager';
    const myCommands = isDistMgr ? allCommands : allCommands.filter(c => c.senderId === user.id || c.outletId === user.outletId);
    
    setCommands(myCommands.filter(c => c.type === 'SUPPLY_REQUISITION'));
    setCatalog(dataStore.get(STORAGE_KEYS.CATALOG));
    setFleet(dataStore.getFleet());
  };

  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (newRequestItems.length === 0) return;

    const allOutlets = dataStore.getOutlets();
    const myOutlet = allOutlets.find(o => o.id === user.outletId);
    const actualOutletName = myOutlet ? myOutlet.name : 'Central Hub Facility';
    const actualLocation = myOutlet ? myOutlet.location : 'Main District HQ';

    // Send a Command to the Distribution Manager
    const command = {
      type: 'SUPPLY_REQUISITION',
      senderId: user.id,
      senderName: user.name,
      senderOutlet: user.outletId || 'Central Hub',
      targetRole: 'Distribution Manager',
      outletId: user.outletId,
      outletName: actualOutletName,
      locationHeader: actualLocation,
      managerName: user.name,
      payload: {
        items: newRequestItems
      }
    };

    dataStore.pushCommand(command);
    setIsNewModal(false);
    setNewRequestItems([]);
    refreshData();
    notify(`Supply Requisition Command broadcasted to Central Warehouse via Command Hub.`, 'success', 'Request Sent');
  };

  const startProcessing = (cmd) => {
    setProcessingCmd(cmd);
    setEditItems(JSON.parse(JSON.stringify(cmd.payload.items))); // deep copy
  };

  const handleAuthorizeProcessed = () => {
    // Filter out 0 qty (unavailable) and save
    const finalItems = editItems.filter(i => i.qty > 0);
    dataStore.updateCommand(processingCmd.id, { 
      payload: { items: finalItems }, 
      status: 'REQ-AUTHORIZED' 
    });
    setProcessingCmd(null);
    refreshData();
    notify(`Command ${processingCmd.id} authorized with updated quantities. Ready for loading bay.`, 'success', 'Processed Successfully');
  };

  const submitComplaint = (e) => {
    e.preventDefault();
    dataStore.updateCommand(isComplaintModal.id, { 
      status: 'PE-COMPLAINT',
      complaint: complaintText
    });
    setIsComplaintModal(null);
    setComplaintText('');
    refreshData();
    notify(`Complaint logged and escalated to Administration & Logistics Hub.`, 'warning', 'Incident Reported');
  };

  const handleConfirmReceipt = (cmdId) => {
    const command = commands.find(c => c.id === cmdId);
    if (!command) return;

    ask(`Confirm arrival of ${command.id}? This will immediately synchronize site inventory levels.`, () => {
      const allInv = dataStore.get(STORAGE_KEYS.INVENTORY);
      const updatedInv = [...allInv];

      command.payload.items.forEach(item => {
        const idx = updatedInv.findIndex(i => i.outletId === user.outletId && i.name === item.name);
        if (idx > -1) {
          updatedInv[idx].stock += item.qty;
          updatedInv[idx].status = updatedInv[idx].stock > updatedInv[idx].limit ? 'In Stock' : 'Low Stock';
        } else {
          updatedInv.push({ id: Date.now() + Math.random(), outletId: user.outletId, name: item.name, category: item.category, stock: item.qty, limit: 10, unit: 'units', status: 'In Stock' });
        }
      });

      dataStore.save(STORAGE_KEYS.INVENTORY, updatedInv);
      dataStore.updateCommand(cmdId, { status: 'REQ-PROCESSED' });
      refreshData();
      notify(`Central synchronization complete. Inventory levels at your terminal have been replenished.`, 'success', 'Site Replenished');
    }, 'Inventory Receipt Protocol');
  };

  const isDistManager = user.role === 'Admin' || user.role === 'Distribution Manager';

  const getOutletDetails = (cmd) => {
    const allOutlets = dataStore.getOutlets();
    const outlet = allOutlets.find(o => o.id === cmd.outletId);
    let n = cmd.outletName || 'Central Hub Facility';
    if (n.includes(' Hub Territory')) n = n.replace(' Hub Territory', ' Logistics Facility');
    return {
      name: outlet ? outlet.name : n,
      manager: cmd.managerName || cmd.senderName,
      location: outlet ? outlet.location : (cmd.locationHeader || 'Main District HQ')
    };
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-center bg-amber-500/5 p-6 rounded-3xl border border-amber-500/10 shadow-inner">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3 tracking-tighter"><Zap className="text-amber-500 animate-pulse" /> Command Hub Requisition</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-loose">Real-Time Centralized Communication Logic</p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 rounded-xl bg-white-5 border border-white/5 font-mono text-xs text-amber-500 font-black">
              SYNC_STATUS: ACTIVE • HUB_SIGNAL: 100%
           </div>
           {!isDistManager && (
            <button onClick={() => setIsNewModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={18} /> New Request Command
            </button>
           )}
        </div>
      </header>

      {/* DISPATCH PIPELINE (DM Only) */}
      {isDistManager && (
        <div className="grid grid-cols-2 gap-10">
           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2 font-heading"><Clock size={14}/> Inbox: Pending Requisitions</h3>
              {commands.filter(c => c.status === 'PE-PENDING').map(cmd => {
                const details = getOutletDetails(cmd);
                return (
                <div key={cmd.id} className="glass-card border-amber-500/30 p-8 space-y-8 animate-in slide-in-from-left-4">
                   <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-2xl font-black uppercase tracking-tighter text-white">{details.name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Mgr: {details.manager} • Loc: {details.location}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">CMD ID: {cmd.id}</p>
                      </div>
                      <span className="text-[10px] bg-amber-500 text-black px-2 py-1 rounded font-black uppercase self-start">NEW COMMAND</span>
                   </div>
                   <div className="space-y-3">
                      {cmd.payload.items.map(item => (
                        <div key={item.id} className="text-xs flex justify-between p-3 rounded-xl bg-white-5 font-bold uppercase border border-white/5">
                           <span>{item.name}</span>
                           <span className="text-amber-500">{item.qty} Units</span>
                        </div>
                      ))}
                   </div>
                   <button onClick={() => startProcessing(cmd)} className="w-full py-5 bg-amber-500 text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:scale-[1.03] shadow-2xl shadow-amber-500/30 active:scale-95 transition-all">Review & Process Requisition</button>
                </div>
              );
              })}
              {commands.filter(c => c.status === 'PE-PENDING').length === 0 && <div className="p-24 text-center glass-card border-dashed opacity-20 italic font-black uppercase tracking-widest text-[10px]">Command Queue Empty</div>}
           </div>

           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2"><ArrowRightCircle size={14}/> Supply Chain Monitor</h3>
              {commands.filter(c => ['REQ-AUTHORIZED', 'REQ-LOADED', 'PE-SENT', 'PE-ARRIVED', 'PE-COMPLAINT', 'REQ-PROCESSED'].includes(c.status)).map(cmd => {
                const details = getOutletDetails(cmd);
                
                if (cmd.status === 'REQ-PROCESSED') {
                  return (
                    <div key={cmd.id} className="glass-card p-4 border-white/5 flex justify-between items-center opacity-60 hover:opacity-100 transition-all">
                       <div>
                          <h4 className="text-sm font-black uppercase tracking-tighter text-white/50">{details.name}</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">CMD ID: {cmd.id} • {cmd.payload.items.reduce((a, b) => a + b.qty, 0)} Units Verified</p>
                       </div>
                       <span className="text-[8px] px-2 py-1 rounded font-black uppercase bg-success text-black self-center">
                          PROCESSED
                       </span>
                    </div>
                  );
                }

                return (
                <div key={cmd.id} className={`glass-card p-6 border-white/5 space-y-4 flex flex-col relative overflow-hidden group ${cmd.status === 'PE-COMPLAINT' ? 'border-danger/50 shadow-lg shadow-danger/10' : ''}`}>
                   {cmd.status === 'PE-COMPLAINT' && <div className="absolute right-0 top-0 w-1/2 h-full bg-danger/5 -skew-x-12 translate-x-1/2" />}
                   
                   <div className="flex justify-between items-start relative z-10 w-full">
                      <div>
                         <h4 className={`text-xl font-black uppercase tracking-tighter ${cmd.status === 'PE-COMPLAINT' ? 'text-danger' : 'text-white'}`}>{details.name}</h4>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Mgr: {details.manager} • Loc: {details.location}</p>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">CMD ID: {cmd.id}</p>
                      </div>
                      <span className={`text-[9px] px-2 py-1 rounded font-black uppercase self-start ${cmd.status === 'PE-COMPLAINT' ? 'bg-danger text-white' : 'bg-white-5 text-amber-500'}`}>
                         {cmd.status.replace(/^(REQ|PE)-/, '')}
                      </span>
                   </div>

                   {cmd.status === 'PE-COMPLAINT' && (
                     <div className="relative z-10 mt-2 p-4 bg-danger/10 border border-danger/30 rounded-xl space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-danger flex items-center gap-2">
                         <ShieldAlert size={14} /> ACTIVE INCIDENT REPORT
                       </p>
                       <p className="text-sm font-medium text-white bg-black/40 p-3 rounded-lg border border-danger/20 break-words">
                         "{cmd.complaint}"
                       </p>
                       <button 
                         onClick={() => {
                           const allInv = dataStore.get(STORAGE_KEYS.INVENTORY);
                           const updatedInv = [...allInv];
                           cmd.payload.items.forEach(item => {
                             const idx = updatedInv.findIndex(i => i.outletId === cmd.outletId && i.name === item.name);
                             if (idx > -1) {
                               updatedInv[idx].stock += item.qty;
                               updatedInv[idx].status = updatedInv[idx].stock > updatedInv[idx].limit ? 'In Stock' : 'Low Stock';
                             } else {
                               updatedInv.push({ id: Date.now() + Math.random(), outletId: cmd.outletId, name: item.name, category: item.category, stock: item.qty, limit: 10, unit: 'units', status: 'In Stock' });
                             }
                           });
                           dataStore.save(STORAGE_KEYS.INVENTORY, updatedInv);

                           dataStore.updateCommand(cmd.id, { status: 'REQ-PROCESSED' });
                           refreshData();
                           notify(`Complaint for ${cmd.id} strictly marked as resolved. Asset inventory has been forcefully synchronized.`, 'success', 'Incident Closed');
                         }}
                         className="w-full mt-3 py-2 bg-danger hover:bg-white text-white hover:text-danger rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                       >
                         Acknowledge & Mark Resolved
                       </button>
                     </div>
                   )}

                   <div className="relative z-10 space-y-2 border-t border-white/5 pt-3 mt-4">
                      <p className="text-[8px] uppercase tracking-widest text-slate-600 font-bold mb-2">Manifest Payload Data</p>
                      {cmd.payload.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-[10px] font-bold uppercase overflow-hidden">
                           <span className="text-slate-400 truncate pr-2">{item.name}</span>
                           <span className={cmd.status === 'PE-COMPLAINT' ? 'text-danger' : 'text-amber-500'}>{item.qty} Units</span>
                        </div>
                      ))}
                   </div>
                </div>
              )})}
           </div>
        </div>
      )}

      {/* OUTLET VIEW: HUB RESPONSE MONITOR */}
      {!isDistManager && (
         <div className="grid grid-cols-2 gap-10">
            <div className="space-y-6">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2"><Send size={14}/> Sent Signals</h3>
               <div className="space-y-4">
                  {commands.filter(c => ['PE-PENDING', 'REQ-AUTHORIZED', 'REQ-LOADED'].includes(c.status)).map(cmd => {
                    const details = getOutletDetails(cmd);
                    return (
                    <div key={cmd.id} className="glass-card opacity-80 flex flex-col group p-6 overflow-hidden relative">
                       <div className="absolute right-0 top-0 w-1/2 h-full bg-amber-500/5 -skew-x-12 translate-x-1/2" />
                       <div className="flex justify-between items-start relative z-10 w-full mb-4">
                          <div>
                            <h4 className="font-black text-xl uppercase tracking-tighter">{details.name}</h4>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1 mt-1"><Clock size={10} className="text-amber-500"/> STATUS: {cmd.status.replace(/^(REQ|PE)-/, '')}</p>
                          </div>
                          <Package size={24} className="text-slate-700 group-hover:text-amber-500 transition-all group-hover:scale-110" />
                       </div>
                       <div className="relative z-10 space-y-2 border-t border-white/5 pt-3">
                          <p className="text-[8px] uppercase tracking-widest text-slate-600 font-bold mb-2">Manifest Payload</p>
                          {cmd.payload.items.map(item => (
                            <div key={item.id} className="flex justify-between items-center text-[10px] font-bold uppercase overflow-hidden">
                               <span className="text-slate-400 truncate pr-2">{item.name}</span>
                               <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">{item.qty} Units</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  )})}
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-[10px] font-black text-success uppercase tracking-[0.2em] px-1 flex items-center gap-2"><ArrowRightCircle size={14}/> Incoming Cargo Shipments</h3>
               <div className="space-y-4">
                  {commands.filter(c => ['PE-SENT', 'PE-ARRIVED'].includes(c.status)).map(cmd => (
                    <div key={cmd.id} className={`glass-card p-8 border-transparent transition-all overflow-hidden relative ${cmd.status === 'PE-ARRIVED' ? 'border-success/40 bg-success/5' : 'animate-pulse'}`}>
                       <div className="flex justify-between items-center mb-8">
                          <div>
                            <h4 className="text-3xl font-black tracking-tighter">{cmd.id}</h4>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">{cmd.status === 'PE-ARRIVED' ? 'HUB AT SITE DOCK' : 'SIGNAL: IN-TRANSIT'}</p>
                          </div>
                          <div className={`w-16 h-16 rounded-[28px] flex items-center justify-center transition-all ${cmd.status === 'PE-ARRIVED' ? 'bg-success text-black' : 'bg-white-5 text-amber-500 shadow-2xl shadow-amber-500/20 border border-amber-500/20'}`}>
                            {cmd.status === 'PE-ARRIVED' ? <PackagePlus size={36} /> : <Truck size={36} />}
                          </div>
                       </div>
                       {cmd.status === 'PE-ARRIVED' && (
                         <div className="flex flex-col gap-3 mt-4">
                           <div className="p-5 bg-black/40 rounded-2xl border border-success/20 mb-2">
                             <p className="text-[10px] uppercase tracking-[0.2em] text-success font-black mb-4 border-b border-success/20 pb-3 flex items-center justify-between">
                               <span>Arrived Cargo Manifest</span>
                               <span>{cmd.payload.items.reduce((sum, item) => sum + item.qty, 0)} Total Units</span>
                             </p>
                             <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                               {cmd.payload.items.map(item => (
                                 <div key={item.id} className="flex justify-between items-center text-[11px] font-bold uppercase">
                                    <span className="text-slate-300">{item.name}</span>
                                    <span className="text-success bg-success/10 px-2 py-1 rounded shadow-inner">{item.qty} Units</span>
                                 </div>
                               ))}
                             </div>
                           </div>
                           <button 
                             onClick={() => handleConfirmReceipt(cmd.id)}
                             className="w-full py-4 bg-success text-black rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-success/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                           >
                             <PackageCheck size={18} /> Finalize Payload & Unload
                           </button>
                           <button 
                             onClick={() => setIsComplaintModal(cmd)}
                             className="w-full py-3 bg-danger/10 text-danger border border-danger/20 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-danger hover:text-white transition-all"
                           >
                             Report Issue / Discrepancy
                           </button>
                         </div>
                       )}
                    </div>
                  ))}
                  {commands.filter(c => ['PE-SENT', 'PE-ARRIVED'].includes(c.status)).length === 0 && (
                     <div className="p-24 text-center glass-card border-dashed opacity-10">NO DETECTED CARGO SIGNALS</div>
                  )}
               </div>
            </div>
         </div>
      )}

      {/* MODAL: NEW REQUEST SIGNAL */}
      {isNewModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
           <div className="glass-card w-[600px] border-amber-500 p-12 space-y-10 animate-in zoom-in-95 shadow-2xl shadow-black/80">
              <div className="flex justify-between items-center">
                 <h3 className="text-4xl font-black tracking-tighter flex items-center gap-4"><Send size={32} className="text-amber-500"/> HUB REQUISITION</h3>
                 <button onClick={() => setIsNewModal(false)} className="text-slate-600 hover:text-white p-2 rounded-full border border-white/5 bg-white-5"><X/></button>
              </div>
              <div className="grid grid-cols-2 gap-6 h-[350px] overflow-y-auto pr-3 custom-scrollbar">
                 {catalog.map(product => {
                    const existing = newRequestItems.find(i => i.id === product.id);
                    return (
                      <div key={product.id} className={`p-6 rounded-3xl border transition-all cursor-pointer group ${existing ? 'bg-amber-500/10 border-amber-500 shadow-xl' : 'bg-white-5 border-white/5 opacity-60 hover:opacity-100 hover:border-white/20'}`}
                           onClick={() => {
                             if(existing) setNewRequestItems(newRequestItems.filter(i => i.id !== product.id));
                             else setNewRequestItems([...newRequestItems, { ...product, qty: 12 }]);
                           }}>
                         <div className="font-black text-md tracking-tight group-hover:text-amber-500 transition-colors uppercase">{product.name}</div>
                         <div className="text-[10px] font-black uppercase text-slate-500 mt-1 tracking-widest">{product.category}</div>
                         {existing && (
                            <div className="mt-6 flex items-center gap-3">
                               <input type="number" value={existing.qty} onClick={e => e.stopPropagation()} onChange={e => {
                                 const v = Math.max(1, parseInt(e.target.value) || 0);
                                 setNewRequestItems(newRequestItems.map(i => i.id === product.id ? { ...i, qty: v } : i));
                               }} className="w-full bg-black/60 border-none rounded-xl p-3 font-mono text-center text-amber-500 font-bold shadow-inner" />
                               <span className="text-[10px] font-black text-amber-500">QTY</span>
                            </div>
                         )}
                      </div>
                    );
                 })}
              </div>
              <button onClick={handleCreateRequest} className="w-full py-6 bg-amber-500 text-black font-black uppercase text-sm tracking-[0.25em] rounded-3xl shadow-2xl shadow-amber-500/40 hover:scale-[1.03] active:scale-95 transition-all">Broadcast Terminal Requisition</button>
           </div>
        </div>
      )}

      {/* MODAL: PROCESS REQUEST (DIST MGR) */}
      {processingCmd && (() => {
        const details = getOutletDetails(processingCmd);
        return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
           <div className="glass-card w-[600px] border-amber-500 p-10 space-y-6 shadow-2xl">
              <div>
                 <h3 className="text-2xl font-black tracking-tighter uppercase">{details.name}</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Mgr: {details.manager} • Loc: {details.location}</p>
                 <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-2">Order Processing: Verify Stocks & Quantities</p>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 {editItems.map((item, idx) => (
                    <div key={item.id} className="flex justify-between items-center p-4 rounded-xl bg-white-5 border border-white/5">
                       <div>
                          <p className="font-bold text-sm uppercase">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{item.category}</p>
                       </div>
                       <div className="flex items-center gap-4">
                          {item.qty > 0 ? (
                             <>
                                <input type="number" value={item.qty} onChange={e => {
                                  const v = Math.max(0, parseInt(e.target.value) || 0);
                                  const newItems = [...editItems];
                                  newItems[idx].qty = v;
                                  setEditItems(newItems);
                                }} className="w-20 bg-black/60 border border-white/10 rounded-lg p-2 font-mono text-center text-amber-500 font-bold outline-none" />
                                <button onClick={() => {
                                  const newItems = [...editItems];
                                  newItems[idx].qty = 0;
                                  setEditItems(newItems);
                                }} className="text-[10px] font-black text-slate-500 hover:text-danger uppercase tracking-widest tracking-tighter transition-colors">Mark out of stock</button>
                             </>
                          ) : (
                             <span className="text-[10px] font-black text-danger uppercase tracking-widest px-3 py-1 bg-danger/10 rounded-lg">Unavailable</span>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
              <div className="flex gap-4 pt-4 border-t border-white/5">
                 <button onClick={() => setProcessingCmd(null)} className="flex-1 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-white-5 rounded-2xl transition-all">Cancel</button>
                 <button onClick={handleAuthorizeProcessed} className="w-2/3 py-4 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all">Authorize Processed Order</button>
              </div>
           </div>
        </div>
        );
      })()}

      {/* MODAL: OUTLET COMPLAINT */}
      {isComplaintModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
           <div className="glass-card w-[500px] border-danger/50 bg-[#120a0a] p-10 space-y-6">
              <div>
                 <h3 className="text-2xl font-black tracking-tighter uppercase text-danger">Report Incident</h3>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Payload Discrepancy regarding {isComplaintModal.id}</p>
              </div>
              <form onSubmit={submitComplaint} className="space-y-6">
                 <textarea 
                   autoFocus
                   value={complaintText} 
                   onChange={e => setComplaintText(e.target.value)}
                   placeholder="Describe the missing items, damages, or discrepancies..."
                   className="w-full h-32 bg-black/60 p-4 rounded-xl border border-white/10 outline-none font-medium text-white resize-none text-sm focus:border-danger/50"
                   required
                 />
                 <div className="flex gap-4">
                    <button type="button" onClick={() => setIsComplaintModal(null)} className="flex-1 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-white-5 rounded-2xl transition-all">Cancel</button>
                    <button type="submit" className="w-2/3 py-4 bg-danger text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-danger/20 active:scale-95 transition-all">Submit Protocol</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SupplyRequests;
