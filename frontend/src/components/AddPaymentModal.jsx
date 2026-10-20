import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, UploadCloud, CheckCircle2 } from 'lucide-react';

export default function AddPaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  isAdmin, 
  initialClientId = null,
  initialPlanId = null,
  initialInstallmentId = null,
  initialAmount = ''
}) {
  const [amount, setAmount] = useState(initialAmount);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Tuition/Fees');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [clientId, setClientId] = useState(initialClientId || '');
  const [planId, setPlanId] = useState(initialPlanId || '');
  const [installmentId, setInstallmentId] = useState(initialInstallmentId || '');
  const [receiptFile, setReceiptFile] = useState(null);

  const [clients, setClients] = useState([]);
  const [clientPlans, setClientPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch clients if admin
  useEffect(() => {
    if (isAdmin && isOpen) {
      api.get('/clients')
        .then(res => setClients(res.data.clients || []))
        .catch(err => console.error('Failed to load clients:', err));
    }
  }, [isAdmin, isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(initialAmount || '');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setCategory('Tuition/Fees');
      setPaymentMethod('UPI');
      setReferenceId('');
      setNotes('');
      setReceiptFile(null);
      setError('');
      if (initialClientId) setClientId(initialClientId);
      if (initialPlanId) setPlanId(initialPlanId);
      if (initialInstallmentId) setInstallmentId(initialInstallmentId);
    }
  }, [isOpen, initialAmount, initialClientId, initialPlanId, initialInstallmentId]);

  // Load plans for selected client
  useEffect(() => {
    const targetClient = isAdmin ? clientId : 'me';
    if (targetClient && isOpen) {
      const url = isAdmin && clientId ? `/plans?clientId=${clientId}` : '/plans';
      api.get(url)
        .then(res => setClientPlans(res.data.plans || []))
        .catch(err => console.error('Failed to load plans:', err));
    } else {
      setClientPlans([]);
    }
  }, [clientId, isAdmin, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    if (isAdmin && !clientId) {
      setError('Please select a client for this payment.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('payment_date', paymentDate);
      formData.append('category', category);
      formData.append('payment_method', paymentMethod);
      if (referenceId) formData.append('reference_id', referenceId);
      if (notes) formData.append('notes', notes);
      if (isAdmin && clientId) formData.append('client_id', clientId);
      if (planId) formData.append('plan_id', planId);
      if (installmentId) formData.append('installment_id', installmentId);
      if (receiptFile) formData.append('receipt', receiptFile);

      await api.post('/payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to submit payment.');
    }
  };

  const categories = [
    'Tuition/Fees',
    'Subscription',
    'Service',
    'Maintenance',
    'Rent',
    'Product',
    'Loan',
    'Other'
  ];

  const methods = ['UPI', 'Bank Transfer', 'Cash', 'Card', 'Cheque'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Record Payment</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
              {isAdmin ? 'Add payment on behalf of a client' : 'Submit your payment details'}
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary btn-sm"
            style={{ border: 'none', padding: '0.3rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            {isAdmin && (
              <div className="form-group">
                <label className="form-label">Client *</label>
                <select
                  className="form-select"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                >
                  <option value="">-- Select Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="e.g. 5000"
                  className="form-input"
                  style={{ fontSize: '1.1rem', fontWeight: 600 }}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method *</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                >
                  {methods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reference ID / UTR / Cheque No.</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. UPI/20261019/12345 or IMPS Ref"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
              />
            </div>

            {/* Optional Link to Payment Plan */}
            {clientPlans.length > 0 && (
              <div className="form-group">
                <label className="form-label">Link to Payment Plan (Optional)</label>
                <select
                  className="form-select"
                  value={planId}
                  onChange={(e) => {
                    setPlanId(e.target.value);
                    setInstallmentId('');
                  }}
                >
                  <option value="">-- No specific plan --</option>
                  {clientPlans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} (Total: ₹{p.total_amount})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Upload Receipt (JPG, PNG, PDF)</label>
              <div style={{
                border: '1px dashed var(--border-input)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-subtle)'
              }}>
                <input
                  type="file"
                  id="receipt-file-input"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setReceiptFile(e.target.files[0]);
                    }
                  }}
                />
                <label htmlFor="receipt-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                  <UploadCloud size={24} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--primary)' }}>
                    {receiptFile ? receiptFile.name : 'Tap to select receipt file'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    Maximum file size: 5MB
                  </span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-textarea"
                placeholder="Additional details regarding this transaction..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
