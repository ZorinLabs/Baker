/**
 * Centralized Command Hub & Data Store for Bakery ERP
 * Version 4.0: Firebase Real-time Cloud Sync
 */
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJu6Jd3gK-1AhFmHWwNm7S7N3lCeP71Gs",
  authDomain: "bakery-erp-13d0e.firebaseapp.com",
  projectId: "bakery-erp-13d0e",
  storageBucket: "bakery-erp-13d0e.firebasestorage.app",
  messagingSenderId: "562219473224",
  appId: "1:562219473224:web:b079198548cf51ac56bb7d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const STORAGE_KEYS = {
  USERS: 'bakery_erp_users_v2',
  OUTLETS: 'bakery_erp_outlets_v2',
  CATALOG: 'bakery_erp_catalog_v2',
  INVENTORY: 'bakery_erp_inventory_v2',
  FLEET: 'bakery_erp_fleet_v2',
  SALES: 'bakery_erp_sales_v2',
  COMMAND_HUB: 'bakery_erp_command_hub',
  // Restored legacy keys to prevent crashes in older components
  SUPPLY_REQUESTS: 'bakery_erp_supply_requests_v2',
  RECRUITMENT: 'bakery_erp_recruitment_v2',
};

const INITIAL_DATA = {
  [STORAGE_KEYS.USERS]: [
    { id: 1, name: 'Alex Baker', username: 'admin', password: '123', role: 'Admin', status: 'Active', outletId: null, phone: '+1 555-0101', avatar: null },
    { id: 6, name: 'Dante V.', username: 'dist_manager', password: '123', role: 'Distribution Manager', status: 'Active', outletId: null, phone: '+1 555-0102', avatar: null },
    { id: 10, name: 'Marco Rossi', username: 'driver1', password: '123', role: 'Driver', status: 'Active', outletId: null, phone: '+1 555-0103', avatar: null },
    { id: 11, name: 'Lucas Miller', username: 'driver2', password: '123', role: 'Driver', status: 'Active', outletId: null, phone: '+1 555-0104', avatar: null },
  ],
  [STORAGE_KEYS.OUTLETS]: [],
  [STORAGE_KEYS.CATALOG]: [
    { id: 1, name: 'Traditional Sourdough', price: 9.50, cost: 3.20, weight: '800g', category: 'Bread', recipe: 'Whole wheat starter, 24h ferment' },
    { id: 2, name: 'French Baguette', price: 5.25, cost: 1.50, weight: '350g', category: 'Bread', recipe: 'Classic flour, high hydration' },
    { id: 3, name: 'Double Choco Muffin', price: 4.50, cost: 1.80, weight: '150g', category: 'Pastry', recipe: 'Dark cocoa, berry notes' },
  ],
  [STORAGE_KEYS.INVENTORY]: [],
  [STORAGE_KEYS.FLEET]: [],
  [STORAGE_KEYS.SALES]: [],
  [STORAGE_KEYS.COMMAND_HUB]: [],
  [STORAGE_KEYS.SUPPLY_REQUESTS]: [],
  [STORAGE_KEYS.RECRUITMENT]: [],
};

// Internal Firebase Sync Engine
let isSyncing = false;
let initialized = false;

const initFirebaseSync = () => {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  Object.values(STORAGE_KEYS).forEach(key => {
    // Write initial data to localstorage immediately so it's ready before Firebase resolves
    const local = localStorage.getItem(key);
    if (!local || local === "undefined" || local === "null") {
      localStorage.setItem(key, JSON.stringify(INITIAL_DATA[key] || []));
    }

    // Initialize document reference
    const docRef = doc(db, 'erp_store', key);

    // Listen to Firebase Real-time updates
    onSnapshot(docRef, (docSnap) => {
      isSyncing = true;
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data;
        localStorage.setItem(key, JSON.stringify(cloudData));
        window.dispatchEvent(new CustomEvent('datastore-update', { detail: { key } }));
      } else {
        // If doc doesn't exist in cloud, push our local initial data
        const currentData = JSON.parse(localStorage.getItem(key)) || INITIAL_DATA[key] || [];
        setDoc(docRef, { data: currentData }, { merge: true }).catch(e => console.error("Firebase init error:", e));
      }
      setTimeout(() => isSyncing = false, 50);
    }, (error) => {
      console.error("Firebase Sync Error for", key, error);
      isSyncing = false;
    });
  });
};

// Attempt to hook up firebase instantly
initFirebaseSync();

const dataStore = {
  get: (key) => {
    try {
      if (!key) return [];
      const data = localStorage.getItem(key);
      if (!data || data === "undefined" || data === "null") {
        const initial = INITIAL_DATA[key] || [];
        localStorage.setItem(key, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : (INITIAL_DATA[key] || []);
    } catch (e) {
      console.error("Data Hub Error:", key, e);
      return INITIAL_DATA[key] || [];
    }
  },

  save: (key, value) => {
    if (!key) return;
    
    // 1. Optimistic Local Update
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('datastore-update', { detail: { key } }));
    }

    // 2. Background Cloud Sync (if not already coming from a firebase push)
    if (!isSyncing && initialized) {
      setDoc(doc(db, 'erp_store', key), { data: value }, { merge: true })
        .catch(err => console.error("Firebase Save Error:", err));
    }
  },

  // Resilient Command Hub Logic
  pushCommand: (command) => {
    const hub = dataStore.get(STORAGE_KEYS.COMMAND_HUB);
    const newCommand = {
      id: `CMD-${Date.now()}`,
      status: 'PE-PENDING',
      timestamp: new Date().toISOString(),
      ...command
    };
    dataStore.save(STORAGE_KEYS.COMMAND_HUB, [newCommand, ...hub]);
    return newCommand;
  },

  updateCommand: (id, updates) => {
    const hub = dataStore.get(STORAGE_KEYS.COMMAND_HUB);
    const updated = hub.map(cmd => cmd.id === id ? { ...cmd, ...updates, lastUpdate: new Date().toISOString() } : cmd);
    dataStore.save(STORAGE_KEYS.COMMAND_HUB, updated);
  },

  getCommandsForRole: (role, outletId = null) => {
    const hub = dataStore.get(STORAGE_KEYS.COMMAND_HUB);
    return hub.filter(cmd => {
      const roleMatch = cmd.targetRole === role || role === 'Admin';
      const outletMatch = !outletId || cmd.outletId === outletId || cmd.targetOutletId === outletId;
      return roleMatch && outletMatch;
    });
  },

  // Helper for adding scoped items (Sales, etc.)
  addScopedItem: (key, item) => {
    const all = dataStore.get(key);
    const newItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...item
    };
    dataStore.save(key, [newItem, ...all]);
    return newItem;
  },

  // Scoped Data Helpers
  getUsers: () => dataStore.get(STORAGE_KEYS.USERS),
  saveUsers: (users) => dataStore.save(STORAGE_KEYS.USERS, users),
  getOutlets: () => dataStore.get(STORAGE_KEYS.OUTLETS),
  getFleet: () => dataStore.get(STORAGE_KEYS.FLEET),
  saveFleet: (fleet) => dataStore.save(STORAGE_KEYS.FLEET, fleet),

  getScopedData: (key, outletId) => {
    const all = dataStore.get(key);
    if (!outletId) return all;
    return all.filter(item => item.outletId === outletId);
  },

  updateUser: (id, updates) => {
    const all = dataStore.getUsers();
    const updated = all.map(u => u.id === id ? { ...u, ...updates } : u);
    dataStore.saveUsers(updated);
    return updated.find(u => u.id === id);
  },

  resetHub: () => {
    localStorage.clear();
    window.location.reload();
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
      window.dispatchEvent(new CustomEvent('datastore-update', { detail: { key: e.key } }));
    }
  });
}

export { dataStore, STORAGE_KEYS };
