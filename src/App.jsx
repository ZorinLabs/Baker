import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Production from './components/Production';
import Distribution from './components/Distribution';
import POS from './components/POS';
import Outlets from './components/Outlets';
import UserManagement from './components/UserManagement';
import Reports from './components/Reports';
import SupplyRequests from './components/SupplyRequests';
import Login from './components/Login';
import Profile from './components/Profile';
import StatusModal from './components/StatusModal';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('POS_ACTIVE_USER');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('POS_ACTIVE_TAB') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('POS_ACTIVE_TAB', activeTab);
  }, [activeTab]);

  // Modal State
  const [modal, setModal] = useState({ isOpen: false, type: 'info', message: '', title: '', onConfirm: null, onCancel: null });

  const notify = (message, type = 'success', title = '') => {
    setModal({
      isOpen: true,
      type,
      message,
      title: title || (type === 'success' ? 'Protocol Success' : 'System Alert'),
      onConfirm: () => setModal(prev => ({ ...prev, isOpen: false })),
      onCancel: null
    });
  };

  const ask = (message, onConfirm, title = 'Attention Required') => {
    setModal({
      isOpen: true,
      type: 'warning',
      message,
      title,
      onConfirm: () => {
        onConfirm();
        setModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('POS_ACTIVE_USER', JSON.stringify(userData));
    
    let tab = 'dashboard';
    if (userData.role === 'Cashier') tab = 'sales';
    else if (userData.role === 'Driver') tab = 'distribution';
    else if (userData.role === 'Production Chef') tab = 'production';
    else if (userData.role === 'Distribution Manager') tab = 'requests';
    setActiveTab(tab);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
    localStorage.removeItem('POS_ACTIVE_USER');
    localStorage.removeItem('POS_ACTIVE_TAB');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    const props = { user, notify, ask };
    switch (activeTab) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'supply': return <Inventory {...props} />;
      case 'production': return <Production {...props} />;
      case 'distribution': return <Distribution {...props} />;
      case 'sales': return <POS {...props} />;
      case 'outlets': return <Outlets {...props} />;
      case 'users': return <UserManagement {...props} />;
      case 'reports': return <Reports {...props} />;
      case 'requests': return <SupplyRequests {...props} />;
      case 'settings': return <Profile {...props} onUpdateUser={setUser} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div className="layout overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
      />
      <div className="main-content flex-1 overflow-y-auto">
        {renderContent()}
      </div>

      <StatusModal 
        isOpen={modal.isOpen}
        type={modal.type}
        message={modal.message}
        title={modal.title}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />
    </div>
  );
}

export default App;
