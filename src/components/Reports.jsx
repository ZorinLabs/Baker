import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, Calendar, Download, DollarSign } from 'lucide-react';
import { dataStore, STORAGE_KEYS } from '../utils/dataStore';

const Reports = ({ user, notify }) => {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);

  const refreshData = () => {
    const s = dataStore.getScopedData(STORAGE_KEYS.SALES, user.outletId);
    const i = dataStore.getScopedData(STORAGE_KEYS.INVENTORY, user.outletId);
    setSales(Array.isArray(s) ? s : []);
    setInventory(Array.isArray(i) ? i : []);
  };

  useEffect(() => {
    refreshData();
    const handleSync = () => refreshData();
    window.addEventListener('datastore-update', handleSync);
    return () => window.removeEventListener('datastore-update', handleSync);
  }, [user.outletId]);

  const totalSalesVal = sales.reduce((sum, s) => sum + s.total, 0);
  const totalCostVal = sales.reduce((sum, s) => sum + s.items.reduce((inner, item) => inner + ((item.cost || 0) * item.qty), 0), 0);
  const netProfit = totalSalesVal - totalCostVal;
  const lowStockCount = inventory.filter(i => i.status !== 'In Stock').length;

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Date', 'Outlet', 'Cashier', 'Method', 'Items', 'Gross Revenue', 'Cost', 'Net Profit'];
    const rows = sales.map(sale => {
      const dateObj = new Date(sale.timestamp);
      const itemsList = sale.items.map(i => `${i.qty}x ${i.name}`).join(' | ');
      const tCost = sale.items.reduce((inner, item) => inner + ((item.cost || 0) * item.qty), 0);
      const net = sale.total - tCost;

      return [
        `ORD-${sale.id.toString().slice(-4)}`,
        `"${dateObj.toLocaleString()}"`,
        `"${sale.outletName || 'Central Hub'}"`,
        `"${sale.cashierName}"`,
        sale.method,
        `"${itemsList}"`,
        sale.total.toFixed(2),
        tCost.toFixed(2),
        net.toFixed(2)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Bakery_BI_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (notify) {
      notify(sales.length > 0 ? `Successfully downloaded ${sales.length} transactional records.` : "Downloaded empty BI Report template.", "success", "Export Initialized");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Business Intelligence</h2>
          <p className="text-slate-400">
            {user.role === 'Admin' ? 'Global performance hub.' : `Performance reports for ${user.outletId}`}
          </p>
        </div>
        <button onClick={handleExportCSV} className="btn-primary flex items-center gap-2">
          <Download size={18} /> Export Data (CSV)
        </button>
      </header>

      <div className={`grid ${user.role === 'Admin' ? 'grid-cols-5' : 'grid-cols-4'} gap-6`}>
        {[
          { label: 'Gross Revenue', value: `$${totalSalesVal.toFixed(2)}`, icon: DollarSign, color: 'text-success' },
          ...(user.role === 'Admin' ? [{ label: 'Net Profit Engine', value: `$${netProfit.toFixed(2)}`, icon: TrendingUp, color: 'text-success' }] : []),
          { label: 'Total Orders', value: sales.length, icon: PieChart, color: 'text-amber-500' },
          { label: 'Low Stock Alerts', value: lowStockCount, icon: BarChart3, color: 'text-danger' },
          { label: 'Avg Order Value', value: sales.length ? `$${(totalSalesVal/sales.length).toFixed(2)}` : '$0.00', icon: TrendingUp, color: 'text-amber-500' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card flex flex-col gap-2">
               <div className="w-10 h-10 rounded-lg bg-white-5 flex items-center justify-center">
                 <Icon size={20} className={stat.color} />
               </div>
               <div className="text-sm text-slate-500 font-semibold">{stat.label}</div>
               <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="glass-card col-span-2">
           <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
             <Calendar size={20} className="text-amber-500" /> Recent Sales History
           </h3>
           <div className="space-y-4">
             {sales.length === 0 ? (
               <div className="p-8 text-center text-slate-500 italic">No sales recorded yet.</div>
             ) : (
               sales.slice(0, 10).map((sale, i) => (
                 <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white-5 border border-white/5">
                    <div>
                      <div className="font-bold text-amber-500 flex items-center gap-2">
                         ORD-{sale.id.toString().slice(-4)}
                         {user.role === 'Admin' && <span className="text-[8px] status-badge bg-slate-700">{sale.outletName}</span>}
                      </div>
                      <div className="text-[10px] text-slate-500">{new Date(sale.timestamp).toLocaleString()} • {sale.cashierName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">${sale.total.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">via {sale.method}</div>
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>

        <div className="glass-card">
           <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
             <PieChart size={20} className="text-amber-500" /> Sales Trend
           </h3>
           <div className="space-y-6">
             {['AM Shift', 'PM Shift', 'Evening'].map((cat, i) => (
               <div key={i} className="space-y-2">
                 <div className="flex justify-between text-xs text-slate-400 tracking-wider">
                   <span>{cat}</span>
                   <span className="font-bold text-white">{[35, 45, 20][i]}%</span>
                 </div>
                 <div className="w-full h-1 bg-white-5 rounded-full overflow-hidden">
                   <div className="h-full bg-amber-500" style={{ width: `${[35, 45, 20][i]}%` }}></div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
