import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Wheat, 
  Lock, 
  X, 
  Save, 
  DollarSign, 
  Scale, 
  ChefHat,
  Eye,
  EyeOff,
  History,
  CheckCircle2
} from 'lucide-react';
import { dataStore, STORAGE_KEYS } from '../utils/dataStore';

const Production = ({ user, notify, ask }) => {
  const [catalog, setCatalog] = useState([]);
  const [isEditModal, setIsEditModal] = useState(null);
  const [showRecipes, setShowRecipes] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: 0, cost: 0, weight: '', category: 'Bread', recipe: '' });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const data = dataStore.get(STORAGE_KEYS.CATALOG);
    setCatalog(data);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const all = dataStore.get(STORAGE_KEYS.CATALOG);
    let updated;
    
    if (isEditModal && isEditModal.id) {
      updated = all.map(item => item.id === isEditModal.id ? { ...item, ...formData } : item);
      notify(`${formData.name} catalog specifications updated. Changes synced across all outlets.`, 'success', 'Catalog Updated');
    } else {
      const newItem = { ...formData, id: Date.now() };
      updated = [newItem, ...all];
      notify(`${formData.name} has been added to the master production catalog.`, 'success', 'New Item Registered');
    }

    dataStore.save(STORAGE_KEYS.CATALOG, updated);
    setIsEditModal(null);
    setFormData({ name: '', price: 0, cost: 0, weight: '', category: 'Bread', recipe: '' });
    refreshData();
  };

  const deleteItem = (id, name) => {
    ask(`Permanently remove ${name} from the master catalog? Outlets will no longer be able to order this item.`, () => {
      const all = dataStore.get(STORAGE_KEYS.CATALOG);
      dataStore.save(STORAGE_KEYS.CATALOG, all.filter(item => item.id !== id));
      refreshData();
      notify(`Catalog item deleted. Global availability revoked.`, 'success', 'Item Purged');
    }, 'Catalog Deletion Authorization');
  };

  const isAdmin = user.role === 'Admin' || user.role === 'Production Chef';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3 tracking-tighter"><Wheat className="text-amber-500" /> Manufacturing Hub</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Master Production Registry & Catalog Control</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setIsEditModal({}); setFormData({ name: '', price: 0, cost: 0, weight: '', category: 'Bread', recipe: '' }); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Master Product
          </button>
        )}
      </header>

      <div className="flex justify-between items-center bg-white-5 p-4 rounded-2xl border border-white/5">
         <div className="flex-1 flex items-center gap-4">
            <Search className="text-slate-600" />
            <input type="text" placeholder="Search master catalog..." className="bg-transparent border-none outline-none text-sm w-full font-bold uppercase tracking-widest" />
         </div>
         <div className="flex items-center gap-6">
            <button onClick={() => setShowRecipes(!showRecipes)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-amber-500 transition-all">
              {showRecipes ? <EyeOff size={16} /> : <Eye size={16} />} 
              {showRecipes ? 'Mask Proprietary Recipes' : 'View Production Details'}
            </button>
         </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {catalog.map(item => (
          <div key={item.id} className="glass-card group hover:border-amber-500/30 transition-all">
             <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white-5 px-2 py-1 rounded">{item.category}</span>
                <div className="text-right">
                   <span className="text-xl font-black font-mono text-success block">${(item.price || 0).toFixed(2)}</span>
                   {isAdmin && <span className="text-[10px] font-black font-mono text-danger uppercase tracking-widest block mt-1">Cost: ${(item.cost || 0).toFixed(2)}</span>}
                </div>
             </div>
             <h3 className="text-2xl font-black tracking-tight group-hover:text-amber-500 transition-colors uppercase">{item.name}</h3>
             <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest flex items-center gap-2"><Scale size={12}/> Net Weight: {item.weight}</p>
             
             <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 font-heading">
                   <ChefHat size={14} className="text-amber-500" /> Proprietary Method
                </div>
                <p className={`text-sm italic leading-relaxed transition-all duration-700 ${!showRecipes ? 'blur-md opacity-30 select-none' : 'opacity-100'}`}>
                  {item.recipe || 'Standard manufacturing process protocol.'}
                </p>
             </div>

             {isAdmin && (
               <div className="flex gap-2 pt-6">
                 <button onClick={() => { setIsEditModal(item); setFormData(item); }} className="flex-1 py-3 bg-white-5 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Modify Item</button>
                 <button onClick={() => deleteItem(item.id, item.name)} className="p-3 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-xl transition-all shadow-lg hover:shadow-danger/20"><Trash2 size={16}/></button>
               </div>
             )}
          </div>
        ))}
      </div>

      {isEditModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
           <div className="glass-card w-[550px] border-amber-500 p-10 space-y-8 animate-in zoom-in-95 shadow-2xl">
              <div className="flex justify-between items-center text-center">
                 <div className="text-left">
                    <h3 className="text-3xl font-black tracking-tight flex items-center gap-3"><Save className="text-amber-500"/> Product Specification</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Updating Global Master Resource</p>
                 </div>
                 <button onClick={() => setIsEditModal(null)} className="text-slate-500 p-2 bg-white-5 rounded-full"><X/></button>
              </div>
              <form onSubmit={handleSave} className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Product Designation</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white-5 border border-white/10 rounded-xl p-4 font-black uppercase outline-none focus:border-amber-500" required />
                 </div>
                 <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2"><DollarSign size={12}/> Unit Cost</label>
                       <input type="number" step="0.01" value={formData.cost || 0} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value) || 0})} className="w-full bg-white-5 border border-danger/10 rounded-xl p-4 font-mono font-black text-danger outline-none" required />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2"><DollarSign size={12}/> Site Retail Price</label>
                       <input type="number" step="0.01" value={formData.price || 0} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="w-full bg-white-5 border border-success/10 rounded-xl p-4 font-mono font-black text-success outline-none" required />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2"><Scale size={12}/> Unit Mass</label>
                       <input type="text" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full bg-white-5 border border-white/10 rounded-xl p-4 font-bold" placeholder="e.g. 500g" required />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2"><ChefHat size={12}/> Proprietary Recipe / Production Instructions</label>
                    <textarea value={formData.recipe} onChange={e => setFormData({...formData, recipe: e.target.value})} className="w-full bg-white-5 border border-white/10 rounded-xl p-4 h-32 resize-none" placeholder="Enter specialized manufacturing details..." />
                 </div>
                 <button type="submit" className="w-full py-5 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl shadow-amber-500/30 mt-4 hover:scale-[1.03] transition-all flex items-center justify-center gap-3">
                    <CheckCircle2 size={18}/> Synchronize Catalog Entity
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Production;
