import React, { useState } from 'react';
import { 
  User, 
  Camera, 
  Phone, 
  Lock, 
  Mail, 
  Save, 
  ShieldCheck,
  Store,
  Calendar
} from 'lucide-react';
import { dataStore } from '../utils/dataStore';

const Profile = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    password: user.password || '',
    phone: user.phone || '',
    avatar: user.avatar || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate slight delay for premium feel
    setTimeout(() => {
      const updatedUser = dataStore.updateUser(user.id, formData);
      onUpdateUser(updatedUser);
      setIsSaving(false);
      alert('Profile synchronization complete. Your identity has been updated across the network.');
    }, 800);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tight">Personal <span className="text-amber-500">Identity</span></h2>
          <p className="text-slate-400 mt-1 uppercase text-[10px] font-bold tracking-[0.2em]">Self-Service Profile Management</p>
        </div>
        <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-xl border border-success/20 text-[10px] font-bold uppercase">
           <ShieldCheck size={16} /> Verified {user.role} Account
        </div>
      </header>

      <div className="grid grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="space-y-6">
           <div className="glass-card flex flex-col items-center text-center p-8 space-y-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent opacity-50" />
              <div className="relative w-32 h-32">
                 <div className="w-full h-full rounded-3xl bg-slate-800 border-2 border-amber-500/30 overflow-hidden shadow-2xl transition-transform group-hover:scale-105">
                    {formData.avatar ? (
                      <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-black text-amber-500">
                        {formData.name[0]}
                      </div>
                    )}
                 </div>
                 <label className="absolute -bottom-2 -right-2 p-3 bg-amber-500 text-black rounded-2xl shadow-xl cursor-pointer hover:bg-amber-400 transition-colors">
                    <Camera size={20} />
                    <input 
                      type="text" 
                      placeholder="Paste Image URL" 
                      className="hidden" 
                      onChange={(e) => setFormData({...formData, avatar: prompt('Enter Profile Picture URL:')})}
                    />
                 </label>
              </div>
              <div className="relative">
                 <h3 className="text-2xl font-bold">{formData.name}</h3>
                 <p className="text-xs text-slate-500 uppercase font-black tracking-widest">@{formData.username}</p>
              </div>
           </div>

           <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-3 text-slate-400">
                 <Store size={18} />
                 <div className="text-xs">
                    <p className="font-bold text-white">Assigned Location</p>
                    <p>{user.outletId || 'Central Hub / Warehouse'}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                 <Calendar size={18} />
                 <div className="text-xs">
                    <p className="font-bold text-white">Member Since</p>
                    <p>March 2026</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="col-span-2 glass-card p-8">
           <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <User size={12} /> Full Name 
                    </label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white-5 border border-white/10 rounded-xl p-4 focus:border-amber-500/50 outline-none transition-all"
                      placeholder="Your name"
                      required
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Mail size={12} /> Login Username
                    </label>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      className="w-full bg-white-5 border border-white/10 rounded-xl p-4 focus:border-amber-500/50 outline-none transition-all"
                      placeholder="Username"
                      required
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Phone size={12} /> Contact Number
                    </label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-white-5 border border-white/10 rounded-xl p-4 focus:border-amber-500/50 outline-none transition-all"
                      placeholder="+1 234 567 890"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Lock size={12} /> Security Password
                    </label>
                    <input 
                      type="password" 
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-white-5 border border-white/10 rounded-xl p-4 focus:border-amber-500/50 outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Camera size={12} /> Profile Picture URL
                 </label>
                 <input 
                   type="text" 
                   value={formData.avatar}
                   onChange={e => setFormData({...formData, avatar: e.target.value})}
                   className="w-full bg-white-5 border border-white/10 rounded-xl p-4 focus:border-amber-500/50 outline-none transition-all font-mono text-xs"
                   placeholder="https://images.unsplash.com/..."
                 />
              </div>

              <div className="pt-6">
                 <button 
                   type="submit" 
                   disabled={isSaving}
                   className="w-full py-5 bg-amber-500 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                   {isSaving ? <><Clock className="animate-spin" size={18} /> Synchronizing...</> : <><Save size={18} /> Commit Identity Updates</>}
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
