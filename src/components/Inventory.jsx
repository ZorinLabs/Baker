import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertCircle, ShoppingCart, RefreshCw, Layers } from 'lucide-react';
import { dataStore, STORAGE_KEYS } from '../utils/dataStore';

const Inventory = ({ user }) => {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Standard', stock: 0, limit: 10, unit: 'units' });

  useEffect(() => {
    refreshData();
    const handleSync = () => refreshData();
    window.addEventListener('datastore-update', handleSync);
    return () => window.removeEventListener('datastore-update', handleSync);
  }, [user.outletId]);

  const refreshData = () => {
    const data = dataStore.getScopedData(STORAGE_KEYS.INVENTORY, user.outletId);
    setItems(Array.isArray(data) ? data : []);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const upItem = { ...newItem, outletId: user.outletId, status: newItem.stock > newItem.limit ? 'In Stock' : 'Low Stock' };
    dataStore.addScopedItem(STORAGE_KEYS.INVENTORY, upItem);
    setIsModalOpen(false);
    setNewItem({ name: '', category: 'Standard', stock: 0, limit: 10, unit: 'units' });
    refreshData();
  };

  const updateStock = (id, change) => {
    const all = dataStore.get(STORAGE_KEYS.INVENTORY);
    const updated = all.map(i => {
      if (i.id === id) {
        const newStock = Math.max(0, i.stock + change);
        return { ...i, stock: newStock, status: newStock > i.limit ? 'In Stock' : 'Low Stock' };
      }
      return i;
    });
    dataStore.save(STORAGE_KEYS.INVENTORY, updated);
    refreshData();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-bold flex items-center gap-3"><Layers className="text-amber-500" /> Stock & Inventory</h2>
           <p className="text-slate-400">Managing inventory ecosystem for {user.outletId || 'Central Hub'}.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Stock Entry
        </button>
      </header>

      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Total Items', value: items.length, icon: Package, color: 'text-amber-500' },
          { label: 'Low Stock Alerts', value: items.filter(i => i.status === 'Low Stock').length, icon: AlertCircle, color: 'text-danger' },
          { label: 'Units Stored', value: items.reduce((sum, i) => sum + i.stock, 0), icon: Layers, color: 'text-success' },
          { label: 'Restock Orders', value: 0, icon: RefreshCw, color: 'text-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-card flex flex-col gap-2">
             <stat.icon size={18} className={stat.color} />
             <div className="text-xs text-slate-500 font-bold uppercase">{stat.label}</div>
             <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card p-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-slate-500 text-sm font-semibold">
              <th className="p-4">Material / Product</th>
              <th className="p-4">Category</th>
              <th className="p-4">Stock Level</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-semibold">{item.name}</td>
                <td className="p-4 text-xs text-slate-400 font-mono">{item.category}</td>
                <td className="p-4 font-mono">
                   <div className="flex flex-col">
                     <span className="text-sm font-bold">{item.stock} {item.unit}</span>
                     <span className="text-[10px] text-slate-500">Threshold: {item.limit}</span>
                   </div>
                </td>
                <td className="p-4">
                  <span className={`badge ${item.status === 'In Stock' ? 'badge-success' : 'badge-danger'}`}>{item.status}</span>
                </td>
                <td className="p-4 text-right">
                   <div className="flex items-center justify-end gap-2">
                     <button onClick={() => updateStock(item.id, -1)} className="w-8 h-8 rounded-lg bg-white-5 hover:bg-danger/20 flex items-center justify-center">-</button>
                     <button onClick={() => updateStock(item.id, 1)} className="w-8 h-8 rounded-lg bg-white-5 hover:bg-success/20 flex items-center justify-center">+</button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="glass-card w-[400px] p-8 space-y-6">
             <h3 className="text-xl font-bold flex items-center gap-2 font-heading"><Package className="text-amber-500" /> Add Stock</h3>
             <form onSubmit={handleAddItem} className="space-y-4">
                <input type="text" placeholder="Item name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-white-5 border border-white/10 rounded-lg p-3" required />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Initial Stock" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: parseInt(e.target.value)})} className="bg-white-5 border border-white/10 rounded-lg p-3" required />
                  <input type="number" placeholder="Limit" value={newItem.limit} onChange={e => setNewItem({...newItem, limit: parseInt(e.target.value)})} className="bg-white-5 border border-white/10 rounded-lg p-3" required />
                </div>
                <button type="submit" className="btn-primary w-full py-3 font-bold mt-4 shadow-xl">Register Item</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-2 text-slate-500 hover:text-white">Cancel</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
