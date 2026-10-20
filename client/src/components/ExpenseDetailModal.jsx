import React from 'react';
import { formatINR, formatDate } from '../utils/formatters';
import { getCategoryTheme, getPaymentMethodTheme } from '../utils/categoryTheme';
import { X, FileText, Download, Edit2, Trash2, Calendar, CreditCard } from 'lucide-react';

export default function ExpenseDetailModal({ 
  expense, 
  onClose, 
  onEdit, 
  onDelete 
}) {
  if (!expense) return null;

  const receiptUrl = expense.receipt_url || null;
  const isImageReceipt = expense.receipt_url && /\.(jpg|jpeg|png|webp|gif)$/i.test(expense.receipt_url);
  const categoryTheme = getCategoryTheme(expense.category);
  const CategoryIcon = categoryTheme.icon;
  const paymentTheme = getPaymentMethodTheme(expense.payment_method);
  const PaymentIcon = paymentTheme.icon;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Mobile drag handle */}
        <div className="modal-drag-handle" />

        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Expense Details</h3>
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

        <div className="modal-body">
          {/* Amount banner with Category Indicator */}
          <div style={{
            padding: '1.2rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.15rem',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500, marginBottom: '0.2rem' }}>
                Total Amount
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {formatINR(expense.amount)}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: categoryTheme.bg,
              color: categoryTheme.color,
              border: `1px solid ${categoryTheme.border}`,
              fontSize: '0.85rem',
              fontWeight: 600
            }}>
              <CategoryIcon size={16} />
              <span>{expense.category}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.95rem', marginBottom: '1.15rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-light)', fontWeight: 500, marginBottom: '0.2rem' }}>Expense Title</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                {expense.title}
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.25rem' }}>
                <Calendar size={13} />
                <span>Date</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                {formatDate(expense.expense_date)}
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.25rem' }}>
                <CreditCard size={13} />
                <span>Payment Mode</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: paymentTheme.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PaymentIcon size={14} />
                <span>{expense.payment_method}</span>
              </div>
            </div>

            {expense.notes && (
              <div style={{ gridColumn: 'span 2', background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>Notes</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                  {expense.notes}
                </div>
              </div>
            )}
          </div>

          {/* Receipt Section */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Bill / Payment Receipt</span>
              {receiptUrl && (
                <a 
                  href={receiptUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', height: '28px', padding: '0 0.65rem' }}
                >
                  <Download size={13} />
                  <span>Download</span>
                </a>
              )}
            </div>

            {receiptUrl ? (
              isImageReceipt ? (
                <div style={{ 
                  borderRadius: 'var(--radius-lg)', 
                  border: '1px solid var(--border-light)', 
                  overflow: 'hidden',
                  textAlign: 'center',
                  maxHeight: '220px',
                  backgroundColor: '#0f172a'
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
                  gap: '0.65rem',
                  backgroundColor: 'var(--bg-subtle)'
                }}>
                  <FileText size={24} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>PDF Receipt Document</div>
                    <a href={receiptUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                      Click to view attached PDF
                    </a>
                  </div>
                </div>
              )
            ) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontStyle: 'italic', padding: '0.5rem 0' }}>
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

          <button type="button" onClick={onClose} className="btn btn-primary btn-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
