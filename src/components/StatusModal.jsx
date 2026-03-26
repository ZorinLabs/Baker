import React from 'react';
import { 
  CheckCircle2, 
  XSquare, 
  AlertTriangle, 
  Info, 
  X, 
  Trash2, 
  ShieldAlert 
} from 'lucide-react';

const StatusModal = ({ isOpen, type, message, onConfirm, onCancel, title }) => {
  if (!isOpen) return null;

  const configs = {
    success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', btn: 'bg-success text-black' },
    error: { icon: XSquare, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30', btn: 'bg-danger text-white' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', btn: 'bg-amber-500 text-black' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', btn: 'bg-blue-500 text-white' },
    danger: { icon: Trash2, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30', btn: 'bg-danger text-white' },
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className={`glass-card max-w-[400px] w-full border-2 ${config.border} p-8 space-y-6 text-center animate-in zoom-in-95`}>
        <div className={`w-20 h-20 mx-auto rounded-3xl ${config.bg} flex items-center justify-center ${config.color} shadow-2xl shadow-black/40`}>
           <Icon size={40} />
        </div>
        
        <div className="space-y-2">
           <h3 className="text-2xl font-black tracking-tight">{title || 'System Protocol'}</h3>
           <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-4 pt-4">
           {onCancel ? (
             <>
               <button 
                onClick={onCancel}
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all underline underline-offset-4"
               >
                 Cancel Mission
               </button>
               <button 
                onClick={onConfirm}
                className={`flex-2 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/40 hover:scale-[1.05] transition-all ${config.btn}`}
               >
                 Proceed
               </button>
             </>
           ) : (
             <button 
              onClick={onConfirm}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/40 hover:scale-[1.05] transition-all ${config.btn}`}
             >
               Acknowledged
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default StatusModal;
