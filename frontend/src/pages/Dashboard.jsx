import React, { useState, useEffect } from 'react';
import api from '../api/client';
import SummaryCards from '../components/SummaryCards';
import PaymentChart from '../components/PaymentChart';
import CategorySummary from '../components/CategorySummary';
import ExpenseCard from '../components/ExpenseCard';
import ExpenseTable from '../components/ExpenseTable';
import FriendsSummaryWidget from '../components/FriendsSummaryWidget';
import { PlusCircle, ArrowRight, RefreshCw, HandCoins } from 'lucide-react';

export default function Dashboard({ 
  onOpenAddExpense, 
  onViewExpenseDetails, 
  onNavigateToExpenses,
  onOpenFriendModal
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get('/expenses/dashboard-stats');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData(true);
  }, []);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>
            MD Dashboard
          </h1>
          <p style={{ fontSize: '0.88rem' }}>
            Track daily spending, categories, and payment receipts.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            className="btn btn-secondary btn-sm"
            title="Refresh Dashboard"
            style={{ height: '38px' }}
          >
            <RefreshCw size={14} />
            <span className="desktop-only">Refresh</span>
          </button>

          {/* Quick Friend Popup Trigger */}
          <button
            type="button"
            onClick={() => onOpenFriendModal && onOpenFriendModal('add')}
            className="btn btn-sm friend-nav-btn"
            style={{ height: '38px' }}
          >
            <HandCoins size={16} />
            <span>Friend</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddExpense}
            className="btn btn-primary"
            style={{ height: '38px' }}
          >
            <PlusCircle size={17} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Summary Cards */}
      <SummaryCards summary={data?.summary} loading={loading} />

      {/* Friends Ledger Widget (Separate from personal expenses) */}
      <FriendsSummaryWidget onOpenFriendModal={onOpenFriendModal} />

      {/* Monthly Spending Chart & Category Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <PaymentChart data={data?.chartData} loading={loading} />
        <CategorySummary categories={data?.categorySummary} loading={loading} />
      </div>

      {/* Recent Expenses Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Expenses</h2>
          <button
            type="button"
            onClick={onNavigateToExpenses}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.35rem' }}
          >
            <span>View All Expenses</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {loading && !data ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : !data?.recentExpenses || data.recentExpenses.length === 0 ? (
          <div className="state-box" style={{ margin: 0, border: 'none' }}>
            <div className="state-box-title">No expenses recorded yet</div>
            <div className="state-box-desc">
              Tap "Add Expense" above to record your first transaction.
            </div>
          </div>
        ) : (
          <>
            {/* Mobile View: Expense Cards */}
            <div className="mobile-only tx-card-list">
              {data.recentExpenses.map((exp) => (
                <ExpenseCard
                  key={exp.id}
                  expense={exp}
                  onViewDetails={onViewExpenseDetails}
                />
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="desktop-only">
              <ExpenseTable
                expenses={data.recentExpenses}
                onViewDetails={onViewExpenseDetails}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
