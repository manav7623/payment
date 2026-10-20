import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, UploadCloud, Smartphone, Banknote, CreditCard, Building2, Check } from 'lucide-react';

export default function AddExpenseModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}) {
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available categories
  useEffect(() => {
    if (isOpen) {
      api.get('/categories')
        .then(res => {
          if (res.data.categories && res.data.categories.length > 0) {
            setCategories(res.data.categories);
            if (!category) setCategory(res.data.categories[0].name);
          }
        })
        .catch(err => console.error('Failed to load categories:', err));
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setTitle('');
      setCategory('Food & Dining');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setNotes('');
      setReceiptFile(null);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
      if (notes.trim()) formData.append('notes', notes.trim());
      if (receiptFile) formData.append('receipt', receiptFile);

      await api.post('/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to record expense.');
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Add Expense</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
              Quickly record what you spent
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

            {/* Big Hero Currency Input */}
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label">Amount Spent *</label>
              <div className="hero-currency-input-wrapper">
                <span className="hero-currency-symbol">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  placeholder="0.00"
                  className="hero-currency-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Quick Amount Shortcut Chips */}
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
                {amount && (
                  <button
                    type="button"
                    onClick={() => setAmount('')}
                    className="quick-amount-chip"
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">Expense Title *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Lunch at Cafe, Groceries, Petrol"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Category Dropdown */}
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

            {/* Date */}
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

            {/* Receipt Upload */}
            <div className="form-group">
              <label className="form-label">Attach Bill / Screenshot (Optional)</label>
              <div style={{
                border: '1.5px dashed var(--border-input)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.95rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-subtle)',
                transition: 'border-color 0.15s ease'
              }}>
                <input
                  type="file"
                  id="expense-receipt-upload"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setReceiptFile(e.target.files[0]);
                    }
                  }}
                />
                <label htmlFor="expense-receipt-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <UploadCloud size={24} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {receiptFile ? receiptFile.name : 'Tap to attach bill or receipt'}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>
                    JPG, PNG, WebP or PDF
                  </span>
                </label>
                {receiptFile && (
                  <button
                    type="button"
                    onClick={() => setReceiptFile(null)}
                    style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--danger)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Remove attachment
                  </button>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-textarea"
                placeholder="Where, why, or any extra details..."
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
              {loading ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
