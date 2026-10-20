import React from 'react';
import { LayoutDashboard, Receipt, Plus, Tag } from 'lucide-react';

export default function BottomNav({ currentTab, setTab, onOpenAddExpense }) {
  return (
    <nav className="bottom-nav">
      <button
        onClick={() => setTab('dashboard')}
        className={`bottom-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
        style={{ background: 'none', border: 'none' }}
      >
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </button>

      <button
        onClick={() => setTab('expenses')}
        className={`bottom-nav-item ${currentTab === 'expenses' ? 'active' : ''}`}
        style={{ background: 'none', border: 'none' }}
      >
        <Receipt size={20} />
        <span>Expenses</span>
      </button>

      <div className="bottom-nav-item add-btn-item">
        <button
          onClick={onOpenAddExpense}
          className="add-circle-btn"
          aria-label="Add Expense"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          <Plus size={24} />
        </button>
      </div>

      <button
        onClick={() => setTab('categories')}
        className={`bottom-nav-item ${currentTab === 'categories' ? 'active' : ''}`}
        style={{ background: 'none', border: 'none' }}
      >
        <Tag size={20} />
        <span>Categories</span>
      </button>
    </nav>
  );
}
