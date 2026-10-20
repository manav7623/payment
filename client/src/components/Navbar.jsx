import React from 'react';
import { PlusCircle } from 'lucide-react';

export default function Navbar({ onOpenAddExpense }) {
  return (
    <header className="top-navbar">
      <div className="top-navbar-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '0.92rem',
          letterSpacing: '-0.3px',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
        }}>
          MD
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.4px', color: 'var(--text-main)' }}>
          MD
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={onOpenAddExpense}
          className="btn btn-primary btn-sm"
          style={{ height: '34px', padding: '0 0.85rem', fontSize: '0.85rem' }}
        >
          <PlusCircle size={15} />
          <span>Add Expense</span>
        </button>
      </div>
    </header>
  );
}
