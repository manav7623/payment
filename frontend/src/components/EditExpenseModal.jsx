import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, UploadCloud, Smartphone, Banknote, CreditCard, Building2 } from 'lucide-react';

export default function EditExpenseModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  expense 
}) {
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/categories')
        .then(res => setCategories(res.data.categories || []))
        .catch(err => console.error('Failed to load categories:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (expense && isOpen) {
      setAmount(expense.amount || '');
      setTitle(expense.title || '');
      setCategory(expense.category || 'Food & Dining');
      setExpenseDate(expense.expense_date || '');
      setPaymentMethod(expense.payment_method || 'UPI');
      setNotes(expense.notes || '');
      setReceiptFile(null);
      setError('');
    }
  }, [expense, isOpen]);

  if (!isOpen || !expense) return null;

  const quickAmounts = [100, 200, 500, 1000, 2000];

  const handleAddQuickAmount = (delta) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + delta));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter an expense title.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('expense_date', expenseDate);
      formData.append('payment_method', paymentMethod);
      if (notes) formData.append('notes', notes.trim());
      if (receiptFile) formData.append('receipt', receiptFile);

      await api.put(`/expenses/${expense.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to update expense.');
    }
  };

  const defaultCategories = [
    'Food & Dining',
    'Groceries',
    'Transport & Fuel',
    'Bills & Utilities',
    'Shopping',
    'Entertainment',
    'Health & Medical',
    'Education',
    'Personal Care',
    'Others'
  ];

  const categoryList = categories.length > 0 ? categories.map(c => c.name) : defaultCategories;
  const popularMethods = [
    { id: 'UPI', label: 'UPI', icon: Smartphone },
    { id: 'Cash', label: 'Cash', icon: Banknote },
    { id: 'Credit Card', label: 'Credit Card', icon: CreditCard },
    { id: 'Debit Card', label: 'Debit Card', icon: CreditCard },
    { id: 'Net Banking', label: 'Net Banking', icon: Building2 }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Mobile drag handle */}
        <div className="modal-drag-handle" />

        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Edit Expense</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
              Record #{expense.id}
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary btn-sm"
            style={{ border: 'none', padding: '0.35rem' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            {/* Big Currency Input */}
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label">Amount (₹) *</label>
              <div className="hero-currency-input-wrapper">
                <span className="hero-currency-symbol">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  required
                  className="hero-currency-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="quick-amount-chips">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAddQuickAmount(amt)}
                    className="quick-amount-chip"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Expense Title *</label>
              <input
                type="text"
                required
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categoryList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Payment Method Pills */}
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <div className="method-segmented-group">
                {popularMethods.map(m => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`method-segment-btn ${isSelected ? 'active' : ''}`}
                    >
                      <Icon size={16} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Replace Bill / Screenshot (Optional)</label>
              <div style={{
                border: '1.5px dashed var(--border-input)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.95rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-subtle)'
              }}>
                <input
                  type="file"
                  id="edit-expense-receipt"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setReceiptFile(e.target.files[0]);
                    }
                  }}
                />
                <label htmlFor="edit-expense-receipt" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <UploadCloud size={24} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {receiptFile ? receiptFile.name : (expense.receipt_url ? 'Tap to change attached bill' : 'Tap to attach bill')}
                  </span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }} disabled={loading}>
              {loading ? 'Updating...' : 'Update Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
