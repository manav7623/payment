import React from 'react';
import { LayoutDashboard, Receipt, Plus, Tag } from 'lucide-react';

export default function BottomNav({ currentTab, setTab, onOpenAddExpense }) {
  return (
    <nav className="bottom-nav">
      <button
        type="button"
        onClick={() => setTab('dashboard')}
        className={`bottom-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
        aria-label="Dashboard"
      >
        <LayoutDashboard size={21} />
        <span>Dashboard</span>
      </button>

      <button
        type="button"
        onClick={() => setTab('expenses')}
        className={`bottom-nav-item ${currentTab === 'expenses' ? 'active' : ''}`}
        aria-label="Expenses"
      >
        <Receipt size={21} />
        <span>Expenses</span>
      </button>

      <div className="bottom-nav-item add-btn-item">
        <button
          type="button"
          onClick={onOpenAddExpense}
          className="add-circle-btn"
          aria-label="Add New Expense"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setTab('categories')}
        className={`bottom-nav-item ${currentTab === 'categories' ? 'active' : ''}`}
        aria-label="Categories"
      >
        <Tag size={21} />
        <span>Categories</span>
      </button>
    </nav>
  );
}
