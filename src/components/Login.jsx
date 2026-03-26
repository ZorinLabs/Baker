import React, { useState } from 'react';
import { Wheat, Key, User, ArrowRight, RefreshCcw } from 'lucide-react';
import { dataStore } from '../utils/dataStore';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setShowReset(false);

    try {
      const users = dataStore.getUsers();
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        if (user.status === 'Inactive') {
          setError('Your account is currently inactive. Contact your administrator.');
          return;
        }
        onLogin(user);
      } else {
        setError('Invalid username or password. Please try again.');
        if (username === 'admin') setShowReset(true);
      }
    } catch (err) {
      console.error(err);
      setError('System Registry Error: Local cache is corrupted.');
      setShowReset(true);
    }
  };

  const handleHardReset = () => {
    if (window.confirm("CRITICAL PROTOCOL: This will wipe all local data and restore system defaults. Proceed?")) {
      dataStore.resetHub();
    }
  };

  return (
    <div className="login-layout relative overflow-hidden">
      {/* Decorative backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="glass-card w-[420px] flex flex-col gap-8 shadow-2xl relative z-10 border-white/10 p-10 mt-[-5%]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-200 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Wheat size={36} className="text-black" />
          </div>
          <div>
             <h1 className="text-3xl font-bold tracking-tight text-white mb-1">BAKERY<span className="text-amber-500">ERP</span></h1>
             <p className="text-[12px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Enterprise Management</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-widest">Username</label>
              <div className="flex items-center gap-3 bg-[rgba(0,0,0,0.6)] border border-white/10 rounded-xl px-4 py-3 focus-within:border-amber-500 transition-all shadow-inner">
                <User size={18} className="text-slate-500" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin" 
                  className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-600 autofill:bg-transparent"
                  style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-widest">Password</label>
              <div className="flex items-center gap-3 bg-[rgba(0,0,0,0.6)] border border-white/10 rounded-xl px-4 py-3 focus-within:border-amber-500 transition-all shadow-inner">
                <Key size={18} className="text-slate-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-600 font-mono"
                  style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                  required
                />
              </div>
            </div>
          </div>

          {error && <div className="text-danger text-xs font-bold uppercase tracking-widest bg-danger/10 p-3 rounded-lg border border-danger/20 text-center">{error}</div>}

          <div className="space-y-3">
             <button type="submit" className="btn-primary w-full py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 group shadow-xl">
               Access Workspace <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </button>
             
             {showReset && (
               <button 
                 type="button" 
                 onClick={handleHardReset}
                 className="w-full text-[10px] font-bold text-danger/60 hover:text-danger uppercase tracking-widest transition-all p-2 flex items-center justify-center gap-2"
               >
                 <RefreshCcw size={12} /> Force Factory Reset
               </button>
             )}
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-slate-500">© 2026 Bakery Enterprise Systems.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
