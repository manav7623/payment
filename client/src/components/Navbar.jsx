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

      <div className="top-navbar-actions">
        {/* Friends Ledger Popup Button */}
        <button
          type="button"
          onClick={() => onOpenFriendModal && onOpenFriendModal('add')}
          className="btn btn-sm friend-nav-btn"
          title="Friends Ledger Popup"
        >
          <HandCoins size={15} />
          <span>Friends</span>
        </button>

        {/* Add Expense (Desktop only in top navbar; mobile uses center floating + button) */}
        <button
          type="button"
          onClick={onOpenAddExpense}
          className="btn btn-primary btn-sm nav-add-expense-btn"
        >
          <PlusCircle size={15} />
          <span>Add Expense</span>
        </button>
      </div>
    </header>
  );
}
