import React from 'react';
import { PlusCircle, Wallet } from 'lucide-react';

export default function Navbar({ onOpenAddExpense }) {
  return (
    <header className="top-navbar">
      <div className="top-navbar-title">
        <div className="brand-icon-box">
          <Wallet size={19} strokeWidth={2.4} />
        </div>
        <div>
          <div className="brand-text-title">
            <span>MD</span>
            <span className="brand-text-badge">Expenses</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <button
          type="button"
          onClick={onOpenAddExpense}
          className="btn btn-primary btn-sm"
          style={{ height: '36px', padding: '0 0.95rem', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <PlusCircle size={16} />
          <span>Add Expense</span>
        </button>
      </div>
    </header>
  );
}
