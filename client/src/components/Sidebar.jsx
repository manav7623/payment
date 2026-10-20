import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Tag, 
  PlusCircle
} from 'lucide-react';

export default function Sidebar({ currentTab, setTab, onOpenAddExpense }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'All Expenses', icon: Receipt },
    { id: 'categories', label: 'Categories', icon: Tag }
  ];

  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '1.05rem',
          letterSpacing: '-0.4px',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
        }}>
          MD
        </div>
        <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-main)' }}>
          MD
        </span>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <button 
          onClick={onOpenAddExpense} 
          className="btn btn-primary btn-full"
          style={{ gap: '0.5rem', height: '42px', fontWeight: 600 }}
        >
          <PlusCircle size={18} />
          <span>Add Expense</span>
        </button>
      </div>

      <nav className="sidebar-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', background: 'none' }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
