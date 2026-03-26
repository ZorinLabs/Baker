import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Store, 
  ShieldAlert, 
  Trash2, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  X, 
  Undo2,
  Lock,
  History
} from 'lucide-react';
import { dataStore, STORAGE_KEYS } from '../utils/dataStore';

const Outlets = ({ user, notify, ask }) => {
  const [outlets, setOutlets] = useState([]);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [isOpeningModal, setIsOpeningModal] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(null);
  const [undoTimers, setUndoTimers] = useState({});
  const [newOutlet, setNewOutlet] = useState({ name: '', address: '', managerId: '' });
  const [auth, setAuth] = useState({ username: '', password: '' });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const allOutlets = dataStore.get(STORAGE_KEYS.OUTLETS);
    setOutlets(allOutlets);
    const users = dataStore.get(STORAGE_KEYS.USERS);
    const usedManagerIds = allOutlets.filter(o => o.status === 'Open').map(o => o.managerId);
    setAvailableManagers(users.filter(u => u.role === 'Manager' && !usedManagerIds.includes(u.id)));
  };

  const handleOpenOutlet = (e) => {
    e.preventDefault();
    if (auth.username !== user.username || auth.password !== '123') {
      notify('Security Verification Failed: Incorrect Administrative Credentials.', 'error', 'Authorization Revoked');
      return;
    }

    const nextId = `OUT-${(outlets.length + 1).toString().padStart(3, '0')}`;
    const opOutlet = {
      ...newOutlet,
      id: nextId,
      status: 'Open',
      openedAt: new Date().toISOString(),
      inventory: [],
      sales: [],
      staff: [],
      metadata: { lastStockCheck: null, cashReport: 0 }
    };

    const updated = [...outlets, opOutlet];
    setOutlets(updated);
    dataStore.save(STORAGE_KEYS.OUTLETS, updated);
    setIsOpeningModal(false);
    setAuth({ username: '', password: '' });
    setNewOutlet({ name: '', address: '', managerId: '' });
    notify(`New territory initialized: ${opOutlet.name}. Deployment successful.`, 'success', 'Terminal Active');
  };

  const initiateClose = (id) => setIsClosingModal(id);

  const confirmClose = (id) => {
    if (auth.username !== user.username || auth.password !== '123') {
      notify('Security Protocol Fault: Administrative Password Required.', 'error', 'Access Denied');
      return;
    }

    const updated = outlets.map(o => {
      if (o.id === id) return { ...o, status: 'Closing-Soon', closeRequestedAt: new Date().toISOString() };
      return o;
    });
    setOutlets(updated);
    dataStore.save(STORAGE_KEYS.OUTLETS, updated);
    setIsClosingModal(null);
    setAuth({ username: '', password: '' });
    
    notify(`Closure protocol initiated. 5-minute undo window is active.`, 'warning', 'Decommissioning Start');
    const timer = setTimeout(() => finalizeClose(id), 300000);
    setUndoTimers({ ...undoTimers, [id]: timer });
  };

  const finalizeClose = (id) => {
    const allOutlets = dataStore.get(STORAGE_KEYS.OUTLETS);
    const updated = allOutlets.map(o => o.id === id ? { ...o, status: 'Closed' } : o);
    setOutlets(updated);
    dataStore.save(STORAGE_KEYS.OUTLETS, updated);
  };

  const undoClose = (id) => {
    clearTimeout(undoTimers[id]);
    const updated = outlets.map(o => o.id === id ? { ...o, status: 'Open', closeRequestedAt: null } : o);
    setOutlets(updated);
    dataStore.save(STORAGE_KEYS.OUTLETS, updated);
    const newTimers = { ...undoTimers };
    delete newTimers[id];
    setUndoTimers(newTimers);
    notify('Territory reactivation successful. Mission restored.', 'success', 'Protocol Aborted');
  };

  if (user.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
        <Lock size={64} className="text-amber-500" />
        <h2 className="text-2xl font-black uppercase tracking-widest">Administrative Override Required</h2>
        <p className="text-xs font-bold text-slate-500">Logistics footprint control is restricted to Master Hub personnel.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3 tracking-tighter"><Store className="text-amber-500" /> Executive Territory Hub</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Managing Global Physical Infrastructure</p>
        </div>
        <button onClick={() => setIsOpeningModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Initialize Territory
        </button>
      </header>

      <div className="grid grid-cols-2 gap-10">
        <div className="space-y-6">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1"><CheckCircle2 size={14} className="text-success" /> Active Operational Zones</h3>
           {outlets.filter(o => o.status === 'Open' || o.status === 'Closing-Soon').map(o => (
             <div key={o.id} className={`glass-card relative overflow-hidden transition-all duration-500 ${o.status === 'Closing-Soon' ? 'border-danger/30 grayscale-[0.8]' : 'hover:border-amber-500/30'}`}>
               <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-2xl font-black text-white tracking-tight">{o.name}</h4>
                    <p className="text-[10px] font-black text-slate-500 flex items-center gap-1 mt-1 uppercase tracking-widest"><MapPin size={10} /> {o.address}</p>
                    <div className="flex items-center gap-3 mt-6">
                       <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-lg"><User size={20} /></div>
                       <div className="text-xs">
                         <div className="text-slate-500 font-black uppercase tracking-widest text-[8px]">In-Charge Commandant</div>
                         <div className="font-black text-sm">{availableManagers.find(m => m.id === o.managerId)?.name || 'Command Assigned'}</div>
                       </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-black/40 px-2 py-1 rounded font-mono text-amber-500/60 border border-white/5">{o.id}</span>
                    {o.status === 'Open' ? (
                      <button onClick={() => initiateClose(o.id)} className="block mt-6 text-[10px] text-danger font-black uppercase tracking-widest hover:underline opacity-60 hover:opacity-100 transition-all">+ Decommission Zone</button>
                    ) : (
                      <div className="mt-6 flex flex-col items-end gap-2 text-right">
                         <span className="text-[10px] text-danger font-black flex items-center gap-1 animate-pulse"><Clock size={10}/> TERMINATING (5:00)</span>
                         <button onClick={() => undoClose(o.id)} className="flex items-center gap-1 text-[10px] font-black text-success hover:underline uppercase tracking-widest"><Undo2 size={10}/> Abort Shutdown</button>
                      </div>
                    )}
                  </div>
               </div>
            </div>
           ))}
           {outlets.filter(o => o.status === 'Open').length === 0 && <div className="p-12 text-center glass-card opacity-30 italic font-bold">Zero active operational zones detected. Initialize territory to begin.</div>}
        </div>

        <div className="space-y-6">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1"><History size={14} /> Historical Archives</h3>
           <div className="space-y-4">
            {outlets.filter(o => o.status === 'Closed').map(o => (
              <div key={o.id} className="glass-card opacity-60 bg-black/40 border-white/5 grayscale group hover:opacity-100 transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-white font-black uppercase tracking-tighter text-lg">{o.name}</h4>
                      <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">{o.address}</p>
                    </div>
                    <button className="py-2 px-4 rounded-xl bg-white-5 text-[10px] font-black text-amber-500 uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all">Audit Logs</button>
                  </div>
              </div>
            ))}
           </div>
        </div>
      </div>

      {isOpeningModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
          <div className="glass-card w-[550px] border-amber-500 p-10 space-y-8 animate-in zoom-in-90 shadow-2xl">
             <div className="flex justify-between items-center text-center">
                <div className="text-left">
                  <h3 className="text-3xl font-black tracking-tighter flex items-center gap-3"><Store size={32} className="text-amber-500" /> Operational Deployment</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Provisioning New Territorial Entity</p>
                </div>
                <button onClick={() => setIsOpeningModal(false)} className="text-slate-500 hover:text-white p-2 bg-white-5 rounded-full"><X /></button>
             </div>
             <form onSubmit={handleOpenOutlet} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity Designation</label>
                    <input type="text" value={newOutlet.name} onChange={e => setNewOutlet({...newOutlet, name: e.target.value})} className="w-full bg-white-5 border border-white/10 rounded-xl p-4 font-bold" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site Commandant</label>
                    <select value={newOutlet.managerId} onChange={e => setNewOutlet({...newOutlet, managerId: parseInt(e.target.value)})} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 font-bold" required>
                      <option value="">Select Commander</option>
                      {availableManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployment Coordinates (Address)</label>
                  <input type="text" value={newOutlet.address} onChange={e => setNewOutlet({...newOutlet, address: e.target.value})} className="w-full bg-white-5 border border-white/10 rounded-xl p-4" required />
                </div>
                
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-danger"><ShieldAlert size={14}/> Executive Authentication Required</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Admin Alias" value={auth.username} onChange={e => setAuth({...auth, username: e.target.value})} className="bg-white-5 border border-white/10 rounded-xl p-4 font-mono text-sm" required />
                    <input type="password" placeholder="Pass-Token" value={auth.password} onChange={e => setAuth({...auth, password: e.target.value})} className="bg-white-5 border border-white/10 rounded-xl p-4 font-mono text-sm" required />
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-amber-500 text-black font-black uppercase text-sm tracking-[0.2em] rounded-2xl shadow-2xl shadow-amber-500/30 mt-4 hover:scale-[1.03] transition-all">Initialize Deployment</button>
             </form>
          </div>
        </div>
      )}

      {isClosingModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
          <div className="glass-card w-[450px] border-danger/40 p-10 space-y-8 animate-in zoom-in-90">
             <div className="text-center space-y-4 text-center">
               <div className="w-20 h-20 bg-danger/20 text-danger rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                <ShieldAlert size={48} />
               </div>
               <div>
                <h3 className="text-2xl font-black tracking-tight mt-4">Decommission Zone?</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 leading-loose px-4">This action initiates total operational termination for the terminal. Security clearance required.</p>
               </div>
             </div>
             <div className="space-y-4 pt-4 border-t border-white/5">
                <input type="text" placeholder="Admin Alias" value={auth.username} onChange={e => setAuth({...auth, username: e.target.value})} className="w-full bg-white-5 border border-white/10 rounded-xl p-4 font-mono text-sm" required />
                <input type="password" placeholder="Pass-Token" value={auth.password} onChange={e => setAuth({...auth, password: e.target.value})} className="w-full bg-white-5 border border-white/10 rounded-xl p-4 font-mono text-sm" required />
                <button onClick={() => confirmClose(isClosingModal)} className="w-full py-5 bg-danger text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-danger/20 hover:scale-[1.03] transition-all">Authorize Decommissioning</button>
                <button onClick={() => setIsClosingModal(null)} className="w-full py-2 text-slate-600 font-black uppercase text-[10px] tracking-widest">Abort Shut Down</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Outlets;
