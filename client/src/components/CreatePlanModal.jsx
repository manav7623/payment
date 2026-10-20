import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, Calendar, Plus, Trash2 } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function CreatePlanModal({ isOpen, onClose, onSuccess, clients }) {
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState('3');
  const [notes, setNotes] = useState('');
  const [customInstallments, setCustomInstallments] = useState([]);
  const [useCustomSchedule, setUseCustomSchedule] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate installment dates and amounts whenever total or count changes
  useEffect(() => {
    if (!useCustomSchedule && totalAmount && installmentsCount) {
      const count = parseInt(installmentsCount) || 1;
      const total = parseFloat(totalAmount) || 0;
      const each = Math.round((total / count) * 100) / 100;

      const items = [];
      for (let i = 1; i <= count; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() + i);
        items.push({
          installment_number: i,
          amount: i === count ? (total - (each * (count - 1))).toFixed(2) : each.toFixed(2),
          due_date: d.toISOString().split('T')[0]
        });
      }
      setCustomInstallments(items);
    }
  }, [totalAmount, installmentsCount, useCustomSchedule]);

  if (!isOpen) return null;

  const handleCustomChange = (index, field, value) => {
    const updated = [...customInstallments];
    updated[index][field] = value;
    setCustomInstallments(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!clientId) {
      setError('Please select a client.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a plan title.');
      return;
    }
    const numTotal = parseFloat(totalAmount);
    if (isNaN(numTotal) || numTotal <= 0) {
      setError('Please enter a valid total amount.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/plans', {
        client_id: parseInt(clientId),
        title: title.trim(),
        total_amount: numTotal,
        installments_count: parseInt(installmentsCount) || 1,
        notes: notes.trim(),
        installments: customInstallments
      });

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to create payment plan.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Create Payment Plan</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
              Assign structured installments to a client
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

            <div className="form-group">
              <label className="form-label">Client *</label>
              <select
                className="form-select"
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">-- Select Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Plan Title / Purpose *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Annual Consulting Fee, Course Tuition, Web Retainer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Total Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  className="form-input"
                  placeholder="e.g. 60000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Number of Installments *</label>
                <select
                  className="form-select"
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(e.target.value)}
                >
                  <option value="1">1 (Single Payment)</option>
                  <option value="2">2 Installments</option>
                  <option value="3">3 Installments</option>
                  <option value="4">4 Installments</option>
                  <option value="6">6 Installments</option>
                  <option value="12">12 Installments</option>
                </select>
              </div>
            </div>

            {/* Installments preview & custom dates */}
            <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Installment Schedule</span>
                <button
                  type="button"
                  onClick={() => setUseCustomSchedule(!useCustomSchedule)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', height: '26px' }}
                >
                  {useCustomSchedule ? 'Reset to Auto' : 'Customize Dates/Amounts'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {customInstallments.map((inst, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'flex', 
                      gap: '0.5rem', 
                      alignItems: 'center', 
                      backgroundColor: 'var(--bg-subtle)', 
                      padding: '0.5rem 0.65rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span style={{ fontWeight: 600, minWidth: '24px' }}>#{inst.installment_number}</span>
                    {useCustomSchedule ? (
                      <>
                        <input
                          type="number"
                          className="form-input"
                          style={{ minHeight: '34px', fontSize: '0.85rem', flex: 1 }}
                          value={inst.amount}
                          onChange={(e) => handleCustomChange(idx, 'amount', e.target.value)}
                        />
                        <input
                          type="date"
                          className="form-input"
                          style={{ minHeight: '34px', fontSize: '0.85rem', flex: 1 }}
                          value={inst.due_date}
                          onChange={(e) => handleCustomChange(idx, 'due_date', e.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontWeight: 500 }}>{formatINR(inst.amount)}</span>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Due: {inst.due_date}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-textarea"
                placeholder="Payment terms, contract references, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Plan...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
