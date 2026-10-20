import React from 'react';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';
import { X, FileText, Download, Edit2, Trash2, Tag, Calendar, CreditCard, User } from 'lucide-react';

export default function ExpenseDetailModal({ 
  expense, 
  onClose, 
  onEdit, 
  onDelete 
}) {
  if (!expense) return null;

  const receiptUrl = expense.receipt_url || null;
  const isImageReceipt = expense.receipt_url && /\.(jpg|jpeg|png|webp|gif)$/i.test(expense.receipt_url);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Expense Details</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
              Record #{expense.id}
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

        <div className="modal-body">
          {/* Amount banner */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '0.15rem' }}>
                Total Spent
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>
                {formatINR(expense.amount)}
              </div>
            </div>
            <span className="badge badge-neutral" style={{ fontSize: '0.85rem', padding: '0.3rem 0.65rem' }}>
              {expense.category}
            </span>
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', marginBottom: '1rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Expense Title</div>
              <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
                {expense.title}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} />
                <span>Date</span>
              </div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                {formatDate(expense.expense_date)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CreditCard size={13} />
                <span>Payment Method</span>
              </div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                {expense.payment_method}
              </div>
            </div>

            {expense.notes && (
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Notes</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                  {expense.notes}
                </div>
              </div>
            )}
          </div>

          {/* Receipt Section */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Bill / Payment Receipt</span>
              {receiptUrl && (
                <a 
                  href={receiptUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', height: '26px', padding: '0.2rem 0.5rem' }}
                >
                  <Download size={13} />
                  <span>Open Full Receipt</span>
                </a>
              )}
            </div>

            {receiptUrl ? (
              isImageReceipt ? (
                <div style={{ 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-light)', 
                  overflow: 'hidden',
                  textAlign: 'center',
                  maxHeight: '220px',
                  backgroundColor: '#fafafa'
                }}>
                  <img 
                    src={receiptUrl} 
                    alt="Receipt" 
                    style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain' }} 
                  />
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--bg-subtle)'
                }}>
                  <FileText size={24} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>PDF Receipt Document</div>
                    <a href={receiptUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem' }}>
                      Click to view PDF
                    </a>
                  </div>
                </div>
              )
            ) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                No receipt attached for this expense.
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this expense record?')) {
                  onDelete(expense.id);
                  onClose();
                }
              }}
              className="btn btn-danger btn-sm"
              style={{ marginRight: 'auto' }}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(expense);
              }}
              className="btn btn-secondary btn-sm"
            >
              <Edit2 size={14} />
              <span>Edit</span>
            </button>
          )}

          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
