import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  UserPlus, 
  Shield, 
  Key, 
  Search, 
  Trash2, 
  X, 
  Store, 
  CheckCircle2, 
  Clock, 
  UserCheck,
  ShieldAlert,
  Send,
  Edit2,
  Lock,
  Phone,
  Camera
} from 'lucide-react';
import { dataStore, STORAGE_KEYS } from '../utils/dataStore';

const UserManagement = ({ user: currentUser, notify, ask }) => {
  const [users, setUsers] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [recruitmentRequests, setRecruitmentRequests] = useState([]);
  
  // Modals
  const [isRecruitModal, setIsRecruitModal] = useState(false);
  const [isProvisionModal, setIsProvisionModal] = useState(null);
  const [isEditModal, setIsEditModal] = useState(null);
  const [isAddModal, setIsAddModal] = useState(false);
  
  // Forms
  const [newRecruit, setNewRecruit] = useState({ name: '', role: 'Cashier' });
  const [provisionData, setProvisionData] = useState({ username: '', password: '' });
  const [editData, setEditData] = useState({});
  const [addData, setAddData] = useState({ name: '', username: '', password: '', role: 'Cashier', outletId: '' });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const allUsers = dataStore.getUsers();
    const allOutlets = dataStore.get(STORAGE_KEYS.OUTLETS);
    const requests = dataStore.get(STORAGE_KEYS.RECRUITMENT);
    
    setOutlets(allOutlets);
    setRecruitmentRequests(requests);
    setUsers(currentUser.role === 'Admin' ? allUsers : allUsers.filter(u => u.outletId === currentUser.outletId));
  };

  const handleDirectAdd = (e) => {
    e.preventDefault();
    const newUser = {
      ...addData,
      id: Date.now(),
      status: 'Active',
      phone: '',
      avatar: null
    };
    const all = dataStore.getUsers();
    dataStore.saveUsers([...all, newUser]);
    setIsAddModal(false);
    setAddData({ name: '', username: '', password: '', role: 'Cashier', outletId: '' });
    refreshData();
    notify(`New identity provisioned for ${newUser.name}. Access active for specified location.`, 'success', 'Identity Generated');
  };

  const handleRecruitmentRequest = (e) => {
    e.preventDefault();
    const req = {
       ...newRecruit,
       id: Date.now(),
       outletId: currentUser.outletId,
       outletName: currentUser.name.split(' ')[0] + ' Hub'
    };
    const all = dataStore.get(STORAGE_KEYS.RECRUITMENT);
    dataStore.save(STORAGE_KEYS.RECRUITMENT, [req, ...all]);
    setIsRecruitModal(false);
    setNewRecruit({ name: '', role: 'Cashier' });
    refreshData();
    notify("Recruitment authorization request has been transmitted to Central Admin.", 'success', 'Request Sent');
  };

  const approveRecruit = (e) => {
    // ... logic same as before but ensured it works in this context
    e.preventDefault();
    const req = isProvisionModal;
    const newUser = {
      id: Date.now(),
      name: req.name,
      username: provisionData.username,
      password: provisionData.password,
      role: req.role,
      outletId: req.outletId,
      status: 'Active',
      phone: '',
      avatar: null
    };
    dataStore.saveUsers([...dataStore.getUsers(), newUser]);
    dataStore.save(STORAGE_KEYS.RECRUITMENT, dataStore.get(STORAGE_KEYS.RECRUITMENT).filter(r => r.id !== req.id));
    setIsProvisionModal(null);
    refreshData();
    notify(`${newUser.name} has been formally authorized and added to the registry.`, 'success', 'Recruit Authorized');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const all = dataStore.getUsers();
    const updated = all.map(u => u.id === isEditModal.id ? { ...u, ...editData } : u);
    dataStore.saveUsers(updated);
    setIsEditModal(null);
    refreshData();
    notify(`Global identity updates for ${editData.name} have been synchronized.`, 'success', 'Registry Synchronized');
  };

  const deleteUser = (id, name) => {
    if (id === 1) {
      notify('Security Alert: The Master Administrator account cannot be decommissioned.', 'error', 'Security Violation');
      return;
    }
    ask(`Permanently decommission system access for ${name}?`, () => {
      const all = dataStore.getUsers();
      dataStore.saveUsers(all.filter(u => u.id !== id));
      refreshData();
      notify(`Identity for ${name} has been purged.`, 'success', 'Personnel Purged');
    }, 'Decommission Authorization');
  };

  const isAdmin = currentUser.role === 'Admin';

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3 tracking-tighter"><UserCheck className="text-amber-500" /> Personnel Command</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{isAdmin ? 'Master Registry Administration' : `Site Personnel Management`}</p>
        </div>
        <div className="flex gap-4">
          {isAdmin && (
            <button onClick={() => setIsAddModal(true)} className="btn-primary flex items-center gap-2">
              <UserPlus size={18} /> Provision Identity
            </button>
          )}
          {!isAdmin && (
            <button onClick={() => setIsRecruitModal(true)} className="py-2 px-4 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
               <Send size={16}/> Send Recruit Request
            </button>
          )}
        </div>
      </header>

      {/* REQUEST QUEUE */}
      {isAdmin && recruitmentRequests.length > 0 && (
        <section className="space-y-4">
           <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1"><Clock size={14}/> Authorization Queue</h3>
           <div className="grid grid-cols-3 gap-6">
              {recruitmentRequests.map(req => (
                <div key={req.id} className="glass-card border-amber-500/20 bg-amber-500/5 items-center justify-between flex gap-4">
                    <div className="flex-1">
                       <h4 className="font-bold text-lg uppercase tracking-tighter">{req.name}</h4>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">{req.role} • {req.outletName}</p>
                    </div>
                    <button onClick={() => setIsProvisionModal(req)} className="p-3 bg-amber-500 text-black rounded-2xl shadow-lg shadow-amber-500/20 hover:scale-110 transition-all"><UserPlus size={20}/></button>
                </div>
              ))}
           </div>
        </section>
      )}

      {/* STAFF LIST */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Active Personnel Registry</h3>
        <div className="glass-card p-0 overflow-hidden border border-white/5 shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest bg-white-5">
                <th className="p-4">Identity</th>
                <th className="p-4">Alias</th>
                <th className="p-4">Security Level</th>
                {isAdmin && <th className="p-4">Operating Zone</th>}
                <th className="p-4 text-right">Control</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-amber-500 border border-white/10 overflow-hidden shadow-inner">
                          {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name[0]}
                       </div>
                       <div>
                         <p className="font-bold text-white text-sm tracking-tight">{u.name}</p>
                         <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{u.phone || 'NO SECURE LINK'}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-400">@{u.username}</td>
                  <td className="p-4"><span className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-2 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20"><Shield size={12}/> {u.role}</span></td>
                  {isAdmin && <td className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{outlets.find(o => o.id === u.outletId)?.name || 'Central Hub'}</td>}
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setIsEditModal(u); setEditData(u); }} className="p-2 bg-white-5 rounded-lg text-slate-400 hover:text-white transition-all"><Edit2 size={16}/></button>
                      {u.id !== 1 && (
                        <button onClick={() => deleteUser(u.id, u.name)} className="p-2 bg-danger/10 rounded-lg text-danger hover:bg-danger hover:text-white transition-all"><Trash2 size={16}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </div>

      {/* MODAL: DIRECT ADD */}
      {isAddModal && createPortal(
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[99999] flex items-center justify-center p-4">
           <div className="glass-card w-[500px] border-amber-500 p-10 space-y-8 animate-in zoom-in-95 shadow-2xl">
              <div className="text-center">
                 <div className="w-20 h-20 bg-amber-500 text-black rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-amber-500/20 mb-6">
                    <UserPlus size={40} />
                 </div>
                 <h3 className="text-3xl font-black tracking-tight">Provision Identity</h3>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Generating Master Direct Access</p>
              </div>
              <form onSubmit={handleDirectAdd} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Full Legal Name</label>
                    <input type="text" placeholder="e.g. Kamal Addawaarachchi" value={addData.name} onChange={e => setAddData({...addData, name: e.target.value})} className="w-full bg-white-5 p-4 rounded-xl border border-white/10 outline-none font-bold" required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Login Alias</label>
                      <input type="text" placeholder="kamal_nyc" value={addData.username} onChange={e => setAddData({...addData, username: e.target.value.toLowerCase()})} className="w-full bg-white-5 p-4 rounded-xl border border-white/10 font-mono text-sm" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Pass-Token</label>
                      <input type="password" placeholder="•••••" value={addData.password} onChange={e => setAddData({...addData, password: e.target.value})} className="w-full bg-white-5 p-4 rounded-xl border border-white/10 font-mono text-sm" required />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                       <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Assigned Role</label>
                       <select value={addData.role} onChange={e => setAddData({...addData, role: e.target.value})} className="w-full bg-[#1a1a1a] p-4 rounded-xl border border-white/10 outline-none text-xs font-bold font-mono">
                          <option value="Admin">Master Admin</option>
                          <option value="Distribution Manager">Dist. Manager</option>
                          <option value="Manager">Site Manager</option>
                          <option value="Cashier">Operational Cashier</option>
                          <option value="Production Chef">Master Baker</option>
                          <option value="Driver">Fleet Pilot</option>
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Operating Zone</label>
                       <select value={addData.outletId} onChange={e => setAddData({...addData, outletId: e.target.value})} className="w-full bg-[#1a1a1a] p-4 rounded-xl border border-white/10 outline-none text-xs font-bold font-mono">
                          <option value="">Central Hub</option>
                          {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                       </select>
                    </div>
                 </div>
                 <button type="submit" className="w-full py-5 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl shadow-amber-500/30 mt-6 hover:scale-[1.03] transition-all">Provision Global Access</button>
                 <button type="button" onClick={() => setIsAddModal(false)} className="w-full py-2 text-slate-600 font-black uppercase text-[10px] tracking-widest mt-2">Abort Generation</button>
              </form>
           </div>
        </div>,
        document.body
      )}

      {/* MODAL: EDIT USER */}
      {isEditModal && createPortal(
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[99999] flex items-center justify-center p-4">
           {/* ... same as existing edit modal but keeping labels consistent */}
           <div className="glass-card w-[550px] border-amber-500/30 p-10 space-y-8 animate-in zoom-in-95">
              <div className="flex justify-between items-center">
                 <h3 className="text-3xl font-black tracking-tight flex items-center gap-3"><Edit2 className="text-amber-500"/> Identify Audit</h3>
                 <button onClick={() => setIsEditModal(null)} className="text-slate-500 p-2 bg-white-5 rounded-full"><X/></button>
              </div>
              <form onSubmit={handleSaveEdit} className="space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Legal Name</label>
                       <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full bg-white-5 p-4 rounded-xl border border-white/10" required />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Login ID</label>
                       <input type="text" value={editData.username} onChange={e => setEditData({...editData, username: e.target.value})} className="w-full bg-white-5 p-4 rounded-xl border border-white/10" required />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Mobile Link</label>
                       <input type="text" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full bg-white-5 p-4 rounded-xl border border-white/10" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Zone Assignment</label>
                       <select value={editData.outletId} onChange={e => setEditData({...editData, outletId: e.target.value})} className="w-full bg-[#1a1a1a] p-4 rounded-xl border border-white/10 text-xs font-bold font-mono">
                          <option value="">Central Hub / Warehouse</option>
                          {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                       </select>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2"><Lock size={12}/> Security Password Update</label>
                    <input type="password" value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})} className="w-full bg-white-5 p-4 rounded-xl border border-white/10 font-mono" required />
                 </div>
                 <button type="submit" className="w-full py-4 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-xl shadow-xl shadow-amber-500/20">Synchronize Registry</button>
              </form>
           </div>
        </div>,
        document.body
      )}

      {/* MODAL: RECRUIT REQUEST */}
      {isRecruitModal && createPortal(
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[99999] flex items-center justify-center p-4">
           <div className="glass-card w-[500px] border-amber-500 p-10 space-y-8 animate-in zoom-in-95 shadow-2xl">
              <div className="text-center">
                 <div className="w-20 h-20 bg-amber-500 text-black rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-amber-500/20 mb-6">
                    <Send size={40} />
                 </div>
                 <h3 className="text-3xl font-black tracking-tight">Request Personnel</h3>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Submit request to Central Admin for approval</p>
              </div>
              <form onSubmit={handleRecruitmentRequest} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Candidate Name</label>
                    <input autoFocus type="text" placeholder="e.g. John Doe" value={newRecruit.name} onChange={e => setNewRecruit({...newRecruit, name: e.target.value})} className="w-full bg-white-5 p-4 rounded-xl border border-white/10 outline-none font-bold" required />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Requested Role</label>
                    <select value={newRecruit.role} onChange={e => setNewRecruit({...newRecruit, role: e.target.value})} className="w-full bg-[#1a1a1a] p-4 rounded-xl border border-white/10 outline-none text-xs font-bold font-mono hover:border-amber-500 transition-colors">
                       <option value="Cashier">Operational Cashier</option>
                       <option value="Driver">Fleet Pilot</option>
                    </select>
                 </div>
                 <button type="submit" className="w-full py-5 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl shadow-amber-500/30 mt-6 hover:scale-[1.03] transition-all">Transmit Request to HQ</button>
                 <button type="button" onClick={() => setIsRecruitModal(false)} className="w-full py-2 text-slate-600 font-black uppercase text-[10px] tracking-widest mt-2 hover:text-white">Cancel Request</button>
              </form>
           </div>
        </div>,
        document.body
      )}

      {/* MODAL: PROVISION APPROVAL */}
      {isProvisionModal && createPortal(
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[99999] flex items-center justify-center p-4">
           <div className="glass-card w-[500px] border-amber-500/50 bg-[#120a0a] p-10 space-y-8 animate-in zoom-in-95 shadow-2xl shadow-amber-500/10">
              <div className="text-center">
                 <div className="w-20 h-20 bg-amber-500 text-black rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-amber-500/20 mb-6">
                    <UserCheck size={40} />
                 </div>
                 <h3 className="text-3xl font-black tracking-tight text-amber-500">Authorize Access</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Provisioning {isProvisionModal.name} as {isProvisionModal.role}</p>
                 <p className="text-[9px] font-black text-slate-600 py-1 px-3 bg-white-5 rounded-full inline-block mt-3 border border-white/5">{isProvisionModal.outletName}</p>
              </div>
              <form onSubmit={approveRecruit} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Generate Login Alias</label>
                    <input autoFocus type="text" placeholder="username" value={provisionData.username} onChange={e => setProvisionData({...provisionData, username: e.target.value.toLowerCase()})} className="w-full bg-black/40 p-4 rounded-xl border border-white/10 font-mono text-sm outline-none focus:border-amber-500" required />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Generate Security Token</label>
                    <input type="password" placeholder="•••••" value={provisionData.password} onChange={e => setProvisionData({...provisionData, password: e.target.value})} className="w-full bg-black/40 p-4 rounded-xl border border-white/10 font-mono text-sm outline-none focus:border-amber-500" required />
                 </div>
                 <button type="submit" className="w-full py-5 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl shadow-amber-500/30 mt-6 hover:scale-[1.03] transition-all">Authorize & Deploy Identity</button>
                 <button type="button" onClick={() => {
                     const all = dataStore.get(STORAGE_KEYS.RECRUITMENT);
                     dataStore.save(STORAGE_KEYS.RECRUITMENT, all.filter(r => r.id !== isProvisionModal.id));
                     setIsProvisionModal(null);
                     notify("Recruitment request rejected and purged from queue.", "error", "Request Denied");
                     refreshData();
                 }} className="w-full py-2 text-danger opacity-70 font-black uppercase text-[10px] tracking-widest mt-2 hover:opacity-100 transition-all border border-transparent hover:border-danger/30 rounded">Reject Request</button>
              </form>
           </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default UserManagement;
