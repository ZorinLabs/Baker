import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Search, Trash2, CreditCard, Banknote, Store } from 'lucide-react';
import { dataStore, STORAGE_KEYS } from '../utils/dataStore';
import { formatCurrency } from '../utils/currency';

const POS = ({ user, notify, ask }) => {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [outletInfo, setOutletInfo] = useState(null);

  useEffect(() => {
    refreshData();
  }, [user.outletId]);

  const refreshData = () => {
    const masterCatalog = dataStore.get(STORAGE_KEYS.CATALOG);
    const localInv = dataStore.getScopedData(STORAGE_KEYS.INVENTORY, user.outletId);
    setInventory(localInv);

    const merged = masterCatalog.map(item => {
      const invMatch = localInv.find(i => i.name === item.name);
      return {
        ...item,
        stock: invMatch ? invMatch.stock : 0
      };
    });
    setProducts(merged);

    if (user.outletId) {
      const allOutlets = dataStore.getOutlets();
      setOutletInfo(allOutlets.find(o => o.id === user.outletId));
    }
  };

  const handleCheckout = (method) => {
    if (cart.length === 0) return;

    for (const item of cart) {
      const product = products.find(p => p.id === item.id);
      if (!product || product.stock < item.qty) {
        notify(`Insufficient physical inventory for ${item.name}. Stock: ${product?.stock || 0}`, 'error', 'Terminal Shortage');
        return;
      }
    }
    
    ask(`Confirm ${formatCurrency(total)} transaction via ${method}?`, () => {
      // Deduct from inventory
      const allInv = dataStore.get(STORAGE_KEYS.INVENTORY);
      const updatedInv = allInv.map(i => {
        if (i.outletId === user.outletId) {
          const cartItem = cart.find(ci => ci.name === i.name);
          if (cartItem) {
            const ns = Math.max(0, i.stock - cartItem.qty);
            return { ...i, stock: ns, status: ns > i.limit ? 'In Stock' : 'Low Stock' };
          }
        }
        return i;
      });
      dataStore.save(STORAGE_KEYS.INVENTORY, updatedInv);

      // Record Sale
      const sale = {
        outletId: user.outletId,
        outletName: outletInfo?.name || 'Central Hub',
        cashierName: user.name,
        items: cart,
        total: total,
        method: method
      };
      dataStore.addScopedItem(STORAGE_KEYS.SALES, sale);

      setCart([]);
      refreshData();
      notify(`Transaction finalized successfully for ${outletInfo?.name || 'Store'}. Terminal synced.`, 'success', 'Checkout Complete');
    }, 'Checkout Authorization');
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      notify('Critical: This item is currently OUT OF STOCK and cannot be added.', 'error', 'Stock Depleted');
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) {
        notify('Warning: Maximum available quantity in cart. No further stock available.', 'warning', 'Limit Threshold');
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    const existing = cart.find(item => item.id === id);
    if (existing && existing.qty > 1) {
      setCart(cart.map(item => item.id === id ? { ...item, qty: item.qty - 1 } : item));
    } else {
      setCart(cart.filter(item => item.id !== id));
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="flex h-full gap-2 p-4 bg-black/20 animate-in fade-in duration-500">
      <div className="flex-1 space-y-4">
        <header className="flex justify-between items-center bg-white-5 p-4 rounded-xl border border-white/5">
           <div className="flex items-center gap-3">
             <Store size={20} className="text-amber-500" />
             <h3 className="font-bold text-lg">{outletInfo?.name || 'Central Hub'} Retail Terminal</h3>
           </div>
           <div className="flex gap-2">
             {['All', 'Bread', 'Pastry', 'Cakes'].map(cat => (
               <button key={cat} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white-5 border border-white/5 hover:bg-amber-500/10 hover:text-amber-500 transition-all uppercase tracking-tighter">
                 {cat}
               </button>
             ))}
           </div>
        </header>

        <div className="grid grid-cols-3 gap-4">
          {products.map(product => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)}
              className={`glass-card group cursor-pointer border-transparent transition-all ${product.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-amber-500/5 hover:border-amber-500/20'}`}
            >
              <div className="flex justify-between items-start">
                 <span className="text-[10px] bg-white-5 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest text-slate-500">{product.category}</span>
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-tighter ${product.stock > 5 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                   {product.stock} Units
                 </span>
              </div>
              <h4 className="font-bold text-lg mt-2 group-hover:text-amber-500 transition-colors">{product.name}</h4>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xl font-bold font-mono">{formatCurrency(product.price)}</span>
                <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${product.stock <= 0 ? 'bg-slate-800' : 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20'}`}>
                  <Plus size={18} className={product.stock <= 0 ? 'text-slate-600' : 'text-black'} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-[400px] flex flex-col gap-4">
        <div className="glass-card flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart size={22} className="text-amber-500" /> Daily Tab
            </h3>
            <button onClick={() => ask("Clear the current active order?", () => setCart([]))} className="text-slate-500 hover:text-danger p-2"><Trash2 size={20}/></button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 opacity-20">
                <ShoppingCart size={48} />
                <p className="mt-2 font-black text-xs uppercase tracking-widest">Awaiting Transaction</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-white-5 border border-white/5 group">
                  <div>
                    <div className="font-bold text-sm group-hover:text-amber-500 transition-colors">{item.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{formatCurrency(item.price)} × {item.qty}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-md bg-white-5 border border-white/10 flex items-center justify-center hover:bg-danger/20 hover:text-danger"><Minus size={14}/></button>
                    <span className="font-mono text-sm w-4 text-center">{item.qty}</span>
                    <button onClick={() => addToCart(products.find(p => p.id === item.id))} className="w-6 h-6 rounded-md bg-white-5 border border-white/10 flex items-center justify-center hover:bg-success/20 hover:text-success transition-colors"><Plus size={14}/></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
             <div className="flex justify-between font-black text-3xl tracking-tighter">
              <span>Total</span>
              <span className="text-amber-500">{formatCurrency(total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => handleCheckout('Cash')}
                className="py-4 px-4 rounded-2xl glass border-slate-700 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-white-5 transition-all"
              >
                <Banknote size={20} /> Cash
              </button>
              <button 
                onClick={() => handleCheckout('Card')}
                className="py-4 px-4 rounded-2xl bg-amber-500 text-black flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-xl shadow-amber-500/10"
              >
                <CreditCard size={20} /> Charge Card
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card bg-amber-500/5 border-amber-500/10 text-center py-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
             Authenticated Terminal • {user.name} 
          </p>
        </div>
      </div>
    </div>
  );
};

export default POS;
