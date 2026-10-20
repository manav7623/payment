import React from 'react';
import { PlusCircle, Wallet, HandCoins } from 'lucide-react';

export default function Navbar({ onOpenAddExpense, onOpenFriendModal }) {
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
        {/* Dedicated Friend Popup Button */}
        <button
          type="button"
          onClick={() => onOpenFriendModal && onOpenFriendModal('add')}
          className="btn btn-sm friend-nav-btn"
          title="Friends Ledger Popup"
        >
          <HandCoins size={16} />
          <span>Friends</span>
        </button>

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
