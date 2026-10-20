import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Categories from './pages/Categories';
import Friends from './pages/Friends';
import AddExpenseModal from './components/AddExpenseModal';
import EditExpenseModal from './components/EditExpenseModal';
import ExpenseDetailModal from './components/ExpenseDetailModal';
import FriendModal from './components/FriendModal';
import api from './api/client';

export default function App() {
  const [currentTab, setTab] = useState('dashboard');

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedExpenseDetail, setSelectedExpenseDetail] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  // Friend Modal State (Dedicated Friend Popup)
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [friendModalTab, setFriendModalTab] = useState('add');
  const [friendModalTarget, setFriendModalTarget] = useState(null);

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleOpenFriendModal = (tab = 'add', targetFriend = null) => {
    setFriendModalTab(tab);
    setFriendModalTarget(targetFriend);
    setIsFriendModalOpen(true);
  };

  // Delete expense handler
  const handleDeleteExpense = async (expenseId) => {
    try {
      await api.delete(`/expenses/${expenseId}`);
      showToast('Expense record deleted successfully.');
      setSelectedExpenseDetail(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete expense.');
    }
  };

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setTab={setTab}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        onOpenFriendModal={handleOpenFriendModal}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <Navbar 
          onOpenAddExpense={() => setIsAddExpenseOpen(true)}
          onOpenFriendModal={handleOpenFriendModal}
        />

        {/* Global Toast Notification */}
        {toast && (
          <div style={{ padding: '0 1rem', marginTop: '0.75rem' }}>
            <div className={`alert ${toast.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              <span>{toast.message}</span>
              <button 
                onClick={() => setToast(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Pages */}
        <main>
          {currentTab === 'dashboard' && (
            <Dashboard
              onOpenAddExpense={() => setIsAddExpenseOpen(true)}
              onViewExpenseDetails={(exp) => setSelectedExpenseDetail(exp)}
              onNavigateToExpenses={() => setTab('expenses')}
              onOpenFriendModal={handleOpenFriendModal}
            />
          )}

          {currentTab === 'expenses' && (
            <Expenses
              onOpenAddExpense={() => setIsAddExpenseOpen(true)}
              onViewExpenseDetails={(exp) => setSelectedExpenseDetail(exp)}
              onEditExpense={(exp) => setEditingExpense(exp)}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {currentTab === 'friends' && (
            <Friends
              onOpenFriendModal={handleOpenFriendModal}
            />
          )}

          {currentTab === 'categories' && (
            <Categories />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        setTab={setTab}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        onOpenFriendModal={handleOpenFriendModal}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={() => {
          showToast('Expense recorded successfully!');
        }}
      />

      {/* Dedicated Friend Popup Modal */}
      <FriendModal
        isOpen={isFriendModalOpen}
        onClose={() => setIsFriendModalOpen(false)}
        initialTab={friendModalTab}
        selectedFriendName={friendModalTarget}
        onSuccess={(msg) => {
          showToast(msg || 'Friends ledger updated successfully!');
        }}
      />

      {/* Expense Details Modal */}
      <ExpenseDetailModal
        expense={selectedExpenseDetail}
        onClose={() => setSelectedExpenseDetail(null)}
        onEdit={(exp) => setEditingExpense(exp)}
        onDelete={handleDeleteExpense}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={Boolean(editingExpense)}
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSuccess={() => {
          showToast('Expense updated successfully.');
        }}
      />
    </div>
  );
}
